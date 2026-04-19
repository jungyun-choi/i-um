import { differenceInDays } from 'date-fns';

// type = DB 저장값 (영어 key), label = 사용자 표시용 한국어
const MILESTONES = [
  { type: 'week_1',    days: 7,   label: '생후 7일' },
  { type: 'week_2',    days: 14,  label: '생후 2주' },
  { type: 'month_1',  days: 30,  label: '생후 한 달' },
  { type: 'day_50',   days: 50,  label: '생후 50일' },
  { type: 'day_100',  days: 100, label: '백일' },
  { type: 'month_6',  days: 180, label: '생후 6개월' },
  { type: 'dol',      days: 365, label: '돌' },
  { type: 'month_18', days: 545, label: '생후 18개월' },
  { type: 'year_2',   days: 730, label: '두 돌' },
  { type: 'year_3',   days: 1095, label: '세 돌' },
];

// tolerance: 초기 milestone(7일, 14일)은 ±1일, 나머지는 ±3일
function getTolerance(days: number): number {
  return days <= 14 ? 1 : 3;
}

// Returns the English type key (stored in DB); UI maps to Korean via MILESTONE_META
export function detectMilestone(birthDate: string, photoDate: string): string | null {
  const days = differenceInDays(new Date(photoDate), new Date(birthDate));
  const found = MILESTONES.find(m => Math.abs(m.days - days) <= getTolerance(m.days));
  return found?.type ?? null;
}

// 서버·워커에서 label 직접 조회
export function getMilestoneLabel(type: string): string {
  return MILESTONES.find(m => m.type === type)?.label ?? type;
}
