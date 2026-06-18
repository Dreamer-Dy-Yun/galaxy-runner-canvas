# src/engine/world

## 역할

`src/engine/world`는 entity group 저장소와 stable iteration helper를 담당한다.

## 파일 책임

- `entity-store.js`: entity 배열, add/remove/compact helper.
- `entity-groups.js`: Galaxy Runner에서 쓰는 group 이름 상수.
- `world.js`: group별 `EntityStore`를 관리하고 배열 접근을 제공한다.

## 경계

- world는 score, damage, drop, stage progression을 계산하지 않는다.
- group 이름은 game layer 의미를 담을 수 있지만, engine helper는 그 의미를 해석하지 않는다.
