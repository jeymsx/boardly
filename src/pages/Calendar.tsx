import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Clock, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useEventsStore } from '../store/useEventsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { buildCalendarMonth, formatDate, todayISO } from '../utils/dates';
import { COLOR_MAP, SUBJECT_COLORS } from '../types';
import type { SubjectColor } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Event Modal ──────────────────────────────────────────────────────────────

interface EventForm {
  title: string;
  date: string;
  subjectId: string;
  topicLabel: string;
  notes: string;
  color: SubjectColor | '';
}

interface EventModalProps {
  open: boolean;
  defaultDate?: string;
  subjects: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (form: EventForm) => void;
}

const EventModal: React.FC<EventModalProps> = ({ open, defaultDate, subjects, onClose, onSave }) => {
  const [title,      setTitle]      = useState('');
  const [date,       setDate]       = useState(defaultDate ?? todayISO());
  const [subjectId,  setSubjectId]  = useState('');
  const [topicLabel, setTopicLabel] = useState('');
  const [notes,      setNotes]      = useState('');
  const [color,      setColor]      = useState<SubjectColor | ''>('');

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDate(defaultDate ?? todayISO());
      setSubjectId('');
      setTopicLabel('');
      setNotes('');
      setColor('');
    }
  }, [open, defaultDate]);

  return (
    <Modal open={open} onClose={onClose} title="Add Custom Event">
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Study Group Meeting"
          autoFocus
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <Select
          label="Subject (optional)"
          value={subjectId}
          onChange={e => setSubjectId(e.target.value)}
        >
          <option value="">— None —</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input
          label="Topic (optional)"
          value={topicLabel}
          onChange={e => setTopicLabel(e.target.value)}
          placeholder="Optional topic label"
        />
        <div>
          <label className="block text-xs font-body font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Color (optional)
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setColor('')}
              className={`w-6 h-6 rounded-full border-2 transition-all
                ${color === '' ? 'border-slate-400 dark:border-slate-300 scale-110' : 'border-transparent bg-slate-200 dark:bg-ink-600'}`}
            />
            {SUBJECT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${COLOR_MAP[c].dot}
                  ${color === c ? 'border-slate-600 dark:border-white scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes..."
          rows={2}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => onSave({ title: title.trim(), date, subjectId, topicLabel, notes, color })}
            disabled={!title.trim() || !date}
          >
            Add Event
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Calendar Page ────────────────────────────────────────────────────────────

export const Calendar: React.FC = () => {
  const { sessions } = useSessionsStore();
  const { subjects } = useSubjectsStore();
  const { events, addEvent, deleteEvent } = useEventsStore();
  const { settings } = useSettingsStore();
  const examDates = settings.examDates ?? [];

  const today = new Date();
  const [current,     setCurrent]     = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected,    setSelected]    = useState<string | null>(null);
  const [dayModal,    setDayModal]    = useState(false);
  const [eventModal,  setEventModal]  = useState(false);

  const calDays  = buildCalendarMonth(current.getFullYear(), current.getMonth(), sessions, events);
  const firstDow = getDay(startOfMonth(current));
  getDaysInMonth(current);
  const blanks   = Array.from({ length: firstDow });


  const handleAddEvent = (form: EventForm) => {
    addEvent({
      title: form.title,
      date: form.date,
      subjectId: form.subjectId || undefined,
      topicLabel: form.topicLabel || undefined,
      notes: form.notes || undefined,
      color: (form.color as SubjectColor) || undefined,
    });
    setEventModal(false);
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <PageHeader
        title="Calendar"
        subtitle="Sessions, reviews & custom events"
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setEventModal(true)}>
            Add Event
          </Button>
        }
      />

      <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
        rounded-2xl overflow-hidden mb-4 shadow-card dark:shadow-none">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-ink-700/40">
          <button
            onClick={() => setCurrent(prev => subMonths(prev, 1))}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/50 hover:bg-slate-200 dark:hover:bg-ink-600
              flex items-center justify-center text-slate-500 dark:text-slate-400
              hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-base text-slate-800 dark:text-slate-200">
              {format(current, 'MMMM yyyy')}
            </h2>
            {(current.getFullYear() !== today.getFullYear() || current.getMonth() !== today.getMonth()) && (
              <button
                onClick={() => {
                  setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelected(format(today, 'yyyy-MM-dd'));
                }}
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full
                  bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400
                  border border-emerald-200 dark:border-emerald-500/25
                  hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-all active:scale-95"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrent(prev => addMonths(prev, 1))}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-ink-700/50 hover:bg-slate-200 dark:hover:bg-ink-600
              flex items-center justify-center text-slate-500 dark:text-slate-400
              hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-ink-700/30">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-mono font-medium
              text-slate-400 dark:text-slate-600 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 p-1">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-[3/4] sm:aspect-square lg:aspect-auto lg:h-24" />)}

          {calDays.map(day => {
            const dayNum     = parseInt(day.date.split('-')[2]);
            const isSelected = day.date === selected;

            const dayExams = examDates.filter(ed => ed.date === day.date);
            const chips = [
              ...dayExams.map(ed => ({ key: `exam-${ed.id}`, label: ed.label || 'Board Exam', color: 'rose' as const })),
              ...day.sessions.map(s => ({ key: `s-${s.id}`, label: s.topicLabel, color: 'sky' as const })),
              ...day.reviews.map(r => ({ key: `r-${r.id}`, label: `Rev ${r.reviewNumber}`, color: 'emerald' as const })),
              ...day.events.map(e => ({ key: `e-${e.id}`, label: e.title, color: 'violet' as const })),
            ];
            const visibleChips = chips.slice(0, 2);
            const extra = chips.length - visibleChips.length;

            return (
              <button
                key={day.date}
                onClick={() => { setSelected(day.date); setDayModal(true); }}
                className={`aspect-[3/4] sm:aspect-square lg:aspect-auto lg:h-24 flex flex-col overflow-hidden p-1 relative
                  transition-all active:scale-95 rounded-lg m-0.5 text-left
                  ${isSelected
                    ? 'bg-emerald-500 text-white'
                    : day.isToday
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400 dark:ring-emerald-500/50'
                    : day.isPast
                    ? 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-ink-700/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-700/40'
                  }`}
              >
                <span className="text-[11px] font-mono font-medium leading-none mb-1 w-full text-center">
                  {dayNum}
                </span>
                <div className="flex flex-col gap-0.5 w-full">
                  {visibleChips.map(chip => (
                    <span key={chip.key}
                      className={`w-full flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-mono leading-tight overflow-hidden
                        ${isSelected
                          ? 'bg-white/20 text-white'
                          : chip.color === 'rose'
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold'
                          : chip.color === 'sky'
                          ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                          : chip.color === 'emerald'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'}`}
                    >
                      <span className={`w-1 h-1 rounded-full shrink-0
                        ${isSelected ? 'bg-white/70'
                          : chip.color === 'rose' ? 'bg-rose-400'
                          : chip.color === 'sky' ? 'bg-sky-400'
                          : chip.color === 'emerald' ? 'bg-emerald-400'
                          : 'bg-violet-400'}`}
                      />
                      <span className="truncate">{chip.label}</span>
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className={`text-[8px] font-mono px-1 leading-tight
                      ${isSelected ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
                      +{extra} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-1 flex-wrap">
        {examDates.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Exam
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Session
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Review
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="w-2 h-2 rounded-full bg-violet-400" /> Event
        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        open={dayModal && selected !== null}
        onClose={() => setDayModal(false)}
        title={selected ? formatDate(selected, 'EEEE, MMMM d') : ''}
        maxWidth="max-w-lg"
      >
        {selected && (() => {
          const day      = calDays.find(d => d.date === selected);
          const daySess  = day?.sessions ?? [];
          const dayRevs  = day?.reviews  ?? [];
          const dayEvts  = day?.events   ?? [];
          const dayExams = examDates.filter(ed => ed.date === selected);
          const total    = daySess.length + dayRevs.length + dayEvts.length + dayExams.length;

          return (
            <div className="flex flex-col gap-3">
              {/* Exam date banner */}
              {dayExams.map(ed => (
                <div key={ed.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                  bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0 text-base">
                    🎓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-rose-700 dark:text-rose-300 truncate">
                      {ed.label || 'Board Exam'}
                    </p>
                    <p className="text-xs text-rose-500 dark:text-rose-400">Exam day</p>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between -mt-1 mb-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-body">
                  {total === 0
                    ? 'Nothing scheduled'
                    : [
                        daySess.length > 0 ? `${daySess.length} session${daySess.length !== 1 ? 's' : ''}` : '',
                        dayRevs.length > 0 ? `${dayRevs.length} review${dayRevs.length !== 1 ? 's' : ''}` : '',
                        dayEvts.length > 0 ? `${dayEvts.length} event${dayEvts.length !== 1 ? 's' : ''}` : '',
                      ].filter(Boolean).join(', ')
                  }
                </p>
                <button
                  onClick={() => setEventModal(true)}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                    hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-body font-medium"
                >
                  <Plus size={12} /> Add Event
                </button>
              </div>

              {total === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-600 py-4 text-center">Nothing scheduled for this day.</p>
              )}

              {daySess.map(session => {
                const subject = subjects.find(s => s.id === session.subjectId);
                const colors  = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
                return (
                  <div key={session.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${colors.border} ${colors.bg}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
                      <GraduationCap size={14} className="text-sky-500 dark:text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">{session.topicLabel}</p>
                      {subject && <p className={`text-xs ${colors.text} truncate`}>{subject.name}</p>}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border
                      ${session.attendanceStatus === 'attended'
                        ? 'text-emerald-700 dark:text-jade-400 bg-emerald-50 dark:bg-jade-500/15 border-emerald-200 dark:border-jade-500/30'
                        : session.attendanceStatus === 'partially-attended'
                        ? 'text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/15 border-orange-200 dark:border-orange-500/30'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-ink-700/60 border-slate-200 dark:border-ink-600/40'}`}
                    >
                      {session.attendanceStatus === 'attended' ? 'Attended' :
                       session.attendanceStatus === 'partially-attended' ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                );
              })}

              {dayRevs.map(review => {
                const session = sessions.find(s => s.id === review.sessionId);
                const subject = session ? subjects.find(s => s.id === session.subjectId) : null;
                const colors  = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
                return (
                  <div key={review.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                      border border-emerald-200 dark:border-emerald-500/20
                      bg-emerald-50/60 dark:bg-emerald-500/5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">Review {review.reviewNumber}</p>
                      {session && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{session.topicLabel}</p>}
                      {subject && <p className={`text-[10px] ${colors.text} truncate`}>{subject.name}</p>}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border
                      ${review.status === 'done'
                        ? 'text-emerald-700 dark:text-jade-400 bg-emerald-50 dark:bg-jade-500/15 border-emerald-200 dark:border-jade-500/30'
                        : review.status === 'in-progress'
                        ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-ink-700/60 border-slate-200 dark:border-ink-600/40'}`}
                    >
                      {review.status === 'done' ? 'Done' : review.status === 'in-progress' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                );
              })}

              {dayEvts.length > 0 && (
                <>
                  <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                    <CalendarDays size={11} /> Custom Events
                  </p>
                  {dayEvts.map(event => {
                    const subject    = event.subjectId ? subjects.find(s => s.id === event.subjectId) : null;
                    const eventColor = event.color ? COLOR_MAP[event.color] : COLOR_MAP.violet;
                    return (
                      <div key={event.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${eventColor.border} ${eventColor.bg}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                          <CalendarDays size={14} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                          {event.topicLabel && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{event.topicLabel}</p>}
                          {subject && <p className={`text-[10px] ${eventColor.text} truncate`}>{subject.name}</p>}
                          {event.notes && <p className="text-[10px] text-slate-400 dark:text-slate-600 truncate italic">{event.notes}</p>}
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="w-6 h-6 rounded flex items-center justify-center
                            text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })()}
      </Modal>

      <EventModal
        open={eventModal}
        defaultDate={selected ?? todayISO()}
        subjects={subjects}
        onClose={() => setEventModal(false)}
        onSave={handleAddEvent}
      />
    </div>
  );
};
