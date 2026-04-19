---
title: first_word / first_step 수동 기록
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [milestone, manual-record, ux]
---

## 기능 개요

백일/돌처럼 날짜 계산으로 예측 가능한 마일스톤과 달리, 첫말(first_word)·첫걸음(first_step)은 언제 일어날지 모르는 이벤트형 마일스톤이다. 부모가 직접 날짜를 입력해 기록할 수 있도록 수동 기록 흐름을 구현했다.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `apps/server/src/routes/milestones.ts` | POST /milestones 엔드포인트 |
| `apps/server/src/__tests__/milestonesRoute.test.ts` | 6개 테스트 케이스 |
| `apps/mobile/src/lib/api.ts` | `api.milestones.create()` 추가 |
| `apps/mobile/app/(tabs)/milestones.tsx` | PendingCard 기록하기 버튼 + RecordModal |

## 핵심 로직

### 서버 (POST /milestones)
- `first_word`, `first_step`만 허용 — 날짜 기반 타입(baekil 등)은 400 반환
- 중복 체크: `maybeSingle()`로 기존 레코드 확인 → 있으면 409 반환
- `milestones` 테이블에 `{ child_id, type, date }` insert

### 모바일 UX
- `PendingCard`에서 `EVENT_TYPES = {'first_word', 'first_step'}`인 경우만 "기록하기" 버튼 노출
- 날짜 기반 마일스톤(백일/돌/두돌)은 D-day 배지만 표시
- `RecordModal`: bottom sheet 스타일, 기본값 오늘 날짜(YYYY-MM-DD), 저장 후 캐시 무효화

## 알려진 한계
- 날짜 입력이 TextInput 기반 — 네이티브 DatePicker가 아니어서 형식 오류 가능성
- 기록 후 AchievedCard에는 사진이 없어 placeholder 이미지로 표시됨
