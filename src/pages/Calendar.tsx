import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Clock, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { useSessionsStore } from '../store/useSessionsStore';
import { useSubjectsStore } from '../store/useSubjectsStore';
import { useEventsStore } from '../store/useEventsStore';
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

  const today = new Date();
  const [current,    setCurrent]    = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected,   setSelected]   = useState<string | null>(format(today, 'yyyy-MM-dd'));
  const [eventModal, setEventModal] = useState(false);

  const calDays  = buildCalendarMonth(current.getFullYear(), current.getMonth(), sessions, events);
  const firstDow = getDay(startOfMonth(current));
  getDaysInMonth(current);
  const blanks   = Array.from({ length: firstDow });

  const selectedDay      = selected ? calDays.find(d => d.date === selected) : null;
  const selectedSessions = selectedDay?.sessions ?? [];
  const selectedReviews  = selectedDay?.reviews  ?? [];
  const selectedEvents   = selectedDay?.events   ?? [];

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
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
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
          {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-square" />)}

          {calDays.map(day => {
            const dayNum      = parseInt(day.date.split('-')[2]);
            const isSelected  = day.date === selected;
            const hasSessions = day.sessions.length > 0;
            const hasReviews  = day.reviews.length > 0;
            const hasEvents   = day.events.length > 0;

            return (
              <button
                key={day.date}
                onClick={() => setSelected(day.date)}
                className={`aspect-square flex flex-col items-center justify-center gap-0.5 relative
                  transition-all active:scale-95 rounded-lg m-0.5
                  ${isSelected
                    ? 'bg-emerald-500 text-white'
                    : day.isToday
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400 dark:ring-emerald-500/50'
                    : day.isPast
                    ? 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-ink-700/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-700/40'
                  }`}
              >
                <span className="text-xs font-mono font-medium leading-none">{dayNum}</span>
                {(hasSessions || hasReviews || hasEvents) && (
                  <div className="flex gap-0.5">
                    {hasSessions && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-sky-400'}`} />
                    )}
                    {hasReviews && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-emerald-400'}`} />
                    )}
                    {hasEvents && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-violet-400'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-1">
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

      {/* Day details */}
      {selected && (
        <div className="bg-white dark:bg-ink-800/60 border border-slate-200 dark:border-ink-700/50
          rounded-2xl overflow-hidden animate-slide-up shadow-card dark:shadow-none">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-ink-700/40 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
                {formatDate(selected, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-body mt-0.5">
                {selectedSessions.length + selectedReviews.length + selectedEvents.length === 0
                  ? 'No events this day'
                  : [
                      selectedSessions.length > 0 ? `${selectedSessions.length} session${selectedSessions.length !== 1 ? 's' : ''}` : '',
                      selectedReviews.length > 0 ? `${selectedReviews.length} review${selectedReviews.length !== 1 ? 's' : ''}` : '',
                      selectedEvents.length > 0 ? `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}` : '',
                    ].filter(Boolean).join(', ')
                }
              </p>
            </div>
            <button
              onClick={() => { setEventModal(true); }}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400
                hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-body font-medium"
            >
              <Plus size={12} /> Add Event
            </button>
          </div>

          <div className="px-4 py-3 flex flex-col gap-2">
            {selectedSessions.length === 0 && selectedReviews.length === 0 && selectedEvents.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-600 py-4 text-center">Nothing scheduled</p>
            )}

            {selectedSessions.map(session => {
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
                    <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">
                      {session.topicLabel}
                    </p>
                    {subject && <p className={`text-xs ${colors.text} truncate`}>{subject.name}</p>}
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border
                    ${session.attendanceStatus === 'attended'
                      ? 'text-emerald-700 dark:text-jade-400 bg-emerald-50 dark:bg-jade-500/15 border-emerald-200 dark:border-jade-500/30'
                      : session.attendanceStatus === 'partially-attended'
                      ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-ink-700/60 border-slate-200 dark:border-ink-600/40'}`}
                  >
                    {session.attendanceStatus === 'attended' ? 'Attended' :
                     session.attendanceStatus === 'partially-attended' ? 'Partial' : 'Pending'}
                  </span>
                </div>
              );
            })}

            {selectedReviews.map(review => {
              const session = sessions.find(s => s.id === review.sessionId);
              const subject = session ? subjects.find(s => s.id === session.subjectId) : null;
              const colors  = subject ? COLOR_MAP[subject.color] : COLOR_MAP.amber;
              return (
                <div key={review.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                    border border-emerald-200 dark:border-emerald-500/20
                    bg-emerald-50/60 dark:bg-emerald-500/5"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20
                    flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">
                      Review {review.reviewNumber}
                    </p>
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

            {/* Custom Events */}
            {selectedEvents.length > 0 && (
              <div className="mt-1">
                <p className="text-xs font-body font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CalendarDays size={11} /> Custom Events
                </p>
                {selectedEvents.map(event => {
                  const subject = event.subjectId ? subjects.find(s => s.id === event.subjectId) : null;
                  const eventColor = event.color ? COLOR_MAP[event.color] : COLOR_MAP.violet;
                  return (
                    <div key={event.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${eventColor.border} ${eventColor.bg} mb-1`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                        <CalendarDays size={14} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-slate-800 dark:text-slate-200 truncate">
                          {event.title}
                        </p>
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
              </div>
            )}
          </div>
        </div>
      )}

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
