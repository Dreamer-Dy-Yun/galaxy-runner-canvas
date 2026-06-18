# src/engine/runtime

## 역할

`src/engine/runtime`은 Canvas surface와 frame clock을 scene 실행 흐름에 연결한다.

## 파일 책임

- `canvas-surface.js`: canvas/context 생성, DPR scale, resize, clear.
- `frame-clock.js`: `requestAnimationFrame` scheduling, delta 계산, delta clamp.
- `engine-runtime.js`: frame clock과 active scene 또는 game object 연결.

## 경계

- runtime은 stage, score, spawn, weapon, item, boss 규칙을 모른다.
- scene의 실패나 asset 필수 여부를 성공으로 감추지 않는다.
