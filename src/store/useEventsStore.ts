import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { scheduleEventsSync } from '../lib/sync';
import type { CalendarEvent, SubjectColor } from '../types';

interface EventsStore {
  events: CalendarEvent[];
  addEvent:    (params: { title: string; date: string; subjectId?: string; topicLabel?: string; notes?: string; color?: SubjectColor }) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: storage.get<CalendarEvent[]>('events', []),

  addEvent: (params) => {
    const event: CalendarEvent = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      title: params.title,
      date: params.date,
      subjectId: params.subjectId,
      topicLabel: params.topicLabel,
      notes: params.notes,
      color: params.color,
    };
    set(state => {
      const events = [...state.events, event];
      storage.set('events', events);
      return { events };
    });
    scheduleEventsSync(get().events);
    return event;
  },

  updateEvent: (id, patch) => {
    set(state => {
      const events = state.events.map(e => e.id === id ? { ...e, ...patch } : e);
      storage.set('events', events);
      return { events };
    });
    scheduleEventsSync(get().events);
  },

  deleteEvent: (id) => {
    set(state => {
      const events = state.events.filter(e => e.id !== id);
      storage.set('events', events);
      return { events };
    });
    scheduleEventsSync(get().events);
  },
}));
