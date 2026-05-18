# REVIEW-ENGINE-002

## 작업 범위

- TODO-ENGINE-002 Runtime, FrameClock, CanvasSurface 분리 코드 골격을 구현했다.
- Galaxy Runner 전용 무기, 스폰, 점수 규칙은 `Game` 내부에 유지했다.
- 문서 담당 파일인 `docs/ENGINE_ARCHITECTURE.md`, `src/engine/README.md`, `docs/PROJECT_STRUCTURE.md`는 수정하지 않았다.

## 변경 내용

- `src/engine/runtime/frame-clock.js`
  - `requestAnimationFrame` 예약, 취소, frame delta 계산 책임을 `FrameClock`으로 분리했다.
  - 첫 프레임은 `deltaSeconds = 0`으로 전달하고 이후 프레임은 최대 delta를 제한한다.

- `src/engine/runtime/canvas-surface.js`
  - canvas context 생성, DPR 해상도 설정, transform 적용 책임을 `CanvasSurface`로 분리했다.
  - 게임 규칙이나 렌더링 순서는 포함하지 않는다.

- `src/engine/runtime/engine-runtime.js`
  - `FrameClock`과 scene/game 객체를 연결하는 `EngineRuntime`을 추가했다.
  - scene에 `frame(frameState)`가 있으면 우선 호출하고, 없으면 `update(deltaSeconds, frameState)`와 `draw(deltaSeconds, frameState)`를 호출한다.

- `src/main.js`
  - 엔트리에서 runtime 스크립트를 보장 로드한 뒤 `CanvasSurface`, `Game`, `EngineRuntime`을 조립하도록 변경했다.
  - 직접 `requestAnimationFrame`으로 `Game.frame()`을 호출하지 않는다.

- `src/engine/game.js`
  - `Game` 생성자가 `CanvasSurface` 또는 canvas element를 받을 수 있게 했다.
  - canvas/context/DPR 초기화 책임은 `CanvasSurface`로 우선 위임한다.
  - `Game.frame()`은 runtime이 넘긴 `deltaSeconds`로 단일 프레임의 update/draw만 수행하고, RAF 반복 예약을 하지 않는다.

## 책임 경계 메모

- Runtime 계층은 시간, surface, scene 호출 흐름만 소유한다.
- Game 계층은 기존 플레이어, 적, 투사체, 아이템, 보스, 점수, HUD 렌더링 규칙을 계속 소유한다.
- `Game` 파일은 기존부터 300라인을 초과하지만, 이번 작업에서는 Runtime 분리 최소 변경만 수행했다.

## 문서 갱신 필요사항

- `docs/ENGINE_ARCHITECTURE.md`
  - `FrameClock -> EngineRuntime -> Game.frame/update/draw` 실행 흐름을 추가해야 한다.
  - `CanvasSurface`가 canvas context와 DPR 설정 책임을 가진다는 내용을 추가해야 한다.

- `src/engine/README.md`
  - `src/engine/runtime/` 폴더와 세 파일의 역할을 추가해야 한다.
  - `Game`은 RAF 루프를 직접 소유하지 않는다는 경계 설명이 필요하다.

- `docs/PROJECT_STRUCTURE.md`
  - `src/engine/runtime/engine-runtime.js`, `frame-clock.js`, `canvas-surface.js` 항목을 추가해야 한다.

## 검증

- 실행: `src/**/*.js` 대상 `node --check` 동등 검증
- 명령: `Get-ChildItem -Path 'src' -Recurse -Filter '*.js' | ForEach-Object { node --check $_.FullName }`
- 결과: 성공, exit code 0
