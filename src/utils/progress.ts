import type { Topic, Subject, Session, MasteryTest, ReadEntry, ReviewEntry } from '../types';

export function readProgress(reads: ReadEntry[]): number {
  if (!reads.length) return 0;
  const done = reads.filter(r => r.status === 'done').length;
  return done / reads.length;
}

export function topicProgress(topic: Topic): number {
  return readProgress(topic.reads);
}

export function subjectProgress(subject: Subject, topics: Topic[]): number {
  const subjectTopics = topics.filter(t => t.subjectId === subject.id);
  if (!subjectTopics.length) return 0;
  const total = subjectTopics.reduce((sum, t) => sum + topicProgress(t), 0);
  return total / subjectTopics.length;
}

export function reviewProgress(reviews: ReviewEntry[]): number {
  if (!reviews.length) return 0;
  return reviews.filter(r => r.status === 'done').length / reviews.length;
}

export function sessionProgress(session: Session): number {
  const attendanceWeight = 0.4;
  const reviewWeight = 0.6;
  const attendanceScore =
    session.attendanceStatus === 'attended' ? 1 :
    session.attendanceStatus === 'partially-attended' ? 0.5 : 0;
  const rvProgress = reviewProgress(session.reviews);
  return attendanceScore * attendanceWeight + rvProgress * reviewWeight;
}

export function testProgress(test: MasteryTest, targetScore: number): number {
  if (!test.scores.length) return 0;
  const latest = test.scores[test.scores.length - 1];
  const pct = (latest.score / latest.maxScore) * 100;
  return Math.min(pct / targetScore, 1);
}

export function overallProgress(
  subjects: Subject[],
  topics: Topic[],
  sessions: Session[],
  tests: MasteryTest[],
  targetScore: number
): number {
  const parts: number[] = [];

  if (subjects.length) {
    const avg = subjects.reduce((sum, s) => sum + subjectProgress(s, topics), 0) / subjects.length;
    parts.push(avg);
  }
  if (sessions.length) {
    const avg = sessions.reduce((sum, s) => sum + sessionProgress(s), 0) / sessions.length;
    parts.push(avg);
  }
  if (tests.length) {
    const avg = tests.reduce((sum, t) => sum + testProgress(t, targetScore), 0) / tests.length;
    parts.push(avg);
  }

  if (!parts.length) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function pctNum(value: number): number {
  return Math.round(value * 100);
}
