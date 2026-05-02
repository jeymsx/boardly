import React from 'react';
import {
  BookOpen, GraduationCap, FlaskConical, TrendingUp,
  CalendarDays, CheckCircle2, Clock, ChevronRight, Timer,
} from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSessionsStore } from '../store/useSessionsStore';
import { useTestsStore } from '../store/useTestsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNavStore } from '../store/useNavStore';
import { overallProgress, subjectProgress, pctNum } from '../utils/progress';
import { highestScore, latestScore } from '../utils/scores';
import { upcomingEvents, formatDay, isToday, daysUntil } from '../utils/dates';
import { ProgressBar } from '../components/ui/ProgressBar';
import { COLOR_MAP } from '../types';

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { subjects, topics } = useSubjectsStore();
  const { sessions } = useSessionsStore();
  const { tests } = useTestsStore();
  const { settings } = useSettingsStore();
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

  const upcomingAll = [
    ...upcomingSessions.map(s => ({ type: 'session' as const, date: s.date, label: s.topicLabel, subjectId: s.subjectId, id: s.id })),
    ...upcomingReviews.map(r => ({ type: 'review' as const, date: r.scheduledDate as string, label: `Review: ${r.sessionLabel}`, subjectId: r.subjectId, id: r.id })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  const examDates = settings.examDates ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 leading-tight">
          {greeting}
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-body mt-1 leading-relaxed">
          {quote}
        </p>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Subjects',      value: subjects.length,                      icon: <BookOpen size={16} />,     color: 'emerald', onClick: () => navigate('subjects') },
          { label: 'Topics Done',   value: `${doneTopics}/${totalTopics}`,       icon: <CheckCircle2 size={16} />, color: 'jade',    onClick: () => navigate('subjects') },
          { label: 'Sessions',      value: `${attendedSessions}/${sessions.length}`, icon: <GraduationCap size={16} />, color: 'sky', onClick: () => navigate('sessions') },
          { label: 'Tests Passed',  value: `${passedTests}/${totalTests}`,       icon: <FlaskConical size={16} />, color: 'violet',  onClick: () => navigate('tests')    },
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

        {/* Upcoming tasks */}
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
                const subject = subjects.find(s => s.id === item.subjectId);
                const colors  = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
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
                      {todayFlag ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400
                          bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/25
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

        {/* Recent test scores */}
        {tests.length > 0 && (
          <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
            rounded-xl overflow-hidden lg:col-span-2 shadow-card dark:shadow-none">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
              {tests.slice(0, 6).map(test => {
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
    </div>
  );
};
