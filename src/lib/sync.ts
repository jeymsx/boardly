/**
 * Local-first sync engine.
 *
 * Each data store calls scheduleXxxSync() after every mutation.
 * Changes are debounced (2 s) per table, then upserted to Supabase.
 * Stale remote rows (deleted locally) are pruned via full-replace:
 *   upsert current set + DELETE WHERE id NOT IN (current ids).
 *
 * Sync is gated by _userId and _syncEnabled so it never fires while
 * the auth store is mid-hydration.
 */

import { supabase } from './supabase';
import type {
  Subject, Topic, Session, MasteryTest, CalendarEvent, AppSettings, SubjectColor,
} from '../types';

// ─── Gate variables ───────────────────────────────────────────────────────────

let _userId: string | null = null;
let _syncEnabled = false;

export function setCurrentUser(id: string | null) { _userId = id; }
export function enableSync()  { _syncEnabled = true; }
export function disableSync() { _syncEnabled = false; }
export function isLoggedIn()  { return _userId !== null; }

// ─── Debounce ─────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 2000;
const timers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {};

function schedule(key: string, fn: () => void) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(fn, DEBOUNCE_MS);
}

// ─── Retry ────────────────────────────────────────────────────────────────────

async function withRetry(fn: () => Promise<void>, attempts = 3, baseDelay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, baseDelay * 2 ** i));
      } else {
        console.warn('[sync] failed after retries:', err);
      }
    }
  }
}

// ─── Full-replace helper ──────────────────────────────────────────────────────

async function replaceTable(
  table: string,
  rows: Record<string, unknown>[],
  ids: string[],
  userId: string,
) {
  await withRetry(async () => {
    if (rows.length > 0) {
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }
    if (ids.length > 0) {
      const { error } = await supabase.from(table).delete()
        .eq('user_id', userId)
        .not('id', 'in', `(${ids.join(',')})`);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) throw error;
    }
  });
}

const ts = () => new Date().toISOString();

// ─── Per-table schedule functions (called by stores) ─────────────────────────

export function scheduleSubjectsSync(subjects: Subject[]) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  const rows = subjects.map(s => ({
    id: s.id, user_id: userId, name: s.name, color: s.color,
    created_at: s.createdAt, updated_at: ts(),
  }));
  const ids = subjects.map(s => s.id);
  schedule('subjects', () => replaceTable('subjects', rows, ids, userId));
}

export function scheduleTopicsSync(topics: Topic[]) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  const rows = topics.map(t => ({
    id: t.id, user_id: userId, subject_id: t.subjectId,
    name: t.name, total_reads: t.totalReads,
    reads: t.reads, notes: t.notes ?? null,
    created_at: t.createdAt, updated_at: ts(),
  }));
  const ids = topics.map(t => t.id);
  schedule('topics', () => replaceTable('topics', rows, ids, userId));
}

export function scheduleSessionsSync(sessions: Session[]) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  const rows = sessions.map(s => ({
    id: s.id, user_id: userId,
    date: s.date, subject_id: s.subjectId, topic_label: s.topicLabel,
    attendance_status: s.attendanceStatus, reviews: s.reviews,
    total_reviews: s.totalReviews, notes: s.notes ?? null,
    notes_link: s.notesLink ?? null, weekly_test: s.weeklyTest ?? null,
    created_at: s.createdAt, updated_at: ts(),
  }));
  const ids = sessions.map(s => s.id);
  schedule('sessions', () => replaceTable('sessions', rows, ids, userId));
}

export function scheduleTestsSync(tests: MasteryTest[]) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  const rows = tests.map(t => ({
    id: t.id, user_id: userId, name: t.name,
    subject_id: t.subjectId ?? null, subject_enabled: t.subjectEnabled,
    topic_label: t.topicLabel ?? null, topic_id: t.topicId ?? null,
    target_score: t.targetScore, link: t.link ?? null, scores: t.scores,
    created_at: t.createdAt, updated_at: ts(),
  }));
  const ids = tests.map(t => t.id);
  schedule('mastery_tests', () => replaceTable('mastery_tests', rows, ids, userId));
}

export function scheduleEventsSync(events: CalendarEvent[]) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  const rows = events.map(e => ({
    id: e.id, user_id: userId, title: e.title, date: e.date,
    subject_id: e.subjectId ?? null, topic_label: e.topicLabel ?? null,
    notes: e.notes ?? null, color: e.color ?? null,
    created_at: e.createdAt, updated_at: ts(),
  }));
  const ids = events.map(e => e.id);
  schedule('calendar_events', () => replaceTable('calendar_events', rows, ids, userId));
}

export function scheduleSettingsSync(settings: AppSettings) {
  if (!_userId || !_syncEnabled) return;
  const userId = _userId;
  schedule('user_settings', () =>
    withRetry(async () => {
      const { error } = await supabase.from('user_settings').upsert(
        { user_id: userId, data: settings, updated_at: ts() },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
    }),
  );
}

// ─── Pull (remote → local on login) ──────────────────────────────────────────

export interface RemoteData {
  subjects:  Subject[];
  topics:    Topic[];
  sessions:  Session[];
  tests:     MasteryTest[];
  events:    CalendarEvent[];
  settings:  AppSettings | null;
}

export async function pullAll(userId: string): Promise<RemoteData | null> {
  try {
    const [subR, topR, sesR, testR, evR, setR] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', userId),
      supabase.from('topics').select('*').eq('user_id', userId),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('mastery_tests').select('*').eq('user_id', userId),
      supabase.from('calendar_events').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('data').eq('user_id', userId).maybeSingle(),
    ]);

    const remoteTopics: Topic[] = (topR.data ?? []).map((r: any) => ({
      id: r.id, subjectId: r.subject_id, name: r.name,
      totalReads: r.total_reads, reads: r.reads,
      notes: r.notes ?? undefined, createdAt: r.created_at,
    }));

    return {
      subjects: (subR.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, color: r.color as SubjectColor,
        topicIds: remoteTopics.filter(t => t.subjectId === r.id).map(t => t.id),
        createdAt: r.created_at,
      })),
      topics: remoteTopics,
      sessions: (sesR.data ?? []).map((r: any) => ({
        id: r.id, date: r.date, subjectId: r.subject_id, topicLabel: r.topic_label,
        attendanceStatus: r.attendance_status, reviews: r.reviews,
        totalReviews: r.total_reviews, notes: r.notes ?? undefined,
        notesLink: r.notes_link ?? undefined,
        weeklyTest: r.weekly_test ?? undefined, createdAt: r.created_at,
      })),
      tests: (testR.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, subjectId: r.subject_id ?? undefined,
        subjectEnabled: r.subject_enabled, topicLabel: r.topic_label ?? undefined,
        topicId: r.topic_id ?? undefined, scores: r.scores,
        targetScore: r.target_score, link: r.link ?? undefined, createdAt: r.created_at,
      })),
      events: (evR.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, date: r.date,
        subjectId: r.subject_id ?? undefined, topicLabel: r.topic_label ?? undefined,
        notes: r.notes ?? undefined, color: r.color ?? undefined, createdAt: r.created_at,
      })),
      settings: setR.data?.data ?? null,
    };
  } catch (err) {
    console.warn('[sync] pullAll failed:', err);
    return null;
  }
}
