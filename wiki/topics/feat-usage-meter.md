---
title: 사용량 미터 — 업로드 화면 "이번 달 N/30" 뱃지
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [monetization, ux, paywall, beta]
---

## 요약

베타 30장/월 한도를 사용자가 **한도 도달 전에 체감**할 수 있도록 업로드 화면 헤더에 실시간 사용량 뱃지를 추가했다. 수익화 전략 문서 (`decision-2026-04-20-monetization.md`)의 "P0 지금 액션" 1순위 항목.

## 목적

- **현재 문제**: 한도에 도달해야 `PaywallModal`이 뜨므로 사용자는 "언제 꽉 차는지" 모름
- **기대 효과**: 한도 임박 시 자연스러운 전환 의향 유도, P1 paywall 설계를 위한 유저 행동 데이터 수집 기반 마련

## 구현 범위

### 백엔드
- `apps/server/src/routes/photos.ts`
  - `monthStartISO()` / `countThisMonth()` 헬퍼 추출 (한도 체크 로직 재사용)
  - `GET /photos/usage` 신규 엔드포인트 — `{ used, limit }` 반환
  - 인증 필수 (기존 `router.use(requireAuth)` 적용 범위)

### 모바일
- `apps/mobile/src/lib/api.ts`
  - `api.photos.usage(): Promise<{ used: number; limit: number }>` 추가
- `apps/mobile/app/upload.tsx`
  - `useEffect`에서 업로드 화면 진입 시 한 번 사용량 조회
  - 헤더 우측에 `N/30` 뱃지 렌더링
  - 70% 도달 시 주황색 경고 (`#C9922A`), 100% 도달 시 빨간색 (`#E8735A`)

### 테스트
- `apps/server/src/__tests__/photosUsage.test.ts` — 4 케이스
  - used/limit 반환, null count 처리, userId 기준 조회, monthStart 1일 0시

## 한계

- **업로드 직후 즉시 반영되지 않음**: 업로드 성공 후 refetch 미구현 (화면 이탈이 전제라 MVP 생략)
- **user_id 기준**: 수익화 문서 P1에서 `child_id` 기준으로 리팩토링 예정 (가족 합산)
- **캐싱 없음**: 화면 진입 시마다 호출 (캐시 무효화 복잡도보다 정확도 우선)

## 관련 페이지

- [[wiki/analysis/decision-2026-04-20-monetization.md]] — P0 액션 1번
- [[wiki/analysis/decision-2026-04-20-beta-paywall.md]] — 30장 한도 결정 배경
