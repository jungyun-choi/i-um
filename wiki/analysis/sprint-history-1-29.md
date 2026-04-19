---
title: 스프린트 #1~29 — 작업 이력 요약
type: analysis
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [sprint, history, retrospective]
---

# 스프린트 #1~29 — 작업 이력 요약

> git log + wiki 기존 문서를 기반으로 재구성한 스프린트 회고록.  
> 각 스프린트는 30분 자동 프로덕션 회의(PM + UX 디자이너 참여) 형식으로 진행됨.

---

## Phase 0: MVP 초기 구축 (Sprint #1~4)

### Sprint #1~2 — 핵심 일기 플로우 완성
- **사진 업로드 → AI 일기 생성** E2E 파이프라인 구축
  - `POST /photos/upload-url` — S3 presigned URL 발급
  - `POST /photos/:id/process` — Bull Queue에 AI 작업 등록
  - `diaryWorker.ts` — Claude Haiku로 일기 생성, 역지오코딩(Nominatim)
- 업로드 완료 후 일기 바로 보기 버튼 추가
- 하단 탭바 구현 — 타임라인 / 마일스톤 / 프로필
- 일기 상세 화면 수평 스와이프 네비게이션 (FlatList)

### Sprint #3 — 기초 UX 정비
- `expo-image` 전환 — 디스크 캐시 + 로딩 속도 개선 (Image → expo-image)
- 이미지 압축 최적화: 1280→1024px, quality 80→70 (Claude Vision 비용 절감)
- DiaryCard 폴리시 + "1년 전 오늘" MemoryCard 컴포넌트 신규 구현
- **EXIF 날짜 없는 사진** 처리 — AI가 오늘 날짜 기준으로 잘못 계산하는 버그 수정

### Sprint #4 — 프로필 + 마일스톤 탭 전면 개선
- Profile 통계 카드 (일기 수, 마일스톤 수, 기록 기간)
- 마일스톤 탭 전면 개선 — 달성/대기 카드 레이아웃
- Welcome 화면 개선 — 핵심 가치 3가지 슬라이드 + CTA 강화
- SafeAreaView 전체 `react-native-safe-area-context`로 마이그레이션

---

## Phase 1: Auth + 보안 강화 (Sprint #5~7)

### Sprint #5 — Auth 완성 + 비밀번호 찾기
- `forgot-password.tsx` 신규 생성 (Supabase `resetPasswordForEmail`)
- PhotoGrid → expo-image 마이그레이션
- login.tsx — "비밀번호를 잊으셨나요?" 링크 추가
- 관련 문서: [[wiki/topics/feat-push-notification.md]]

### Sprint #6 — 서버 보안 강화
- 전체 엔드포인트 **소유권 검증** 추가 (`assertChildAccess()`)
  - milestones, monthlyLetters, children에 인가 검증
- children.ts — POST input validation (name 필수, birth_date 형식, gender enum)
- diary.ts — content 10,000자 제한 + PATCH 빈값 방지
- `reset-password.tsx` 신규 생성 (PASSWORD_RECOVERY deep link)
- `express-rate-limit` 도입 — 전역 300req/15min, 사진 업로드 30req/hour
- Jest 테스트 22개 통과

### Sprint #7 — UX 폴리시
- DiaryCard text-only 카드 — dark journal 스타일 (`#2C2420` 배경)
- write.tsx — 9000자 이상 경고 표시
- signup/login — 이메일 형식 클라이언트 검증

---

## Phase 2: 안정성 + 기능 확장 (Sprint #8~12)

### Sprint #8 — 실패 상태 + 재시도 UX
- timeline DiaryCard에 `failed` 상태 표시
- diary/[id].tsx — 실패 시 재시도 버튼
- 관련 문서: [[wiki/topics/feat-retry-ux.md]]

### Sprint #9 — 아이 프로필 삭제
- child/[id]/edit.tsx — 삭제 기능 (확인 다이얼로그)
- `DELETE /children/:id` 서버 엔드포인트 + 연관 데이터 cascade

