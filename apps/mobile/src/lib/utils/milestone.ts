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

// ─── 발자국 앨범 범위 (Range-based Footstep Album) ──────────────────────────
// 일기 사진들을 아이의 생후 일수 기준으로 범위별로 묶어 앨범처럼 보여주기 위한 정의.
export interface FootstepRange {
  key: string;
  label: string;
  emoji: string;
  minDays: number;  // 시작일 (포함, inclusive)
  maxDays: number;  // 종료일 (미포함, exclusive). Infinity 사용 가능.
}

export const FOOTSTEP_RANGES: FootstepRange[] = [
  { key: 'prenatal', label: '태어나기 전',   emoji: '🤰', minDays: -Infinity, maxDays: 0 },
  { key: 'week_1',   label: '첫 주',          emoji: '🌱', minDays: 0,     maxDays: 7 },
  { key: 'week_2',   label: '2주차',          emoji: '🌿', minDays: 7,     maxDays: 14 },
  { key: 'month_1',  label: '한 달까지',      emoji: '🎀', minDays: 14,    maxDays: 30 },
  { key: 'day_50',   label: '50일까지',       emoji: '🌸', minDays: 30,    maxDays: 50 },
  { key: 'day_100',  label: '백일까지',       emoji: '🎂', minDays: 50,    maxDays: 100 },
  { key: 'month_6',  label: '6개월까지',      emoji: '🌻', minDays: 100,   maxDays: 180 },
  { key: 'dol',      label: '돌까지',         emoji: '🎉', minDays: 180,   maxDays: 365 },
  { key: 'month_18', label: '18개월까지',     emoji: '🚀', minDays: 365,   maxDays: 545 },
  { key: 'year_2',   label: '두 돌까지',      emoji: '🎈', minDays: 545,   maxDays: 730 },
  { key: 'year_3',   label: '세 돌까지',      emoji: '🌟', minDays: 730,   maxDays: 1095 },
  { key: 'beyond',   label: '그 이후',        emoji: '✨', minDays: 1095,  maxDays: Infinity },
];

// 로컬 자정 기준 두 날짜 사이의 일 수 계산
function daysBetweenLocal(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const [ty, tm, td] = toStr.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

// 생년월일과 대상 날짜(ISO 혹은 YYYY-MM-DD)로 해당하는 범위 key 반환
export function getFootstepRange(birthDate: string, targetDate: string): string | undefined {
  const target = targetDate.includes('T') ? targetDate.split('T')[0] : targetDate;
  const days = daysBetweenLocal(birthDate, target);
  return FOOTSTEP_RANGES.find((r) => days >= r.minDays && days < r.maxDays)?.key;
}

// 특정 범위의 종료일(목표 달성일)을 반환 — pending 카드의 D-day 표시에 사용
export function getRangeEndDate(birthDate: string, rangeKey: string): string | undefined {
  const range = FOOTSTEP_RANGES.find((r) => r.key === rangeKey);
  if (!range || !isFinite(range.maxDays)) return undefined;
  const [y, m, d] = birthDate.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const target = new Date(birth.getTime() + range.maxDays * 86400000);
  const ty = target.getFullYear();
  const tm = String(target.getMonth() + 1).padStart(2, '0');
  const td = String(target.getDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}
