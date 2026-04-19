---
title: 기술 결정 — MVP 실기기 테스트 셋업 (2026-04-19)
type: analysis
created: 2026-04-19
updated: 2026-04-19
sources: []
tags: [decision, expo, supabase, r2, claude, setup]
---

# 기술 결정 — MVP 실기기 테스트 셋업

## 결정 1: Expo Go에서 `<Stack>`/`<Tabs>` → `<Slot>` 대체

- **날짜**: 2026-04-19
- **결정**: expo-router의 `<Stack>`, `<Tabs>` 컴포넌트를 모두 `<Slot>`으로 교체
- **이유**: Expo Go SDK 54는 New Architecture(Fabric)를 강제 적용. react-native-screens의 Fabric 컴포넌트가 `boolean` 대신 `string` prop을 받으면 `TypeError: expected dynamic type 'boolean', but had type 'string'` 에러 발생. `<Slot>`은 native screen 없이 순수 React 렌더링이라 에러 없음.
- **대안**: dev build로 newArchEnabled:false 사용 — Expo Go 포기 필요. 기각.
- **영향**: 탭바·헤더 등 네이티브 네비게이션 UI 없음. 추후 dev build 전환 시 복구 예정.
- **파일**: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(auth)/_layout.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`

## 결정 2: Supabase DB 스키마 — Management API로 마이그레이션

- **날짜**: 2026-04-19
- **결정**: Supabase Personal Access Token(PAT) + Management REST API로 스키마 적용
- **이유**: 이 프로젝트의 Supabase DB는 IPv6 전용 신규 인프라(`db.[ref].supabase.co` → IPv6 AAAA 레코드만 존재). 맥북 로컬 환경에 IPv6 인터넷 라우팅 없음. psql 직접 연결 불가. 풀러(`aws-0-ap-northeast-2.pooler.supabase.com`)도 "tenant not found" 오류.
- **대안**: Supabase SQL Editor 모바일 붙여넣기 — iOS Safari CodeMirror에서 복붙 불안정. 기각.
- **API 엔드포인트**: `POST https://api.supabase.com/v1/projects/{ref}/database/query`
- **영향**: 마이그레이션 자동화 불편. 추후 `supabase CLI` 도입 고려.
- **생성 테이블**: `children`, `photos`, `diary_entries`, `milestones` + RLS 정책 4개

## 결정 3: 이미지 스토리지 — Cloudflare R2 (cookly-meal 버킷 임시 공유)

- **날짜**: 2026-04-19
- **결정**: AWS S3 대신 Cloudflare R2 사용. planeat-new 프로젝트의 `cookly-meal` 버킷을 임시 공유, `i-um/` 프리픽스로 분리
- **이유**: AWS 계정/버킷 신규 설정 비용 절감. planeat-new에서 이미 사용 중인 R2 크레덴셜 재활용. R2는 S3 호환 API라 `@aws-sdk/client-s3` 코드 변경 최소화 (`endpoint`만 추가).
- **대안**: Supabase Storage — 추가 의존성 없으나 파일 크기 제한, presigned URL 만료 정책 다름. Supabase Storage로 전환도 고려 가능.
- **TODO**: 이음 전용 R2 버킷 `i-um-photos` 생성 후 분리 필요 (현재 planeat-new와 공유 중)
- **퍼블릭 베이스 URL**: `https://pub-fcaa0633314f4642ab284ef5995bb806.r2.dev`
- **파일**: `apps/server/src/services/s3Service.ts`, `apps/server/.env`

## 결정 4: AI 모델 — Claude Opus 4.7 → Haiku 4.5

- **날짜**: 2026-04-19
- **결정**: 일기 생성 모델을 `claude-opus-4-7`에서 `claude-haiku-4-5-20251001`로 변경
- **이유**: MVP 테스트 단계에서 비용 절감. Haiku도 이미지 분석(멀티모달) 지원. 품질 차이는 추후 실사용 피드백으로 검증.
- **대안**: Sonnet 4.6 — 품질/비용 중간. 필요 시 전환 가능.
- **영향**: 일기 감성 품질 미검증. 사용자 피드백 후 모델 업그레이드 고려.
- **파일**: `apps/server/src/services/claudeService.ts`

---

## 현재 환경 변수 현황

### `apps/server/.env` (실제 값 적용 완료)
| 변수 | 상태 |
|------|------|
| `SUPABASE_URL` | ✅ 실제 값 |
| `SUPABASE_SERVICE_KEY` | ✅ 실제 값 |
| `R2_ENDPOINT` | ✅ 실제 값 |
| `R2_ACCESS_KEY_ID` | ✅ 실제 값 |
| `R2_SECRET_ACCESS_KEY` | ✅ 실제 값 |
| `S3_BUCKET` | ✅ cookly-meal (임시) |
| `ANTHROPIC_API_KEY` | ❌ 미설정 (플레이스홀더) |
| `REDIS_URL` | ❌ 미설정 (Bull Queue 미작동) |
| `KAKAO_REST_API_KEY` | ❌ 미설정 (역지오코딩 스킵) |

### `apps/mobile/.env` (실제 값 적용 완료)
| 변수 | 상태 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ 실제 값 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ 실제 값 |
| `EXPO_PUBLIC_API_URL` | ✅ `http://100.82.207.115:3000` |
| `EXPO_PUBLIC_S3_BASE_URL` | ✅ R2 퍼블릭 URL |
