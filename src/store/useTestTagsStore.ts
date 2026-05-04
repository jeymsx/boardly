import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleTestTagsSync } from '../lib/sync';
import type { Tag } from '../types';

interface TestTagsStore {
  tags: Tag[];
  addTag: (name: string) => Tag | null;
  updateTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
}

export const useTestTagsStore = create<TestTagsStore>((set, get) => ({
  tags: storage.get<Tag[]>('test-tags', []),

  addTag: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (get().tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return null;
    const tag: Tag = { id: uuid(), name: trimmed, createdAt: new Date().toISOString() };
    set(state => {
      const tags = [...state.tags, tag];
      storage.set('test-tags', tags);
      return { tags };
    });
    scheduleTestTagsSync(get().tags);
    return tag;
  },

  updateTag: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => {
      const tags = state.tags.map(t => t.id === id ? { ...t, name: trimmed } : t);
      storage.set('test-tags', tags);
      return { tags };
    });
    scheduleTestTagsSync(get().tags);
  },

  deleteTag: (id: string) => {
    set(state => {
      const tags = state.tags.filter(t => t.id !== id);
      storage.set('test-tags', tags);
      return { tags };
    });
    scheduleTestTagsSync(get().tags);
  },
}));
