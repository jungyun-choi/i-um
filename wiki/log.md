# 이음 Wiki — 작업 이력

> append-only 로그. 기존 항목은 수정하지 않습니다.
> 파싱: `grep "^## \[" wiki/log.md | tail -5`

---

## [2026-04-20] feat | 스프린트 — 텍스트 일기 + 알림 설정 + app.json 브랜딩

- `feat/text-diary-ui`: write.tsx 텍스트 일기 작성 화면 + AsyncStorage draft 자동저장
- `feat/write-ux-polish`: placeholder 정리, FAB 레이블 개선
- `feat/milestone-notifications`: notification-settings.tsx 알림 권한 관리 화면 구현
- `chore`: app.json — name: 이음, slug: i-um, bundleId: com.ium.app, 알림 플러그인
- `feat/upload-progress`: 다중 사진 업로드 시 1/N 진행 표시
- 타임라인 확장형 FAB (사진/직접쓰기 분기)
- wiki: feat-text-diary.md, feat-notification-settings.md 추가

---

## [2026-04-20] feat | 프로덕션 품질 스프린트 — 초대 UI + 토스트 + ErrorBoundary

- `feat/invite-ui`: 프로필 탭 가족 공유 섹션 — 초대 코드 생성(Share.share) + JoinModal 6자리 입력
- `feat/global-toast`: 슬라이드업 토스트 시스템 (Toast.tsx, ToastProvider) — API 에러 Alert 교체
  - 토스트 색상: error `#C0392B`, success `#E8735A` (브랜드 통일)
  - upload.tsx, diary/[id].tsx, child/new.tsx 에러 → 토스트 전환
- `feat/onboarding-ux`: 온보딩 전환율 개선 — child 생성 후 Alert 제거, 바로 upload 화면으로
- `feat/error-boundary`: ErrorBoundary 클래스 컴포넌트 — JS 크래시 폴백 UI, 스토어 제출 필수

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

## [2026-04-19] commit | feat: 월별 달력 탐색 구현 (SectionList + 퀵점프 바)

- 커밋: `c9bee10` by jy.choi
- 변경 파일 수: 5
  - CLAUDE.md
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/src/__tests__/groupByMonth.test.ts
  - apps/mobile/src/hooks/usePushNotification.ts
  - apps/mobile/src/utils/groupByMonth.ts

## [2026-04-19] commit | feat: calendar navigation — date picker sheet + scroll jump fix

- 커밋: `3ac50be` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/timeline.tsx

## [2026-04-19] commit | feat: 일기 생성 실패 시 재시도 UX 추가

- 커밋: `77524ff` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/diary/[id].tsx

## [2026-04-19] commit | feat: DiaryCard 폴리시 + "1년 전 오늘" 메모리 카드

- 커밋: `263483c` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/src/components/DiaryCard.tsx
  - apps/mobile/src/components/MemoryCard.tsx

## [2026-04-19] commit | feat: Welcome 화면 개선 — 핵심 가치 3가지 + CTA 강화

- 커밋: `625d5bf` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(auth)/welcome.tsx

## [2026-04-19] commit | fix: AI 일기가 오늘 날짜 기준으로 계산하는 버그 수정

- 커밋: `1620b52` by jy.choi
- 변경 파일 수: 1
  - apps/server/src/services/claudeService.ts

## [2026-04-19] commit | perf: 이미지 압축 1280→1024px, 80→70% (Claude Vision 최적화)

- 커밋: `36c4685` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/upload.tsx

## [2026-04-19] commit | perf: expo-image로 전환 — 디스크 캐시 + 로딩 속도 개선

- 커밋: `3d6f924` by jy.choi
- 변경 파일 수: 5
  - apps/mobile/.env
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/package.json
  - apps/mobile/src/components/DiaryCard.tsx
  - apps/mobile/src/components/MemoryCard.tsx

## [2026-04-19] commit | fix: EXIF 날짜 없는 사진에서 AI가 오늘 기준으로 계산하는 버그 수정

- 커밋: `1889be7` by jy.choi
- 변경 파일 수: 4
  - apps/server/.env
  - apps/server/src/routes/photos.ts
  - apps/server/src/services/claudeService.ts
  - apps/server/src/workers/diaryWorker.ts

## [2026-04-19] commit | feat: 일기 상세 화면 수평 스와이프 네비게이션

- 커밋: `6f78d71` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/src/components/DiaryCard.tsx

## [2026-04-19] commit | feat: 하단 탭바 구현 — 타임라인/마일스톤/프로필 이동

- 커밋: `a4e8fcd` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/_layout.tsx

## [2026-04-19] commit | feat: Profile 통계 카드 + Milestone 탭 전면 개선

