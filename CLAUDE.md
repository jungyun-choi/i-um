# 이음 (i-um) — 프로젝트 규칙 & LLM Wiki Schema

이 파일은 이음 프로젝트의 **개발 규칙**, **인프라 정보**, **지식 베이스(LLM Wiki) 운영 방식**을 정의합니다.
Claude Code는 세션 시작 시 이 파일을 읽고 모든 규칙을 준수합니다.

---

## 개발 규칙 (Claude가 반드시 따라야 할 규칙)

### 1. 브랜치 전략
- **모든 기능 구현은 반드시 feature 브랜치에서 진행**한다
- 브랜치 네이밍: `feat/{기능명}` / `fix/{버그명}` / `refactor/{대상}`
- 구현 완료 후 main에 머지. 머지 전 반드시 코드 확인
- 예시: `git checkout -b feat/highlight-video`

### 2. 기능 문서화 (구현 완료 시 필수)
- 새 기능 구현이 완료되면 **반드시** `wiki/topics/feat-{기능명}.md` 생성
- 포함 내용: 기능 개요, 구현 파일 목록, 핵심 로직, 알려진 한계
- `wiki/index.md`에 등록, `wiki/log.md`에 `feat` 항목 추가

### 3. 리서치 문서화 (조사 시 필수)
- 기술 선택·라이브러리·API 등 자료 조사 내용은 **반드시** wiki에 정리
- 소스 원문 → `raw/` 저장 후 ingest 워크플로우 따름
- 간단한 조사 결과는 `wiki/analysis/research-YYYY-MM-DD-{주제}.md`에 직접 작성

### 4. TDD 워크플로우 (Claude가 반드시 따라야 할 규칙)

이음 프로젝트는 TDD 방식으로 개발한다. 사용자가 매번 수동 확인하지 않아도 되도록, Claude는 구현 전 테스트를 먼저 작성하고 통과 여부를 직접 확인한다.

**레이어별 테스트 전략:**

| 레이어 | 도구 | 자동화 |
|--------|------|--------|
| 서버 API / 서비스 로직 | Jest + supertest | ✅ 완전 자동 |
| 모바일 hooks / utils | Jest + RNTL | ✅ 완전 자동 |
| 모바일 UI 렌더링 | — | ⚠️ 가끔 수동 |
| 실기기 (알림, 카메라) | — | ❌ 수동 필수 |

**TDD 순서 (기능 하나당):**
1. `__tests__/` 에 실패하는 테스트 먼저 작성
2. 테스트가 통과할 최소한의 코드 구현
3. `npm test` 실행해서 초록불 확인 후 사용자에게 보고
4. 리팩토링 (테스트는 계속 통과해야 함)

**테스트 파일 위치:**
- 서버: `apps/server/src/__tests__/{기능}.test.ts`
- 모바일: `apps/mobile/src/__tests__/{기능}.test.ts`

**테스트 실행:**
```bash
# 서버 테스트
cd apps/server && npm test

# 서버 watch 모드 (개발 중)
cd apps/server && npm run test:watch

# 모바일 테스트
cd apps/mobile && npm test
```

**Claude 행동 규칙:**
- 새 기능 구현 시 테스트 없이 코드만 짜는 것은 금지
- `npm test` 결과 없이 "구현 완료"라고 보고하는 것은 금지
- 테스트가 실패하면 통과할 때까지 스스로 수정
- UI/실기기 테스트가 불가능한 부분만 사용자에게 확인 요청

### 5. 기능 구현 체크리스트
기능 하나가 완성됐다고 판단하려면 아래를 모두 충족해야 한다:
- [ ] 브랜치에서 구현 완료
- [ ] 테스트 작성 및 `npm test` 통과 확인
- [ ] UI/실기기 필요 시 사용자에게 명시적으로 확인 요청
- [ ] `wiki/topics/feat-{기능명}.md` 생성
- [ ] `wiki/index.md` 업데이트
- [ ] main 머지 & 커밋

