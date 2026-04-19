import { detectMilestone } from '../lib/milestoneUtils';

function daysAfter(birthDate: string, days: number): string {
  const d = new Date(birthDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const BIRTH = '2025-01-01';

describe('detectMilestone', () => {
  it('생후 100일 정확히 baekil 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 100))).toBe('baekil');
  });

  it('생후 98일 (±3일 범위) baekil 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 98))).toBe('baekil');
  });

  it('생후 103일 (±3일 범위) baekil 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 103))).toBe('baekil');
  });

  it('생후 104일 (범위 밖) null 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 104))).toBeNull();
  });

  it('생후 365일 dol 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 365))).toBe('dol');
  });

  it('생후 730일 2nd_year 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 730))).toBe('2nd_year');
  });

  it('일반 날짜 null 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 50))).toBeNull();
  });
});
