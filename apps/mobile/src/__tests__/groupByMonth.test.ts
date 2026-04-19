import { groupEntriesByMonth, formatMonthLabel } from '../utils/groupByMonth';

const makeEntry = (id: string, takenAt: string | null, createdAt: string) => ({
  id,
  created_at: createdAt,
  photos: takenAt ? { id: id, taken_at: takenAt, s3_key: '', location_name: null } : null,
  content: '',
  status: 'done' as const,
  milestone: null,
});

describe('groupEntriesByMonth', () => {
  it('같은 달 항목을 하나의 섹션으로 묶는다', () => {
    const entries = [
      makeEntry('1', '2025-03-10T00:00:00Z', '2025-03-10T00:00:00Z'),
      makeEntry('2', '2025-03-20T00:00:00Z', '2025-03-20T00:00:00Z'),
    ];
    const sections = groupEntriesByMonth(entries);
    expect(sections).toHaveLength(1);
    expect(sections[0].data).toHaveLength(2);
  });

  it('다른 달 항목을 별도 섹션으로 분리한다', () => {
    const entries = [
      makeEntry('1', '2025-03-10T00:00:00Z', '2025-03-10T00:00:00Z'),
      makeEntry('2', '2025-04-05T00:00:00Z', '2025-04-05T00:00:00Z'),
    ];
    const sections = groupEntriesByMonth(entries);
    expect(sections).toHaveLength(2);
  });

  it('최신 달이 먼저 온다', () => {
    const entries = [
      makeEntry('1', '2025-01-10T00:00:00Z', '2025-01-10T00:00:00Z'),
      makeEntry('2', '2025-04-05T00:00:00Z', '2025-04-05T00:00:00Z'),
    ];
    const sections = groupEntriesByMonth(entries);
    expect(sections[0].monthKey).toBe('2025-04');
    expect(sections[1].monthKey).toBe('2025-01');
  });

  it('photos.taken_at이 없으면 created_at을 사용한다', () => {
    const entries = [
      makeEntry('1', null, '2025-06-15T00:00:00Z'),
    ];
    const sections = groupEntriesByMonth(entries);
    expect(sections[0].monthKey).toBe('2025-06');
  });

  it('빈 배열은 빈 섹션을 반환한다', () => {
    expect(groupEntriesByMonth([])).toEqual([]);
  });
});

describe('formatMonthLabel', () => {
  it('2025-03을 "2025년 3월"로 변환한다', () => {
    expect(formatMonthLabel('2025-03')).toBe('2025년 3월');
  });

  it('2025-12을 "2025년 12월"로 변환한다', () => {
    expect(formatMonthLabel('2025-12')).toBe('2025년 12월');
  });
});
