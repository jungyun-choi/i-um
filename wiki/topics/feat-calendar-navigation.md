---
title: 월별 달력 탐색
type: topic
created: 2026-04-19
updated: 2026-04-19
tags: [feat, timeline, navigation, tdd]
---

## 기능 개요

타임라인을 월별 섹션으로 분리하고, 상단 퀵점프 바로 원하는 달로 즉시 이동한다.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `src/utils/groupByMonth.ts` | 일기 목록 → 월별 섹션 그룹핑 유틸 |
| `src/__tests__/groupByMonth.test.ts` | 유틸 테스트 (7개) |
| `app/(tabs)/timeline.tsx` | FlatList → SectionList 교체, 월 칩 바 추가 |

## 핵심 동작

- `groupEntriesByMonth()`: `photos.taken_at` 우선, 없으면 `created_at` 기준으로 `YYYY-MM` 키로 그룹핑, 최신 달 먼저 정렬
- 월 칩 바: 일기가 2개월 이상일 때만 표시
- 스크롤 시 현재 보이는 섹션의 월 칩이 자동으로 활성화
- 월 칩 탭 시 `SectionList.scrollToLocation()`으로 즉시 점프
- `stickySectionHeadersEnabled`: 섹션 헤더가 스크롤 중 상단 고정

## 테스트 커버리지

`groupByMonth.test.ts` — 7개, `dateUtils.test.ts` — 9개 (기존), 총 모바일 16개 통과
