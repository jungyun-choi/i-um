import { getAgeText, getDday, formatBirthDate } from '../lib/utils/age';

describe('getAgeText', () => {
  it('생후 0일 — 생일 당일', () => {
    expect(getAgeText('2025-04-20', '2025-04-20')).toBe('생후 0일');
  });

  it('생후 10일', () => {
    expect(getAgeText('2025-04-10', '2025-04-20')).toBe('생후 10일');
  });

  it('생후 30일 → 1개월', () => {
    expect(getAgeText('2025-03-21', '2025-04-20')).toBe('생후 30일');
  });

  it('31일 → 1개월', () => {
    expect(getAgeText('2025-03-20', '2025-04-20')).toBe('1개월');
  });

  it('날짜 경계: UTC midnight 이슈 없음 — 로컬 날짜 기준', () => {
    // "2025-01-01"을 UTC로 파싱하면 UTC+9에서는 2025-01-01 09:00 KST가 됨
    // 로컬 파싱이면 정확히 0일
    expect(getAgeText('2025-01-01', '2025-01-01')).toBe('생후 0일');
    expect(getAgeText('2025-01-01', '2025-01-02')).toBe('생후 1일');
  });

  it('24개월 이상 → 살 단위', () => {
    expect(getAgeText('2023-04-20', '2025-04-20')).toBe('2살 0개월');
  });
});

describe('getDday', () => {
  it('오늘 → D-day', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    expect(getDday(`${y}-${m}-${d}`)).toBe('D-day');
  });
});

describe('formatBirthDate', () => {
  it('날것 문자열 대신 한국어 날짜 포맷', () => {
    expect(formatBirthDate('2025-01-05')).toBe('2025년 1월 5일');
    expect(formatBirthDate('2024-12-25')).toBe('2024년 12월 25일');
  });
});
