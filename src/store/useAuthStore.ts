/**
 * Auth store — wraps Supabase Auth and drives the hydration flow:
 *
 * On sign-in:
 *  1. Disable sync (prevents race during hydration)
 *  2. Pull all remote data
 *  3a. Remote has data → overwrite local stores + localStorage (server wins)
 *  3b. Remote is empty → schedule push of current local state (local wins)
 *  4. Enable sync — all future mutations auto-sync
 *
 * On sign-out:
 *  setCurrentUser(null) gates all future schedule calls.
 */

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  setCurrentUser, enableSync, disableSync, pullAll,
  scheduleSubjectsSync, scheduleTopicsSync, scheduleSessionsSync,
  scheduleTestsSync, scheduleEventsSync, scheduleSettingsSync,
  scheduleTagsSync, scheduleTestTagsSync, scheduleBookmarksSync,
} from '../lib/sync';
import { useSubjectsStore } from './useSubjectsStore';
import { useSessionsStore } from './useSessionsStore';
import { useTestsStore }    from './useTestsStore';
import { useEventsStore }   from './useEventsStore';
import { useSettingsStore } from './useSettingsStore';
import { useTagsStore }     from './useTagsStore';
import { useTestTagsStore } from './useTestTagsStore';
import { useBookmarksStore } from './useBookmarksStore';
import { storage } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../types';
import type { RemoteData } from '../lib/sync';

interface AuthStore {
  user:        User | null;
  initialized: boolean;
  syncing:     boolean;
  initialize:  () => void;
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>;
  signUp:  (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// Overwrite all local stores with data pulled from Supabase, then persist to localStorage.
function hydrateStores(remote: RemoteData) {
  useSubjectsStore.setState({ subjects: remote.subjects, topics: remote.topics });
  useSessionsStore.setState({ sessions: remote.sessions });
  useTestsStore.setState({ tests: remote.tests });
  useEventsStore.setState({ events: remote.events });
  useTagsStore.setState({ tags: remote.tags });
  useTestTagsStore.setState({ tags: remote.testTags });
  useBookmarksStore.setState({ bookmarks: remote.bookmarks });

  storage.set('subjects', remote.subjects);
  storage.set('topics',   remote.topics);
  storage.set('sessions', remote.sessions);
  storage.set('tests',    remote.tests);
  storage.set('events',   remote.events);
  storage.set('tags',     remote.tags);
  storage.set('test-tags', remote.testTags);
  storage.set('bookmarks', remote.bookmarks);

  if (remote.settings) {
    const merged = { ...DEFAULT_SETTINGS, ...remote.settings };
    useSettingsStore.setState({ settings: merged });
    storage.set('settings', merged);
  }
}

// Push the current local state up to Supabase (first-time login).
function pushLocalState() {
  const { subjects, topics } = useSubjectsStore.getState();
  const { sessions }         = useSessionsStore.getState();
  const { tests }            = useTestsStore.getState();
  const { events }           = useEventsStore.getState();
  const { settings }         = useSettingsStore.getState();
  const { tags }             = useTagsStore.getState();
  const { tags: testTags }   = useTestTagsStore.getState();
  const { bookmarks }        = useBookmarksStore.getState();
  scheduleSubjectsSync(subjects);
  scheduleTopicsSync(topics);
  scheduleSessionsSync(sessions);
  scheduleTestsSync(tests);
  scheduleEventsSync(events);
  scheduleSettingsSync(settings);
  scheduleTagsSync(tags);
  scheduleTestTagsSync(testTags);
  scheduleBookmarksSync(bookmarks);
}

async function handleSignIn(userId: string, set: (p: Partial<AuthStore>) => void) {
  set({ syncing: true });
  setCurrentUser(userId);
  disableSync();

  const remote = await pullAll(userId);
  const hasData = remote && (
    remote.subjects.length > 0 ||
    remote.sessions.length > 0 ||
    remote.tests.length > 0
  );

  if (hasData) {
    hydrateStores(remote!);
  }

  enableSync();

  if (!hasData) {
    // New account — push whatever the user already has locally.
    pushLocalState();
  }

  set({ syncing: false });
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:        null,
  initialized: false,
  syncing:     false,

  initialize() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      set({ user, initialized: true });
      if (user) handleSignIn(user.id, set);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      if (user) {
        handleSignIn(user.id, set);
      } else {
        setCurrentUser(null);
        disableSync();
      }
    });
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  async signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  },

  async signOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    disableSync();
    set({ user: null });
  },
}));