- 커밋: `4702400` by jy.choi
- 변경 파일 수: 6
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/src/__tests__/groupByMonth.test.ts
  - apps/mobile/src/lib/api.ts
  - apps/mobile/src/utils/groupByMonth.ts

## [2026-04-19] commit | feat: 업로드 완료 후 일기 바로 보기 버튼 추가

- 커밋: `f99f647` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/upload.tsx

## [2026-04-20] commit | fix: Hermes TypeError 재발 방지 — style 배열 & onPress boolean 패턴 수정

- 커밋: `e37c385` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/timeline.tsx

## [2026-04-20] commit | fix: tabBarLabelStyle fontWeight 제거 — iOS native bridge 타입 오류 수정

- 커밋: `fa16059` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/_layout.tsx

## [2026-04-20] commit | fix: TabBar 타입 오류 수정 2차

- 커밋: `388ebd6` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/src/hooks/usePushNotification.ts

## [2026-04-20] commit | feat: 마일스톤 알림 스케줄러 — 매일 오전 9시 자동 발송

- 커밋: `bfce209` by jy.choi
- 변경 파일 수: 2
  - apps/server/src/index.ts
  - apps/server/src/workers/milestoneScheduler.ts

## [2026-04-20] commit | feat: first_word / first_step 수동 기록 기능

- 커밋: `df9cfad` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/src/lib/api.ts
  - apps/server/src/__tests__/milestonesRoute.test.ts
  - apps/server/src/routes/milestones.ts

## [2026-04-20] commit | feat: AI 월간 레터 — 매달 1일 Claude로 편지 생성 + 타임라인 카드

- 커밋: `a63bddc` by jy.choi
- 변경 파일 수: 6
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/src/lib/api.ts
  - apps/server/src/__tests__/monthlyLetterScheduler.test.ts
  - apps/server/src/index.ts
  - apps/server/src/routes/monthlyLetters.ts

## [2026-04-20] commit | refactor: SafeAreaView 전체 react-native-safe-area-context로 마이그레이션

- 커밋: `c9dfe10` by jy.choi
- 변경 파일 수: 10
  - apps/mobile/app/(auth)/login.tsx
  - apps/mobile/app/(auth)/signup.tsx
  - apps/mobile/app/(auth)/welcome.tsx
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/(tabs)/profile.tsx

## [2026-04-20] commit | feat: 온보딩 플로우 — 빈 화면을 따뜻한 첫 경험으로

- 커밋: `c5294cf` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/child/new.tsx

## [2026-04-20] commit | refactor: welcome 화면 3단계 스와이프 슬라이더로 개선

- 커밋: `60501fc` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(auth)/welcome.tsx

## [2026-04-20] commit | feat: Skeleton shimmer UI — ActivityIndicator 전면 교체

- 커밋: `b8fa05f` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/src/components/Skeleton.tsx

## [2026-04-20] commit | feat: 가족 공유 — invite_codes + family_members (서버 + API 클라이언트)

- 커밋: `aa31b2f` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/src/lib/api.ts
  - apps/server/src/index.ts
  - apps/server/src/routes/children.ts
  - apps/server/src/routes/invites.ts

## [2026-04-20] commit | feat: 가족 초대 UI — 초대 보내기 + 코드 참여 모달

- 커밋: `872eebb` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/profile.tsx

## [2026-04-20] commit | feat: 글로벌 에러 토스트 시스템 구현

- 커밋: `2332dd0` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/app/upload.tsx
  - apps/mobile/src/components/Toast.tsx

## [2026-04-20] commit | feat: 온보딩 전환율 개선 + 토스트 색상 정제

- 커밋: `9c028df` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/child/new.tsx
  - apps/mobile/src/components/Toast.tsx

## [2026-04-20] commit | feat: 앱 전체 ErrorBoundary — 크래시 화이트스크린 방지

- 커밋: `c2ea8cc` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/_layout.tsx
  - apps/mobile/src/components/ErrorBoundary.tsx

## [2026-04-20] commit | feat: 계정 삭제 + DiaryGenerating UX 개선

- 커밋: `13c573f` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/src/components/DiaryGenerating.tsx
  - apps/mobile/src/lib/api.ts
  - apps/server/src/routes/users.ts

## [2026-04-20] commit | feat: 탭바 Ionicons 벡터 아이콘 + 햅틱 피드백

- 커밋: `6172f3d` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/upload.tsx

## [2026-04-20] commit | fix: child edit 화면 품질 개선

- 커밋: `b068caa` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/child/[id]/edit.tsx

## [2026-04-20] commit | feat: KST 날짜 버그 수정 + 개인정보처리방침 인앱 페이지

- 커밋: `a25a3af` by jy.choi
- 변경 파일 수: 5
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/app/privacy.tsx
  - apps/mobile/src/lib/utils/date.ts
  - apps/mobile/src/utils/groupByMonth.ts

