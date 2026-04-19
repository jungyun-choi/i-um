---
title: 일기 생성 실패 재시도 UX
type: topic
created: 2026-04-19
updated: 2026-04-19
tags: [feat, diary, retry, ux]
---

## 기능 개요

AI 일기 생성이 실패(`status: 'failed'`)한 경우, 단순 에러 텍스트 대신 재시도 버튼을 제공한다.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `app/diary/[id].tsx` | 실패 UI, 재시도 로직, 폴링 재활성화 |

## 핵심 동작

1. `current.status === 'failed'`면 실패 UI 렌더링 (이모지 + 설명 + 재시도 버튼)
2. 재시도 버튼 탭 → `api.photos.process(photoId)` 호출 → `retrying = true`
3. `retrying`이 `true`면 `useDiaryGeneration`에 `photoId`를 다시 전달해 폴링 재활성화
4. 폴링 중에는 `DiaryGenerating` 로딩 화면 표시
5. 생성 완료 시 `polledDiary.status === 'done'`으로 전환, 화면 정상 표시
6. API 호출 실패 시 `retrying = false`로 복구, Alert 표시

## 알려진 한계

- `retrying` 상태는 컴포넌트 언마운트 시 초기화됨 (페이지 이탈 후 재진입 시 실패 화면으로 돌아옴)
- 서버 측에서 재시도 횟수 제한 없음 (무한 재시도 가능)
