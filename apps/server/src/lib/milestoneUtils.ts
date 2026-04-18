import { differenceInDays } from 'date-fns';

const MILESTONES = [
  { type: 'baekil',   days: 100 },
  { type: 'dol',      days: 365 },
  { type: '2nd_year', days: 730 },
];

export function detectMilestone(birthDate: string, photoDate: string): string | null {
  const days = differenceInDays(new Date(photoDate), new Date(birthDate));
  const found = MILESTONES.find(m => Math.abs(m.days - days) <= 3);
  return found?.type ?? null;
}
