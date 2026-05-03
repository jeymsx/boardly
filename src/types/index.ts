// ─── Status Types ────────────────────────────────────────────────────────────

export type ReadStatus = 'pending' | 'in-progress' | 'done';
export type AttendanceStatus = 'pending' | 'partially-attended' | 'attended';

export const READ_STATUS_ORDER: ReadStatus[] = ['pending', 'in-progress', 'done'];
export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = ['pending', 'partially-attended', 'attended'];

// ─── Subject & Topic ─────────────────────────────────────────────────────────

export interface ReadEntry {
  id: string;
  readNumber: number;
  status: ReadStatus;
  completedAt?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  totalReads: number;
  reads: ReadEntry[];
  notes?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  topicIds: string[];
  createdAt: string;
}

export type SubjectColor =
  | 'amber'
  | 'jade'
  | 'sky'
  | 'rose'
  | 'violet'
  | 'orange'
  | 'teal'
  | 'pink';

export const SUBJECT_COLORS: SubjectColor[] = [
  'amber', 'jade', 'sky', 'rose', 'violet', 'orange', 'teal', 'pink',
];

export const COLOR_MAP: Record<SubjectColor, { bg: string; solidBg: string; text: string; border: string; dot: string }> = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   solidBg: 'bg-amber-100 dark:bg-amber-500/25',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-300 dark:border-amber-500/30',   dot: 'bg-amber-500'   },
  jade:   { bg: 'bg-emerald-50 dark:bg-jade-500/10',  solidBg: 'bg-emerald-100 dark:bg-jade-500/25',  text: 'text-emerald-700 dark:text-jade-400',  border: 'border-emerald-300 dark:border-jade-500/30',  dot: 'bg-emerald-500' },
  sky:    { bg: 'bg-sky-400/10 dark:bg-sky-500/10',   solidBg: 'bg-sky-100 dark:bg-sky-500/25',       text: 'text-sky-700 dark:text-sky-400',       border: 'border-sky-400/40 dark:border-sky-500/30',    dot: 'bg-sky-500'     },
  rose:   { bg: 'bg-rose-400/10 dark:bg-rose-500/10', solidBg: 'bg-rose-100 dark:bg-rose-500/25',     text: 'text-rose-700 dark:text-rose-400',     border: 'border-rose-400/40 dark:border-rose-500/30',  dot: 'bg-rose-500'    },
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', solidBg: 'bg-violet-100 dark:bg-violet-500/25', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500'  },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', solidBg: 'bg-orange-100 dark:bg-orange-500/25', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-500/30', dot: 'bg-orange-500'  },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-500/10',     solidBg: 'bg-teal-100 dark:bg-teal-500/25',     text: 'text-teal-700 dark:text-teal-400',     border: 'border-teal-300 dark:border-teal-500/30',     dot: 'bg-teal-500'    },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-500/10',     solidBg: 'bg-pink-100 dark:bg-pink-500/25',     text: 'text-pink-700 dark:text-pink-400',     border: 'border-pink-300 dark:border-pink-500/30',     dot: 'bg-pink-500'    },
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface ReviewEntry {
  id: string;
  sessionId: string;
  reviewNumber: number;
  scheduledDate: string | null;  // null when dateEnabled = false
  dateEnabled: boolean;
  status: ReadStatus;
  completedAt?: string;
}

export interface WeeklyScore {
  id: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  date: string;
  link?: string;
  notes?: string;
}

export interface WeeklyTest {
  scores: WeeklyScore[];
  link?: string;
}

export interface Session {
  id: string;
  date: string;
  subjectId: string;
  topicLabel: string;
  attendanceStatus: AttendanceStatus;
  reviews: ReviewEntry[];
  totalReviews: number;
  notes?: string;
  notesLink?: string;
  weeklyTest?: WeeklyTest;
  createdAt: string;
}

// ─── Mastery Tests ────────────────────────────────────────────────────────────

export interface ScoreEntry {
  id: string;
  testId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
  link?: string;
}

export interface MasteryTest {
  id: string;
  name: string;
  subjectId?: string;
  subjectEnabled: boolean;
  topicLabel?: string;
  topicId?: string;
  scores: ScoreEntry[];
  targetScore: number;
  link?: string;
  createdAt: string;
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  subjectId?: string;
  topicLabel?: string;
  notes?: string;
  color?: SubjectColor;
  createdAt: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface ExamDate {
  id: string;
  label: string;
  date: string;
}

export interface PageLabels {
  dashboard: string;
  subjects:  string;
  sessions:  string;
  tests:     string;
  calendar:  string;
  settings:  string;
}

export const DEFAULT_PAGE_LABELS: PageLabels = {
  dashboard: 'Dashboard',
  subjects:  'Subjects',
  sessions:  'Sessions',
  tests:     'Tests',
  calendar:  'Calendar',
  settings:  'Settings',
};

export interface AppSettings {
  userName: string;
  boardExamName: string;
  defaultReadsPerTopic: number;
  defaultReviewsPerSession: number;
  reviewIntervals: number[];
  targetPassingScore: number;
  autoGenerateReviews: boolean;
  examDates: ExamDate[];
  pageLabels: PageLabels;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  boardExamName: '',
  defaultReadsPerTopic: 3,
  defaultReviewsPerSession: 3,
  reviewIntervals: [1, 3, 7],
  targetPassingScore: 90,
  autoGenerateReviews: true,
  examDates: [],
  pageLabels: { ...DEFAULT_PAGE_LABELS },
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export type NavPage = 'dashboard' | 'subjects' | 'sessions' | 'tests' | 'calendar' | 'settings';
