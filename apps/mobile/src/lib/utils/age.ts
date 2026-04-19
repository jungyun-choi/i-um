// "YYYY-MM-DD" 문자열을 로컬 자정 Date로 파싱 (UTC midnight 방지)
function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 두 로컬 Date 사이의 일 수 (시각 무관, 날짜 기준)
function daysBetween(from: Date, to: Date): number {
  const fromMid = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMid = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toMid.getTime() - fromMid.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAgeText(birthDate: string, targetDate?: string): string {
  const birth = parseDateStr(birthDate);
  const target = targetDate ? parseDateStr(targetDate) : new Date();
  const days = daysBetween(birth, target);

  if (days < 31) return `생후 ${days}일`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}개월`;
  return `${Math.floor(months / 12)}살 ${months % 12}개월`;
}

export function getDday(targetDate: string): string {
  const target = parseDateStr(targetDate);
  const today = new Date();
  const diff = daysBetween(today, target);
  if (diff === 0) return 'D-day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function formatBirthDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
