---
title: 일기 스타일 "드라마틱" 모드 추가
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [diary, ai, prompt, ux]
---

## 기능 개요

기존 일기 스타일(`감성적` / `사실 위주` / `간결하게`)에 네 번째 옵션 **`드라마틱`(dramatic)** 를 추가했다.
영화 내레이션 톤으로 그날의 평범한 순간을 극적인 서사로 재구성하는 모드. MZ 세대의 자극적 콘텐츠 수요에 대응.

## 변경 파일

| 파일 | 역할 |
|------|------|
| `apps/server/src/services/claudeService.ts` | `style` union에 `'dramatic'` 추가, 시스템 프롬프트 4-way 분기, 드라마틱 전용 길이 지시문 추가 |
| `apps/server/src/workers/diaryWorker.ts` | `DiaryJob.diaryStyle` union 확장 |
| `apps/server/src/routes/photos.ts` | 런타임 허용값 가드 확장 (`dramatic` 추가) |
| `apps/mobile/src/lib/api.ts` | `photos.process` 바디 타입 union 확장 |
| `apps/mobile/app/upload.tsx` | `DiaryStyle` 타입 + 4번째 pill 버튼, 레이아웃을 column + flexWrap으로 변경 |

## 프롬프트 설계

### System (dramatic 전용)
```
당신은 부모가 아이에게 남기는 육아 일기를 영화 내레이션처럼 드라마틱하게 써주는 AI입니다.
그날의 평범한 순간을 극적인 서사로 재구성하고, 영화 같은 클라이맥스와 긴장감 있는 문장을 사용하세요.
"그 순간, 세상이 멈췄다", "운명처럼", "마치 영원 같았다" 같은 극적인 표현을 자유롭게 활용하되,
"너는", "{childName}은" 같이 아이에게 말을 건네는 문체로 쓰고,
마크다운 기호(**,##,- 등)는 절대 사용하지 마세요.
```

### User prompt 길이 지시문 (dramatic 전용)
```
첨부 사진을 보고 육아 일기를 드라마틱한 영화 내레이션처럼 써주세요.
- 사진 속 순간을 극적인 클라이맥스로 재구성하세요
- 짧은 문장과 긴 문장을 섞어 리듬감을 주세요 ("그 순간. 세상이 멈췄다." 처럼)
- {childName}의 아주 작은 몸짓 하나도 영화 속 결정적 장면처럼 묘사하세요
- 남은 날수나 현재 날짜를 언급하지 마세요 — 사진 속 순간 자체에 집중하세요
- 150~250자 내외로 작성해주세요
```

## UX 변경

pill 버튼이 3개 → 4개로 늘면서 한 줄에 들어가지 않게 됨. 해결책으로 `styleContainer`를 기존 row(label↔pills) 레이아웃에서 column 레이아웃으로 변경:
- 라벨 "일기 스타일" 위에
- pill 4개 아래에 (`flexWrap: 'wrap'` 적용으로 좁은 화면에서도 자동 줄바꿈)

```tsx
styleContainer: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }
stylePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }
```

## 알려진 한계

- `diary_style`은 DB에 저장되지 않으므로, 기존 일기를 드라마틱 스타일로 "재생성"하는 기능은 없음.
- Claude 응답이 지나치게 과장되어 "취향 아닌" 결과가 나올 수 있음 — 프롬프트로만 제약 (인간 큐레이션 없음).
- 실제 기기 QA로 4개 pill wrap 동작 + 드라마틱 결과 톤 검증 필요.

## 관련 페이지

- [feat-diary-brief-style.md](./feat-diary-brief-style.md) — 같은 패턴을 복제한 이전 구현
