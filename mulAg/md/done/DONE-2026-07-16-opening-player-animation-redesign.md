# DONE: 기본 기체 오프닝과 공통 Rig 애니메이션 엔진

## 완료 일시

2026-07-16

## 완료 범위

- Ready 선택을 제거하고 `baseLaunch -> routeChoice -> combat` 제품 흐름을 적용했다.
- 1초 기본 기체 표시 뒤 Rapid, Energy, Spread, Nova 고정 선택 아이템을 제공하고 route를 잠갔다.
- 기존 final-form 40장을 승인된 settled 정본으로 그대로 유지했다.
- Base 4개와 네 노선 transition-only part 17개를 생성·등록했다.
- 공통 `RigAnimationEngine`이 part diff, phase, detach/attach, target settle, fallback과 pose lifecycle을 처리한다.
- 좌우 이동의 전체 이미지 skew/비균일 scale을 제거하고 rigid bank enter/reverse/pause/return을 적용했다.
- 강화 lifecycle의 frozen `rigChange`가 same-route detach/attach transition을 시작한다.

## QA 결과

- Node/static: 76/76 PASS, classic script 61개 순서 검증
- Python asset pipeline: 16/16 PASS
- final lifecycle-doc build: 190 files, 15,585,765 bytes
- browser smoke: PASS
- seeded soak: 12초 PASS, entity high-water 33, final 11
- independent QA: `REVIEW-RIG-ANIMATION-QA-005.md` PASS
- 신규 code 23개 모두 300라인 이하, engine/test 최대 300라인
- final-form diff 0, runtime rig 21개 모두 512×512 RGBA와 4면 투명 alpha 계약 충족

## 배포 결과

- 구현 commit: `f2cfaceb5a9e52c748240db9a919af0ef867d7e9`
- feature branch: `codex/rig-animation-engine`
- feature Pages run: `29469336137`, success
- main fast-forward 병합 후 Pages run: `29469442296`, success
- live: `https://dreamer-dy-yun.github.io/galaxy-runner-canvas/galaxy-runner.html?v=f2cface-main`
- live 확인: HTML 200, 새 pose module 참조, 삭제된 loadout selector 미참조, Rapid part 200

## 배포 보호 규칙 처리

- 최초 feature run `29469285897`은 `github-pages` environment가 main만 허용해 job 시작 전에 거절됐다.
- `codex/rig-animation-engine` exact branch policy만 임시 추가해 feature 배포를 수행했다.
- feature 성공 직후 임시 policy를 제거했으며 최종 environment 허용 policy는 다시 `main` 하나다.

## 비차단 후속

- 12초 soak는 배포 gate이며 장시간 memory/performance 인증은 아니다.
- GitHub Actions의 일부 v4 action에는 Node.js 20 deprecation warning이 남지만 run은 Node.js 24 강제 실행으로 성공했다.
- 기존 대형 `player.js`와 `game-config.js`의 전체 분리는 별도 하드닝 범위다. 이번 작업에서는 두 파일 모두 순감소했다.
