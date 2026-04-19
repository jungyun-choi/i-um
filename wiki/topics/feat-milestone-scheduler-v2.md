---
title: 마일스톤 스케줄러 v2 — 전체 재작성
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [milestone, push-notification, scheduler, bug-fix]
---

# 마일스톤 스케줄러 v2 — 전체 재작성

## 배경

Sprint #31에서 기존 마일스톤 스케줄러의 두 가지 심각한 버그를 발견해 전면 재작성했다.

### 문제 1: 타입 키 불일치

기존 스케줄러는 구버전 타입 키를 사용하고 있었다:

| 구버전 키 (스케줄러) | 신버전 키 (DB/앱) |
|---------------------|------------------|
| `baekil` | `day_100` |
| `dol` | `dol` (동일) |
| `2nd_year` | `year_2` |

결과: `milestones` 테이블의 중복 체크가 항상 통과해 같은 마일스톤 알림이 반복 발송될 수 있었다.

### 문제 2: UTC 날짜 파싱 오차

```typescript
// 버그: "2025-01-01" 문자열을 UTC 자정으로 파싱
const birthDate = new Date(child.birth_date);  // UTC midnight

// 수정: 로컬 날짜로 파싱 (KST 오전 9시 이전 하루 오차 제거)
const [by, bm, bd] = child.birth_date.split('-').map(Number);
const birthDate = new Date(by, bm - 1, bd);
```

KST(UTC+9) 환경에서 `new Date("YYYY-MM-DD")`는 UTC 자정 = KST 오전 9시로 파싱된다. 매일 9am KST에 실행되는 크론잡이 9am 이전에 실행됐다면 하루 오차가 발생한다.

## 개선 내용

### 알림 커버리지 확장

기존 3개 → 10개 마일스톤으로 확장:

| 타입 | D+day | 제목 |
|------|-------|------|
| `week_1` | D+7 | 생후 7일이에요! |
| `week_2` | D+14 | 생후 2주예요! |
| `month_1` | D+30 | 생후 한 달이에요! |
| `day_50` | D+50 | 생후 50일이에요! |
| `day_100` | D+100 | 백일이에요! |
| `month_6` | D+180 | 생후 6개월이에요! |
| `dol` | D+365 | 첫 돌이에요! |
| `month_18` | D+545 | 생후 18개월이에요! |
| `year_2` | D+730 | 두 돌이에요! |
| `year_3` | D+1095 | 세 돌이에요! |

## 구현 파일

- `apps/server/src/workers/milestoneScheduler.ts` — 전면 재작성
- 실행 시각: 매일 오전 9시 KST (`cron.schedule('0 9 * * *', ...)`)
- 알림 대상: `children.user_id` + `family_members.user_id` 합집합 (중복 제거)

## 관련 페이지

- [[wiki/topics/feat-push-notification.md]]
- [[wiki/topics/feat-profile-milestone.md]]
