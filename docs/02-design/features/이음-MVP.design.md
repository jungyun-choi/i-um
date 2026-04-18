# 이음(i-um) MVP — Design Document

> Plan 참조: `docs/01-plan/features/이음-MVP.plan.md`
> 작성일: 2026-04-19

---

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│                   Client (iOS)                   │
│          React Native + Expo Router              │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / REST
┌────────────────────▼────────────────────────────┐
│               API Server (Node.js)               │
│  Express + Supabase SDK + Bull Queue             │
└──────┬─────────────┬──────────────┬─────────────┘
       │             │              │
┌──────▼───┐  ┌──────▼────┐  ┌─────▼──────────────┐
│ Supabase │  │  AWS S3   │  │   Claude API        │
│ (DB+Auth)│  │ (사진 저장) │  │ (멀티모달 일기 생성) │
└──────────┘  └───────────┘  └────────────────────┘
```

### 1.2 데이터 흐름 (AI 일기 생성)

```
[사진 선택] → [S3 업로드] → [분석 큐 등록]
                                  ↓
                         [Worker: EXIF 추출]
                                  ↓
                    [Claude API: 사진 + 메타데이터]
                                  ↓
                         [일기 텍스트 생성]
                                  ↓
                    [DB 저장 + 클라이언트 알림]
```

---

## 2. 데이터 모델

### 2.1 ERD (핵심 테이블)

```
users
  id          uuid PK
  email       text UNIQUE
  created_at  timestamptz

children
  id           uuid PK
  user_id      uuid FK → users
  name         text
  birth_date   date
  gender       text ('M'|'F'|'N')
  avatar_url   text
  created_at   timestamptz

photos
  id             uuid PK
  child_id       uuid FK → children
  user_id        uuid FK → users
  s3_key         text
  taken_at       timestamptz        -- EXIF 기반
  gps_lat        float
  gps_lng        float
  location_name  text               -- reverse geocoding
  ai_analysis    jsonb              -- 얼굴, 감정, 장소, 맥락
  created_at     timestamptz

diary_entries
  id          uuid PK
  photo_id    uuid FK → photos
  child_id    uuid FK → children
  content     text                  -- AI 생성 또는 사용자 편집
  is_edited   boolean DEFAULT false
  milestone   text                  -- 'baekil'|'dol'|'first_step' 등
  status      text ('pending'|'generating'|'done'|'failed')
  created_at  timestamptz
  updated_at  timestamptz

milestones
  id          uuid PK
  child_id    uuid FK → children
  type        text                  -- 'baekil'|'dol'|'first_word' 등
  date        date
  photo_id    uuid FK → photos
  diary_id    uuid FK → diary_entries
  created_at  timestamptz
```

### 2.2 ai_analysis JSONB 스키마

```json
{
  "faces": [
    { "role": "child", "emotion": "happy", "age_estimate": "infant" },
    { "role": "parent", "emotion": "smiling" }
  ],
  "scene": "outdoor_park",
  "season": "spring",
  "objects": ["stroller", "flowers"],
  "context_summary": "공원에서 유모차를 타고 봄 나들이"
}
```

---

## 3. API 명세

### 3.1 인증

```
POST /auth/signup
  body: { email, password }
  res:  { user, session }

POST /auth/login
  body: { email, password }
  res:  { user, session }

POST /auth/logout
  headers: Authorization: Bearer {token}
```

### 3.2 아이 프로필

```
POST /children
  body: { name, birth_date, gender }
  res:  { child }

GET /children
  res: [ child ]

PATCH /children/:id
  body: { name?, birth_date?, gender?, avatar_url? }
  res:  { child }
```

### 3.3 사진 업로드 & 일기 생성

```
POST /photos/upload-url
  body: { child_id, filename, taken_at?, gps_lat?, gps_lng? }
  res:  { upload_url, photo_id }
  -- S3 presigned URL 반환, 클라이언트가 직접 S3에 PUT

POST /photos/:id/process
  -- S3 업로드 완료 후 호출 → AI 분석 큐 등록
  res: { status: 'queued' }

GET /photos/:id/diary
  -- polling or SSE로 생성 완료 확인
  res: { diary_entry }
```

### 3.4 타임라인 & 일기

```
GET /timeline/:child_id
  query: { cursor?, limit=20 }
  res:   { entries: [{ photo, diary, milestone? }], next_cursor }

GET /diary/:id
  res: { diary_entry }

PATCH /diary/:id
  body: { content }
  res:  { diary_entry }  -- is_edited: true
```

### 3.5 마일스톤

```
GET /milestones/:child_id
  res: [ milestone ]
