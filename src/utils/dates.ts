import {
  format, addDays, isSameDay, parseISO,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isBefore, isAfter, startOfDay, differenceInCalendarDays,
} from 'date-fns';
import type { Session, ReviewEntry, CalendarEvent } from '../types';

export function generateReviewDates(sessionDate: string, intervals: number[]): string[] {
  const base = parseISO(sessionDate);
  return intervals.map(d => format(addDays(base, d), 'yyyy-MM-dd'));
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(iso: string, fmt = 'MMM d, yyyy'): string {
  try { return format(parseISO(iso), fmt); } catch { return iso; }
}

export function formatDay(iso: string): string {
  return formatDate(iso, 'EEE, MMM d');
}

export function isToday(iso: string): boolean {
  return isSameDay(parseISO(iso), new Date());
}

export function isPast(iso: string): boolean {
  return isBefore(startOfDay(parseISO(iso)), startOfDay(new Date()));
}

export function isFuture(iso: string): boolean {
  return isAfter(startOfDay(parseISO(iso)), startOfDay(new Date()));
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), startOfDay(new Date()));
}

export interface CalendarDay {
  date: string;
  sessions: Session[];
  reviews: ReviewEntry[];
  events: CalendarEvent[];
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
}

export function buildCalendarMonth(
  year: number,
  month: number,
  sessions: Session[],
  events: CalendarEvent[] = [],
): CalendarDay[] {
  const first = startOfMonth(new Date(year, month));
  const last = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start: first, end: last });

  return days.map(day => {
    const iso = format(day, 'yyyy-MM-dd');
    const daySessions = sessions.filter(s => s.date === iso);
    const dayReviews: ReviewEntry[] = sessions.flatMap(s =>
      s.reviews.filter(r =>
        r.dateEnabled !== false &&
        r.scheduledDate !== null &&
        r.scheduledDate === iso
      )
    );
    const dayEvents = events.filter(e => e.date === iso);
    return {
      date: iso,
      sessions: daySessions,
      reviews: dayReviews,
      events: dayEvents,
      isToday: isSameDay(day, new Date()),
      isPast: isBefore(startOfDay(day), startOfDay(new Date())),
      isCurrentMonth: true,
    };
  });
}

export function upcomingEvents(sessions: Session[], daysAhead = 7) {
  const today = todayISO();
  const cutoff = format(addDays(parseISO(today), daysAhead), 'yyyy-MM-dd');

  const upcomingSessions = sessions.filter(
    s => s.date >= today && s.date <= cutoff
  );

  const upcomingReviews = sessions.flatMap(s =>
    s.reviews
      .filter(r =>
        r.dateEnabled !== false &&
        r.scheduledDate !== null &&
        r.scheduledDate! >= today &&
        r.scheduledDate! <= cutoff &&
        r.status !== 'done'
      )
      .map(r => ({ ...r, sessionLabel: s.topicLabel, subjectId: s.subjectId }))
  );

  return { upcomingSessions, upcomingReviews };
}
