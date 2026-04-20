---
title: 한도 계산 기준 리팩토링 — user_id → child_id
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [monetization, refactor, paywall, p1-prep]
---

## 요약

월 30장 한도 집계 기준을 `user_id`(개인)에서 `child_id`(아이 단위 = 가족 합산)로 변경. 수익화 문서 `decision-2026-04-20-monetization.md` P1 준비 액션 2번.

## 배경

베타 기간에는 개인 기준 집계로 운영했지만, invite로 공동 양육자가 붙으면 자연스럽게 "가구당 60장"이 무료 제공되어 가족 플랜 상품의 가치 명분이 약해졌다. P1(Freemium 구독) 진입 전 기준을 아이 단위로 전환해 두어야:
- 가족 플랜(P1.5) 상품이 "한도 공유 → 무제한" 명확한 가치 제안을 가진다
- AI 비용이 아이당 30장으로 캡핑된다 (가구당 60장 → 30장)

## 구현 범위

### 백엔드 (`apps/server/src/routes/photos.ts`)
- `countThisMonth(childId)` 시그니처 변경 — `.eq('child_id', childId)` 쿼리
- `GET /photos/usage`
  - `?child_id=` 쿼리 파라미터 **필수**
  - 누락 시 400 `{ error: 'child_id required' }`
- `POST /photos/upload-url` — req.body의 `child_id` 그대로 사용 (userId 경로 제거)

### 모바일
- `apps/mobile/src/lib/api.ts` — `api.photos.usage(childId: string)` 필수 인자
- `apps/mobile/app/upload.tsx`
  - `useEffect([activeChild?.id])` — activeChild 변경 시 usage 재조회
  - activeChild가 없으면 호출 안 함 (뱃지도 숨김)

### 테스트
- `apps/server/src/__tests__/photosUsage.test.ts` — 5 케이스 (기존 4 + 400 가드 1)
  - `child_id` 쿼리 기준 조회 검증
  - `child_id` 누락 시 400

## 영향 & 호환성

- **공동 양육자 페어링 시 체감 한도 반감**: 부부가 invite join → 예전엔 60장 → 이제 30장
- **앱 내 공지 필요**: 베타 사용자에게 "이번 업데이트부터 아이 단위 한도로 바뀝니다" 안내 (P1 출시 직전에 맞추는 편이 나음)
- **DB 스키마 변경 없음** — photos 테이블 `child_id`는 기존 FK로 존재

## 테스트 결과

- 서버 33/33 그린
- 타입 체크: `apps/server`, `apps/mobile` 양쪽 통과

## 남은 작업

- 실기기 QA — activeChild 전환 시 뱃지 숫자 갱신 확인
- 앱 내 공지 문구 작성은 P1 출시 체크리스트로 이동

## 관련 페이지

- [[wiki/analysis/decision-2026-04-20-monetization.md]] — P1 준비 액션 2번
- [[wiki/topics/feat-usage-meter.md]] — 한도 뱃지 기능 (선행)
- [[wiki/topics/feat-paywall-intent.md]] — 전환 의향 수집
