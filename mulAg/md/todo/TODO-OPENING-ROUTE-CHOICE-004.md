# TODO: 기본 기체 오프닝과 기체 노선 선택 통합

## 목적

Ready 선택을 제거하고 기본 기체 출격, 안전한 4종 선택, route lock을 구현하며 첫 선택을 공통 rig animation request로 연결한다.

## 참조 plan

- `mulAg/md/plan/active/PLAN-2026-07-16-opening-player-animation-redesign.md`

## 작업 범위

- `baseLaunch -> routeChoice -> combat` run phase
- ready 시작 기체 선택 UI/입력 제거
- 고정 4종 선택 아이템 생성·보존·나머지 제거
- 선택 이후 weapon drop/morph의 route lock
- Restart 선택 제거, Continue 선택 보존
- Player adapter 생성/update/첫 조립 request 연결
- classic script 순서와 gameplay docs/tests 갱신

## 실행 조건

- TODO-003이 QA 승인되어 Player adapter 공개 API가 고정되어야 한다.
- run/session/collectible/loop은 기존 하드닝 범위이므로 사용자의 명시적 수정 승인이 필요하다.
- TODO-003과 동시에 실행하지 않는다.

## 수정 가능한 파일

- `src/gameplay/run-rules.js`
- `src/systems/game-session-system.js`
- `src/systems/collectible-lifecycle-system.js`
- `src/entities/collectible-item.js`
- `src/systems/game-loop-system.js`
- `src/engine/game.js`
- `src/ui/game-overlay.js`
- `src/ui/README.md`
- `docs/GAMEPLAY_SYSTEMS.md`
- `docs/PROJECT_STRUCTURE.md`
- `galaxy-runner.html`
- `tests/session-input.test.mjs`
- `tests/browser-smoke.mjs`

## 생성 가능한 파일

- `tests/opening-route-choice.test.mjs`
- `mulAg/md/review/REVIEW-OPENING-ROUTE-CHOICE-004.md`

## 읽기 전용 파일

- `src/engine/animation/**`
- `src/engine/rendering/rig-animation-renderer.js`
- `src/systems/player-rig-animation-adapter.js`
- `src/systems/player-progression-system.js`
- `src/entities/player.js`
- `src/renderers/player-renderer.js`
- `src/gameplay/player-rig-catalog.js`
- 참조 plan

## 수정 금지 파일

- `src/engine/animation/**`
- `src/engine/rendering/rig-animation-renderer.js`
- `src/entities/player.js`
- `src/systems/player-progression-system.js`
- `src/renderers/player-renderer.js`
- `assets/**`

## 입력

- 입력 파일: run/session/collectible/loop 현재 계약, 승인된 Player adapter API
- 입력 데이터 구조: run phase, selectedWeaponKind, progression result
- 참조해야 할 함수/클래스: `GameSessionSystem`, `CollectibleLifecycleSystem`, `PlayerRigAnimationAdapter`
- 변경하지 말아야 할 인터페이스: Continue의 score/time/danger/upgrades 보존, 방어/특수기 계약

## 출력

- 생성/수정 파일: opening/route lock 구현, UI, script order, tests/docs
- 반환 형식: 명시적 run phase와 선택된 route 상태
- 외부에서 참조할 상태: `runPhase`, `selectedWeaponKind`
- 유지해야 할 인터페이스: action mapping, Restart/Continue 진입 방식

## 작업 단계

- [x] 1. ready 시작 무기 선택과 관련 테스트/UI를 제거한다.
- [x] 2. baseLaunch timer와 routeChoice spawn gate를 구현한다.
- [x] 3. 고정 4종 선택 아이템과 나머지 제거를 구현한다.
- [x] 4. 일반 weapon drop/morph를 선택 노선으로 제한한다.
- [x] 5. 첫 선택을 Player adapter `start()` request로 전달한다.
- [x] 6. Restart/Continue와 classic script/browser 계약을 검증한다.

## 완료 기준

- Space 후 기본 기체가 지정 시간 동안 표시된다.
- 선택 전 적/일반 아이템이 spawn되지 않는다.
- 선택 아이템은 만료/morph되지 않고 하나 선택 시 나머지 세 개가 제거된다.
- 이후 다른 기체의 일반 weapon item이 등장하지 않는다.
- 첫 조립 연출도 공통 engine API를 사용한다.
- Restart와 Continue가 문서·테스트와 일치한다.
- 전체 test/build/browser/soak가 통과한다.

## 주의사항

- opening 전용 animation timer를 만들지 않는다.
- route lock은 item 표시만 숨기는 것이 아니라 후보 생성 계약을 제한해야 한다.
- `game.js`는 300라인을 넘기지 않도록 adapter 조립 책임을 별도 helper에 둔다.
