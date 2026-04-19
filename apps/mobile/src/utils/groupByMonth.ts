export interface DiaryEntry {
  id: string;
  created_at: string;
  photos: { id: string; taken_at: string | null; s3_key: string; location_name: string | null } | null;
  content: string;
  status: string;
  milestone: string | null;
}

export interface MonthSection {
  monthKey: string; // 'YYYY-MM'
  data: DiaryEntry[];
}

import { toKSTMonthKey } from '../lib/utils/date';

export function groupEntriesByMonth(entries: DiaryEntry[]): MonthSection[] {
  const map = new Map<string, DiaryEntry[]>();

  for (const entry of entries) {
    const dateStr = entry.photos?.taken_at ?? entry.created_at;
    const monthKey = toKSTMonthKey(dateStr);
    if (!map.has(monthKey)) map.set(monthKey, []);
    map.get(monthKey)!.push(entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // 최신 달 먼저
    .map(([monthKey, data]) => ({ monthKey, data }));
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${year}년 ${parseInt(month)}월`;
}
