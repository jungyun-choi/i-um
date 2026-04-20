---
title: 일기 스타일 "간결하게" 모드 추가
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [diary, ai, prompt, ux]
---

## 기능 개요

기존 일기 스타일(`감성적` / `사실 위주`)에 세 번째 옵션 **`간결하게`(brief)** 를 추가했다.
긴 글을 부담스러워하는 사용자를 위한 짧고 깔끔한 2~3문장, 100자 이내 포맷이다.

## 변경 파일

| 파일 | 역할 |
|------|------|
| `apps/server/src/services/claudeService.ts` | `style` union에 `'brief'` 추가, 시스템 프롬프트 3-way 분기, 사용자 프롬프트의 길이 지시문도 style별 분기 |
| `apps/server/src/workers/diaryWorker.ts` | `DiaryJob.diaryStyle` union 확장 |
| `apps/server/src/routes/photos.ts` | 런타임 허용값 가드 추가 (`emotional`/`factual`/`brief`만 허용, 나머지는 `emotional` fallback) |
| `apps/mobile/src/lib/api.ts` | `photos.process` 바디 타입 union 확장 |
| `apps/mobile/app/upload.tsx` | `DiaryStyle` 타입 + pill 버튼 3개 렌더링, pill padding/gap을 3개 수용 가능하도록 조정 |

## 프롬프트 설계

### System (brief 전용)
```
당신은 부모가 아이에게 남기는 짧은 육아 메모를 써주는 AI입니다.
2~3문장, 100자 이내로 그날의 순간을 한국어로 기록하세요.
"너는", "{childName}은" 같이 아이에게 말을 건네는 문체로 쓰되
불필요한 수식 없이 핵심만 담고, 마크다운 기호(**,##,- 등)는 절대 사용하지 마세요.
```

### User prompt 길이 지시문 (brief 전용)
```
첨부 사진을 보고 육아 메모를 짧게 써주세요.
- 2~3문장, 100자 이내로 핵심만 담으세요
- 사진 속 순간의 가장 인상적인 포인트 하나에 집중하세요
- 남은 날수나 현재 날짜를 언급하지 마세요 — 사진 속 순간 자체에 집중하세요
```

## UX

업로드 화면 하단의 "일기 스타일" 라벨 옆 pill 버튼이 2개 → 3개로 늘었다.
좁은 화면에서도 한 줄에 들어가도록 pill `paddingHorizontal: 16→12`, `gap: 8→6`으로 축소.

## 알려진 한계

- `diary_style`은 DB에 저장되지 않으므로, 기존 일기를 다른 스타일로 "재생성"하는 기능은 아직 없음 (재시도는 기본값 `emotional`로 생성됨).
- 실제 Claude 응답이 100자를 초과할 가능성은 있음 — 프롬프트 가이드로만 제약 (하드 truncation은 없음).
- claudeService에 대한 단위 테스트는 없음 (Anthropic API 실호출이 필요해 단위 테스트 가치 낮음). 실기기 수동 QA로 검증.

## 관련 페이지

- 없음 (신규 topic)
