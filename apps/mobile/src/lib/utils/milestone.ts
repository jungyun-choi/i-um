export const MILESTONE_DAYS: Record<string, number> = {
  week_1: 7,
  week_2: 14,
  month_1: 30,
  day_50: 50,
  day_100: 100,
  month_6: 180,
  dol: 365,
  month_18: 545,
  year_2: 730,
  year_3: 1095,
  // manual-record only
  first_word: 0,
  first_step: 0,
  // legacy keys (backward compat with old DB records)
  baekil: 100,
  '2nd_year': 730,
};

export const MILESTONE_META: Record<string, { emoji: string; label: string }> = {
  week_1:   { emoji: '🌱', label: '생후 7일' },
  week_2:   { emoji: '🌿', label: '생후 2주' },
  month_1:  { emoji: '🎀', label: '생후 한 달' },
  day_50:   { emoji: '🌸', label: '생후 50일' },
  day_100:  { emoji: '🎂', label: '백일' },
  month_6:  { emoji: '🌻', label: '생후 6개월' },
  dol:      { emoji: '🎉', label: '돌' },
  month_18: { emoji: '🚀', label: '생후 18개월' },
  year_2:   { emoji: '🎈', label: '두 돌' },
  year_3:   { emoji: '🌟', label: '세 돌' },
  first_word: { emoji: '💬', label: '첫 대화' },
  first_step: { emoji: '👣', label: '첫걸음' },
  // legacy
  baekil:   { emoji: '🎂', label: '백일' },
  '2nd_year': { emoji: '🎈', label: '두돌' },
};

// 마일스톤 화면 표시 순서 (legacy·중복 키 제외)
export const ORDERED_MILESTONE_TYPES: string[] = [
  'week_1', 'week_2', 'month_1', 'day_50', 'day_100',
  'month_6', 'dol', 'month_18', 'year_2', 'year_3',
  'first_word', 'first_step',
];

// DB에 저장된 type key → 사용자 표시용 한국어 label
export function getMilestoneDisplayLabel(type: string): string {
  return MILESTONE_META[type]?.label ?? type;
}

// "YYYY-MM-DD" → "YYYY년 M월 D일" 표시용 포맷
export function formatMilestoneDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

// 두 날짜 문자열 비교 (로컬 기준, UTC 오차 없음)
export function isDatePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  return target < todayMid;
}

export function getExpectedDate(birthDate: string, type: string): string | undefined {
  const days = MILESTONE_DAYS[type];
  if (!days) return undefined;
  const [y, m, d] = birthDate.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const target = new Date(birth.getTime() + days * 86400000);
  const ty = target.getFullYear();
  const tm = String(target.getMonth() + 1).padStart(2, '0');
  const td = String(target.getDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}
