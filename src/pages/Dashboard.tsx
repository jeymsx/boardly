import React, { useState, useMemo } from 'react';
import {
  BookOpen, GraduationCap, FlaskConical, TrendingUp,
  CalendarDays, CheckCircle2, Clock, ChevronRight, Timer, Activity,
  Plus, BookMarked, RotateCcw,
} from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSessionsStore } from '../store/useSessionsStore';
import { useTestsStore } from '../store/useTestsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useEventsStore } from '../store/useEventsStore';
import { useNavStore } from '../store/useNavStore';
import { overallProgress, subjectProgress, pctNum } from '../utils/progress';
import { highestScore, latestScore } from '../utils/scores';
import { upcomingEvents, formatDay, isToday, daysUntil } from '../utils/dates';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { ActivityPage } from './ActivityPage';
import { COLOR_MAP } from '../types';
import type { AttendanceStatus, Session, CalendarEvent } from '../types';

// ─── Greeting helpers ─────────────────────────────────────────────────────────

const MORNING_GREETINGS   = ['Morning', 'Good morning', 'Rise and shine'];
const AFTERNOON_GREETINGS = ['Good afternoon', 'Hey', 'Hello'];
const EVENING_GREETINGS   = ['Good evening', 'Evening'];
const NIGHT_GREETINGS     = ['Burning the midnight oil', 'Up late', 'Late night grind'];

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const pool =
    hour >= 5  && hour < 12 ? MORNING_GREETINGS   :
    hour >= 12 && hour < 18 ? AFTERNOON_GREETINGS :
    hour >= 18 && hour < 22 ? EVENING_GREETINGS   :
    NIGHT_GREETINGS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return name ? `${pick}, ${name}!` : `${pick}!`;
}

const QUOTES = [
  "Every page you read today is one less thing to worry about tomorrow.",
  "Consistency beats cramming. Show up, even on hard days.",
  "You don't have to be perfect — you just have to pass. Keep going.",
  "Small progress is still progress. Trust the process.",
  "The exam doesn't test how smart you are. It tests how prepared you are.",
  "One topic at a time. One session at a time. One day at a time.",
  "Your future self will thank you for studying today.",
  "Discipline is choosing what you want most over what you want now.",
  "Review, repeat, retain. The formula works — stick to it.",
  "Hard days in review are easier than regret after the exam.",
  "You've already started. That's the hardest part.",
  "Every review session is a deposit into your exam-day confidence.",
  "Mastery is just consistency compounded over time.",
  "The board exam is a marathon, not a sprint. Pace yourself.",
  "Today's effort is tomorrow's edge.",
];

function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

// ─── Attendance badge ─────────────────────────────────────────────────────────

