import { v4 as uuid } from 'uuid';
import { storage } from './storage';
import { generateReviewDates } from './dates';
import type { Subject, Topic, Session, MasteryTest, ReadEntry, ReviewEntry } from '../types';

function reads(total: number, doneCount = 0): ReadEntry[] {
  return Array.from({ length: total }, (_, i) => ({
    id: uuid(),
    readNumber: i + 1,
    status: i < doneCount ? 'done' : i === doneCount ? 'in-progress' : 'pending',
    completedAt: i < doneCount ? new Date().toISOString() : undefined,
  }));
}

export function seedIfEmpty() {
  const existing = storage.get<Subject[]>('subjects', []);
  if (existing.length > 0) return;

  const subjects: Subject[] = [
    { id: 'subj-1', name: 'Plumbing Code',       color: 'amber',  topicIds: ['t1','t2','t3'], createdAt: new Date().toISOString() },
    { id: 'subj-2', name: 'Plumbing Arithmetic',  color: 'sky',    topicIds: ['t4','t5'],      createdAt: new Date().toISOString() },
    { id: 'subj-3', name: 'SPDI',                 color: 'jade',   topicIds: ['t6','t7','t8'], createdAt: new Date().toISOString() },
  ];

  const topics: Topic[] = [
    { id: 't1', subjectId: 'subj-1', name: 'Water Distribution Systems', totalReads: 3, reads: reads(3, 2), createdAt: new Date().toISOString() },
    { id: 't2', subjectId: 'subj-1', name: 'Drainage & Venting', totalReads: 3, reads: reads(3, 1), createdAt: new Date().toISOString() },
    { id: 't3', subjectId: 'subj-1', name: 'Fixture Units & Sizing', totalReads: 3, reads: reads(3, 0), createdAt: new Date().toISOString() },
    { id: 't4', subjectId: 'subj-2', name: 'Pipe Flow Calculations', totalReads: 4, reads: reads(4, 3), createdAt: new Date().toISOString() },
    { id: 't5', subjectId: 'subj-2', name: 'Pressure & Head Loss', totalReads: 4, reads: reads(4, 1), createdAt: new Date().toISOString() },
    { id: 't6', subjectId: 'subj-3', name: 'Site Development Fundamentals', totalReads: 3, reads: reads(3, 2), createdAt: new Date().toISOString() },
    { id: 't7', subjectId: 'subj-3', name: 'Soil & Foundation Types', totalReads: 3, reads: reads(3, 3), createdAt: new Date().toISOString() },
    { id: 't8', subjectId: 'subj-3', name: 'Erosion Control Methods', totalReads: 3, reads: reads(3, 0), createdAt: new Date().toISOString() },
  ];

  const today   = new Date();
  const fmtDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  function makeReviews(sessionId: string, date: string, total = 3): ReviewEntry[] {
    const intervals = [1, 3, 7];
    const dates = generateReviewDates(date, intervals.slice(0, total));
    return dates.map((d, i) => ({
      id: uuid(),
      sessionId,
      reviewNumber: i + 1,
      scheduledDate: d,
      dateEnabled: true,
      status: 'pending' as const,
    }));
  }

  const sess1Id = 'sess-1';
  const sess2Id = 'sess-2';
  const sess3Id = 'sess-3';

  const sessions: Session[] = [
    {
      id: sess1Id,
      date: fmtDate(-5),
      subjectId: 'subj-1',
      topicLabel: 'Day 1 — Water Distribution Systems',
      attendanceStatus: 'attended',
      reviews: makeReviews(sess1Id, fmtDate(-5)),
      totalReviews: 3,
      weeklyTest: { scores: [] },
      createdAt: new Date().toISOString(),
    },
    {
      id: sess2Id,
      date: fmtDate(-2),
      subjectId: 'subj-2',
      topicLabel: 'Day 2 — Pipe Flow Calculations',
      attendanceStatus: 'attended',
      reviews: makeReviews(sess2Id, fmtDate(-2)),
      totalReviews: 3,
      weeklyTest: { scores: [] },
      createdAt: new Date().toISOString(),
    },
    {
      id: sess3Id,
      date: fmtDate(1),
      subjectId: 'subj-3',
      topicLabel: 'Day 3 — SPDI Overview',
      attendanceStatus: 'pending',
      reviews: makeReviews(sess3Id, fmtDate(1)),
      totalReviews: 3,
      weeklyTest: { scores: [] },
      createdAt: new Date().toISOString(),
    },
  ];

  const testId1 = 'test-1';
  const testId2 = 'test-2';

  const tests: MasteryTest[] = [
    {
      id: testId1,
      name: 'Plumbing Code Mock Exam 1',
      subjectId: 'subj-1',
      subjectEnabled: true,
      topicLabel: 'Water Distribution Systems',
      targetScore: 90,
      scores: [
        { id: uuid(), testId: testId1, attemptNumber: 1, score: 72, maxScore: 100, date: fmtDate(-10) },
        { id: uuid(), testId: testId1, attemptNumber: 2, score: 81, maxScore: 100, date: fmtDate(-5)  },
        { id: uuid(), testId: testId1, attemptNumber: 3, score: 88, maxScore: 100, date: fmtDate(-1)  },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: testId2,
      name: 'Arithmetic Problem Set A',
      subjectId: 'subj-2',
      subjectEnabled: true,
      targetScore: 85,
      scores: [
        { id: uuid(), testId: testId2, attemptNumber: 1, score: 65, maxScore: 100, date: fmtDate(-7) },
        { id: uuid(), testId: testId2, attemptNumber: 2, score: 79, maxScore: 100, date: fmtDate(-3) },
        { id: uuid(), testId: testId2, attemptNumber: 3, score: 91, maxScore: 100, date: fmtDate(-1) },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  storage.set('subjects', subjects);
  storage.set('topics',   topics);
  storage.set('sessions', sessions);
  storage.set('tests',    tests);
}
