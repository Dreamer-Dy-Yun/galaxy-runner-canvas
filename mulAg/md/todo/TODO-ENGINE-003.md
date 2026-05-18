# TODO-ENGINE-003: Scene lifecycle 및 input action mapping 분리

## 목적

Galaxy Runner 실행 단위를 scene으로 만들고, raw key 입력과 게임 명령을 분리한다.

## 작업 범위

- `src/engine/scenes/scene-manager.js`
- `src/engine/scenes/scene.js`
- `src/engine/input/input-state.js`
- `src/engine/input/action-map.js`
- `src/engine/input/input-controller.js` 또는 기존 `src/engine/input.js`
- `src/game/galaxy-runner-scene.js` 또는 현재 구조에 맞는 scene 파일
- 관련 문서 갱신

## 구현 방향

- scene은 `enter`, `update`, `draw`, `exit` 계약을 가진다.
- input engine은 key/button 상태와 pressed/held/released를 관리한다.
- Galaxy Runner는 action 이름(`fire`, `special`, `pause`, `restart`, `start`)을 읽어 규칙을 실행한다.
- canvas pointer 좌표 변환은 엔진 입력 계층이 제공한다.

## 제외할 내용

- weapon/special 동작 자체 변경
- HUD 레이아웃 변경
- World/EntityStore 분리

## 완료 기준

- 입력 계층이 `game.reset()` 같은 게임 전용 메서드를 직접 호출하지 않는다.
- Galaxy Runner scene이 입력 action을 소비한다.
- `node --check src/**/*.js` 검증 결과를 review에 기록한다.
- `REVIEW-ENGINE-003.md`를 작성한다.
