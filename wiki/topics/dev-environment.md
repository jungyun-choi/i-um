---
title: 개발 환경 및 실행 가이드
type: topic
created: 2026-04-19
updated: 2026-04-19
sources: []
tags: [setup, dev, expo, server, supabase, r2]
---

# 개발 환경 및 실행 가이드

## 모노레포 구조

```
i-um/
├── apps/
│   ├── mobile/          # Expo React Native 앱
│   └── server/          # Node.js Express API 서버
└── package.json         # npm workspaces 루트
```

## 서버 실행

```bash
cd apps/server
npm run dev
# → http://localhost:3000
# → Tailscale: http://100.82.207.115:3000
```

### 헬스체크
```bash
curl http://100.82.207.115:3000/health
# → {"ok":true}
```

## 모바일 앱 실행

```bash
cd apps/mobile
npx expo start
# QR 코드 → Expo Go 앱으로 스캔
```

**주의**: Expo Go SDK 54는 New Architecture 강제. `<Stack>`/`<Tabs>` 대신 `<Slot>` 사용 중.

## 기술 스택 확정

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 모바일 | Expo SDK 54 + React Native | Expo Go로 테스트 |
| 라우팅 | expo-router v4 (`<Slot>` 기반) | Stack/Tabs 미사용 (Fabric 이슈) |
| 상태관리 | Zustand + TanStack Query | |
| 백엔드 | Node.js + Express + TypeScript | |
| DB | Supabase (PostgreSQL) | IPv6 전용 신규 인프라 |
| 인증 | Supabase Auth | 이메일 확인 OFF 설정 필요 |
| 이미지 저장 | Cloudflare R2 (cookly-meal 버킷) | `i-um/` 프리픽스, 추후 전용 버킷 분리 예정 |
| AI 일기 | Claude Haiku 4.5 (멀티모달) | |
| 큐 | Bull + Redis | Redis 미설정 시 워커 미작동 |
| 역지오코딩 | Kakao Maps API | 미설정 시 location_name null |

## Supabase DB 마이그레이션

직접 psql 연결 불가 (IPv6 전용). **Supabase Management API** 사용:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/dqlqaleukqswrkzzqkng/database/query' \
  -H 'Authorization: Bearer {PERSONAL_ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"query": "SELECT 1"}'
```

PAT 발급: `https://supabase.com/dashboard/account/tokens`

## 남은 설정 항목

| 항목 | 우선순위 | 방법 |
|------|---------|------|
| `ANTHROPIC_API_KEY` 설정 | 🔴 즉시 | Anthropic 콘솔에서 발급 |
| R2 버킷 퍼블릭 접근 설정 | 🔴 즉시 | R2 버킷 → Settings → Public access |
| Redis 설치 | 🟡 중요 | `brew install redis` 또는 Upstash |
| i-um 전용 R2 버킷 분리 | 🟢 나중 | planeat-new 버킷 공유 중 |
| dev build 전환 | 🟢 나중 | TestFlight 배포 시 필요 |

## 알려진 이슈

1. **탭바 없음**: `<Slot>` 사용으로 하단 탭바 미표시. timeline/milestones/profile 간 이동 불가.
2. **Bull Queue 미작동**: Redis 없으면 사진 처리 워커가 실행되지 않음 → `ANTHROPIC_API_KEY` + Redis 둘 다 필요.
3. **역지오코딩 없음**: Kakao API 키 없으면 사진 촬영 장소명이 null.
