# 이음 Wiki — 작업 이력

> append-only 로그. 기존 항목은 수정하지 않습니다.
> 파싱: `grep "^## \[" wiki/log.md | tail -5`

---

## [2026-04-19] feat | TDD 셋업 + 푸시 알림 구현

- Jest 셋업: 서버(ts-jest + supertest), 모바일(ts-jest 순수 로직 / jest-expo 컴포넌트)
- 총 23개 테스트 작성 및 통과 (서버 14개, 모바일 9개)
- `CLAUDE.md` TDD 워크플로우 규칙 추가
- 구현: `pushService.ts`, `routes/users.ts`, `usePushNotification` 훅
- DB: `profiles` 테이블 추가 필요 (SQL은 feat-push-notification.md 참조)
- 실기기 확인 필요: Expo Push 토큰 발급, 알림 수신

---

## [2026-04-19] decision | 프로덕션 로드맵 — 아이디어 회의

- MVP 완성 후 프로덕션화 방향 논의
- 핵심 전략: "AI가 써주는 일기" 차별점 집중, FamilyAlbum과 공유 기능 정면 경쟁 금지
- Phase 0: 푸시 알림, 달력 탐색, 실패 재시도 UX (2주)
- Phase 1: AI 월간 레터 ⭐, 1년 전 메모리 카드, 마일스톤 알림 (1~2달)
- Phase 2: 배우자 초대, 조부모 공유 링크, AI 연간 레터 (2~3달)
- Phase 3: 프리미엄 구독, 포토북, 하이라이트 영상 (3~6달)
- 상세: `wiki/analysis/decision-2026-04-19-production-roadmap.md`
- 기능 아이디어 전체: `wiki/topics/product-feature-ideas.md`

---

## [2026-04-19] feat | MVP 실기기 테스트 셋업 완료

- Expo Go Fabric 에러 해결: `<Stack>`/`<Tabs>` → `<Slot>` 전환
- Supabase DB 스키마 적용 (Management API PAT 방식, IPv6 환경 우회)
- Cloudflare R2 연동 (cookly-meal 버킷, i-um/ 프리픽스)
- Claude 모델 Opus → Haiku 변경 (비용 절감)
- 서버 환경 변수 실제값 적용 및 재시작
- 회원가입 → 아이 프로필 생성까지 동작 확인
- 남은 항목: ANTHROPIC_API_KEY, Redis, 사진 업로드 E2E 테스트
- 관련 문서: [[wiki/analysis/decision-2026-04-19-tech-setup.md]], [[wiki/topics/dev-environment.md]]

## [2026-04-19] ingest | 시장조사 완료 — 육아 기록 앱 경쟁사 10개 분석

- 조사 앱: FamilyAlbum, Tinybeans, Google Photos, Apple Photos, Glow Baby, 쑥쑥찰칵, 베이비타임, 베이비빌리, 23snaps, Lifecake(종료)
- 핵심 발견: AI 텍스트 서사 생성 앱 현재 시장에 없음 → 이음의 핵심 차별점
- 생성 페이지: entities/ 6개, topics/ 2개, analysis/ 1개
- 관련 페이지: [[wiki/analysis/competitor-comparison.md]], [[wiki/topics/ium-differentiation.md]], [[wiki/topics/market-landscape.md]]

## [2026-04-18] setup | LLM Wiki 초기 셋업 완료

- CLAUDE.md 스키마 작성
- wiki/ 디렉토리 구조 생성
- index.md, log.md, overview.md 초기화
- raw/, raw/assets/ 디렉토리 생성
- GitHub 저장소: https://github.com/jungyun-choi/i-um

## [2026-04-18] commit | feat: 개발 과정 자동 wiki 기록 설정

- 커밋: `d046102` by jy.choi
- 변경 파일 수: 2
  - .githooks/post-commit
  - CLAUDE.md

## [2026-04-19] commit | feat: 이음-MVP PDCA Plan 문서 작성

- 커밋: `283f0c8` by jy.choi
- 변경 파일 수: 1
  - "docs/01-plan/features/\354\235\264\354\235\214-MVP.plan.md"

## [2026-04-19] commit | feat: 이음-MVP PDCA Design 문서 작성

- 커밋: `f44a8d6` by jy.choi
- 변경 파일 수: 1
  - "docs/02-design/features/\354\235\264\354\235\214-MVP.design.md"

## [2026-04-19] commit | feat: Phase 1 서버 구현 완료

- 커밋: `41bd3dd` by jy.choi
- 변경 파일 수: 28
  - apps/mobile/.gitignore
  - apps/mobile/App.tsx
  - apps/mobile/app.json
  - apps/mobile/assets/adaptive-icon.png
  - apps/mobile/assets/favicon.png

## [2026-04-19] commit | feat: Phase 1 모바일 앱 화면 구현 완료

- 커밋: `5f0571d` by jy.choi
- 변경 파일 수: 28
  - apps/mobile/.env.example
  - apps/mobile/App.tsx
  - apps/mobile/app.json
  - apps/mobile/app/(auth)/_layout.tsx
  - apps/mobile/app/(auth)/login.tsx

## [2026-04-19] commit | fix: Gap analysis 발견 버그 수정 + 의존성 정리

- 커밋: `b933f7e` by jy.choi
- 변경 파일 수: 8
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/src/components/MilestoneCard.tsx
  - apps/mobile/src/lib/api.ts
  - apps/server/package.json
  - apps/server/src/index.ts

## [2026-04-19] commit | feat: Gap analysis iterate — 87% → 95%+ 달성

- 커밋: `3856391` by jy.choi
- 변경 파일 수: 10
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/child/[id]/edit.tsx

## [2026-04-19] commit | docs: 이음-MVP PDCA 완료 보고서 작성

- 커밋: `27d0b7b` by jy.choi
- 변경 파일 수: 1
  - "docs/04-report/\354\235\264\354\235\214-MVP.report.md"

## [2026-04-19] commit | fix: add app/index.tsx for Expo Router root route

- 커밋: `ce6413e` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/index.tsx

## [2026-04-19] commit | fix: metro config for monorepo React dedup + root index route

- 커밋: `1de329e` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/metro.config.js

## [2026-04-19] commit | fix: Expo Go 호환성 수정 — 앱 렌더링 성공

- 커밋: `a77f7b9` by jy.choi
- 변경 파일 수: 9
  - apps/mobile/app.json
  - apps/mobile/app/(auth)/_layout.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/babel.config.js
  - apps/mobile/metro.config.js

## [2026-04-19] commit | feat: 일기 스타일 선택 + 완성 모달 + 삭제 기능 + 다수 UX 개선

- 커밋: `2051f5e` by jy.choi
- 변경 파일 수: 17
  - CLAUDE.md
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/_layout.tsx.bak
  - apps/mobile/app/child/new.tsx

## [2026-04-19] commit | docs: CLAUDE.md에 개발 규칙 및 인프라 정보 섹션 추가

- 커밋: `31eb9bf` by jy.choi
- 변경 파일 수: 1
  - CLAUDE.md

## [2026-04-19] commit | feat: TDD 셋업 + 푸시 알림 구현

- 커밋: `8a9664a` by jy.choi
- 변경 파일 수: 18
  - CLAUDE.md
  - apps/mobile/app/_layout.tsx
  - apps/mobile/jest.config.js
  - apps/mobile/package.json
  - apps/mobile/src/__tests__/dateUtils.test.ts
