import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import {
  type Subject, type Topic, type ReadEntry,
  type SubjectColor, type ReadStatus, READ_STATUS_ORDER,
} from '../types';

interface SubjectsStore {
  subjects: Subject[];
  topics: Topic[];

  // Subjects
  addSubject:    (name: string, color: SubjectColor) => Subject;
  updateSubject: (id: string, patch: Partial<Pick<Subject, 'name' | 'color'>>) => void;
  deleteSubject: (id: string) => void;

  // Topics
  addTopic:      (subjectId: string, name: string, totalReads: number) => Topic;
  updateTopic:   (id: string, patch: Partial<Pick<Topic, 'name' | 'totalReads' | 'notes'>>) => void;
  deleteTopic:   (id: string) => void;
  cycleReadStatus: (topicId: string, readIndex: number) => void;
  resetTopicReads: (topicId: string) => void;
}

function buildReads(total: number, existing: ReadEntry[] = []): ReadEntry[] {
  return Array.from({ length: total }, (_, i) => {
    const prev = existing[i];
    return prev ?? {
      id: uuid(),
      readNumber: i + 1,
      status: 'pending' as ReadStatus,
    };
  });
}

function persist(subjects: Subject[], topics: Topic[]) {
  storage.set('subjects', subjects);
  storage.set('topics', topics);
}

export const useSubjectsStore = create<SubjectsStore>((set) => ({
  subjects: storage.get<Subject[]>('subjects', []),
  topics:   storage.get<Topic[]>('topics', []),

  addSubject: (name, color) => {
    const subject: Subject = {
      id: uuid(), name, color, topicIds: [], createdAt: new Date().toISOString(),
    };
    set(state => {
      const subjects = [...state.subjects, subject];
      persist(subjects, state.topics);
      return { subjects };
    });
    return subject;
  },

  updateSubject: (id, patch) =>
    set(state => {
      const subjects = state.subjects.map(s => s.id === id ? { ...s, ...patch } : s);
      persist(subjects, state.topics);
      return { subjects };
    }),

  deleteSubject: (id) =>
    set(state => {
      const subjects = state.subjects.filter(s => s.id !== id);
      const topics   = state.topics.filter(t => t.subjectId !== id);
      persist(subjects, topics);
      return { subjects, topics };
    }),

  addTopic: (subjectId, name, totalReads) => {
    const topic: Topic = {
      id: uuid(), subjectId, name, totalReads,
      reads: buildReads(totalReads),
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const topics   = [...state.topics, topic];
      const subjects = state.subjects.map(s =>
        s.id === subjectId ? { ...s, topicIds: [...s.topicIds, topic.id] } : s
      );
      persist(subjects, topics);
      return { subjects, topics };
    });
    return topic;
  },

  updateTopic: (id, patch) =>
    set(state => {
      const topics = state.topics.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch };
        if (patch.totalReads !== undefined && patch.totalReads !== t.totalReads) {
          updated.reads = buildReads(patch.totalReads, t.reads);
        }
        return updated;
      });
      persist(state.subjects, topics);
      return { topics };
    }),

  deleteTopic: (id) =>
    set(state => {
      const topic    = state.topics.find(t => t.id === id);
      const topics   = state.topics.filter(t => t.id !== id);
      const subjects = topic
        ? state.subjects.map(s =>
            s.id === topic.subjectId
              ? { ...s, topicIds: s.topicIds.filter(tid => tid !== id) }
              : s
          )
        : state.subjects;
      persist(subjects, topics);
      return { subjects, topics };
    }),

  cycleReadStatus: (topicId, readIndex) =>
    set(state => {
      const topics = state.topics.map(t => {
        if (t.id !== topicId) return t;
        const reads = t.reads.map((r, i) => {
          if (i !== readIndex) return r;
          const cur = READ_STATUS_ORDER.indexOf(r.status);
          const next = READ_STATUS_ORDER[(cur + 1) % READ_STATUS_ORDER.length];
          return {
            ...r,
            status: next,
            completedAt: next === 'done' ? new Date().toISOString() : undefined,
          };
        });
        return { ...t, reads };
      });
      persist(state.subjects, topics);
      return { topics };
    }),

  resetTopicReads: (topicId) =>
    set(state => {
      const topics = state.topics.map(t =>
        t.id === topicId
          ? { ...t, reads: buildReads(t.totalReads) }
          : t
      );
      persist(state.subjects, topics);
      return { topics };
    }),
}));

export function getTopicsForSubject(topics: Topic[], subjectId: string): Topic[] {
  return topics.filter(t => t.subjectId === subjectId);
}