### Sprint #10 — 프로덕션 폴리시
- 네트워크 에러 핸들링 전체 화면 개선
- 마일스톤 가족 알림 — 아이 소유자 + 가족 구성원 모두에게 발송
- DiaryCard 각종 edge case 처리
- 관련 문서: [[wiki/topics/feat-profile-milestone.md]]

### Sprint #11 — 공유 + Rate Limit UX
- diary/[id].tsx — 공유 버튼 (Share API)
- letters.tsx — 월간 레터 공유
- Rate limit 초과 시 사용자 친화적 에러 메시지

### Sprint #12 — Aha Moment 로딩 경험
- `DiaryGenerating.tsx` 풀스크린 오버레이
  - Ken Burns 효과 (배경 사진 슬로우 줌)
  - 감성 메시지 페이드 순환 ("사진 속 표정을 읽고 있어요" 등)
  - 바운싱 로딩 도트 애니메이션
- 업로드 직후 → AI 생성 중 → 완성 모달 플로우 완성
- 푸시 알림 권한 요청 타이밍 최적화 — 첫 일기 완성 직후

---

## Phase 3: 브랜드 + 온보딩 완성 (Sprint #13~18)

### Sprint #13 — 탭바 polish
- 탭바 safe area 버그 수정
- Ionicons 벡터 아이콘 적용 + 햅틱 피드백

### Sprint #14~15 — Pretendard 폰트
- Pretendard 4가지 굵기 전역 적용 (Regular / Medium / SemiBold / Bold)
- `Text.defaultProps` 방식으로 앱 전체 한국어 타이포그래피 통일
- `expo-splash-screen` — 폰트 로딩 완료 전 스플래시 유지

### Sprint #16 — UX 전면 Polish
- Pretendard 기반 전체 타이포그래피 재조정
- 간격, 색상, 레이아웃 일관성 통일

### Sprint #17 — Empty State + Paywall 게이트
- 타임라인 empty state 개선 (첫 사진 추가 CTA)
- `PaywallModal.tsx` 신규 구현 — 월간 무료 한도 도달 시 표시
- 업로드 월간 무료 한도 체크 로직 (`FREE_MONTHLY_LIMIT`)

### Sprint #18 — 온보딩 플로우 완성
- Welcome → Signup → 아이 프로필 → Upload 연속 플로우
- `child/new.tsx` — `?from=onboarding` 파라미터로 맥락 구분
- 온보딩 시 아이 생성 완료 → 바로 upload 화면으로 (`router.replace('/upload')`)
- 진행률 표시 (2/2단계 인디케이터)
- `DateTimePicker` iOS 모달 시트 + Android 인라인 분기

---

## Phase 4: 아이콘 + 오프라인 + 고급 기능 (Sprint #19~25)

### Sprint #19 — 아이 편집 DatePicker
- child/[id]/edit.tsx — 생일 DatePicker iOS/Android 분기 처리
- 편집 화면 전반적인 품질 개선

### Sprint #20 — 앱 아이콘
- 이음 브랜드 아이콘 생성 (산호색 배경 + 이음 한글)
- icon.png, adaptive-icon.png, splash-icon.png, favicon.png 일괄 교체

### Sprint #21 — 오프라인 배너
- `OfflineBanner.tsx` — `@react-native-community/netinfo` 기반
- 네트워크 단절 시 앱 상단 오렌지 배너 자동 표시/숨김

### Sprint #22 — 멀티 업로드 + 가족 초대 UX
- 다중 사진 업로드 결과 모달 — "N개 일기가 생성됐어요!" + 마지막 일기 미리보기
- 가족 초대 UX 개선 — 초대 코드 공유 버튼 + JoinModal 6자리 입력

