---
title: Paywall 전환 의향 수집 — "Pro 출시 소식 받기" 버튼
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [monetization, paywall, data-collection, beta]
---

## 요약

한도 도달 유저에게 Paywall 모달에서 "Pro 출시 소식 받기 💛" 버튼을 제공해 **전환 의향을 1탭으로 수집**한다. P1 Paywall 가격/패키지 설계를 위한 베타 단계 데이터 기반. 수익화 전략 문서의 P0 액션 2번.

## 목적

- **현재 상태**: 한도 도달 유저가 얼마나 전환 의향이 있는지 **정량 데이터 0**
- **수집 후 활용**: 의향 유저 / 30장 도달 유저 비율로 **가격 민감도 추정**, 개인/가족 플랜 분기 시점 판단

## 구현 범위

### DB
- `paywall_intent` 테이블 신규 생성 (schema.sql 반영)
  ```sql
  create table paywall_intent (
    id         uuid primary key default uuid_generate_v4(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now()
  );
  ```
- RLS는 생략 (서버 service role로만 insert, 일반 유저 조회 불필요)
- Supabase Management API로 프로덕션 DB 적용 완료

### 서버
- `apps/server/src/routes/users.ts` — `POST /users/paywall-intent` 추가
- 본문 없음, 인증된 유저의 `user_id`만 저장 (중복 허용 — 동일 유저 여러 번 의향 표시 = 시그널 강도)

### 모바일
- `apps/mobile/src/lib/api.ts` — `api.users.paywallIntent()`
- `apps/mobile/src/components/PaywallModal.tsx`
  - 기본 버튼 1개(확인) → 2단 구조: **Primary "Pro 출시 소식 받기 💛"** + **Secondary "다음에"**
  - 의향 클릭 시 API 호출 → "고마워요 💛 정식 출시 소식 빠르게 알려드릴게요" 뱃지 노출
  - 중복 클릭 방지 (`sending`/`sent` 로컬 상태)
  - 실패 시 조용히 무시 (UX 우선, 데이터는 best-effort)

### 테스트
- `apps/server/src/__tests__/usersRoute.test.ts` — 3 케이스 추가
  - 200 ok 반환
  - `paywall_intent` 테이블에 `{ user_id }` insert 호출 검증
  - Supabase 에러 시 400 fallthrough
- 전체 서버 32/32 그린

## 분석 쿼리 (수동 집계)

```sql
-- 이번 주 의향 클릭 유저 수 (unique)
select count(distinct user_id) from paywall_intent
where created_at >= now() - interval '7 days';

-- 한도 도달 유저 중 의향 표시 비율 (대략)
-- 한도 도달은 photos count >= 30 인 유저 기준
with heavy_users as (
  select user_id from photos
  where created_at >= date_trunc('month', now())
  group by user_id
  having count(*) >= 30
)
select
  (select count(distinct user_id) from paywall_intent where user_id in (select user_id from heavy_users))::float
  / (select count(*) from heavy_users) as intent_rate;
```

## 한계

- **의향 = 실 결제 아님**: 데이터 해석 시 inflation 고려 (UI 1탭이라 낮은 커밋먼트)
- **재클릭 권장하지 않음**: `sent` 상태에서 버튼은 "확인"으로 전환 — 같은 세션 중복 방지
- **RevenueCat 미통합**: 실제 결제는 P1, 지금은 시그널만 수집
- **AsyncStorage 영구화 안 함**: 앱 재시작하면 다시 보일 수 있음 — 베타 단계 수집 목적에 부합

## 관련 페이지

- [[wiki/analysis/decision-2026-04-20-monetization.md]] — P0 액션 2번
- [[wiki/topics/feat-usage-meter.md]] — P0 액션 1번 (선행 기능)
- [[wiki/analysis/decision-2026-04-20-beta-paywall.md]] — 30장 한도 결정 배경
