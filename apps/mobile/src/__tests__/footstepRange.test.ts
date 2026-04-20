import { getFootstepRange, getRangeEndDate, FOOTSTEP_RANGES } from '../lib/utils/milestone';

describe('getFootstepRange', () => {
  const birth = '2025-05-01';

  it('태어나기 전 — 출생 전 사진', () => {
    expect(getFootstepRange(birth, '2025-04-01')).toBe('prenatal');
    expect(getFootstepRange(birth, '2025-04-30')).toBe('prenatal');
  });

  it('첫 주 — 0일부터 6일까지', () => {
    expect(getFootstepRange(birth, '2025-05-01')).toBe('week_1'); // 0일
    expect(getFootstepRange(birth, '2025-05-07')).toBe('week_1'); // 6일
    expect(getFootstepRange(birth, '2025-05-08')).toBe('week_2'); // 7일
  });

  it('2주차 — 7일부터 13일까지', () => {
    expect(getFootstepRange(birth, '2025-05-08')).toBe('week_2'); // 7일
    expect(getFootstepRange(birth, '2025-05-14')).toBe('week_2'); // 13일
    expect(getFootstepRange(birth, '2025-05-15')).toBe('month_1'); // 14일
  });

  it('한 달까지 — 14일 ~ 29일', () => {
    expect(getFootstepRange(birth, '2025-05-15')).toBe('month_1'); // 14일
    expect(getFootstepRange(birth, '2025-05-30')).toBe('month_1'); // 29일
  });

  it('백일까지 — 50일 ~ 99일', () => {
    expect(getFootstepRange(birth, '2025-06-20')).toBe('day_100'); // 50일
    expect(getFootstepRange(birth, '2025-08-08')).toBe('day_100'); // 99일
  });

  it('돌까지 — 180 ~ 364일', () => {
    expect(getFootstepRange(birth, '2025-10-28')).toBe('dol'); // 180일
    expect(getFootstepRange(birth, '2026-04-30')).toBe('dol'); // 364일
  });

  it('ISO 형식 날짜(T 포함)도 정상 파싱', () => {
    expect(getFootstepRange(birth, '2025-05-03T10:30:00.000Z')).toBe('week_1');
  });

  it('그 이후 — 3살 이후', () => {
    expect(getFootstepRange(birth, '2030-05-01')).toBe('beyond');
  });
});

describe('getRangeEndDate', () => {
  it('첫 주 끝 = 생후 7일', () => {
    expect(getRangeEndDate('2025-05-01', 'week_1')).toBe('2025-05-08');
  });

  it('백일까지 끝 = 생후 100일', () => {
    expect(getRangeEndDate('2025-01-01', 'day_100')).toBe('2025-04-11');
  });

  it('beyond는 무한대이므로 undefined 반환', () => {
    expect(getRangeEndDate('2025-05-01', 'beyond')).toBeUndefined();
  });

  it('존재하지 않는 key는 undefined', () => {
    expect(getRangeEndDate('2025-05-01', 'nonexistent')).toBeUndefined();
  });
});

describe('FOOTSTEP_RANGES — 연속성 검증', () => {
  it('인접 범위의 maxDays와 minDays가 일치해야 함 (gap/overlap 없음)', () => {
    for (let i = 0; i < FOOTSTEP_RANGES.length - 1; i++) {
      expect(FOOTSTEP_RANGES[i].maxDays).toBe(FOOTSTEP_RANGES[i + 1].minDays);
    }
  });

  it('prenatal의 minDays는 -Infinity, beyond의 maxDays는 Infinity', () => {
    expect(FOOTSTEP_RANGES[0].minDays).toBe(-Infinity);
    expect(FOOTSTEP_RANGES[FOOTSTEP_RANGES.length - 1].maxDays).toBe(Infinity);
  });
});
