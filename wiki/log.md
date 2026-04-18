# 이음 Wiki — 작업 이력

> append-only 로그. 기존 항목은 수정하지 않습니다.
> 파싱: `grep "^## \[" wiki/log.md | tail -5`

---

## [2026-04-19] ingest | 시장조사 완료 — 육아 기록 앱 경쟁사 10개 분석

- 조사 앱: FamilyAlbum, Tinybeans, Google Photos, Apple Photos, Glow Baby, 쑥쑥찰칵, 베이비타임, 베이비빌리, 23snaps, Lifecake(종료)
- 핵심 발견: AI 텍스트 서사 생성 앱 현재 시장에 없음 → 이음의 핵심 차별점
- 생성 페이지: entities/ 6개, topics/ 2개, analysis/ 1개
- 관련 페이지: [[wiki/analysis/competitor-comparison.md]], [[wiki/topics/ium-differentiation.md]], [[wiki/topics/market-landscape.md]]

## [2026-04-18] setup | LLM Wiki 초기 셋업 완료

- CLAUDE.md 스키마 작성
- wiki/ 디렉토리 구조 생성
- index.md, log.md, overview.md 초기화
- raw/, raw/assets/ 디렉토리 생성
- GitHub 저장소: https://github.com/jungyun-choi/i-um

## [2026-04-18] commit | feat: 개발 과정 자동 wiki 기록 설정

- 커밋: `d046102` by jy.choi
- 변경 파일 수: 2
  - .githooks/post-commit
  - CLAUDE.md
