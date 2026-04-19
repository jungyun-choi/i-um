---
title: Hermes Fabric — condition && style 크래시 패턴 수정
type: topic
created: 2026-04-20
updated: 2026-04-20
sources: []
tags: [hermes, fabric, new-architecture, bug-fix, react-native]
---

# Hermes Fabric — condition && style 크래시 패턴 수정

## 배경

Sprint #33에서 앱 전체를 검색해 Hermes(New Architecture) 환경에서 크래시를 일으키는 스타일 패턴 7건을 발견·수정했다.

## 문제 패턴

Expo SDK 54 + React Native New Architecture(Fabric + Hermes)에서 `StyleSheet` 배열 안에 `false`(불리언)가 들어오면 예외를 발생시킨다.

```tsx
// 위험: condition이 false이면 false가 배열에 포함됨
style={[styles.base, condition && styles.active]}
//                   ↑ false 가능 → Hermes 크래시

// 안전: null은 StyleSheet 배열에서 무시됨
style={[styles.base, condition ? styles.active : null]}
```

## 수정 목록

| 파일 | 수정 건수 | 수정 내용 |
|------|-----------|----------|
| `apps/mobile/app/(tabs)/timeline.tsx` | 2건 | `childItemActive`, `childItemTextActive` 조건 스타일 |
| `apps/mobile/app/upload.tsx` | 5건 | `pillActive`, `pillTextActive`(×2), `btnDisabled` 등 |

## 수정 예시

```tsx
// timeline.tsx — 아이 선택 피커
// Before
style={[styles.childItem, activeChild?.id === child.id && styles.childItemActive]}
// After
style={[styles.childItem, activeChild?.id === child.id ? styles.childItemActive : null]}

// upload.tsx — 일기 스타일 필
// Before
style={[styles.pill, style === 'emotional' && styles.pillActive]}
// After
style={[styles.pill, style === 'emotional' ? styles.pillActive : null]}

// upload.tsx — 업로드 버튼 disabled
// Before
style={[styles.uploadBtn, uploading && styles.btnDisabled]}
// After
style={[styles.uploadBtn, uploading ? styles.btnDisabled : null]}
```

## 이음 프로젝트 규칙 (CLAUDE.md 기억 항목)

> React Native Hermes + Fabric 환경에서 `condition && styles.X` 패턴은 금지.  
> 반드시 `condition ? styles.X : null` 를 사용한다.

## 구현 파일

- `apps/mobile/app/(tabs)/timeline.tsx`
- `apps/mobile/app/upload.tsx`

## 관련 페이지

- [[wiki/topics/dev-environment.md]]
