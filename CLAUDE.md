# 이음 (i-um) — LLM Wiki Schema

이 파일은 이음 프로젝트의 지식 베이스(LLM Wiki)를 관리하기 위한 규칙과 워크플로우를 정의합니다.
Claude Code는 이 파일을 읽고 wiki를 일관되게 유지합니다.

---

## 프로젝트 개요

**이음(i-um)**은 AI 기반 제로에포트 육아 기록 앱입니다.
부모가 직접 기록하지 않아도 AI가 사진·영상·메타데이터를 분석해 아이의 성장 일기와 하이라이트 영상을 자동으로 생성합니다.

---

## 디렉토리 구조

```
i-um/
├── CLAUDE.md          # 이 파일 — wiki 스키마 및 운영 규칙
├── README.md          # 프로젝트 소개
├── raw/               # 원본 소스 (읽기 전용, LLM이 수정하지 않음)
│   ├── assets/        # 이미지, 첨부파일
│   └── *.md           # 아티클, 논문, 메모 등
└── wiki/              # LLM이 작성·유지하는 지식 베이스
    ├── index.md       # 전체 페이지 카탈로그 (항상 최신 유지)
    ├── log.md         # 작업 이력 (append-only)
    ├── overview.md    # 프로젝트 종합 개요 및 핵심 인사이트
    ├── entities/      # 개념, 기술, 서비스 등 개체 페이지
    ├── topics/        # 주제별 심층 분석 페이지
    ├── sources/       # 각 소스 요약 페이지
    └── analysis/      # 비교 분석, 질문 응답 결과 등
```

---

## 핵심 원칙

1. **raw/ 는 불변** — 소스 파일은 절대 수정하지 않음
2. **wiki/ 는 LLM이 전적으로 소유** — 사람이 직접 편집하는 경우 log.md에 기록
3. **index.md 는 항상 최신** — 페이지 추가/수정 시 반드시 index.md 업데이트
4. **log.md 는 append-only** — 기존 항목 수정 금지, 새 항목만 추가
5. **상호 참조 유지** — 관련 페이지는 반드시 서로 링크
6. **모순 명시** — 새 소스가 기존 내용과 충돌하면 해당 페이지에 `> ⚠️ 모순` 블록으로 표시

---

## 페이지 형식

### 모든 wiki 페이지 공통 frontmatter
```yaml
---
title: 페이지 제목
type: entity | topic | source | analysis | overview
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [소스파일명, ...]
tags: [태그1, 태그2]
---
```

### 소스 요약 페이지 (`wiki/sources/`)
```markdown
---
title: 소스 제목
type: source
created: YYYY-MM-DD
updated: YYYY-MM-DD
original: raw/파일명.md
tags: []
---

## 핵심 요약
(3-5문장)

## 주요 포인트
- 포인트 1
- 포인트 2

## 관련 페이지
- [[wiki/entities/...]]
- [[wiki/topics/...]]

## 인용
> 원문에서 중요한 구절
```

### 개체 페이지 (`wiki/entities/`)
```markdown
---
title: 개체명
type: entity
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
tags: []
---

## 정의
(간결한 정의)

## 주요 특징

## 이음 프로젝트와의 연관성

## 관련 개체
- [[...]]

## 소스
- [[wiki/sources/...]]
```

---

## 워크플로우

### 1. Ingest (소스 추가)
새 소스를 `raw/`에 추가하고 처리 요청 시:
1. 소스 파일 읽기
2. 핵심 내용 파악 후 사용자와 논의 (선택)
3. `wiki/sources/` 에 요약 페이지 생성
4. 관련 entity/topic 페이지 업데이트 또는 신규 생성
5. `wiki/overview.md` 업데이트 (필요 시)
6. `wiki/index.md` 업데이트
7. `wiki/log.md` 에 항목 추가: `## [YYYY-MM-DD] ingest | 소스 제목`

### 2. Query (질문 응답)
질문을 받으면:
1. `wiki/index.md` 읽어 관련 페이지 파악
2. 관련 페이지 읽기
3. 답변 합성 (출처 명시)
4. 가치 있는 답변은 `wiki/analysis/` 에 저장
5. `wiki/log.md` 에 항목 추가: `## [YYYY-MM-DD] query | 질문 요약`

### 3. Lint (상태 점검)
주기적 또는 요청 시:
1. 모순되는 페이지 찾기
2. 인바운드 링크 없는 고아 페이지 찾기
3. 언급은 있지만 페이지 없는 개념 목록화
4. 보강이 필요한 데이터 갭 제안
5. 결과를 `wiki/analysis/lint-YYYY-MM-DD.md` 에 저장
6. `wiki/log.md` 에 항목 추가: `## [YYYY-MM-DD] lint | 요약`

---

## 이음 프로젝트 핵심 도메인

wiki를 구성할 때 아래 도메인 영역을 중심으로 개체/토픽 페이지를 구성합니다.

- **육아 기록**: 밀스톤, 성장 일기, 포토 앨범, 추억 보관
- **AI 기술**: Vision AI, 멀티모달 LLM, 영상 합성, 자동 태깅
- **UX 패턴**: 제로에포트, 자동화, 푸시 알림, 개인화
- **시장 분석**: 경쟁 앱, 사용자 페르소나, 수익 모델
- **기술 스택**: Frontend, Backend, AI/ML, 인프라
- **개발 계획**: 기능 명세, 로드맵, 의사결정 기록

---

## log.md 파싱 팁

```bash
# 최근 5개 항목 확인
grep "^## \[" wiki/log.md | tail -5

# ingest 항목만 필터
grep "^## \[" wiki/log.md | grep "ingest"

# 특정 날짜 항목
grep "^## \[2026-04" wiki/log.md
```

---

## 개발 과정 자동 기록 규칙

### Git Hook (자동)
`.githooks/post-commit` 이 모든 커밋 후 `wiki/log.md`에 자동으로 기록합니다.
커밋 메시지, 해시, 변경 파일 목록이 기록됩니다.

### Claude 작업 시 규칙 (Claude가 따라야 할 규칙)

**1. 새 기능/컴포넌트 구현 완료 시**
`wiki/topics/` 또는 `wiki/entities/`에 해당 내용 페이지를 생성하거나 업데이트합니다.

**2. 중요 기술 결정 시**
결정 사항, 선택 이유, 고려한 대안을 `wiki/analysis/decision-YYYY-MM-DD-{주제}.md`에 기록합니다.

형식:
```markdown
## 결정: {제목}
- **날짜**: YYYY-MM-DD
- **결정**: ...
- **이유**: ...
- **대안**: ...
- **영향**: ...
```

**3. 버그 발견/수정 시**
`wiki/log.md`에 수동으로 항목 추가:
`## [YYYY-MM-DD] fix | 버그 설명`

**4. 세션 종료 전**
의미 있는 진행이 있었다면 `wiki/overview.md`의 "현재 상태" 체크리스트를 업데이트합니다.

**5. 외부 리서치 참고 시**
참고한 내용을 `raw/`에 저장하고 ingest 워크플로우를 따릅니다.

### log 항목 타입 정의

| 타입 | 의미 |
|------|------|
| `setup` | 환경 설정, 초기화 |
| `commit` | git 커밋 (자동) |
| `ingest` | 소스 추가 |
| `query` | 질문 응답 |
| `lint` | wiki 상태 점검 |
| `decision` | 기술 결정 |
| `fix` | 버그 수정 |
| `feat` | 새 기능 구현 |
| `refactor` | 리팩토링 |
