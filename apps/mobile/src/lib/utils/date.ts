const KST_OFFSET = 9 * 60 * 60 * 1000;

export function toKSTDateStr(utcStr: string): string {
  const kst = new Date(new Date(utcStr).getTime() + KST_OFFSET);
  return kst.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export function toKSTMonthKey(utcStr: string): string {
  return toKSTDateStr(utcStr).slice(0, 7); // 'YYYY-MM'
}

export function formatDisplayDate(utcStr: string): string {
  const d = new Date(new Date(utcStr).getTime() + KST_OFFSET);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}
