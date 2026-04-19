---
title: 이음(i-um) 프로젝트 개요
type: overview
created: 2026-04-18
updated: 2026-04-20 (Sprint #30~33)
sources: []
tags: [overview, 육아, AI, 제로에포트]
---

# 이음(i-um) — 프로젝트 개요

## 핵심 아이디어

부모가 직접 기록하지 않아도, AI가 자동으로 아이의 성장을 기록하는 **제로에포트(Zero-effort) 육아 기록 앱**.

사진·영상의 메타데이터와 AI 분석을 결합해 감성적인 성장 일기와 하이라이트 영상을 자동 생성합니다.

---

## 해결하는 문제

- 기록하고 싶지만 매번 시간을 내기 어려운 부모
- 사진은 수천 장 있지만 정리가 안 된 상태
- 아이의 특별한 순간을 나중에야 인지하는 아쉬움

---

## 핵심 기능 (예정)

| 기능 | 설명 |
|------|------|
| 자동 일기 생성 | 사진 맥락 분석 → LLM이 감성적 일기 작성 |
| 스마트 앨범 | GPS·시간·인물 인식으로 자동 태깅·분류 |
| 성장 하이라이트 | 매월/매년 성장 영상 자동 편집 |
| 마일스톤 알림 | 첫걸음, 첫말 등 AI가 먼저 감지해 알림 |

---

## 기술 아키텍처 (초안)

```
사진/영상 입력
    ↓
Vision AI (인물·장소·맥락 인식)
    ↓
메타데이터 결합 (GPS, 시간, 캘린더)
    ↓
LLM (감성 일기 생성)
    ↓
영상 합성 (하이라이트 무비)
    ↓
부모에게 전달
```

---

## 현재 상태 (2026-04-20 기준)

### 완료 ✅
- [x] 프로젝트 아이디어 구체화
- [x] 기술 스택 확정 (React Native + Expo SDK 54, Node.js + Express, Supabase, Cloudflare R2, Claude Haiku 4.5)
- [x] 시장 조사 및 경쟁 앱 분석 완료 (10개 앱)
- [x] MVP 기능 정의 및 시스템 설계 (ERD, API, 화면 설계)
- [x] **전체 Auth 플로우** — 회원가입, 로그인, 비밀번호 찾기, 비밀번호 재설정 (PASSWORD_RECOVERY deep link)
- [x] **핵심 일기 플로우** — 사진 업로드 → AI 일기 생성 (Bull Queue + Claude Haiku), 텍스트 직접 작성
- [x] **타임라인** — 월별 섹션, 무한 스크롤, 메모리 카드, 월간 레터
- [x] **마일스톤** — 자동 감지 (백일, 돌, 생일 등) + 수동 기록 (첫걸음, 첫말)
- [x] **가족 공유** — 초대 코드 생성/참여
- [x] **월간 AI 레터** — 매달 1일 자동 생성, 아카이브 화면
- [x] **푸시 알림** — Expo Notifications 설정, 알림 설정 화면
- [x] **프로필** — 아바타 업로드, 아이 편집, 계정 삭제 (GDPR)
- [x] **보안 강화** — 전체 엔드포인트 소유권 검증, rate limiting, input validation
- [x] **UX 폴리시** — premium text diary card, 이메일 validation, char limit warning
- [x] **개인정보처리방침** 화면
- [x] 서버 Jest 테스트 25개 통과
- [x] **마일스톤 스케줄러 v2** — 3개 → 10개 알림 커버리지, UTC 날짜 파싱 버그 수정
- [x] **KST 날짜 버그 3건** — todayString, AchievedCard, formatRecordPeriod UTC 오차 제거
- [x] **Hermes Fabric 호환성** — condition && style 크래시 패턴 7건 수정
- [x] **베타 Paywall UX** — 무료 한도 30개, 베타 친화 메시지

### 사용자가 직접 해야 할 작업 🔧
- [ ] `npx eas login` → `npx eas project:init` → `app.json`의 `projectId` 자동 설정
- [ ] `apps/mobile/.env`에 `EXPO_PUBLIC_EAS_PROJECT_ID=<value>` 추가
- [ ] `eas.json`의 `appleTeamId`, `ascAppId` 설정 (App Store 등록 시)
- [ ] 앱 아이콘 / 스플래시 디자인 자산 교체 (`apps/mobile/assets/`)

### 다음 스프린트 후보
- [ ] Phase 2: 하이라이트 영상 생성 (ffmpeg or Remotion)
- [ ] 베타 테스트 (TestFlight)
- [ ] 수익 모델 구현 (월 구독, RevenueCat)

---

## 열린 질문들

1. iOS/Android 동시 지원 vs. 한 플랫폼 먼저?
2. 온디바이스 AI vs. 클라우드 AI (프라이버시 트레이드오프)
3. 수익 모델: 구독형 vs. 일회성 구매?
4. 아이 식별은 얼굴인식? 아니면 다른 방법?

---

## 관련 페이지

_소스 추가 및 분석이 진행되면 링크가 추가됩니다._
