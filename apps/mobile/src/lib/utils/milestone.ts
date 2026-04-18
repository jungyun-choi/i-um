export const MILESTONE_DAYS: Record<string, number> = {
  baekil: 100,
  dol: 365,
  '2nd_year': 730,
};

export const MILESTONE_META: Record<string, { emoji: string; label: string }> = {
  baekil: { emoji: '🎂', label: '백일' },
  dol: { emoji: '🎉', label: '돌' },
  '2nd_year': { emoji: '🎈', label: '두돌' },
  first_word: { emoji: '💬', label: '첫말' },
  first_step: { emoji: '👣', label: '첫걸음' },
};

export function getExpectedDate(birthDate: string, type: string): string | undefined {
  const days = MILESTONE_DAYS[type];
  if (!days) return undefined;
  const birth = new Date(birthDate);
  const d = new Date(birth.getTime() + days * 86400000);
  return d.toISOString().split('T')[0];
}
