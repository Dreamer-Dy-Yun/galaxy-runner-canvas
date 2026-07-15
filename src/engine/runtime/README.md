# src/engine/runtime

## 역할

`src/engine/runtime`은 Canvas surface와 frame clock을 scene 실행 흐름에 연결하고 한 frame의 phase를 단일 지점에서 소유한다.

## 파일 책임

- `canvas-surface.js`: canvas/context 생성, DPR scale, resize, clear.
- `frame-clock.js`: `requestAnimationFrame` scheduling, delta 계산, delta clamp.
- `engine-runtime.js`: frame clock과 active scene 또는 game object 연결, canonical phase 실행, observer 등록과 오류 격리.

## EngineRuntime 공개 계약

`EngineRuntime`은 다음 순서를 frame마다 한 번 실행한다.

```text
beforeFrame observers
-> scene.update(dt, frameState)        // dt > 0, scene이 paused가 아닐 때
-> afterUpdate observers
-> scene.draw(dt, frameState)
-> afterDraw observers
-> scene.afterFrame(dt, frameState)    // input transient cleanup 포함
-> afterFrame observers
```

- `frame(frameState)`는 `deltaSeconds`가 유한하지 않으면 `0`으로 정규화한다.
- 정규화한 state에는 `runtime`과 `surface`를 넣고 `lastFrameState`에 보관한다.
- `scene.frame`은 호출하지 않는다. `EngineRuntime`이 update/draw/afterFrame의 유일한 frame 조립자다.
- update가 실행되지 않아도 draw, scene `afterFrame`, observer phase는 실행한다.
- update 또는 draw가 어떤 값이든 throw하면 draw의 후속 실행은 중단하되 scene `afterFrame`과 observer `afterFrame`을 실행한 다음 최초 throw 값을 그대로 다시 던진다. `null`, `undefined`, `0`, `false`, 빈 문자열도 실패다.
- `start()`와 `stop()`은 idempotent하며 `FrameClock.start(runFrame)`과 `FrameClock.stop()`에 scheduling을 위임한다.

## Observer 계약

`subscribe(observer)`는 아래 phase 이름 중 하나 이상의 메서드를 가진 객체를 받으며 unsubscribe 함수를 반환한다.

```js
const unsubscribe = runtime.subscribe({
  beforeFrame(event) {},
  afterUpdate(event) {},
  afterDraw(event) {},
  afterFrame(event) {},
});
```

- 같은 객체 identity를 다시 등록하면 중복 callback을 만들지 않고 기존 unsubscribe 함수를 반환한다.
- 반환된 unsubscribe와 `runtime.unsubscribe(observer)`는 최초 해제 때 `true`, 이미 해제된 뒤에는 `false`를 반환한다.
- callback은 등록 순서대로 실행한다. 각 구독은 내부적으로 고유 record 세대를 가지며 phase 시작 시점의 record snapshot으로 dispatch한다.
- phase dispatch 중 해제 후 같은 객체 identity를 재등록해도 이전 record snapshot으로 현재 phase에 호출하지 않는다. 새 구독은 다음 phase부터 관측하며, 이전 세대의 unsubscribe는 새 세대를 해제하지 못한다.
- event와 event의 `frameState` snapshot은 shallow read-only다.
- event는 `phase`, `runtime`, `scene`, `frameState`, `deltaSeconds`, `durationMs`, `executed`, `failed`, `error`를 제공한다.
- `executed`는 `EngineRuntime`이 직접 보유한 scene delegate 메서드를 호출했는지를 뜻한다. direct scene이 paused면 update의 값은 `false`다. `SceneManager.update`가 호출된 뒤 manager가 paused active scene 전달을 생략한 경우에는 runtime delegate가 호출됐으므로 `true`다.
- `failed`는 해당 event 시점까지 scene frame이 실패했는지를 나타낸다. `failed: false`면 `error`는 `null`이고, `failed: true`면 `error`는 최초 throw 값을 원형 그대로 보존한다. 따라서 `error`의 truthiness로 실패 여부를 판단하지 않는다.
- `afterUpdate`와 `afterDraw`의 `durationMs`는 해당 scene phase 비용이며, `afterFrame`의 값은 frame 시작부터 scene cleanup 완료까지의 비용이다.
- observer callback 오류는 gameplay나 다음 observer를 중단하지 않는다. `onObserverError(error, details)`가 있으면 그곳에 보고하고, 없으면 `console.error`에 표시한다.
- 실패한 observer는 자동 해제하지 않는다. observer lifetime은 반환된 unsubscribe를 소유한 쪽이 명시적으로 끝낸다.

## 경계

- runtime은 stage, score, spawn, weapon, item, boss 규칙을 모른다.
- scene의 실패나 asset 필수 여부를 성공으로 감추지 않는다.
- observer는 scene/runtime 메서드를 교체하지 않고 공개 phase만 구독한다.
- runtime은 DOM input listener나 Canvas debug drawing을 소유하지 않는다.
