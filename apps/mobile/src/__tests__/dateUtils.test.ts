// EXIF 날짜 파싱 로직 테스트 (upload.tsx의 takenAt 파싱 인라인 로직)

function parseExifDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    return new Date(String(raw).replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')).toISOString();
  } catch {
    return undefined;
  }
}

describe('EXIF 날짜 파싱', () => {
  it('EXIF 형식(콜론 구분)을 ISO 문자열로 변환한다', () => {
    const result = parseExifDate('2025:03:07 14:30:00');
    expect(result).toMatch(/^2025-03-07/);
  });

  it('이미 ISO 형식이면 그대로 파싱된다', () => {
    const result = parseExifDate('2025-03-07T14:30:00Z');
    expect(result).toMatch(/^2025-03-07/);
  });

  it('undefined 입력 시 undefined 반환', () => {
    expect(parseExifDate(undefined)).toBeUndefined();
  });

  it('빈 문자열 시 undefined 반환', () => {
    expect(parseExifDate('')).toBeUndefined();
  });

  it('유효하지 않은 날짜 문자열 시 undefined 반환', () => {
    expect(parseExifDate('not-a-date')).toBeUndefined();
  });
});

// GPS 부호 처리 로직 테스트
function applyGpsRef(value: number | undefined, ref: string | undefined, negativeRef: string): number | undefined {
  if (value == null) return undefined;
  return ref === negativeRef ? -value : value;
}

describe('GPS 좌표 부호 처리', () => {
  it('S 참조는 위도를 음수로 변환', () => {
    expect(applyGpsRef(37.5, 'S', 'S')).toBe(-37.5);
  });

  it('N 참조는 위도를 양수 유지', () => {
    expect(applyGpsRef(37.5, 'N', 'S')).toBe(37.5);
  });

  it('W 참조는 경도를 음수로 변환', () => {
    expect(applyGpsRef(127.0, 'W', 'W')).toBe(-127.0);
  });

  it('undefined 값은 undefined 반환', () => {
    expect(applyGpsRef(undefined, 'N', 'S')).toBeUndefined();
  });
});
