---
title: 프로필 통계 & 마일스톤 UX 개선
type: topic
created: 2026-04-19
updated: 2026-04-19
sources: []
tags: [profile, milestone, stats, ux]
---

## 기능 개요

프로필 탭과 마일스톤 탭의 UX를 전면 개선. 사용자가 앱에서 자신의 기록을 한눈에 파악할 수 있도록 통계 정보와 감성적인 마일스톤 카드 디자인 제공.

## 구현 파일 목록

- `apps/mobile/app/(tabs)/profile.tsx` — 프로필 탭 전면 재설계
- `apps/mobile/app/(tabs)/milestones.tsx` — 마일스톤 탭 개선
- `apps/server/src/routes/diary.ts` — `/diary/stats/:childId` 엔드포인트 추가
- `apps/mobile/src/lib/api.ts` — `api.diary.stats()` 추가

## 핵심 로직

### 프로필 통계 (`GET /diary/stats/:childId`)

```ts
// Promise.all로 3개 쿼리 병렬 실행
const [countResult, firstResult, milestoneResult] = await Promise.all([
  supabase.from('diary_entries').select('id', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'done'),
  supabase.from('diary_entries').select('created_at').eq('child_id', childId).eq('status', 'done').order('created_at', { ascending: true }).limit(1),
  supabase.from('milestones').select('id', { count: 'exact', head: true }).eq('child_id', childId),
]);
// 응답: { diary_count, first_entry_date, milestone_count }
```

### 마일스톤 탭 섹션 분리

- 달성된 마일스톤: `AchievedCard` — 풀블리드 사진 + 어두운 오버레이 + 달성 나이 + "일기 보기" 버튼
- 예정 마일스톤: `PendingCard` — 이모지 + D-day 배지 (D+N은 회색, D-N은 오렌지)

### 업로드 완료 모달 개선

`pollDiary`에서 diary `id`를 포함 반환 → 모달에 "일기 바로 보기 →" 버튼 추가.

## 알려진 한계

- `first_word`, `first_step` 마일스톤은 수동 기록 방법이 없음 (자동 감지 불가)
- 다중 사진 업로드 시 마지막 사진의 일기만 모달에 표시됨