## [2026-04-20] commit | feat: 로그인/회원가입 UX 전면 개선 + DiaryCard KST 날짜 수정

- 커밋: `d3dc9db` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(auth)/login.tsx
  - apps/mobile/app/(auth)/signup.tsx
  - apps/mobile/src/components/DiaryCard.tsx

## [2026-04-20] commit | feat: 텍스트 전용 일기 API — POST /diary (사진 없이 기록 가능)

- 커밋: `8a62cb5` by jy.choi
- 변경 파일 수: 1
  - apps/server/src/routes/diary.ts

## [2026-04-20] commit | feat: add diary.create() API method for text-only diary

- 커밋: `9a5bd28` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/src/lib/api.ts

## [2026-04-20] commit | feat: text diary compose screen + expandable FAB on timeline

- 커밋: `d9f35d8` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/write.tsx

## [2026-04-20] commit | feat: draft autosave + UX polish on write screen

- 커밋: `862f2f6` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/write.tsx
  - apps/mobile/package.json
  - package-lock.json

## [2026-04-20] commit | feat: notification settings screen — replaces 준비 중 badge

- 커밋: `7e25a84` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/notification-settings.tsx

## [2026-04-20] commit | chore: app.json — 이음 브랜드 설정 + 번들 ID + 알림 플러그인

- 커밋: `bc520ad` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app.json

## [2026-04-20] commit | fix: show per-photo upload progress for multi-photo uploads

- 커밋: `0acaaf2` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/upload.tsx

## [2026-04-20] commit | chore: EAS build config + app.json projectId placeholder

- 커밋: `e550f49` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app.json
  - apps/mobile/eas.json

## [2026-04-20] commit | feat: POST /children/:id/avatar-url — R2 presigned URL for avatar upload

- 커밋: `ac1978c` by jy.choi
- 변경 파일 수: 1
  - apps/server/src/routes/children.ts

## [2026-04-20] commit | feat: child avatar upload — R2 presigned URL + ImageManipulator compression

- 커밋: `6076f7e` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/child/[id]/edit.tsx
  - apps/mobile/src/lib/api.ts

## [2026-04-20] commit | feat: monthly letters list, expo-image avatar, text-only diary card polish

- 커밋: `0630315` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/letters.tsx
  - apps/mobile/src/components/ChildAvatar.tsx
  - apps/mobile/src/components/DiaryCard.tsx

## [2026-04-20] commit | feat: upload screen auto-launches picker on mount

- 커밋: `d1a613f` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/upload.tsx

## [2026-04-20] commit | fix: diary route authorization + signup privacy link

- 커밋: `7051c9d` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/(auth)/signup.tsx
  - apps/server/src/routes/diary.ts

## [2026-04-20] commit | feat: onboarding progress indicator + write keyboard fix

- 커밋: `e89121f` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(auth)/signup.tsx
  - apps/mobile/app/child/new.tsx
  - apps/mobile/app/write.tsx

## [2026-04-20] commit | feat: forgot-password screen + PhotoGrid expo-image + login UX polish

- 커밋: `8bb75ef` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/(auth)/forgot-password.tsx
  - apps/mobile/app/(auth)/login.tsx
  - apps/mobile/src/components/PhotoGrid.tsx

## [2026-04-20] commit | fix: add ownership checks to milestones, monthlyLetters + children validation

- 커밋: `35a9fef` by jy.choi
- 변경 파일 수: 4
  - apps/server/src/__tests__/milestonesRoute.test.ts
  - apps/server/src/routes/children.ts
  - apps/server/src/routes/milestones.ts
  - apps/server/src/routes/monthlyLetters.ts

## [2026-04-20] commit | feat: password reset flow — handle PASSWORD_RECOVERY deep link

- 커밋: `7c14238` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/reset-password.tsx

## [2026-04-20] commit | feat: rate limiting + diary content validation

- 커밋: `c0d6369` by jy.choi
- 변경 파일 수: 4
  - apps/server/package.json
  - apps/server/src/index.ts
  - apps/server/src/routes/diary.ts
  - package-lock.json

## [2026-04-20] commit | feat: UX polish — premium text diary card + email validation + char limit

- 커밋: `f0bad3c` by jy.choi
- 변경 파일 수: 4
  - apps/mobile/app/(auth)/login.tsx
  - apps/mobile/app/(auth)/signup.tsx
  - apps/mobile/app/write.tsx
  - apps/mobile/src/components/DiaryCard.tsx

## [2026-04-20] commit | chore: remove stale _layout.tsx.bak

- 커밋: `4f2d4e6` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/_layout.tsx.bak

## [2026-04-20] feat | 야간 자동 스프린트 — 프로덕션 수준 달성

