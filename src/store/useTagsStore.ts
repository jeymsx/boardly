import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleTagsSync } from '../lib/sync';
import type { Tag } from '../types';

interface TagsStore {
  tags: Tag[];
  addTag: (name: string) => Tag | null;
  updateTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
}

export const useTagsStore = create<TagsStore>((set, get) => ({
  tags: storage.get<Tag[]>('tags', []),

  addTag: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (get().tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return null;
    const tag: Tag = { id: uuid(), name: trimmed, createdAt: new Date().toISOString() };
    set(state => {
      const tags = [...state.tags, tag];
      storage.set('tags', tags);
      return { tags };
    });
    scheduleTagsSync(get().tags);
    return tag;
  },

  updateTag: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => {
      const tags = state.tags.map(t => t.id === id ? { ...t, name: trimmed } : t);
      storage.set('tags', tags);
      return { tags };
    });
    scheduleTagsSync(get().tags);
  },

  deleteTag: (id: string) => {
    set(state => {
      const tags = state.tags.filter(t => t.id !== id);
      storage.set('tags', tags);
      return { tags };
    });
    scheduleTagsSync(get().tags);
  },
}));
