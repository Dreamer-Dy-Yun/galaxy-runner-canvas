# REVIEW-ENGINE-004

## Scope

- TODO-ENGINE-004: World, EntityStore, Collision Query 도입.
- Galaxy Runner 고유 규칙은 `Game`에 남기고, 엔진 계층은 저장소/그룹/충돌 조회 helper만 담당하도록 경계를 잡았다.

## 변경 요약

- `src/engine/world/entity-store.js`: 배열 압축(`compactKeptTail`)과 순서 무관 삭제(`removeAtUnordered`) 정책을 공통 helper로 이동하고, 인스턴스형 entity store를 추가했다.
- `src/engine/world/entity-groups.js`: World에서 사용하는 범용 group 이름을 정의했다.
- `src/engine/world/world.js`: group 이름별 `EntityStore`를 소유하는 World 컨테이너를 추가했다.
- `src/engine/physics/collision-query.js`: 원형 충돌 overlap과 collection 내 첫 overlap 조회를 공통화했다.
- `src/engine/game.js`: 기존 배열 속성은 유지하되 World/EntityStore backing array로 연결했고, 삭제/압축 정책과 일부 원형 충돌 판정은 엔진 helper를 사용하도록 변경했다.
- `src/main.js`: Game 생성 전에 새 엔진 helper들이 로드되도록 runtime loader 목록을 갱신했다.

## 경계 기록

- Energy absorb, Nova mine, item pickup, 점수/스테이지/보스 카운트 같은 Galaxy Runner 의미는 엔진으로 올리지 않았다.
- `CollisionQuery`는 충돌 결과의 의미를 판단하지 않고 overlap 조회만 반환한다.
- `World`는 group store 소유까지만 담당하며 spawn, damage, collect, detonate 같은 게임 규칙을 호출하지 않는다.

## 문서 갱신 필요 사항

- 엔진 구조 문서가 있다면 `src/engine/world/*`와 `src/engine/physics/collision-query.js` 역할을 추가해야 한다.
- `src/main.js` 런타임 로더가 엔진 기반 helper를 Game 생성 전에 보장한다는 점을 구조 문서에 반영해야 한다.
- `src/engine/game.js`는 여전히 300라인을 크게 초과한다. 이번 작업 범위를 넘는 분리 대상이며, 향후 장면 orchestration, entity update loop, HUD/overlay draw 책임 분리가 필요하다.
