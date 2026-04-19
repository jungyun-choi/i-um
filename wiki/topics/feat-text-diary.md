---
title: 텍스트 일기 작성 기능
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [feature, diary, mobile, ux]
---

## 기능 개요

사진 없이 텍스트만으로 육아 일기를 작성하는 기능.
신생아 초기 또는 사진 찍을 여유가 없는 상황에서도 기록 가능.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `apps/server/src/routes/diary.ts` | `POST /diary` 엔드포인트 (photo_id nullable) |
| `apps/mobile/src/lib/api.ts` | `api.diary.create()` 메서드 추가 |
| `apps/mobile/app/write.tsx` | 텍스트 일기 작성 화면 |
| `apps/mobile/app/(tabs)/timeline.tsx` | 확장형 FAB — 사진/텍스트 일기 선택 |

## 핵심 로직

### 서버 (POST /diary)
- `child_id` + `content` 필수, `date` 선택 (없으면 현재 시각)
- 소유권 확인: `children.user_id` 또는 `family_members` 테이블 체크
- `status: 'done'`으로 즉시 저장 (AI 생성 없음)

### 모바일 (write.tsx)
- 날짜 선택: 오늘 기준 전날로 이동 가능 (미래 날짜 불가)
- KST 기준 날짜 계산 (`KST_OFFSET = 9h`)
- AsyncStorage 자동 draft 저장 — 앱 종료 후에도 복원
- 저장 성공 시 draft 삭제, timeline React Query 캐시 invalidate

### FAB (timeline.tsx)
- Animated.spring으로 확장/축소
- 메인 버튼 45도 회전 애니메이션
- 하위 버튼: 📸 사진으로 → `/upload`, ✏️ 직접 쓰기 → `/write`
- backdrop Pressable로 닫기 가능

## 알려진 한계

- 텍스트 일기는 사진 없음 → 타임라인에서 `imagePlaceholder` 회색 배경 표시
- 날짜 입력이 ‹ › 버튼 only — 달력 UI 없음 (v2에서 개선 예정)
- 글자수 제한 없음

## 관련 페이지
- [[wiki/topics/feat-push-notification.md]]
