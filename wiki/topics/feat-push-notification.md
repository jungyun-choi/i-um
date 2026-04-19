---
title: 푸시 알림 — 일기 완성 알림
type: topic
created: 2026-04-19
updated: 2026-04-19
sources: []
tags: [feat, push-notification, expo, tdd]
---

## 기능 개요

AI 일기 생성이 완료됐을 때 부모에게 Expo Push Notification을 발송한다.
마일스톤 달성 시 특별 메시지 ("🎉 특별한 기억이 기록됐어요!")를 전송한다.

## 구현 파일 목록

### 서버
| 파일 | 역할 |
|------|------|
| `apps/server/src/services/pushService.ts` | Expo Push API 호출 래퍼 |
| `apps/server/src/routes/users.ts` | `PATCH /users/push-token` 엔드포인트 |
| `apps/server/src/workers/diaryWorker.ts` | 일기 완성 후 푸시 발송 (기존 파일 수정) |
| `apps/server/src/index.ts` | `/users` 라우트 등록 (기존 파일 수정) |

### 모바일
| 파일 | 역할 |
|------|------|
| `apps/mobile/src/hooks/usePushNotification.ts` | 권한 요청 → 토큰 발급 → 서버 저장 |
| `apps/mobile/app/_layout.tsx` | 앱 시작 시 훅 실행 (기존 파일 수정) |
| `apps/mobile/src/lib/api.ts` | `api.users.savePushToken()` 추가 (기존 파일 수정) |

## 핵심 로직

### 토큰 등록 흐름
```
앱 시작 → usePushNotification() →
  권한 요청 → 토큰 발급 (Expo) →
  PATCH /users/push-token → profiles 테이블 저장
```

### 알림 발송 흐름
```
diaryWorker 완료 →
  children.user_id로 profiles.push_token 조회 →
  sendPushNotification() → Expo Push API
```

### 알림 메시지
- 일반: "✨ {아이이름}의 일기가 완성됐어요"
- 마일스톤: "🎉 {아이이름}의 특별한 기억이 기록됐어요! / {마일스톤} 달성"

## DB 변경사항

Supabase에 `profiles` 테이블 추가 필요:
```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

## 테스트 커버리지

| 테스트 파일 | 케이스 수 | 통과 |
|------------|----------|------|
| `pushService.test.ts` | 4 | ✅ |
| `usersRoute.test.ts` | 3 | ✅ |
| (서버 전체) | 14 | ✅ |
| `dateUtils.test.ts` (모바일) | 9 | ✅ |

## 알려진 한계 & TODO

- **Expo Go SDK 53+에서 원격 푸시 제거됨** → Development Build 필요
- Development Build 만들 때:
  1. `eas build --profile development --platform ios` 실행
  2. EAS 프로젝트 생성 → `app.json`에 `extra.eas.projectId` 추가
  3. `apps/mobile/.env`에 `EXPO_PUBLIC_EAS_PROJECT_ID={id}` 추가
  4. 그러면 `usePushNotification` 훅이 자동으로 동작
