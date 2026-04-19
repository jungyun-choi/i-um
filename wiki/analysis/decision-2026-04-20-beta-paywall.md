---
title: 결정 — 베타 Paywall 전략 및 무료 한도 조정
type: analysis
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [paywall, monetization, beta, UX]
---

## 결정: 베타 기간 무료 한도 30개 + Paywall UX 개선

- **날짜**: 2026-04-20 (Sprint #31)
- **결정**: 월간 무료 AI 일기 한도를 10개 → 30개로 상향, Paywall 메시지를 베타 친화적으로 교체
- **이유**: 10개 한도는 헤비 유저(신생아 부모)에게 너무 빠르게 막힘. 베타 기간에는 피드백 수집이 목표이므로 사용 마찰 최소화가 우선. RevenueCat 결제 시스템 미구현 상태에서 "업그레이드" 버튼은 데드엔드(dead-end) UX.
- **대안**: 무제한 무료 (피드백만 받기) / 10개 유지 + 결제 구현 완료까지 대기
- **선택한 이유**: 30개는 일반 부모 사용 패턴(하루 1장 = 월 30장)과 일치. 결제 구현 전까지 사용자 이탈 방지.
- **영향**:
  - `apps/server/src/routes/photos.ts`: `FREE_MONTHLY_LIMIT = 30`
  - `apps/mobile/src/components/PaywallModal.tsx`: 베타 메시지 + 산호색 닫기 버튼
  - RevenueCat 연동 완료 시 한도 재조정 필요

### Paywall 메시지 Before/After

| | Before | After |
|--|--------|-------|
| 설명 | "곧 출시 예정" (막연함) | "베타 서비스 — 소중한 피드백을 기다려요 💛" |
| 닫기 버튼 | 회색 보조 버튼 | 산호색 주 버튼 (`#E8735A`) |
| 분위기 | 업그레이드 강요 | 베타 참여 감사 |
