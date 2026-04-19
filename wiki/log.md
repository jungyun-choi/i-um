# 이음 Wiki — 작업 이력

> append-only 로그. 기존 항목은 수정하지 않습니다.
> 파싱: `grep "^## \[" wiki/log.md | tail -5`

---

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
