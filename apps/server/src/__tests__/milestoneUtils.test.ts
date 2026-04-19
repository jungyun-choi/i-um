import { detectMilestone } from '../lib/milestoneUtils';

function daysAfter(birthDate: string, days: number): string {
  const d = new Date(birthDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const BIRTH = '2025-01-01';

describe('detectMilestone', () => {
  it('생후 7일 week_1 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 7))).toBe('week_1');
  });

  it('생후 9일 (±1 범위 밖) null', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 9))).toBeNull();
  });

  it('생후 100일 day_100 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 100))).toBe('day_100');
  });

  it('생후 98일 (±3일 범위) day_100 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 98))).toBe('day_100');
  });

  it('생후 103일 (±3일 범위) day_100 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 103))).toBe('day_100');
  });

  it('생후 104일 (범위 밖) null 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 104))).toBeNull();
  });

  it('생후 365일 dol 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 365))).toBe('dol');
  });

  it('생후 730일 year_2 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 730))).toBe('year_2');
  });

  it('생후 50일 day_50 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 50))).toBe('day_50');
  });

  it('일반 날짜 null 반환', () => {
    expect(detectMilestone(BIRTH, daysAfter(BIRTH, 200))).toBeNull();
  });
});
