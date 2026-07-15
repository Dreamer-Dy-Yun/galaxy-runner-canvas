# TODO-P1-RUN-CONTRACT-001: 시작·Continue·방어 계약

## 목적

첫 무기 경험을 보장하고 Assist Continue와 방어 계산을 코드·화면·문서의 단일 계약으로 맞춘다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 작업 범위

- ready 시작 무기 선택과 Restart 전이
- 보존형 Assist Continue 표시
- flat cap과 최소 HP 피해를 포함한 방어 계산 추출
- HUD, overlay, 도움말, gameplay 문서 동기화

## 선행 조건

- 사용자 P1/P2 수정·배포 허가 완료
- P0 runtime hardening 완료

## 수정 가능 파일

- `src/core/constants.js`
- `src/entities/player.js`
- `src/engine/input/action-map.js`
- `src/systems/game-session-system.js`
- `src/ui/game-overlay.js`
- `src/ui/game-hud.js`
- `src/gameplay/game-config.js`
- `src/gameplay/game-info.js`
- `src/engine/game.js`
- `galaxy-runner.html`
- `docs/GAMEPLAY_SYSTEMS.md`
- `README.md`
- `src/gameplay/README.md`
- `src/systems/README.md`
- `src/ui/README.md`
- `src/entities/README.md`
- `docs/PROJECT_STRUCTURE.md`

## 생성 가능 파일

- `src/gameplay/run-rules.js`
- `src/gameplay/player-defense-rules.js`
- `src/systems/player-defense-system.js`
- `src/systems/player-progression-system.js`
- `src/ui/loadout-selector.js`
- `mulAg/md/review/REVIEW-P1-RUN-CONTRACT-001.md`

## 읽기 전용 파일

- `src/gameplay/weapon-catalog.js`
- `src/gameplay/weapon-definitions.js`
- `src/systems/weapon-system.js`
- `tests/**`
- `scripts/**`
- `.github/**`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- `src/entities/enemy.js`
- `src/engine/runtime/**`
- `src/engine/debug/**`
- 위 목록에 없는 기존 파일

## 출력

- 시작 무기 선택과 Assist Continue의 명시적 상태 전이
- 순수 방어 계산 snapshot과 Player delegate
- 화면·도움말·문서가 사용하는 동일한 계약

## 작업 단계

- [x] 1. run/defense 공개 계약을 생성한다.
- [x] 2. session과 Player를 계약에 연결한다.
- [x] 3. ready/Continue/HUD UI를 수정한다.
- [x] 4. 문서와 폴더 책임을 갱신한다.
- [x] 5. review에 diff와 검증 결과를 기록한다.

## 완료 기준

- 첫 start에서 선택한 무기만 level 1이다.
- Restart는 선택을 보존하고 ready로 돌아간다.
- Continue는 진행 보존과 Assist 의미를 화면에 표시한다.
- 방어 flat cap 10.5와 최소 1 HP 피해가 계산·HUD·문서에서 일치한다.
