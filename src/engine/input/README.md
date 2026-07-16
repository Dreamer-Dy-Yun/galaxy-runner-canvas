# src/engine/input

## 역할

`src/engine/input`은 raw keyboard code를 game action 이름으로 매핑하고, frame 단위 입력 상태를 제공한다. 포커스가 사라지거나 문서가 background로 전환되면 모든 입력 상태를 이 경계에서 초기화한다.

## 파일 책임

- `action-map.js`: 이동·발사·pause, `X/Ctrl` special, `I` info action과 raw key code의 연결. 숫자 1~4 ready 선택 action은 제거됐다.
- `input-state.js`: 눌림/해제/axis 상태를 action 기준으로 조회하는 상태 저장소.
- `../input.js`: DOM listener lifecycle, action dispatch, Canvas focus, blur/visibility reset.

## 경계

- 이 폴더는 Galaxy Runner의 발사 주기, 특수기 cost, 이동 속도를 결정하지 않는다.
- game layer는 가능한 `isDown("fire")`, `axis("moveLeft", "moveRight")`처럼 action 이름을 사용한다.
- 새 입력 장치를 붙일 때도 raw code 의미를 game entity에 누출하지 않는다.
- `blur` 또는 hidden `visibilitychange` 뒤에는 down/pressed/released 상태가 남지 않는다.
- `InputController.resetVersion()`은 blur, hidden, destroy reset마다 증가하며 gameplay latch가 즉시 재입력을 놓치지 않게 한다.
- `destroy()`는 key, blur, visibility listener를 대칭적으로 제거하고 마지막 입력 상태를 reset한다.
