# REVIEW-ENGINE-003

## 작업 범위

- TODO-ENGINE-003: Scene lifecycle 및 input action mapping 분리.
- 직접 수정 파일: `src/engine/scenes/scene.js`, `src/engine/scenes/scene-manager.js`, `src/engine/input/input-state.js`, `src/engine/input/action-map.js`, `src/engine/input.js`, `src/main.js`, `src/engine/game.js`.
- 문서 본문은 크게 갱신하지 않고, 필요한 후속 문서 갱신사항은 이 리뷰에 기록했다.

## 관련 이벤트 리스트

- `keydown`: raw `KeyboardEvent.code`를 action 이름으로 변환한다.
- `keyup`: raw key down 상태를 해제하고 action release 상태를 갱신한다.
- `restartButton.click`: `restart` action으로 발행한다.
- `canvas.click`: `info` action으로 발행한다.
- `runtime.frame`: `SceneManager`가 현재 scene에 frame을 전달한다.

## 이벤트 흐름

- `InputController.handleKeyDown`은 `ActionMap`과 `InputState`를 통해 raw code를 `start`, `restart`, `pause`, `fire`, `special`, 이동 action으로 변환한다.
- `InputController`는 더 이상 `game.reset`, `game.start`, `game.togglePause`, `game.handleCanvasClick`을 직접 호출하지 않고 `target.handleAction(actionEvent)`만 호출한다.
- `Game.handleAction`은 현재 최소 범위에서 `start`, `restart`, `pause`, `info`를 소비한다.
- `fire`, `special`, 이동 action은 `InputState.isDown(actionName)`으로 조회할 수 있도록 준비했으나, 기존 게임 동작 보존을 위해 플레이어/스페셜 시스템의 raw code 조회는 이번 범위에서 강제로 바꾸지 않았다.
- `main.js`는 새 scene/input 모듈 로딩을 보장하고, `Game`을 `SceneManager`에 등록한 뒤 `EngineRuntime`에 manager를 전달한다.

## 문제점과 경계

- `src/engine/game.js`는 이미 300라인을 크게 초과하고 있어 AGENTS.md의 파일 크기 기준에 맞지 않는다.
- 플레이어 이동, 발사, 스페셜 소비는 아직 `src/entities/player.js`, `src/systems/special-system.js`에서 raw key 조회를 일부 사용한다.
- 해당 파일들은 이번 소유 파일 범위 밖이며, 기존 동작을 크게 바꾸지 않는 목표가 있어 이번 작업에서는 compatibility query를 유지했다.
- 새 `src/engine/scenes`와 `src/engine/input` 폴더 책임 설명은 `src/engine/README.md` 또는 하위 README에 반영이 필요하다.

## 수정 내용

- `Scene`: scene lifecycle 기본 계약(`enter`, `exit`, `pause`, `resume`, `handleAction`, `update`, `draw`, `frame`)을 추가했다.
- `SceneManager`: scene 등록, 전환, action forwarding, runtime frame forwarding을 담당한다.
- `ActionMap`: raw input code와 action 이름의 binding을 관리한다.
- `InputState`: raw code down 상태와 action-level `isDown`, `wasPressed`, `wasReleased`, `axis` query를 제공한다.
- `InputController`: DOM 이벤트를 action event로 변환하고 target에 전달하는 adapter로 역할을 좁혔다.
- `Game`: input action 소비 지점으로 `handleAction`을 추가하고 lifecycle 진입/종료 메서드를 갖췄다.

## 문서 갱신 필요사항

- `src/engine/README.md`: `src/engine/scenes/*`, `src/engine/input/*`의 현재 책임과 남은 raw input compatibility 경계를 기록해야 한다.
- `docs/ENGINE_ARCHITECTURE.md`: runtime이 `Game`을 직접 받던 구조에서 `SceneManager`를 통해 scene frame을 전달하는 구조를 반영해야 한다.
- 하드닝 기준상 `Game` 분리 계획이 필요하다. 특히 lifecycle, input action 소비, gameplay state, rendering 책임이 한 파일에 남아 있다.

## 검증

- 요청 검증 범위: 가능하면 `src/**/*.js`에 대한 `node --check`.
- 이 리뷰 작성 시점에는 아직 검증 명령을 실행하지 않았다.
