import type { ScoreEntry } from '../types';

export function highestScore(scores: ScoreEntry[]): number | null {
  if (!scores.length) return null;
  return Math.max(...scores.map(s => (s.score / s.maxScore) * 100));
}

export function latestScore(scores: ScoreEntry[]): number | null {
  if (!scores.length) return null;
  const last = scores[scores.length - 1];
  return (last.score / last.maxScore) * 100;
}

export function averageScore(scores: ScoreEntry[]): number | null {
  if (!scores.length) return null;
  const sum = scores.reduce((a, s) => a + (s.score / s.maxScore) * 100, 0);
  return sum / scores.length;
}

export function scoreTrend(scores: ScoreEntry[]): 'up' | 'down' | 'flat' | 'none' {
  if (scores.length < 2) return 'none';
  const last = (scores[scores.length - 1].score / scores[scores.length - 1].maxScore) * 100;
  const prev = (scores[scores.length - 2].score / scores[scores.length - 2].maxScore) * 100;
  if (last > prev + 1) return 'up';
  if (last < prev - 1) return 'down';
  return 'flat';
}

export function passedTarget(scores: ScoreEntry[], target: number): boolean {
  const hi = highestScore(scores);
  return hi !== null && hi >= target;
}
