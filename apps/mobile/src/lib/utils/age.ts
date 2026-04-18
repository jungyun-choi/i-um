export function getAgeText(birthDate: string, targetDate?: string): string {
  const birth = new Date(birthDate);
  const target = targetDate ? new Date(targetDate) : new Date();
  const days = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 31) return `생후 ${days}일`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}개월`;
  return `${Math.floor(months / 12)}살 ${months % 12}개월`;
}

export function getDday(targetDate: string): string {
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}
