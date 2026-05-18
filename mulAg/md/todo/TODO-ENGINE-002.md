# TODO-ENGINE-002: Runtime, FrameClock, CanvasSurface 분리

## 목적

`Game`이 직접 소유한 canvas 초기화와 frame loop를 공통 엔진 런타임으로 분리한다.

## 작업 범위

- `src/engine/runtime/engine-runtime.js`
- `src/engine/runtime/frame-clock.js`
- `src/engine/runtime/canvas-surface.js`
- `src/main.js`
- 필요 시 `src/engine/game.js`
- 관련 문서: `docs/ENGINE_ARCHITECTURE.md`, `src/engine/README.md`

## 구현 방향

- `EngineRuntime`은 scene의 `update(dt)`와 `draw(ctx)`를 호출한다.
- `FrameClock`은 `dt` 계산, clamp, 음수 방지, frame handle 관리를 담당한다.
- `CanvasSurface`는 canvas 존재 검증, 2D context, DPR, logical size를 담당한다.
- Galaxy Runner 전용 상태값은 runtime으로 올리지 않는다.

## 제외할 내용

- enemy spawn, score, weapon, special 규칙 변경
- World/EntityStore 분리
- asset/visual cleanup 반영

## 완료 기준

- `requestAnimationFrame` 직접 제어가 `Game`에서 runtime으로 이동한다.
- 기존 게임 시작 흐름은 유지된다.
- `node --check src/**/*.js` 검증 결과를 review에 기록한다.
- `REVIEW-ENGINE-002.md`를 작성한다.
