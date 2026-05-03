import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleSessionsSync } from '../lib/sync';
import {
  type Session, type ReviewEntry, type AttendanceStatus,
  type ReadStatus, type WeeklyScore,
  ATTENDANCE_STATUS_ORDER, READ_STATUS_ORDER,
} from '../types';
import { generateReviewDates } from '../utils/dates';

interface SessionsStore {
  sessions: Session[];

  addSession: (params: {
    date: string;
    subjectId: string;
    topicLabel: string;
    totalReviews: number;
    reviewIntervals: number[];
    autoGenerate: boolean;
    notesLink?: string;
  }) => Session;

  updateSession: (id: string, patch: Partial<Pick<Session, 'date' | 'subjectId' | 'topicLabel' | 'notes' | 'notesLink' | 'totalReviews'>>) => void;
  deleteSession: (id: string) => void;

  cycleAttendance:   (id: string) => void;
  cycleReviewStatus: (sessionId: string, reviewIndex: number) => void;
  toggleReviewDate:  (sessionId: string, reviewIndex: number, sessionDate: string, intervals: number[]) => void;
  setReviewDate:     (sessionId: string, reviewIndex: number, date: string) => void;
  regenerateReviews: (sessionId: string, intervals: number[]) => void;
  addReview:         (sessionId: string, date?: string) => void;
  deleteReview:      (sessionId: string, reviewId: string) => void;

  addWeeklyScore:    (sessionId: string, params: { score: number; maxScore: number; notes?: string; link?: string }) => void;
  updateWeeklyScore: (sessionId: string, scoreId: string, patch: { score?: number; maxScore?: number; link?: string }) => void;
  deleteWeeklyScore: (sessionId: string, scoreId: string) => void;
  updateWeeklyTest:  (sessionId: string, patch: { link?: string }) => void;
}

function buildReviews(sessionId: string, dates: string[]): ReviewEntry[] {
  return dates.map((d, i) => ({
    id: uuid(),
    sessionId,
    reviewNumber: i + 1,
    scheduledDate: d,
    dateEnabled: true,
    status: 'pending' as ReadStatus,
  }));
}

function persist(sessions: Session[]) {
  storage.set('sessions', sessions);
}

export const useSessionsStore = create<SessionsStore>((set, get) => ({
  sessions: storage.get<Session[]>('sessions', []),

  addSession: ({ date, subjectId, topicLabel, totalReviews, reviewIntervals, autoGenerate, notesLink }) => {
    const id = uuid();
    const intervals = reviewIntervals.slice(0, totalReviews);
    const reviews = autoGenerate ? buildReviews(id, generateReviewDates(date, intervals)) : [];
    const session: Session = {
      id, date, subjectId, topicLabel,
      attendanceStatus: 'pending',
      reviews,
      totalReviews,
      notesLink,
      weeklyTest: { scores: [] },
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const sessions = [...state.sessions, session];
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
    return session;
  },

  updateSession: (id, patch) => {
    set(state => {
      const sessions = state.sessions.map(s => s.id === id ? { ...s, ...patch } : s);
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  deleteSession: (id) => {
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id);
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  cycleAttendance: (id) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== id) return s;
        const cur  = ATTENDANCE_STATUS_ORDER.indexOf(s.attendanceStatus);
        const next = ATTENDANCE_STATUS_ORDER[(cur + 1) % ATTENDANCE_STATUS_ORDER.length];
        return { ...s, attendanceStatus: next as AttendanceStatus };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  cycleReviewStatus: (sessionId, reviewIndex) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const reviews = s.reviews.map((r, i) => {
          if (i !== reviewIndex) return r;
          const cur  = READ_STATUS_ORDER.indexOf(r.status);
          const next = READ_STATUS_ORDER[(cur + 1) % READ_STATUS_ORDER.length];
          return {
            ...r,
            status: next as ReadStatus,
            completedAt: next === 'done' ? new Date().toISOString() : undefined,
          };
        });
        return { ...s, reviews };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  toggleReviewDate: (sessionId, reviewIndex, sessionDate, intervals) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const reviews = s.reviews.map((r, i) => {
          if (i !== reviewIndex) return r;
          const nowEnabled = r.dateEnabled !== false;
          if (nowEnabled) {
            return { ...r, dateEnabled: false, scheduledDate: null };
          } else {
            const autoDate = generateReviewDates(sessionDate, intervals)[i] ?? null;
            return { ...r, dateEnabled: true, scheduledDate: autoDate };
          }
        });
        return { ...s, reviews };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  setReviewDate: (sessionId, reviewIndex, date) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const reviews = s.reviews.map((r, i) =>
          i === reviewIndex ? { ...r, scheduledDate: date } : r
        );
        return { ...s, reviews };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  addReview: (sessionId, date) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const review: ReviewEntry = {
          id: uuid(),
          sessionId,
          reviewNumber: s.reviews.length + 1,
          scheduledDate: date ?? null,
          dateEnabled: !!date,
          status: 'pending',
        };
        return { ...s, reviews: [...s.reviews, review] };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  deleteReview: (sessionId, reviewId) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const reviews = s.reviews
          .filter(r => r.id !== reviewId)
          .map((r, i) => ({ ...r, reviewNumber: i + 1 }));
        return { ...s, reviews };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  regenerateReviews: (sessionId, intervals) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const dates   = generateReviewDates(s.date, intervals.slice(0, s.totalReviews));
        const reviews = buildReviews(s.id, dates);
        return { ...s, reviews };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  addWeeklyScore: (sessionId, { score, maxScore, notes, link }) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const wt    = s.weeklyTest ?? { scores: [] };
        const entry: WeeklyScore = {
          id: uuid(),
          attemptNumber: wt.scores.length + 1,
          score, maxScore,
          date: new Date().toISOString(),
          notes, link,
        };
        return { ...s, weeklyTest: { ...wt, scores: [...wt.scores, entry] } };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  updateWeeklyScore: (sessionId, scoreId, patch) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const wt     = s.weeklyTest ?? { scores: [] };
        const scores = wt.scores.map(sc => sc.id === scoreId ? { ...sc, ...patch } : sc);
        return { ...s, weeklyTest: { ...wt, scores } };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  deleteWeeklyScore: (sessionId, scoreId) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const wt     = s.weeklyTest ?? { scores: [] };
        const scores = wt.scores
          .filter(sc => sc.id !== scoreId)
          .map((sc, i) => ({ ...sc, attemptNumber: i + 1 }));
        return { ...s, weeklyTest: { ...wt, scores } };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },

  updateWeeklyTest: (sessionId, patch) => {
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const wt = s.weeklyTest ?? { scores: [] };
        return { ...s, weeklyTest: { ...wt, ...patch } };
      });
      persist(sessions);
      return { sessions };
    });
    scheduleSessionsSync(get().sessions);
  },
}));
