---
title: 발자국 앨범 (범위 기반)
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [milestone, footstep, album, ux, redesign]
---

## 기능 개요

기존 발자국 탭은 백일/돌처럼 "특정 하루"에 도달해야만 카드가 나타나는 구조였다. 그 결과:
- 아직 해당 일자에 도달하지 않은 아기의 경우 대부분 빈 화면
- 도달한 순간도 "사진 한 장"만 표현되어 그 기간의 추억을 되돌아보기 어려움
- 태어나기 전에 찍은 태교/초음파 사진이 전혀 반영되지 않음

→ 발자국을 **날짜 범위(range)** 로 재정의하고, 범위별 일기들을 앨범처럼 스와이프로 훑어보게 개편.

## 범위 정의

| key | 라벨 | 일수 구간 | 이모지 |
|-----|------|----------|--------|
| `prenatal` | 태어나기 전 | `-∞ ~ 0` | 🤰 |
| `week_1` | 첫 주 | `0 ~ 7` | 🌱 |
| `week_2` | 2주차 | `7 ~ 14` | 🌿 |
| `month_1` | 한 달까지 | `14 ~ 30` | 🎀 |
| `day_50` | 50일까지 | `30 ~ 50` | 🌸 |
| `day_100` | 백일까지 | `50 ~ 100` | 🎂 |
| `month_6` | 6개월까지 | `100 ~ 180` | 🌻 |
| `dol` | 돌까지 | `180 ~ 365` | 🎉 |
| `month_18` | 18개월까지 | `365 ~ 545` | 🚀 |
| `year_2` | 두 돌까지 | `545 ~ 730` | 🎈 |
| `year_3` | 세 돌까지 | `730 ~ 1095` | 🌟 |
| `beyond` | 그 이후 | `1095 ~ ∞` | ✨ |

구간은 `[min, max)` — 인접 범위 간 gap/overlap 없음 (테스트로 검증).

## 구현 파일

| 파일 | 역할 |
|------|------|
| `apps/mobile/src/lib/utils/milestone.ts` | `FOOTSTEP_RANGES`, `getFootstepRange()`, `getRangeEndDate()` 추가 |
| `apps/mobile/app/(tabs)/milestones.tsx` | 전체 재작성: 타임라인 fetch → 런타임 range 그룹핑 → 앨범 카드 렌더 |
| `apps/mobile/src/__tests__/footstepRange.test.ts` | 14개 테스트 (범위 경계, ISO 파싱, 연속성 검증) |

## 핵심 로직

### 그룹핑 (런타임)
```ts
// 1. timeline API로 일기 전체 fetch (limit=1000)
const timeline = await api.diary.timeline(childId, undefined, 1000);

// 2. 각 일기의 photo.taken_at (없으면 created_at) 기준으로 range 계산
const key = getFootstepRange(child.birth_date, entry.photos.taken_at);

// 3. range key로 그룹핑 → 최신순 유지 (타임라인이 DESC이므로 자연스럽게)
```

### 앨범 카드 → 가로 스와이프
- 카드 탭 → `/diary/{firstId}?ids=id1,id2,id3,...` 으로 push
- `app/diary/[id].tsx`는 이미 `ids` 쿼리 파라미터 기반 `FlatList` 가로 스와이프를 지원 (재활용)
- 페이지 인디케이터 `1 / N` 표시 기능도 기존 구현 그대로 사용

### DB 스키마 변경 없음
- `milestones` 테이블은 `first_word` / `first_step` 수동 기록 용도로만 계속 사용
- 날짜 범위 그룹핑은 순수 클라이언트 사이드 계산 → 스키마 마이그레이션 불필요

## UX 개선 효과

1. **태어나기 전 사진도 자동 포함** — 초음파/태교 사진을 업로드해두면 `prenatal` 범위 앨범이 생성됨
2. **"그 기간의 모든 추억"을 한 번에** — 카드 탭 한 번으로 해당 범위의 모든 일기를 스와이프로 탐색
3. **빈 상태 감소** — 신생아 단계에서도 도달한 범위가 있으면 앨범 카드가 노출됨

## 알려진 한계

- `timeline` API를 `limit=1000`으로 호출 — 일기가 1000건을 초과하는 장기 사용 유저는 일부 범위가 누락될 수 있음 (2-3년 활발한 기록 기준 도달 가능한 수치). 필요 시 서버 측 range 집계 엔드포인트 추가 고려.
- 커버 이미지는 각 범위의 "최신" 사진 — 사용자가 직접 대표 사진을 고를 수는 없음.
- 기존 `milestones` 테이블에 저장된 레거시 레코드(week_1, day_100 등)는 더 이상 UI에 나타나지 않음 (range 기반으로 동적 계산).

## 관련 페이지

- [[feat-milestone-manual-record]] — first_word / first_step 수동 기록 (하단 "특별한 순간" 섹션으로 유지)
- [[feat-milestone-scheduler-v2]] — 범위 종료일(`getRangeEndDate`)은 "앞으로의 발자국" D-day 계산에 사용
