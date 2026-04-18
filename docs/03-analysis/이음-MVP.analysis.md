# Gap Analysis — 이음-MVP

> 분석일: 2026-04-19
> Design: `docs/02-design/features/이음-MVP.design.md`
> 구현: `apps/server/src/` + `apps/mobile/app/` + `apps/mobile/src/`

---

## 종합 결과

**Match Rate: 87%** — 전반적으로 높은 일치율. 핵심 데이터 모델, API, 화면 모두 구현됨. 일부 컴포넌트 누락 및 마일스톤 키 불일치(버그) 발견.

| 카테고리 | 점수 | 상태 |
|---------|:---:|:---:|
| API 엔드포인트 | 86% | ✅ |
| 데이터 모델 | 100% | ✅ |
| 화면 구현 | 86% | ✅ |
| 컴포넌트 구조 | 60% | ⚠️ |
| AI 파이프라인 | 75% | ⚠️ |
| 폴더/훅 구조 | 83% | ✅ |
| 인증 플로우 | 90% | ✅ |
| **전체** | **87%** | ✅ |

---

## 미구현 항목 (Design O, Impl X)

| 항목 | 설계 위치 | 설명 |
|------|---------|------|
| `POST /auth/logout` 서버 라우트 | API §3.1 | 클라이언트 `api.auth.logout()` 존재하나 서버 핸들러 없음 |
| `/diary/[id]/edit` 라우트 | 화면 §4.1 | 편집 기능이 detail 화면 내 인라인 state로 구현됨 |
| `/child/[id]/edit` 라우트 | 화면 §4.1 | 미구현. 서버 PATCH는 존재하나 클라이언트 미사용 |
| `PhotoGrid.tsx` 컴포넌트 | 구조 §6 | `upload.tsx` 내 FlatList로 인라인 처리 |
| `ChildAvatar.tsx` 컴포넌트 | 구조 §6 | `profile.tsx` 내 인라인 처리 |
| `useChild.ts` 훅 | 훅 §6 | Zustand store + `api.children.list()` 직접 호출로 대체 |
| `lib/utils/milestone.ts` (클라이언트) | 구조 §6 | 로직이 `milestones.tsx` / `MilestoneCard.tsx`에 분산 |
| AI 파이프라인 Step 2: 서버 EXIF 파싱 | 파이프라인 §5.1 | 클라이언트 `upload.tsx`에서 EXIF 추출 (서버 미사용) |
| AI 파이프라인 Step 8: Supabase Realtime 알림 | 파이프라인 §5.1 | 클라이언트 3초 polling만 사용 |
| 배치 처리 (같은 날 3장+ → 단일 Claude 호출) | §5.3 | 각 사진 개별 처리 중 |
| `ai_analysis` JSONB 저장 | 데이터모델 §2.2 | 컬럼 존재하나 워커에서 미작성 |

---

## 불일치 항목 (Design ≠ Implementation)

| 항목 | 설계 | 구현 | 영향도 |
|------|-----|------|:---:|
| **두 돌 마일스톤 키** | `2nd_year` | 서버: `2nd_year`, 클라이언트: `idol` | 🔴 HIGH |
| 타임라인 엔드포인트 경로 | `GET /timeline/:child_id` | `GET /diary/timeline/:childId` | 🟡 LOW |
| 회원가입 플로우 | 서버 `POST /auth/signup` 경유 | `supabase.auth.signUp()` 직접 호출 | 🟡 MEDIUM |
| 로그인 플로우 | 서버 `POST /auth/login` 경유 | `supabase.auth.signInWithPassword()` 직접 호출 | 🟡 MEDIUM |
| 다중 아이 전환 UI | `[아이 선택▼]` 드롭다운 | `onPress={() => {}}` 미구현 | 🟡 MEDIUM |

---

## 수정 우선순위

### 즉시 수정 (정합성 버그)

1. **두 돌 마일스톤 키 통일** — `MilestoneCard.tsx:8` `idol` → `2nd_year` 변경
   - `apps/mobile/src/components/MilestoneCard.tsx`
   - `apps/mobile/app/(tabs)/milestones.tsx` (EXPECTED_MILESTONES 배열)
2. **Auth 전략 확정** — 서버 auth 라우트 제거 OR 클라이언트를 서버 경유로 통일
3. **`POST /auth/logout`** 서버 구현 또는 `api.ts`에서 제거

### 단기 (기능 완성도)

4. `/child/[id]/edit` 화면 추가 (서버 PATCH 이미 존재)
5. 다중 아이 전환 드롭다운 구현 (`timeline.tsx:38`)
6. `ai_analysis` JSONB 저장 구현 또는 컬럼 제거 결정

### 장기 (성능/비용)

7. 같은 날 사진 배치 처리 구현 → $0.005/diary 목표 달성
8. Supabase Realtime 구독 추가 (polling 병행)

---

## 설계 문서 업데이트 필요

- §3.4 타임라인 경로: `/timeline/:child_id` → `/diary/timeline/:childId`
- §5.1 Step 2: 서버 EXIF → 클라이언트 EXIF로 수정
- §5.1 Step 8: Realtime → Polling으로 수정
- 인증: Supabase 클라이언트 SDK 직접 사용으로 명시