```

---

## 4. 화면 설계

### 4.1 화면 목록

```
(인증)
  /auth/welcome        -- 온보딩 첫 화면
  /auth/signup         -- 가입
  /auth/login          -- 로그인

(메인)
  /(tabs)/timeline     -- 타임라인 피드 (홈)
  /(tabs)/milestones   -- 마일스톤 목록
  /(tabs)/profile      -- 아이 프로필 + 설정

(기능)
  /upload              -- 사진 선택 + 업로드
  /diary/[id]          -- 일기 상세 (사진 + 텍스트)
  /diary/[id]/edit     -- 일기 편집
  /child/new           -- 아이 프로필 생성
  /child/[id]/edit     -- 아이 프로필 수정
```

### 4.2 핵심 화면 와이어프레임

#### Welcome / Onboarding
```
┌─────────────────────────┐
│                         │
│    [이음 로고]           │
│                         │
│  "사진만 찍으면          │
│   AI가 일기를 써드려요"  │
│                         │
│  [시작하기]             │
│  [로그인]               │
└─────────────────────────┘
```

#### 타임라인 (홈)
```
┌─────────────────────────┐
│  이음  [아이 선택▼]  [+] │
├─────────────────────────┤
│  ── 2026년 4월 ──        │
│ ┌───────────────────┐   │
│ │ [사진 썸네일]      │   │
│ │ 4월 15일 · 공원    │   │
│ │ "민준이가 처음으로  │   │
│ │  잔디를 밟았어요." │   │
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │ [사진 썸네일]  🎉  │   │  ← 마일스톤 뱃지
│ │ 4월 10일 · 100일   │   │
│ │ "오늘 민준이의     │   │
│ │  백일이에요..."    │   │
│ └───────────────────┘   │
└─────────────────────────┘
```

#### 사진 업로드
```
┌─────────────────────────┐
│  ← 취소     사진 추가    │
├─────────────────────────┤
│  [사진 그리드 선택기]    │
│  □ □ □ □               │
│  □ □ □ □               │
│  □ □ □ □               │
│                         │
│  선택됨: 3장            │
│  [AI 일기 생성하기]      │
└─────────────────────────┘
```

#### 일기 생성 중 / 완료
```
┌─────────────────────────┐
│  ←        2026.04.15    │
├─────────────────────────┤
│  [사진 풀스크린]         │
│                         │
├─────────────────────────┤
│  공원 · 봄              │
│                         │
│  "오늘은 민준이가        │
│  처음으로 잔디밭을       │
│  밟아본 날이에요.        │
│  신기한 듯 발가락을      │
│  꼼지락거리며..."        │
│                         │
│           [편집]        │
└─────────────────────────┘
```

#### 마일스톤
```
┌─────────────────────────┐
│  민준이의 특별한 순간    │
├─────────────────────────┤
│  🎂 백일  2026.04.10    │
│  [사진 썸네일]           │
│                         │
│  👣 첫걸음  (예정)       │
│  ─ 아직 기록되지 않음 ─  │
│                         │
│  🎉 돌     (예정)        │
│  2027.01.10 (D-266)     │
└─────────────────────────┘
```

---

## 5. AI 일기 생성 파이프라인

### 5.1 처리 흐름

```
photos/process 요청
    ↓
Bull Queue → Worker 실행
    ↓
[Step 1] S3에서 이미지 다운로드
    ↓
[Step 2] EXIF 파싱 (날짜, GPS)
    ↓
[Step 3] GPS → 장소명 변환 (reverse geocoding)
    ↓
[Step 4] 아이 나이 계산 (birth_date 기준)
    ↓
[Step 5] 마일스톤 체크 (백일/돌 해당 여부)
    ↓
[Step 6] Claude API 호출 (이미지 + 컨텍스트)
    ↓
[Step 7] diary_entries 저장 (status: 'done')
    ↓
[Step 8] 클라이언트 알림 (Supabase Realtime)
```

### 5.2 Claude API 프롬프트

```
시스템 메시지:
당신은 한국 부모를 위해 육아 일기를 써주는 AI입니다.
따뜻하고 감성적인 한국어로, 마치 부모가 직접 쓴 것처럼 자연스럽게 작성하세요.

사용자 메시지:
[아이 정보]
- 이름: {child_name}
- 현재 나이: {age_text} (생후 {days}일)
{if milestone}: - 오늘은 특별한 날: {milestone_description}

[사진 촬영 정보]
- 날짜: {date_formatted}
- 장소: {location_name or '알 수 없음'}