const AttendanceBadge: React.FC<{ status: AttendanceStatus; isToday: boolean }> = ({ status, isToday: todayFlag }) => {
  if (status === 'attended') {
    return (
      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400
        bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/25
        rounded-full px-1.5 py-0.5">
        Attended
      </span>
    );
  }
  if (status === 'partially-attended') {
    return (
      <span className="text-[10px] font-mono font-bold text-orange-700 dark:text-orange-400
        bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/25
        rounded-full px-1.5 py-0.5">
        Partial
      </span>
    );
  }
  // pending
  if (todayFlag) {
    return (
      <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400
        bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/25
        rounded-full px-1.5 py-0.5">
        TODAY
      </span>
    );
  }
  return null;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { subjects, topics } = useSubjectsStore();
  const { sessions } = useSessionsStore();
  const { tests } = useTestsStore();
  const { settings } = useSettingsStore();
  const { events } = useEventsStore();
  const { navigate } = useNavStore();

  const overall = overallProgress(subjects, topics, sessions, tests, settings.targetPassingScore);
  const { upcomingSessions, upcomingReviews } = upcomingEvents(sessions, 7);

  const greeting = React.useMemo(() => getGreeting(settings.userName ?? ''), [settings.userName]);
  const quote    = React.useMemo(() => getDailyQuote(), []);

  const totalTopics = topics.length;
  const doneTopics  = topics.filter(t => t.reads.every(r => r.status === 'done')).length;
  const totalTests  = tests.length;
  const passedTests = tests.filter(t => {
    const hi = highestScore(t.scores);
    return hi !== null && hi >= settings.targetPassingScore;
  }).length;

  const attendedSessions = sessions.filter(s => s.attendanceStatus === 'attended').length;

  // Upcoming sessions + reviews with attendance status on sessions
  const upcomingAll = [
    ...upcomingSessions.map(s => ({
      type: 'session' as const,
      date: s.date,
      label: s.topicLabel,
      subjectId: s.subjectId,
      id: s.id,
      attendanceStatus: s.attendanceStatus,
    })),
    ...upcomingReviews.map(r => ({
      type: 'review' as const,
      date: r.scheduledDate as string,
      label: `Review: ${r.sessionLabel}`,
      subjectId: r.subjectId,
      id: r.id,
      attendanceStatus: undefined,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  // 7-day week summary grid
  const weekDays = React.useMemo(() => {
    const todayBase = new Date();
    todayBase.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayBase);
      d.setDate(d.getDate() + i);
      const iso = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum  = d.getDate();
      const daySessions = sessions.filter(s => s.date === iso);
      const dayReviews  = sessions.flatMap(s =>
        s.reviews
          .filter(r => r.dateEnabled !== false && r.scheduledDate === iso && r.status !== 'done')
          .map(r => ({ ...r, sessionLabel: s.topicLabel, subjectId: s.subjectId }))
      );
      const dayEvents = events.filter(e => e.date === iso);
      return { iso, dayName, dayNum, daySessions, dayReviews, dayEvents, isToday: i === 0 };
    });
  }, [sessions, events]);

  const examDates = settings.examDates ?? [];

  type WeekDayInfo = (typeof weekDays)[number];
  const [selectedDay, setSelectedDay] = useState<WeekDayInfo | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  // Activity feed — derived from existing data, newest first
  const activityFeed = useMemo(() => {
    type ActivityItem = { id: string; ts: string; icon: React.ReactNode; label: string; sub?: string; color: string };
    const items: ActivityItem[] = [];

    subjects.forEach(s => {
      items.push({ id: `subj-${s.id}`, ts: s.createdAt, icon: <BookOpen size={13} />, label: `Added subject: ${s.name}`, color: 'emerald' });
    });

    topics.forEach(t => {
      const subj = subjects.find(s => s.id === t.subjectId);
      items.push({ id: `topic-${t.id}`, ts: t.createdAt, icon: <Plus size={13} />, label: `Added topic: ${t.name}`, sub: subj?.name, color: 'jade' });
      t.reads.forEach(r => {
        if (r.status === 'done' && r.completedAt) {
          items.push({ id: `read-${r.id}`, ts: r.completedAt, icon: <CheckCircle2 size={13} />, label: `Read ${r.readNumber}/${t.totalReads} done: ${t.name}`, sub: subj?.name, color: 'sky' });
        }
      });
    });

    sessions.forEach(s => {
      const subj = subjects.find(sub => sub.id === s.subjectId);
      items.push({ id: `sess-${s.id}`, ts: s.createdAt, icon: <GraduationCap size={13} />, label: `Added session: ${s.topicLabel}`, sub: subj?.name, color: 'sky' });
      s.reviews.forEach(r => {
        if (r.status === 'done' && r.completedAt) {
          items.push({ id: `rev-${r.id}`, ts: r.completedAt, icon: <RotateCcw size={13} />, label: `Review ${r.reviewNumber} done: ${s.topicLabel}`, sub: subj?.name, color: 'emerald' });
        }
      });
    });

    tests.forEach(t => {
      const subj = t.subjectEnabled && t.subjectId ? subjects.find(s => s.id === t.subjectId) : undefined;
      items.push({ id: `test-${t.id}`, ts: t.createdAt, icon: <FlaskConical size={13} />, label: `Added test: ${t.name}`, sub: subj?.name, color: 'violet' });
      t.scores.forEach(sc => {
        const pct = ((sc.score / sc.maxScore) * 100).toFixed(1);
        items.push({ id: `score-${sc.id}`, ts: sc.date, icon: <BookMarked size={13} />, label: `Scored ${pct}% on ${t.name}`, sub: subj?.name, color: 'violet' });
      });
    });

    return items.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [subjects, topics, sessions, tests]);

  if (showActivity) {
    return <ActivityPage onBack={() => setShowActivity(false)} />;
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 leading-tight">
          {greeting}
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-body mt-1 leading-relaxed">
          {quote}
        </p>
      </div>

      {/* Hero progress */}
      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden shadow-glow-emerald
        bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-ink-800 dark:to-ink-900
        border border-emerald-500/30 dark:border-emerald-500/20"
      >
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-ink opacity-20 dark:opacity-30" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-mono font-medium text-white/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1">
                Overall Progress
              </p>
              <p className="font-display font-bold text-4xl text-white tracking-tight">
                {pctNum(overall)}<span className="text-xl text-white/70 dark:text-emerald-400 ml-1">%</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-emerald-500/15
              border border-white/30 dark:border-emerald-500/25 flex items-center justify-center">
              <TrendingUp size={22} className="text-white dark:text-emerald-400" />
            </div>
          </div>
          <ProgressBar value={overall} size="lg" color="jade" />
          <p className="text-xs text-white/60 dark:text-slate-500 font-body mt-2">
            Keep going — consistent study beats cramming.
          </p>
        </div>
      </div>

      {/* Exam Countdown */}
      {examDates.length > 0 && (
        <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
          rounded-2xl overflow-hidden mb-4 shadow-card dark:shadow-none">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center gap-2">
            <Timer size={14} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
              {settings.boardExamName || 'Board Exam'} Countdown
            </h2>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
            {examDates.map(ed => {
              const days = daysUntil(ed.date);
              const label = days === 0 ? 'Today!' : days < 0 ? 'Passed' : `${days} day${days !== 1 ? 's' : ''} left`;
              const color = days === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : days < 0
                ? 'text-slate-400 dark:text-slate-600'
                : days <= 7
                ? 'text-rose-600 dark:text-rose-400'
                : days <= 30
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400';
              return (
                <div key={ed.id} className="flex items-center gap-3">
                  <div>
                    <p className="text-xs font-body text-slate-500 dark:text-slate-400">{ed.label}</p>
                    <p className={`font-display font-bold text-2xl ${color}`}>{label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Subjects',     value: subjects.length,                          icon: <BookOpen size={16} />,      color: 'emerald', onClick: () => navigate('subjects') },
          { label: 'Topics Done',  value: `${doneTopics}/${totalTopics}`,           icon: <CheckCircle2 size={16} />,  color: 'jade',    onClick: () => navigate('subjects') },
          { label: 'Sessions',     value: `${attendedSessions}/${sessions.length}`, icon: <GraduationCap size={16} />, color: 'sky',     onClick: () => navigate('sessions') },
          { label: 'Tests Passed', value: `${passedTests}/${totalTests}`,           icon: <FlaskConical size={16} />,  color: 'violet',  onClick: () => navigate('tests')    },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50 rounded-xl p-3.5
              hover:border-slate-300 dark:hover:border-ink-600/70 hover:shadow-card-hover
              transition-all active:scale-[0.98] text-left group shadow-card dark:shadow-none"
          >
            <div className={`w-7 h-7 rounded-lg mb-2 flex items-center justify-center
              ${stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                stat.color === 'jade'    ? 'bg-emerald-50 dark:bg-jade-500/15 text-emerald-600 dark:text-jade-400' :
                stat.color === 'sky'     ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-500 dark:text-sky-400' :
                'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400'}`}
            >
              {stat.icon}
            </div>
            <p className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Subject progress */}
        <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
          rounded-xl overflow-hidden shadow-card dark:shadow-none">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Subject Progress</h2>
            <button
              onClick={() => navigate('subjects')}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {subjects.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-600">No subjects yet.</p>
              <button onClick={() => navigate('subjects')}
                className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 hover:text-emerald-700">
                Add your first subject →
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-3">
              {subjects.map(subject => {
                const colors = COLOR_MAP[subject.color];
                const prog   = subjectProgress(subject, topics);
                const tCount = topics.filter(t => t.subjectId === subject.id).length;
                return (
                  <div key={subject.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <span className="text-sm font-body font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                          {subject.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400 dark:text-slate-600">{tCount}T</span>
                        <span className={colors.text}>{pctNum(prog)}%</span>
                      </div>
                    </div>
                    <ProgressBar value={prog} size="xs" gradient />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming sessions + reviews */}
        <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
          rounded-xl overflow-hidden shadow-card dark:shadow-none">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Upcoming (7 days)</h2>
            <button
              onClick={() => navigate('calendar')}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Calendar <ChevronRight size={12} />
            </button>
          </div>
          {upcomingAll.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CalendarDays size={24} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-600">Nothing coming up.</p>
            </div>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-2">
              {upcomingAll.map(item => {
                const subject   = subjects.find(s => s.id === item.subjectId);
                const colors    = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
                const todayFlag = isToday(item.date);
                return (
                  <div key={item.id + item.type}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg
                      bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                      ${item.type === 'session' ? 'bg-sky-50 dark:bg-sky-500/15' : 'bg-emerald-50 dark:bg-emerald-500/15'}`}>
                      {item.type === 'session'
                        ? <GraduationCap size={14} className="text-sky-500 dark:text-sky-400" />
                        : <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</p>
                      {subject && <p className={`text-[10px] ${colors.text} truncate`}>{subject.name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {item.type === 'session' && item.attendanceStatus ? (
                        <AttendanceBadge status={item.attendanceStatus} isToday={todayFlag} />
                      ) : todayFlag ? (
                        <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400
                          bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/25
                          rounded-full px-1.5 py-0.5">TODAY</span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">{formatDay(item.date)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-Day Week Summary */}
        <div className="lg:col-span-2 bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
          rounded-xl overflow-hidden shadow-card dark:shadow-none">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">This Week</h2>
              <div className="flex items-center gap-2.5">
                {[
                  { color: 'bg-sky-400', label: 'Session' },
                  { color: 'bg-emerald-400', label: 'Review' },
                  { color: 'bg-violet-400', label: 'Event' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} />
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">{label}</span>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('calendar')}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Calendar <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-3 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[320px]">
              {weekDays.map((day) => {
                const { iso, dayName, dayNum, daySessions, dayReviews, dayEvents, isToday: todayCard } = day;
                const chips = [
                  ...daySessions.map(s => ({ key: `s-${s.id}`, label: s.topicLabel, color: 'sky' as const })),
                  ...dayReviews.map(r => ({ key: `r-${r.id}`, label: `Rev ${r.reviewNumber}`, color: 'emerald' as const })),
                  ...dayEvents.map(e => ({ key: `e-${e.id}`, label: e.title, color: 'violet' as const })),
                ];
                const visibleChips = chips.slice(0, 2);
                const extra = chips.length - visibleChips.length;
                return (
                  <button key={iso}
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-start rounded-xl p-1.5 gap-1.5 transition-all
                      active:scale-[0.96] cursor-pointer w-full overflow-hidden
                      ${todayCard
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-400 dark:border-emerald-500/50 hover:shadow-md'
                        : 'bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40 hover:border-slate-300 dark:hover:border-ink-600/60 hover:shadow-sm'}`}
                  >
                    <div className="flex items-baseline justify-between w-full gap-1">
                      <span className={`font-display font-bold text-sm leading-none
                        ${todayCard ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dayNum}
                      </span>
                      <span className={`text-[8px] font-mono font-semibold uppercase tracking-wider shrink-0
                        ${todayCard ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        {dayName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 w-full">
                      {visibleChips.map(chip => (
                        <span key={chip.key}
                          className={`w-full flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-mono leading-tight overflow-hidden
                            ${chip.color === 'sky'
                              ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                              : chip.color === 'emerald'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'}`}
                        >
                          <span className={`w-1 h-1 rounded-full shrink-0
                            ${chip.color === 'sky' ? 'bg-sky-400' : chip.color === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'}`} />
                          <span className="truncate">{chip.label}</span>
                        </span>
                      ))}
                      {chips.length === 0 && (
                        <span className={`text-[10px] ${todayCard ? 'text-emerald-300 dark:text-emerald-600/50' : 'text-slate-300 dark:text-slate-700'}`}>
                          —
                        </span>
                      )}
                      {extra > 0 && (
                        <span className="text-[8px] font-mono px-1 text-slate-400 dark:text-slate-500 leading-tight">
                          +{extra} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent test scores */}
        {tests.length > 0 && (
          <div className="lg:col-span-2 bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
            rounded-xl overflow-hidden shadow-card dark:shadow-none">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center justify-between">
              <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Mastery Tests</h2>
              <button
                onClick={() => navigate('tests')}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                  hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 p-3">
              {tests.slice(0, 4).map(test => {
                const latest  = latestScore(test.scores);
                const passed  = latest !== null && latest >= test.targetScore;
                const subject = test.subjectEnabled !== false && test.subjectId
                  ? subjects.find(s => s.id === test.subjectId)
                  : undefined;
                const colors  = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
                return (
                  <div key={test.id}
                    className="bg-slate-50 dark:bg-ink-900/40 border border-slate-200 dark:border-ink-700/40
                      rounded-lg px-3 py-2.5">
                    <p className="text-xs font-body font-medium text-slate-700 dark:text-slate-300 truncate mb-1">{test.name}</p>
                    {subject && <p className={`text-[10px] ${colors.text} mb-2 truncate`}>{subject.name}</p>}
                    {latest !== null ? (
                      <div>
                        <ProgressBar value={latest / 100} size="xs" color={passed ? 'jade' : 'rose'} />
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs font-mono font-semibold
                            ${passed ? 'text-emerald-600 dark:text-jade-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {latest.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">/{test.targetScore}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-600">No scores yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="mt-4 bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
        rounded-xl overflow-hidden shadow-card dark:shadow-none">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center gap-2">
          <Activity size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">Activity</h2>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 ml-1">
            {activityFeed.length} event{activityFeed.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowActivity(true)}
            className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
              hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>
        {activityFeed.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Activity size={24} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-600">No activity yet. Start adding subjects and sessions!</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <div className="px-4 py-3 flex flex-col gap-2">
              {activityFeed.map((item, idx) => {
                const ts = new Date(item.ts);
                const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <div key={item.id} className="flex items-start gap-3 relative">
                    {/* Timeline line */}
                    {idx < activityFeed.length - 1 && (
                      <div className="absolute left-[15px] top-7 bottom-0 w-px bg-slate-100 dark:bg-ink-700/60" />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10
                      ${item.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        item.color === 'jade'    ? 'bg-emerald-50 dark:bg-jade-500/15 text-emerald-600 dark:text-jade-400' :
                        item.color === 'sky'     ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-500 dark:text-sky-400' :
                        item.color === 'violet'  ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400' :
                        'bg-slate-50 dark:bg-ink-700/60 text-slate-500'}`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-xs font-body font-medium text-slate-700 dark:text-slate-300 leading-snug truncate">
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 truncate">{item.sub}</p>
                      )}
                      <p className="text-[10px] font-mono text-slate-300 dark:text-slate-700 mt-0.5">
                        {dateStr} · {timeStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <Modal
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={`${selectedDay.dayName}, ${new Date(selectedDay.iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
        >
          <div className="flex flex-col gap-4">
            {selectedDay.daySessions.length === 0 && selectedDay.dayReviews.length === 0 && selectedDay.dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-600 text-center py-4">Nothing scheduled for this day.</p>
            ) : (
              <>
                {selectedDay.daySessions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2">
                      Sessions
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {selectedDay.daySessions.map((s: Session) => {
                        const subj = subjects.find(sub => sub.id === s.subjectId);
                        const colors = subj ? COLOR_MAP[subj.color] : COLOR_MAP.amber;
                        return (
                          <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20">
                            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">{s.topicLabel}</p>
                              {subj && <p className={`text-xs ${colors.text} truncate`}>{subj.name}</p>}
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full
                              ${s.attendanceStatus === 'attended'
                                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                : s.attendanceStatus === 'partially-attended'
                                ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30'
                                : 'bg-slate-100 dark:bg-ink-700/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-ink-600/40'}`}>
                              {s.attendanceStatus === 'attended' ? 'Attended' : s.attendanceStatus === 'partially-attended' ? 'Partial' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDay.dayReviews.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2">
                      Reviews
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {selectedDay.dayReviews.map((r) => {
                        const subj = subjects.find(sub => sub.id === r.subjectId);
                        const colors = subj ? COLOR_MAP[subj.color] : COLOR_MAP.amber;
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">
                                Review {r.reviewNumber} — {r.sessionLabel}
                              </p>
                              {subj && <p className={`text-xs ${colors.text} truncate`}>{subj.name}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDay.dayEvents.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2">
                      Events
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {selectedDay.dayEvents.map((e: CalendarEvent) => (
                        <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                          bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                          <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">{e.title}</p>
                            {e.notes && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{e.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
