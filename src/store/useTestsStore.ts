import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleTestsSync } from '../lib/sync';
import { type MasteryTest, type ScoreEntry } from '../types';

interface TestsStore {
  tests: MasteryTest[];
  addTest:     (params: { name: string; subjectId?: string; subjectEnabled: boolean; topicLabel?: string; targetScore: number; link?: string }) => MasteryTest;
  updateTest:  (id: string, patch: Partial<Pick<MasteryTest, 'name' | 'subjectId' | 'subjectEnabled' | 'topicLabel' | 'targetScore' | 'link'>>) => void;
  deleteTest:  (id: string) => void;
  addScore:    (testId: string, score: number, maxScore: number, notes?: string, link?: string) => void;
  updateScore: (testId: string, scoreId: string, patch: { score?: number; maxScore?: number; link?: string }) => void;
  deleteScore: (testId: string, scoreId: string) => void;
}

export const useTestsStore = create<TestsStore>((set, get) => ({
  tests: storage.get<MasteryTest[]>('tests', []),

  addTest: ({ name, subjectId, subjectEnabled, topicLabel, targetScore, link }) => {
    const test: MasteryTest = {
      id: uuid(), name, subjectId, subjectEnabled, topicLabel,
      scores: [], targetScore, link, createdAt: new Date().toISOString(),
    };
    set(state => {
      const tests = [...state.tests, test];
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
    return test;
  },

  updateTest: (id, patch) => {
    set(state => {
      const tests = state.tests.map(t => t.id === id ? { ...t, ...patch } : t);
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
  },

  deleteTest: (id) => {
    set(state => {
      const tests = state.tests.filter(t => t.id !== id);
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
  },

  addScore: (testId, score, maxScore, notes, link) => {
    set(state => {
      const tests = state.tests.map(t => {
        if (t.id !== testId) return t;
        const entry: ScoreEntry = {
          id: uuid(), testId,
          attemptNumber: t.scores.length + 1,
          score, maxScore,
          date: new Date().toISOString(),
          notes, link,
        };
        return { ...t, scores: [...t.scores, entry] };
      });
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
  },

  updateScore: (testId, scoreId, patch) => {
    set(state => {
      const tests = state.tests.map(t => {
        if (t.id !== testId) return t;
        const scores = t.scores.map(s => s.id === scoreId ? { ...s, ...patch } : s);
        return { ...t, scores };
      });
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
  },

  deleteScore: (testId, scoreId) => {
    set(state => {
      const tests = state.tests.map(t => {
        if (t.id !== testId) return t;
        const scores = t.scores
          .filter(s => s.id !== scoreId)
          .map((s, i) => ({ ...s, attemptNumber: i + 1 }));
        return { ...t, scores };
      });
      storage.set('tests', tests);
      return { tests };
    });
    scheduleTestsSync(get().tests);
  },
}));
