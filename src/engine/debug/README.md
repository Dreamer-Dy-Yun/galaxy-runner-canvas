# src/engine/debug

## 역할

`src/engine/debug`는 `EngineRuntime`의 공개 observer phase를 이용해 진단 정보를 수집하고 표시한다. runtime, scene, gameplay 메서드를 교체하지 않는다.

## 파일 책임

- `frame-profiler.js`: runtime event의 frame/update/draw `durationMs`를 최근 표본과 시작 구간 spike로 집계한다. Canvas나 scene을 알지 않는다.
- `debug-overlay.js`: FPS, scene/entity 상태와 선택적 profiler snapshot을 Canvas에 표시한다. gameplay 상태를 변경하지 않는다.

## FrameProfiler 공개 계약

```js
const profiler = new FrameProfiler({ enabled: true });
profiler.attach({ runtime });
const snapshot = profiler.snapshot();
profiler.detach();
```

- `attach({ runtime })`: `runtime.subscribe(profiler)`로 연결한다. 같은 runtime에 반복 호출해도 중복 구독하지 않는다. 다른 runtime으로 옮길 때는 기존 구독을 먼저 해제한다.
- `detach()`: 구독을 해제하고 진행 중인 frame 표본을 버린다. 반복 호출할 수 있다.
- `enable()` / `disable()`: 표본 수집만 켜고 끈다. 기존 표본은 보존한다.
- `snapshot()`: shallow read-only `{ frame, update, draw, spikes, sampleCount }`를 반환한다. 각 metric은 `{ avg, p95, max }`다.
- `afterUpdate`, `afterDraw`, `afterFrame`에 전달된 runtime의 실제 `durationMs`만 기록한다. 자체 timer로 scene을 감싸거나 비용을 재계산하지 않는다.
- profiler는 Canvas context를 받거나 draw API를 제공하지 않는다.

## DebugOverlay 공개 계약

```js
const overlay = new DebugOverlay({
  enabled: false,
  sceneManager,
  surface,
  getWorld,
  profiler,
});
overlay.attach(runtime);
overlay.enable();
overlay.detach();
```

- 기본값은 disabled다. `DebugOverlay.readEnabledFlag()`는 `?debug=1` 또는 storage의 명시적 opt-in을 읽는다.
- `attach(runtime)` / `detach()`는 idempotent한 observer lifecycle이다.
- `enable()` / `disable()` / `toggle()`은 표시만 제어한다. runtime과 profiler 수집 여부를 바꾸지 않는다.
- profiler는 선택 사항이다. overlay 단독, profiler 단독, 어느 연결 순서든 gameplay phase에는 영향이 없다.
- overlay가 profiler보다 먼저 등록되면 첫 표시만 아직 기록되지 않은 이전 snapshot을 볼 수 있고, 이후 frame부터 정상 표본을 표시한다.

## 실패와 변경 경계

- diagnostics callback 오류는 `EngineRuntime`의 observer 오류 정책으로 보고되며 gameplay와 다음 observer를 중단하지 않는다.
- debug 계층은 runtime/scene 함수, RAF scheduling, input cleanup, score·spawn·damage 규칙을 수정하지 않는다.
- profiler metric schema나 overlay 표시 책임이 바뀌면 이 문서와 `tests/runtime-diagnostics.test.mjs`를 함께 갱신한다.
