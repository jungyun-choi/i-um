---
title: 알림 설정 화면
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [feature, notification, mobile]
---

## 기능 개요

프로필 탭 "알림 설정" 메뉴에서 접근하는 푸시 알림 권한 관리 화면.
기존 "준비 중" 배지를 실제 기능으로 교체.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `apps/mobile/app/notification-settings.tsx` | 알림 설정 화면 |
| `apps/mobile/app/(tabs)/profile.tsx` | 메뉴 아이템 → 실제 화면 연결 |

## 핵심 로직

- `Notifications.getPermissionsAsync()` 로 현재 상태 확인
- `AppState.addEventListener('change')` 로 OS 설정 복귀 시 자동 재확인
- 토글 ON: 권한 미결정 → `requestPermissionsAsync()`, 거부 → `Linking.openSettings()`
- 토글 OFF: `Linking.openSettings()` (앱에서 직접 권한 취소 불가)
- iOS에서 거부 상태일 때 안내 메시지 표시

## 알림 종류

| 이벤트 | 발송 시점 | 서버 |
|--------|-----------|------|
| 백일/돌/두돌 | 매일 오전 9시 cron | milestoneScheduler.ts |
| AI 일기 완성 | diaryWorker 완료 시 | diaryWorker.ts |
| 월간 레터 도착 | 매달 1일 오전 2시 | monthlyLetterScheduler.ts |

## 관련 페이지
- [[wiki/topics/feat-push-notification.md]]
