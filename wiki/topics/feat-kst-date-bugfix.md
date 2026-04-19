---
title: KST 날짜 버그 수정 — UTC 파싱 오차 3건
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [bug-fix, date, timezone, KST, UTC]
---

# KST 날짜 버그 수정 — UTC 파싱 오차 3건

## 배경

Sprint #32에서 앱 전체에서 공통적으로 발생하는 날짜 파싱 패턴 버그를 발견했다.

### 근본 원인

`new Date("YYYY-MM-DD")` 또는 `new Date().toISOString().split('T')[0]`는 **UTC 기준**으로 동작한다.  
KST(UTC+9)에서는 자정~오전 9시 사이에 이 코드를 실행하면 날짜가 하루 전으로 계산된다.

---

## 수정 3건

### Bug 1 — `todayString()` (milestones.tsx)

```typescript
// 버그: UTC 기준
function todayString() {
  return new Date().toISOString().split('T')[0];
}

// 수정: 로컬 날짜
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

영향: 마일스톤 탭에서 "오늘 달성" 기준 계산이 하루 오차 발생 가능.

---

### Bug 2 — `AchievedCard` 날짜 표시 (milestones.tsx)

```tsx
// 버그: 원시 ISO 문자열 표시 ("2026-03-15")
<Text style={styles.achievedDate}>{milestone.date}</Text>

// 수정: 한국어 형식 변환
<Text style={styles.achievedDate}>{formatMilestoneDate(milestone.date)}</Text>
// → "2026년 3월 15일"
```

영향: UX — 사용자에게 `2026-03-15` 같은 기계적 포맷이 노출됨.

---

### Bug 3 — `formatRecordPeriod()` (profile.tsx)

```typescript
// 버그: date-only 문자열을 UTC 자정으로 파싱
const days = Math.floor((Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));

// 수정: 로컬 날짜로 파싱
const [fy, fm, fd] = firstDate.split('-').map(Number);
const first = new Date(fy, fm - 1, fd);
const days = Math.floor((Date.now() - first.getTime()) / (1000 * 60 * 60 * 24));
```

영향: 프로필 통계 "기록 기간" 텍스트가 하루 오차 발생 가능.

---

## 교훈 — 이음 프로젝트 날짜 처리 원칙

| 상황 | 올바른 방법 |
|------|------------|
| 오늘 날짜 문자열 생성 | `new Date()` + 로컬 getFullYear/Month/Date |
| DB의 `YYYY-MM-DD` 파싱 | `split('-')` + `new Date(y, m-1, d)` |
| UTC ISO 타임스탬프 파싱 | `new Date(isoString)` 사용 가능 (이미 UTC) |
| 날짜 비교 | `date-fns/differenceInDays` (로컬 파싱 후) |

## 구현 파일

- `apps/mobile/app/(tabs)/milestones.tsx`
- `apps/mobile/app/(tabs)/profile.tsx`

## 관련 페이지

- [[wiki/topics/feat-milestone-scheduler-v2.md]] — 서버 측 동일 버그 수정
