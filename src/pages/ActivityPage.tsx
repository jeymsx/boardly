import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, BookOpen, Plus, CheckCircle2, GraduationCap,
  RotateCcw, FlaskConical, BookMarked, Activity,
} from 'lucide-react';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useSessionsStore } from '../store/useSessionsStore';
import { useTestsStore } from '../store/useTestsStore';
import { COLOR_MAP } from '../types';

// ─── Internal category (for styling) ─────────────────────────────────────────

type Category = 'subject' | 'topic' | 'read' | 'session' | 'review' | 'test' | 'score';

const CATEGORY_STYLE: Record<Category, { dot: string; iconBg: string }> = {
  subject: { dot: 'bg-amber-500',   iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'     },
  topic:   { dot: 'bg-amber-500',   iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'     },
  read:    { dot: 'bg-amber-500',   iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'     },
  session: { dot: 'bg-sky-500',     iconBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'             },
  test:    { dot: 'bg-sky-500',     iconBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'             },
  score:   { dot: 'bg-sky-500',     iconBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'             },
  review:  { dot: 'bg-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
};

// ─── Filter groups (the 3 legend chips) ───────────────────────────────────────

type FilterGroup = 'subject' | 'session' | 'review';

const FILTER_GROUPS: Record<FilterGroup, Category[]> = {
  subject: ['subject', 'topic', 'read'],
  session: ['session', 'test', 'score'],
  review:  ['review'],
};

const FILTER_STYLE: Record<FilterGroup, {
  label: string;
  dot: string;
  activeChip: string;
  inactiveChip: string;
}> = {
  subject: {
    label: 'Subject',
    dot: 'bg-amber-500',
    activeChip:   'bg-amber-100 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-400/50 dark:border-amber-500/40',
    inactiveChip: 'bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-700/50 hover:border-amber-300 dark:hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400',
  },
  session: {
    label: 'Session',
    dot: 'bg-sky-500',
    activeChip:   'bg-sky-100 dark:bg-sky-500/25 text-sky-700 dark:text-sky-300 border-sky-400/50 dark:border-sky-500/40',
    inactiveChip: 'bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-700/50 hover:border-sky-300 dark:hover:border-sky-500/30 hover:text-sky-600 dark:hover:text-sky-400',
  },
  review: {
    label: 'Review',
    dot: 'bg-emerald-500',
    activeChip:   'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-400/50 dark:border-emerald-500/40',
    inactiveChip: 'bg-white dark:bg-ink-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-700/50 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400',
  },
};

const FILTER_ORDER: FilterGroup[] = ['subject', 'session', 'review'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  ts: string;
  category: Category;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  subjectColor?: string;
}

interface Props {
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(ts: string): string {
  const now  = Date.now();
  const then = new Date(ts).getTime();
  const diff = now - then;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const d         = new Date(item.ts);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let key: string;
    if (d.toDateString() === today.toDateString())          key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Activity Page ────────────────────────────────────────────────────────────

export const ActivityPage: React.FC<Props> = ({ onBack }) => {
  const { subjects, topics } = useSubjectsStore();
  const { sessions } = useSessionsStore();
  const { tests } = useTestsStore();

  const [activeFilters, setActiveFilters] = useState<Set<FilterGroup>>(new Set());

  const feed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    subjects.forEach(s => {
      items.push({
        id: `subj-${s.id}`, ts: s.createdAt,
        category: 'subject',
        icon: <BookOpen size={16} />,
        label: 'Added subject',
        sub: s.name,
        subjectColor: s.color,
      });
    });

    topics.forEach(t => {
      const subj = subjects.find(s => s.id === t.subjectId);
      items.push({
        id: `topic-${t.id}`, ts: t.createdAt,
        category: 'topic',
        icon: <Plus size={16} />,
        label: 'Added topic',
        sub: `${t.name}${subj ? ` · ${subj.name}` : ''}`,
        subjectColor: subj?.color,
      });
      t.reads.forEach(r => {
        if (r.status === 'done' && r.completedAt) {
          items.push({
            id: `read-${r.id}`, ts: r.completedAt,
            category: 'read',
            icon: <CheckCircle2 size={16} />,
            label: `Completed read ${r.readNumber} of ${t.totalReads}`,
            sub: `${t.name}${subj ? ` · ${subj.name}` : ''}`,
            subjectColor: subj?.color,
          });
        }
      });
    });

    sessions.forEach(s => {
      const subj = subjects.find(sub => sub.id === s.subjectId);
      items.push({
        id: `sess-${s.id}`, ts: s.createdAt,
        category: 'session',
        icon: <GraduationCap size={16} />,
        label: 'Added session',
        sub: `${s.topicLabel}${subj ? ` · ${subj.name}` : ''}`,
        subjectColor: subj?.color,
      });
      s.reviews.forEach(r => {
        if (r.status === 'done' && r.completedAt) {
          items.push({
            id: `rev-${r.id}`, ts: r.completedAt,
            category: 'review',
            icon: <RotateCcw size={16} />,
            label: `Completed review ${r.reviewNumber}`,
            sub: `${s.topicLabel}${subj ? ` · ${subj.name}` : ''}`,
            subjectColor: subj?.color,
          });
        }
      });
    });

    tests.forEach(t => {
      const subj = t.subjectEnabled && t.subjectId ? subjects.find(s => s.id === t.subjectId) : undefined;
      items.push({
        id: `test-${t.id}`, ts: t.createdAt,
        category: 'test',
        icon: <FlaskConical size={16} />,
        label: 'Added test',
        sub: `${t.name}${subj ? ` · ${subj.name}` : ''}`,
        subjectColor: subj?.color,
      });
      t.scores.forEach(sc => {
        const pct = ((sc.score / sc.maxScore) * 100).toFixed(1);
        items.push({
          id: `score-${sc.id}`, ts: sc.date,
          category: 'score',
          icon: <BookMarked size={16} />,
          label: `Scored ${pct}%`,
          sub: `${t.name}${subj ? ` · ${subj.name}` : ''}`,
          subjectColor: subj?.color,
        });
      });
    });

    return items.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [subjects, topics, sessions, tests]);

  // Filter the feed based on active chips (empty = show all)
  const visibleFeed = useMemo(() => {
    if (activeFilters.size === 0) return feed;
    const allowed = new Set<Category>();
    activeFilters.forEach(f => FILTER_GROUPS[f].forEach(c => allowed.add(c)));
    return feed.filter(item => allowed.has(item.category));
  }, [feed, activeFilters]);

  const groups = useMemo(() => groupByDate(visibleFeed), [visibleFeed]);

  const toggleFilter = (f: FilterGroup) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  return (
    <div className="min-h-full animate-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-ink-950/90 backdrop-blur-xl
        border-b border-slate-200 dark:border-ink-800/60">
        <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-ink-800/60
              hover:bg-slate-200 dark:hover:bg-ink-700/60 flex items-center justify-center
              text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
              Activity
            </h1>
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
              {visibleFeed.length}{activeFilters.size > 0 ? ` of ${feed.length}` : ''} event{visibleFeed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15
            flex items-center justify-center">
            <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 lg:px-6 pb-3 flex items-center gap-2">
          {FILTER_ORDER.map(f => {
            const style  = FILTER_STYLE[f];
            const active = activeFilters.has(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-body font-medium
                  transition-all active:scale-95 ${active ? style.activeChip : style.inactiveChip}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                {style.label}
              </button>
            );
          })}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="text-[10px] font-mono text-slate-400 dark:text-slate-500
                hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-4">
        {visibleFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-ink-800/60
              flex items-center justify-center">
              <Activity size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-slate-700 dark:text-slate-300">
                {activeFilters.size > 0 ? 'No matching activity' : 'No activity yet'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">
                {activeFilters.size > 0
                  ? 'Try selecting a different filter or clear all.'
                  : 'Start adding subjects, sessions, and tests to see your progress here.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(group => (
              <div key={group.label}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest shrink-0">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-ink-700/60" />
                </div>

                {/* Items */}
                <div className="flex flex-col">
                  {group.items.map((item, idx) => {
                    const catStyle      = CATEGORY_STYLE[item.category];
                    const subjectColors = item.subjectColor ? COLOR_MAP[item.subjectColor as keyof typeof COLOR_MAP] : null;
                    const isLast        = idx === group.items.length - 1;

                    return (
                      <div key={item.id} className="flex gap-4 relative">
                        {/* Timeline connector */}
                        {!isLast && (
                          <div className="absolute left-[19px] top-12 bottom-0 w-0.5
                            bg-slate-100 dark:bg-ink-700/60" />
                        )}

                        {/* Category icon circle */}
                        <div className="shrink-0 mt-1 z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                            border-2 border-white dark:border-ink-950 shadow-sm ${catStyle.iconBg}`}>
                            {item.icon}
                          </div>
                        </div>

                        {/* Card */}
                        <div className="flex-1 min-w-0 pb-5">
                          <div className="bg-white dark:bg-ink-800/60 border border-slate-100 dark:border-ink-700/40
                            rounded-2xl px-4 py-3.5 hover:border-slate-200 dark:hover:border-ink-600/60
                            transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-body font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                                  {item.label}
                                </p>
                                {item.sub && (
                                  <p className={`text-sm mt-0.5 leading-snug truncate ${
                                    subjectColors ? subjectColors.text : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {item.sub}
                                  </p>
                                )}
                              </div>
                              {/* Category dot */}
                              <span className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1 ${catStyle.dot}`} />
                            </div>
                            <p className="text-[11px] font-mono text-slate-300 dark:text-slate-700 mt-2">
                              {formatRelative(item.ts)} · {new Date(item.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