첨부 사진을 보고, 이 날의 육아 일기를 2~3문단으로 써주세요.
- 사진 속 상황을 구체적으로 묘사하세요
- 아이의 표정/행동에서 느껴지는 감정을 담아주세요
- {child_name}(이/가)로 자연스럽게 언급하세요
- 150~250자 내외
```

### 5.3 배치 처리 (비용 최적화)

- 같은 날 찍힌 사진 3장 이상: 하나의 Claude API 호출로 처리
- 프롬프트 캐싱: 시스템 메시지 캐시 (`cache_control: ephemeral`)
- 예상 비용: 일기 1건당 ~$0.008 (캐싱 적용 시 ~$0.005)

---

## 6. 컴포넌트 구조

```
src/
├── app/                          # Expo Router 페이지
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── signup.tsx
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── timeline.tsx          # 홈
│   │   ├── milestones.tsx
│   │   └── profile.tsx
│   ├── upload.tsx
│   ├── diary/
│   │   ├── [id].tsx
│   │   └── [id]/edit.tsx
│   └── child/
│       ├── new.tsx
│       └── [id]/edit.tsx
│
├── components/
│   ├── DiaryCard.tsx             # 타임라인 카드
│   ├── PhotoGrid.tsx             # 사진 선택 그리드
│   ├── MilestoneCard.tsx         # 마일스톤 아이템
│   ├── DiaryGenerating.tsx       # 생성 중 로딩
│   └── ChildAvatar.tsx
│
├── hooks/
│   ├── useTimeline.ts            # React Query
│   ├── useDiaryGeneration.ts     # 생성 상태 polling
│   └── useChild.ts
│
├── lib/
│   ├── supabase.ts               # Supabase 클라이언트
│   ├── api.ts                    # API 호출 함수
│   └── utils/
│       ├── age.ts                # 나이 계산
│       └── milestone.ts          # 마일스톤 판별
│
└── stores/
    └── childStore.ts             # 선택된 아이 Zustand store

server/
├── routes/
│   ├── auth.ts
│   ├── children.ts
│   ├── photos.ts
│   ├── diary.ts
│   └── milestones.ts
├── workers/
│   └── diaryWorker.ts            # Bull Queue Worker
├── services/
│   ├── claudeService.ts          # Claude API 래퍼
│   ├── s3Service.ts              # S3 업로드/다운로드
│   └── geocodingService.ts       # GPS → 장소명
└── middleware/
    └── auth.ts                   # Supabase JWT 검증
```

---

## 7. 마일스톤 판별 로직

```typescript
const MILESTONES = [
  { type: 'baekil',   days: 100,  label: '백일' },
  { type: 'dol',      days: 365,  label: '돌잔치' },
  { type: '2nd_year', days: 730,  label: '두 돌' },
];

function checkMilestone(birthDate: Date, photoDate: Date) {
  const days = differenceInDays(photoDate, birthDate);
  // ±3일 범위에서 마일스톤 감지
  return MILESTONES.find(m => Math.abs(m.days - days) <= 3) ?? null;
}
```

---

## 8. 기술적 결정 사항

| 결정 | 선택 | 근거 |
|------|------|------|
| 사진 업로드 방식 | Presigned URL (클라이언트 → S3 직접) | 서버 부하 최소화 |
| 일기 생성 방식 | 비동기 Queue (Bull) | 30초 이상 걸릴 수 있어 동기 불가 |
| 실시간 알림 | Supabase Realtime | 추가 인프라 없이 간단 구현 |
| 다중 사진 처리 | 날짜별 배치 → 단일 API 호출 | API 비용 최적화 |
| 장소 정보 | Kakao Maps API (한국 특화) | 한국 주소/장소명 품질 |

---

## 9. 구현 순서 (Phase 1 기준)

1. Supabase 프로젝트 + DB 스키마 생성
2. Node.js API 서버 셋업 (Express + Supabase SDK)
3. S3 버킷 + presigned URL 엔드포인트
4. React Native 프로젝트 초기화 (Expo)
5. 인증 화면 (signup/login)
6. 아이 프로필 생성 화면
7. 사진 선택 + S3 업로드 UI
8. Bull Queue + diaryWorker 구현
9. Claude API 통합 (diaryWorker 내부)
10. 일기 결과 화면 (polling + Realtime)
11. 타임라인 피드 UI

---

## 참고
- Plan: `docs/01-plan/features/이음-MVP.plan.md`
- 시장조사: `wiki/analysis/competitor-comparison.md`
- 차별성: `wiki/topics/ium-differentiation.md`