### Sprint #5 — forgot-password + PhotoGrid + login UX
- `app/(auth)/forgot-password.tsx` 신규 생성 (Supabase resetPasswordForEmail)
- PhotoGrid → expo-image 마이그레이션, borderRadius/gap 개선
- login.tsx — "비밀번호를 잊으셨나요?" 링크 추가

### Sprint #6 — 서버 보안 강화 + 비밀번호 재설정 플로우
- milestones.ts — GET/POST에 `assertChildAccess()` 소유권 검증 추가
- monthlyLetters.ts — GET/latest에 소유권 검증 추가
- children.ts — POST input validation (name 필수, birth_date 형식, gender enum)
- diary.ts — POST/PATCH content 10,000자 제한 + PATCH 빈값 방지
- `app/reset-password.tsx` 신규 생성 (PASSWORD_RECOVERY deep link 처리)
- `_layout.tsx` — `PASSWORD_RECOVERY` 이벤트 감지 → /reset-password로 라우팅
- express-rate-limit 도입 — 전역 300req/15min, 사진 업로드 30req/hour
- Jest 테스트 22개 모두 통과

### Sprint #7 — UX 폴리시
- DiaryCard text-only 카드 — dark journal 스타일 (2C2420 배경 + 인용구 글리프)
- write.tsx — 9000자 이상 시 경고 표시
- signup/login — 이메일 형식 클라이언트 검증 추가
- `_layout.tsx.bak` 스테일 파일 제거


## [2026-04-20] commit | fix: show failed diary state in timeline cards

- 커밋: `bbf3961` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/src/components/DiaryCard.tsx

## [2026-04-20] commit | feat: child profile deletion

- 커밋: `987b528` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/child/[id]/edit.tsx
  - apps/mobile/src/lib/api.ts
  - apps/server/src/routes/children.ts

## [2026-04-20] commit | feat: sprint-10 production polish — network errors, UX fixes, milestone family notifications

- 커밋: `66f6e63` by jy.choi
- 변경 파일 수: 6
  - apps/mobile/app/(tabs)/profile.tsx
  - apps/mobile/app/(tabs)/timeline.tsx
  - apps/mobile/app/upload.tsx
  - apps/mobile/src/components/DiaryCard.tsx
  - apps/mobile/src/lib/api.ts

## [2026-04-20] commit | feat: sprint-11 — diary/letter share + rate limit UX

- 커밋: `22e4227` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/app/letters.tsx
  - apps/server/src/index.ts

## [2026-04-20] commit | feat: sprint-12 — Aha moment loading experience + push prompt timing

- 커밋: `94bbf06` by jy.choi
- 변경 파일 수: 3
  - apps/mobile/app/diary/[id].tsx
  - apps/mobile/app/upload.tsx
  - apps/mobile/src/components/DiaryGenerating.tsx

## [2026-04-20] commit | fix: TypeScript clean + app.json description for App Store

- 커밋: `802e2c4` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/app.json
  - apps/mobile/app/diary/[id].tsx

## [2026-04-20] commit | fix: tab bar safe area + icon polish (sprint-13)

- 커밋: `6ed68e4` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/(tabs)/_layout.tsx

## [2026-04-20] commit | feat: Pretendard 폰트 전역 적용 (sprint-14)

- 커밋: `3001d5d` by jy.choi
- 변경 파일 수: 7
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/assets/fonts/Pretendard-Bold.otf
  - apps/mobile/assets/fonts/Pretendard-Medium.otf
  - apps/mobile/assets/fonts/Pretendard-Regular.otf

## [2026-04-20] commit | feat: install expo-splash-screen for font-gated splash (sprint-15)

- 커밋: `ce8e1b7` by jy.choi
- 변경 파일 수: 2
  - apps/mobile/package.json
  - package-lock.json

## [2026-04-20] commit | feat: Pretendard 전역 적용 (Text.defaultProps)

- 커밋: `36b1208` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/_layout.tsx

## [2026-04-20] commit | feat: Sprint #17 — empty state 개선 + 월간 구독 게이트

- 커밋: `d956450` by jy.choi
- 변경 파일 수: 7
  - .claude/scheduled_tasks.lock
  - apps/mobile/app/(tabs)/milestones.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/upload.tsx
  - apps/mobile/src/components/PaywallModal.tsx

## [2026-04-20] commit | feat: Sprint #18 — 온보딩 플로우 완성

- 커밋: `e67789e` by jy.choi
- 변경 파일 수: 5
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/child/new.tsx
  - apps/mobile/app/upload.tsx
  - apps/mobile/package.json
  - package-lock.json

## [2026-04-20] commit | feat: Sprint #19 — child edit DatePicker + 일관성

- 커밋: `2d4c98e` by jy.choi
- 변경 파일 수: 1
  - apps/mobile/app/child/[id]/edit.tsx
