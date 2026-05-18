# src/engine/debug

## 역할

`src/engine/debug`는 런타임 상태를 관찰하는 선택형 debug helper를 둔다.

## 파일 책임

- `debug-overlay.js`: 기본 비활성 overlay hook을 제공하며, 활성화 시 FPS, dt, entity count, scene 이름/state를 canvas 위에 그린다.

## 경계

- 이 폴더는 gameplay state를 수정하지 않는다.
- Debug helper는 관찰과 표시만 담당하며, 점수/스테이지/플레이어 final-form 같은 게임 규칙을 판단하지 않는다.
- 현재 게임에서는 `globalThis.GalaxyRunnerDebug.enable()` 또는 `?debug=1`로 활성화할 수 있다.
