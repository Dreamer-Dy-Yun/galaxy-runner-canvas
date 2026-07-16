# TODO: Player Rig adapter와 renderer 경계 통합

## 목적

Player의 이동·강화 상태를 공통 `RigAnimationEngine` request로 변환하고, Player 전용 애니메이션 알고리즘 없이 렌더 경계를 정리한다.

## 참조 plan

- `mulAg/md/plan/PLAN-2026-07-16-opening-player-animation-redesign.md`

## 작업 범위

- progression result에 immutable from/to change snapshot 추가
- move axis와 progression result를 engine request로 변환하는 adapter
- Player ship draw 책임 추출과 generic rig renderer 연결
- 기존 global scale/skew 제거
- final-form fallback과 armor/shield/thruster draw order 유지

## 실행 조건

- TODO-001과 TODO-002가 QA 승인되어야 한다.
- `player-progression-system.js`와 `player.js`는 기존 하드닝 범위이므로 사용자의 명시적 수정 승인이 필요하다.
- TODO-004와 동시에 실행하지 않는다.

## 수정 가능한 파일

- `src/entities/player.js`
- `src/systems/player-progression-system.js`
- `src/renderers/player-renderer.js`
- `src/entities/README.md`
- `src/systems/README.md`
- `src/renderers/README.md`

## 생성 가능한 파일

- `src/systems/player-rig-animation-adapter.js`
- `src/renderers/player-rig-art.js`
- `tests/player-rig-animation.test.mjs`
- `mulAg/md/review/REVIEW-PLAYER-RIG-ADAPTER-003.md`

## 읽기 전용 파일

- `src/engine/animation/**`
- `src/engine/rendering/rig-animation-renderer.js`
- `src/gameplay/player-animation-profiles.js`
- `src/gameplay/player-rig-catalog.js`
- `assets/player/rig/**`
- `src/systems/game-loop-system.js`
- `src/engine/game.js`
- 참조 plan

## 수정 금지 파일

- `src/engine/**`
- `src/gameplay/**`
- `assets/**`
- `src/systems/game-session-system.js`
- `src/systems/collectible-lifecycle-system.js`
- `src/systems/game-loop-system.js`
- `src/engine/game.js`
- `src/ui/**`
- `galaxy-runner.html`

## 입력

- 입력 파일: engine 공개 계약, Player rig catalog/profile, 현재 Player/Progression/Renderer
- 입력 데이터 구조: progression result, `RigSnapshot`, engine frame snapshot
- 참조해야 할 함수/클래스: `RigAnimationEngine`, `RigAnimationRenderer`, `PlayerProgressionSystem`
- 변경하지 말아야 할 인터페이스: weapon damage/level/core, hitbox/footprint 계산

## 출력

- 생성/수정 파일: Player adapter, art provider, renderer/progression 경계, tests/docs
- 반환 형식: engine `TransitionRequest`와 read-only render input
- 외부에서 참조할 클래스: `PlayerRigAnimationAdapter`
- 유지해야 할 인터페이스: 기존 progression outcome 필드와 gameplay 즉시 확정

## 작업 단계

- [x] 1. progression result에 기존 필드를 유지한 채 from/to snapshot을 추가한다.
- [x] 2. adapter가 move/progression을 generic pose/start request로 변환하게 한다.
- [x] 3. Player의 ship draw 메서드를 renderer/art provider로 추출한다.
- [x] 4. scale/skew를 제거하고 generic renderer snapshot을 사용한다.
- [x] 5. fallback과 shield/thruster/armor draw 순서를 검증한다.
- [x] 6. feature-specific timer/phase 분기가 없는지 review한다.

## 완료 기준

- Player, progression, renderer에 detach/attach phase timer가 없다.
- Player adapter는 gameplay token을 engine snapshot/profile id로 변환할 뿐 animation을 계산하지 않는다.
- progression change snapshot은 immutable이며 기존 outcome과 호환된다.
- 전체 이미지에 non-uniform scale/skew를 적용하지 않는다.
- Player visual 책임이 추가되지 않고 `player.js`가 순감소한다.
- 관련 테스트와 전체 test/build가 통과한다.

## 주의사항

- engine 예외를 Player 분기문으로 우회하지 않는다.
- gameplay 상태는 animation 완료를 기다리지 않는다.
- 누락 asset fallback은 engine/art provider 계약을 사용한다.
