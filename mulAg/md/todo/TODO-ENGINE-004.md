# TODO-ENGINE-004: World, EntityStore, Collision Query 도입

## 목적

탄환, 적, 아이템, 파티클 등 entity 배열 관리와 충돌 query를 공통 엔진 helper로 분리한다.

## 작업 범위

- `src/engine/world/world.js`
- `src/engine/world/entity-store.js`
- `src/engine/world/entity-groups.js`
- `src/engine/physics/collision-query.js`
- 기존 `src/core/collision.js` 또는 충돌 helper 위치 정리
- 필요 시 `src/engine/game.js` 또는 `src/game/galaxy-runner-scene.js`
- 관련 문서 갱신

## 구현 방향

- `World`는 group별 entity store를 관리한다.
- `EntityStore`는 add, remove, unordered remove, compact, update iteration을 담당한다.
- collision primitive는 범용 함수로 유지하고, 충돌 의미는 게임 시스템이 담당한다.
- Energy absorb, Nova mine, item pickup 같은 Galaxy Runner 규칙은 엔진으로 올리지 않는다.

## 제외할 내용

- ECS 전면 도입
- 게임 밸런스 변경
- rendering helper 분리

## 완료 기준

- 최소 하나 이상의 entity group이 `EntityStore`를 통해 관리된다.
- 기존 제거 정책(`removeAtUnordered`, compact tail 등)이 공통 helper로 정리된다.
- `node --check src/**/*.js` 검증 결과를 review에 기록한다.
- `REVIEW-ENGINE-004.md`를 작성한다.