---

## 인프라 & 서버 정보

### 서버 실행
```bash
# Redis 시작 (Bull Queue 필수)
brew services start redis

# 서버 실행 (포트 4242)
cd apps/server && npm run dev

# 모바일 앱 실행
cd apps/mobile && npx expo start

# 헬스체크
curl http://localhost:4242/health
```

### 주요 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/children` | 아이 생성 |
| GET | `/children` | 아이 목록 |
| POST | `/photos/upload-url` | S3 presigned URL 발급 |
| POST | `/photos/:id/process` | AI 일기 생성 큐 등록 |
| GET | `/photos/:id/diary` | 일기 생성 상태 폴링 |
| GET | `/diary/timeline/:childId` | 타임라인 조회 |
| PATCH | `/diary/:id` | 일기 편집 |
| DELETE | `/diary/:id` | 일기 + 사진 삭제 |
| GET | `/milestones/:childId` | 마일스톤 목록 |

### 스택 & 서비스
| 서비스 | 용도 | 비고 |
|--------|------|------|
| Supabase | DB + Auth | `apps/server/.env` |
| Cloudflare R2 | 이미지 스토리지 | cookly-meal 버킷, `i-um/` prefix |
| Redis (local) | Bull Queue | `redis://localhost:6379` |
| Anthropic Claude | AI 일기 생성 | Haiku 4.5 모델 |
| OpenStreetMap Nominatim | 역지오코딩 | 무료, 키 불필요 |

---

## API 키 위치

새 세션에서 환경변수 설정 시 참고:

| 키 | 위치 |
|----|------|
| `ANTHROPIC_API_KEY` | `~/.zshrc` (export로 등록됨) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | `apps/server/.env` (실제값 적용 완료) |
| `SUPABASE_ANON_KEY` | `apps/mobile/.env` (실제값 적용 완료) |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `/Users/jungyun.choi/Dev/planeat-new/backend/scripts/upload_to_r2.py` 상단 하드코딩 |
| `GEMINI_API_KEY` | `/Users/jungyun.choi/Dev/planeat-new/backend/.env` |
| `REPLICATE_API_TOKEN` | `/Users/jungyun.choi/Dev/planeat-new/backend/.env` |
| `KAKAO_REST_API_KEY` | 미발급 (Kakao Developers에서 신규 발급 필요) |
| `REDIS_URL` | 미설정 (`brew install redis` 후 `redis://localhost:6379`) |
| `SUPABASE_DB_PASSWORD` | `apps/server/.env` — Supabase DB 직접 접속용 비밀번호 (IPv6 환경에선 DNS 불가) |
| `SUPABASE_DB_HOST` | `apps/server/.env` — `db.dqlqaleukqswrkzzqkng.supabase.co` |
| `SUPABASE_PAT` | `apps/server/.env` — Management API Personal Access Token (마이그레이션 실행용) |

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어 git에 커밋되지 않음.
> 서버 재시작 전 항상 `apps/server/.env` 확인 필요.

### DB 마이그레이션 실행 방법

이 개발 환경은 IPv6 이슈로 `db.*.supabase.co` 직접 접속이 안 됨.
마이그레이션은 아래 방법 중 하나로 실행:

1. **Supabase 대시보드** → SQL Editor → SQL 붙여넣기
2. **Management API (PAT) 사용** ← 검증된 방법, Claude가 직접 실행 가능

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/dqlqaleukqswrkzzqkng/database/query" \
  -H "Authorization: Bearer {SUPABASE_PAT}" \
  -H "Content-Type: application/json" \
  -d '{"query": "여기에 SQL 입력"}'
```

- 응답 `[]` = 성공 (DDL은 빈 배열 반환)
- 응답 `[{...}]` = SELECT 결과
- PAT 위치: `apps/server/.env` → `SUPABASE_PAT`
- PAT 발급: [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)

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
