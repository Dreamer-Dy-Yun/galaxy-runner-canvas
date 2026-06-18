# src/engine/input

## 역할

`src/engine/input`은 raw keyboard code를 game action 이름으로 매핑하고, frame 단위 입력 상태를 제공한다.

## 파일 책임

- `action-map.js`: `moveLeft`, `fire`, `special`, `pause` 같은 action과 raw key code의 연결.
- `input-state.js`: 눌림/해제/axis 상태를 action 기준으로 조회하는 상태 저장소.

## 경계

- 이 폴더는 Galaxy Runner의 발사 주기, 특수기 cost, 이동 속도를 결정하지 않는다.
- game layer는 가능한 `isDown("fire")`, `axis("moveLeft", "moveRight")`처럼 action 이름을 사용한다.
- 새 입력 장치를 붙일 때도 raw code 의미를 game entity에 누출하지 않는다.
