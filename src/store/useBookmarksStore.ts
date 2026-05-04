import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleBookmarksSync } from '../lib/sync';
import type { Bookmark } from '../types';

interface BookmarksStore {
  bookmarks: Bookmark[];
  addBookmark:    (params: { title: string; url: string; icon?: string }) => void;
  updateBookmark: (id: string, patch: Partial<Pick<Bookmark, 'title' | 'url' | 'icon'>>) => void;
  deleteBookmark: (id: string) => void;
  togglePin:      (id: string) => void;
}

function persist(bookmarks: Bookmark[]) {
  storage.set('bookmarks', bookmarks);
}

export const useBookmarksStore = create<BookmarksStore>((set, get) => ({
  bookmarks: storage.get<Bookmark[]>('bookmarks', []),

  addBookmark: ({ title, url, icon }) => {
    const bookmark: Bookmark = {
      id: uuid(), title, url, icon, pinned: false,
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const bookmarks = [...state.bookmarks, bookmark];
      persist(bookmarks);
      return { bookmarks };
    });
    scheduleBookmarksSync(get().bookmarks);
  },

  updateBookmark: (id, patch) => {
    set(state => {
      const bookmarks = state.bookmarks.map(b => b.id === id ? { ...b, ...patch } : b);
      persist(bookmarks);
      return { bookmarks };
    });
    scheduleBookmarksSync(get().bookmarks);
  },

  deleteBookmark: (id) => {
    set(state => {
      const bookmarks = state.bookmarks.filter(b => b.id !== id);
      persist(bookmarks);
      return { bookmarks };
    });
    scheduleBookmarksSync(get().bookmarks);
  },

  togglePin: (id) => {
    set(state => {
      const bookmarks = state.bookmarks.map(b => b.id === id ? { ...b, pinned: !b.pinned } : b);
      persist(bookmarks);
      return { bookmarks };
    });
    scheduleBookmarksSync(get().bookmarks);
  },
}));
