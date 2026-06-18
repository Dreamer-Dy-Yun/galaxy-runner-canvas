# src/engine/physics

## 역할

`src/engine/physics`는 충돌 후보 조회와 primitive overlap 계산을 제공한다.

## 파일 책임

- `collision-query.js`: 배열 또는 entity store에서 대상과 겹치는 첫 entity를 찾고 radius를 해석한다.

## 경계

- 이 폴더는 피해량, 점수, item pickup, boss armor 결과를 결정하지 않는다.
- 충돌 결과의 gameplay 의미는 `Game`, entity, system 계층에서 처리한다.