### Sprint #23 — React 안티패턴 수정 + 활동 스트립
- 타임라인 7일 활동 스트립 — 최근 일주일 날짜별 업로드 여부 시각화
- diary/[id].tsx React 키 경고 등 안티패턴 수정

### Sprint #24 — Worker 크래시 방지
- `diaryWorker.ts` — `takenAt` null 전달 시 크래시 방지 (optional chaining)

### Sprint #25 — RecordModal DateTimePicker 개선
- 마일스톤 수동 기록 모달 (`RecordModal`) — 날짜 입력을 DateTimePicker로 교체
- iOS/Android 분기 처리 + 로컬 날짜 파싱

---

## Phase 5: 마일스톤 + Deep Link + 버그 수정 (Sprint #26~29)

### Sprint #26 — Push Deep Link + Write 날짜
- 푸시 알림 → 앱 오픈 시 해당 다이어리로 deep link (`/diary/:id`)
- write.tsx — 날짜 선택 DateTimePicker 추가 (수동 날짜 기록 지원)
- MilestoneCard.tsx 데드 코드 정리

### Sprint #27 — Age UTC 버그 + 알림 타이밍
- `age.ts` getAgeText() 함수 UTC 파싱 버그 수정
  - `new Date(birth_date)` → 로컬 날짜 파싱
- 생일 표시 형식 수정
- 푸시 알림 권한 요청 타이밍 재조정

### Sprint #28 — Upload 네비게이션 버그
- upload.tsx — 사진 선택 취소 후 photos.length === 0 시 `router.back()` (무한 루프 방지)
- 업로드 화면에 아이 나이 컨텍스트 표시 (`📅 N살 N개월의 순간을 기록해요`)

### Sprint #29 — 마일스톤 전면 개편
- `milestone.ts` 유틸리티 신규 작성
  - `MILESTONE_META` — 10개 마일스톤 타입 → emoji + 한국어 라벨 매핑
  - `ORDERED_MILESTONE_TYPES` — 표준 표시 순서 (타임드 10개 + 이벤트 2개)
  - `formatMilestoneDate()` — "YYYY-MM-DD" → "YYYY년 M월 D일"
  - `getMilestoneDisplayLabel()` — 타입 키 → 한국어 라벨
  - `getExpectedDate()` — 생일 기반 예상 달성 날짜 계산
  - `detectMilestone()` — days 기반 마일스톤 자동 감지 (±허용 범위)
- DiaryCard — 마일스톤 배지 한국어 라벨 표시
- `milestoneUtils.test.ts` — 경계값 포함 10개 테스트 케이스

---

## 누적 성과 (Sprint #1~29 기준)

| 카테고리 | 완성 내용 |
|---------|---------|
| 핵심 플로우 | 업로드 → AI 일기 → 타임라인 → 공유 |
| Auth | 회원가입 / 로그인 / 비밀번호 찾기 / 재설정 |
| 마일스톤 | 10종 자동 감지 + 2종 수동 기록 (first_word, first_step) |
| AI 기능 | 일기 생성 (감성/사실 스타일), 역지오코딩, 월간 레터 |
| 가족 | 초대 코드 생성/참여, 가족 알림 |
| UX 폴리시 | Pretendard 폰트, 햅틱, Skeleton UI, 오프라인 배너 |
| 보안 | 소유권 검증, Rate Limit, 콘텐츠 검증 |
| 테스트 | Jest 25개 (서버 + 모바일) |

## 관련 문서

- [[wiki/topics/feat-push-notification.md]]
- [[wiki/topics/feat-calendar-navigation.md]]
- [[wiki/topics/feat-retry-ux.md]]
- [[wiki/topics/feat-memory-card.md]]
- [[wiki/topics/feat-profile-milestone.md]]
- [[wiki/topics/feat-milestone-manual-record.md]]
- [[wiki/topics/feat-text-diary.md]]
- [[wiki/topics/feat-notification-settings.md]]
- [[wiki/topics/feat-milestone-scheduler-v2.md]]
