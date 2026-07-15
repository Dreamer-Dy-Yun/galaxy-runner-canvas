# REVIEW: 런타임 구성과 모듈 계약 조사

## 수행 일시

2026-07-15 23:40:13 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-QA-RUNTIME-001.md`

## 수행 내용

- 현재 `main` / `8e5c713`을 기준으로 `src/main.js`부터 RAF callback, `runtime.frame`, scene dispatch, game update/draw까지 역추적했다.
- `EngineRuntime`, `DebugOverlay`, `FrameProfiler`의 입력, 출력, 메서드 교체 부작용, `this` 보존 방식, attach 순서 전제를 대조했다.
- 현재 부트 순서, profiler 단독 연결, debug overlay 선행 연결, profiler 선행 연결을 격리 실행으로 비교했다.
- 실제 dispatch 형태에서 profiler의 update/draw 계측이 호출 경로를 포착하는지 확인했다.
- 엔진/debug 문서가 선언한 책임 경계와 실제 구현을 대조했다.
- API, UI, 게임 기획, 실제 배포 브라우저 재검증, 전체 테스트 적정성은 다른 TODO의 범위이므로 판단하지 않았다.

## 변경 파일

- 없음

## 생성 파일

- `mulAg/md/review/REVIEW-QA-RUNTIME-001.md`

## 미변경 파일

- `src/main.js`
- `src/engine/**`
- `src/gameplay/**`
- `src/systems/**`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/PROJECT_STRUCTURE.md`
- 기존 `mulAg/md/**`

## 검증 내용

### 1. 현재 기준

- 브랜치: `main`
- HEAD: `8e5c713`
- 상태: `main...origin/main`; 조사용 plan/TODO 4개만 untracked였고 코드 diff는 없었다.
- 최근 커밋: `8e5c713 refactor: harden galaxy-runner module boundaries`

### 2. 실제 부트와 frame 호출 순서

현재 부트 순서는 명확하고 결정적이다. 다만 이 순서가 각 debug 모듈의 공개 계약으로 문서화되어 있지는 않다.

1. `ensureRuntime()`이 목록 순서대로 전역 script를 적재한다 (`src/main.js:6-24`, `src/main.js:42-47`).
2. `Game`을 만들고 `SceneManager`에 등록한 뒤 즉시 `game` scene으로 전환한다 (`src/main.js:68-71`). 전환은 `Game.enter()`를 호출한다 (`src/engine/scenes/scene-manager.js:39-50`, `src/engine/game.js:24-26`).
3. `EngineRuntime`을 만들면서 `runFrame = (frameState) => this.frame(frameState)`를 생성한다 (`src/main.js:72-76`, `src/engine/runtime/engine-runtime.js:15-20`). 이 화살표 함수는 매 frame마다 현재의 `runtime.frame`을 동적으로 조회한다.
4. debug 표시가 비활성이어도 `DebugOverlay.attach(runtime)`은 항상 실행된다 (`src/main.js:77-84`). 이 attach는 원래 `runtime.frame`을 `runtime.frame.bind(runtime)`으로 보존하고 runtime 메서드를 화살표 함수로 교체한다 (`src/engine/debug/debug-overlay.js:25-38`).
5. 그 뒤 `FrameProfiler.attach(...)`가 실행된다 (`src/main.js:85-91`). 따라서 profiler가 `runtime.frame`에서 캡처하는 함수는 `EngineRuntime.frame` 원본이 아니라 앞 단계의 화살표 wrapper다 (`src/engine/debug/frame-profiler.js:27-34`). profiler는 이를 다시 바깥 wrapper로 교체한다 (`src/engine/debug/frame-profiler.js:58-74`).
6. 모든 교체가 끝난 뒤에만 `runtime.start()`가 호출된다 (`src/main.js:94`). `EngineRuntime.start()`는 `runFrame`을 clock에 전달하고 (`src/engine/runtime/engine-runtime.js:25-34`), `FrameClock`은 RAF마다 frame state를 이 callback으로 보낸다 (`src/engine/runtime/frame-clock.js:52-68`).

현재 frame의 실제 호출 체인은 다음과 같다.

```text
requestAnimationFrame
  -> FrameClock.handleFrame
  -> EngineRuntime.runFrame
  -> FrameProfiler runtime.frame wrapper
  -> DebugOverlay runtime.frame wrapper
  -> bound EngineRuntime.frame
  -> EngineRuntime.normalizeFrameState
  -> SceneManager.frame
  -> Game.frame
  -> Game.update / Game.draw
  -> DebugOverlay.afterFrame
  -> FrameProfiler overlay / record
```

근거는 `EngineRuntime.frame`이 `scene.frame`을 우선 호출하는 부분 (`src/engine/runtime/engine-runtime.js:44-51`), `SceneManager.frame`이 현재 scene의 `frame`을 우선 호출하는 부분 (`src/engine/scenes/scene-manager.js:76-88`), 실제 `Game.frame`이 update/draw를 소유하는 부분 (`src/engine/game.js:271-290`)이다.

### 3. attach/detach 계약 대조

| 모듈 | 입력과 정상 경로 | 부작용 | 반환/해제 | 확인된 순서 전제 |
| --- | --- | --- | --- | --- |
| `EngineRuntime` | `scene` 필수, `clock`/`surface` 선택 (`src/engine/runtime/engine-runtime.js:6-18`) | `runFrame`에서 현재 `this.frame` 호출 | `start/stop`은 있으나 frame observer 계약은 없음 | 외부가 `frame`을 교체해도 동적 조회로 적용됨 |
| `DebugOverlay` | `runtime.frame` 함수 여부를 검사 (`src/engine/debug/debug-overlay.js:25-29`) | 원본을 runtime에 bind하고 `runtime.frame` 교체, `runtime.__debugOverlayHook` 추가 (`src/engine/debug/debug-overlay.js:31-38`) | attach는 `this` 반환, detach 없음 | 단독 attach는 안전하나 다른 wrapper와의 복원/소유권 계약 없음 |
| `FrameProfiler` | runtime/scene 누락 또는 재attach를 오류 없이 return (`src/engine/debug/frame-profiler.js:27-30`) | `runtime.frame`, `scene.update`, `scene.draw`를 직접 교체 (`src/engine/debug/frame-profiler.js:32-74`) | 반환값 없음, 원본 저장 필드와 detach 없음 | 캡처한 `runtime.frame`이 이미 receiver-safe 함수여야 함 |

### 4. 순서 조합 격리 재현

동일 HEAD의 네 모듈을 Node VM에 읽어 `EngineRuntime.frame`을 한 번 호출했다. 소스 파일은 수정하지 않았다.

```text
baseline: PASS
profiler-only: FAIL TypeError: Cannot read properties of undefined (reading 'normalizeFrameState')
overlay-then-profiler: PASS
profiler-then-overlay: FAIL TypeError: Cannot read properties of undefined (reading 'normalizeFrameState')
```

원인은 `FrameProfiler`가 `const originalFrame = runtime.frame`으로 receiver 없이 캡처한 뒤 (`src/engine/debug/frame-profiler.js:32`) 일반 함수 호출로 실행하는 데 있다 (`src/engine/debug/frame-profiler.js:60`, `src/engine/debug/frame-profiler.js:67`). 캡처 대상이 `EngineRuntime.frame` 원본이면 class method 내부의 `this`가 `undefined`가 되어 `this.normalizeFrameState(...)`에서 실패한다 (`src/engine/runtime/engine-runtime.js:44-46`).

현재 부트는 먼저 설치된 `DebugOverlay`가 bound 원본을 감싼 화살표 함수를 만들어 주므로 profiler가 receiver-safe wrapper를 캡처한다. 즉, 현재 실행 성공은 우연한 타이밍은 아니지만 **항상 attach되는 optional debug wrapper의 선행 설치**에 의존한다. `enabled: false`는 표시만 끌 뿐 attach 자체를 생략하지 않는다 (`src/engine/debug/debug-overlay.js:15`, `src/main.js:77-84`).

### 5. 실제 dispatch 형태의 계측 검증

실제 구조와 같이 `EngineRuntime.scene`에 `SceneManager`를 넣고, current scene이 자체 `frame`에서 update/draw하는 형태로 한 frame을 실행했다.

```text
production-shaped-dispatch: updates=1 draws=1 updateMs=0 drawMs=0 samples=1
```

게임의 update/draw는 각각 한 번 실행됐지만 profiler의 세부 측정값은 모두 0이었다. profiler가 감싸는 대상은 `SceneManager.update/draw` (`src/engine/debug/frame-profiler.js:33-55`)인데, 실제 경로는 `SceneManager.frame`이 `Game.frame`을 직접 호출하여 그 두 메서드를 지나지 않기 때문이다 (`src/engine/scenes/scene-manager.js:76-81`, `src/engine/game.js:271-290`). 전체 frame sample은 남지만 README가 주장하는 "scene update/draw와 runtime frame 비용 측정"은 현재 조립 경로에서 충족되지 않는다 (`src/engine/debug/README.md:12-15`).

### 6. 확인된 문제와 severity

#### [High - 하드닝/회귀, 현재 사용자 장애 아님] profiler의 receiver 계약이 선행 overlay에 숨게 의존함

- `FrameProfiler.attach`는 독립적으로 유효한 `EngineRuntime-like` 객체를 감싸지 못한다.
- 현재 `main.js`의 정확한 순서에서는 정상 실행되므로, 이 문제를 현재 배포본의 사용자 실행 장애로 분류하면 안 된다.
- overlay 제거, attach 순서 변경, profiler 단독 재사용, 다른 부트스트랩 도입 시 첫 frame에서 즉시 실패한다.
- optional debug 모듈의 존재가 다른 debug 모듈의 receiver 보존을 대신한다는 점에서 재사용 가능한 안정 계약은 아니다.

#### [High - 관측 신뢰도, 게임 진행 장애 아님] update/draw profiler 수치가 실제 실행 단계를 측정하지 않음

- update와 draw는 실행되지만 profiler는 현재 dispatch 경로에서 두 비용을 포착하지 못한다.
- gameplay 결과는 바꾸지 않지만 성능 회귀 판단과 startup spike 원인 분석에 잘못된 증거를 제공할 수 있다.
- frame 전체 비용에는 debug/profiler overlay 자체의 비용도 포함된다 (`src/engine/debug/frame-profiler.js:64-72`). 무엇을 포함하는 metric인지 문서화되지 않았다.

#### [Medium - lifecycle/조합] runtime과 scene monkey patch가 비대칭임

- 두 debug 모듈 모두 `runtime.frame`을 직접 교체한다. profiler는 scene 메서드도 직접 교체한다.
- `DebugOverlay`는 원본을 임시 hook에 남기지만 detach가 없고, `FrameProfiler`는 원본을 instance에 보관하지 않으며 detach도 없다.
- attach 실패, teardown, scene 교체, 여러 observer 설치 시 원복 순서와 소유권이 정의되지 않았다.
- profiler는 잘못된 입력을 명시적 오류로 드러내지 않고 조용히 return하므로 구성 실패 가시성도 낮다 (`src/engine/debug/frame-profiler.js:27-30`).

#### [Medium - 문서/경계] 문서의 debug 및 engine/game 경계가 구현과 일치하지 않음

- debug README는 "엔진 런타임을 직접 변경하지 않고" 진단한다고 선언하지만 (`src/engine/debug/README.md:3-5`), 실제 두 모듈은 `runtime.frame`을 직접 교체한다.
- 아키텍처 문서는 기본 frame 순서를 `FrameClock -> input snapshot -> scene update -> cleanup -> draw -> debug hook`으로 정의한다 (`docs/ENGINE_ARCHITECTURE.md:62-69`). 실제 경로는 `SceneManager.frame -> Game.frame`이 update/draw 및 input end-frame을 소유하고, observer는 메서드 교체로 앞뒤에 삽입된다.
- `src/engine`은 게임에 종속되지 않는 경계라고 문서화되어 있으나 (`src/engine/README.md:3-13`, `docs/PROJECT_STRUCTURE.md:11-18`), `src/engine/game.js`는 `GameSessionSystem`, `GameLoopSystem`, spawn/lifecycle/system 등 Galaxy Runner 구체 책임에 직접 위임한다 (`src/engine/game.js:32-225`). 이는 현재 실행 장애가 아니라 폴더 책임과 수정 경계를 오해하게 만드는 하드닝 부채다.

### 7. 사용자 장애와 하드닝 위험 구분

| 판단 대상 | 결론 |
| --- | --- |
| 현재 `main.js` 부트 순서 | 코드상 결정적이며 overlay -> profiler -> start 순서를 지켜 정상 실행 가능한 구성이다. |
| 현재 배포본의 첫 frame 장애 | 이 조사에서는 확인되지 않았다. 앞선 profiler 단독 실패를 현재 배포 실패로 일반화하면 안 된다. 실제 브라우저 증거는 별도 evidence TODO에서 통합해야 한다. |
| profiler 단독/역순 조립 | 격리 재현으로 첫 frame TypeError가 확인됐다. |
| 전형적이고 독립적인 모듈 조합인가 | 아니다. profiler의 성공이 문서화되지 않은 선행 wrapper와 `this` 보존 구현에 의존한다. |
| 하드닝 완료인가 | 아니다. 입력/부작용/순서/해제/실패 계약과 실제 phase 계측이 안정화되어 있지 않다. |
| 게임 전체가 비정상 순서로 실행되는가 | 그렇게 단정할 근거는 없다. 문제 범위는 런타임 debug 구성과 문서화된 engine/scene 경계다. |

## 남은 이슈

1. **canonical frame 소유권 결정**: `EngineRuntime`이 update/draw phase를 소유할지, `SceneManager/Game.frame`이 통합 frame을 소유할지 먼저 하나의 계약으로 확정해야 한다. 현재 문서는 전자를, 구현은 후자를 중심으로 동작한다.
2. **관측 API 도입**: debug 도구가 `runtime.frame`을 직접 교체하지 않도록 `beforeFrame/afterFrame` 또는 subscribe/unsubscribe observer 계약을 `EngineRuntime`에 두는 방향이 우선이다.
3. **profiler phase 계약 정리**: 실제 호출되는 update/draw 경계에 명시적 phase hook을 두거나, 지원 전까지 세부 metric을 제공하지 않는다고 계약을 축소해야 한다. 단순히 현재 `SceneManager.update/draw`를 감싸는 방식은 유효하지 않다.
4. **attach/detach 대칭성**: 중복 attach, 여러 observer, 역순 detach, attach 중 실패를 포함한 소유권과 원복 규칙이 필요하다.
5. **구성 회귀 테스트**: baseline, overlay-only, profiler-only, 두 모듈 양 순서, enabled/disabled, detach 후 원복을 검증해야 한다. 순서를 강제할 경우 잘못된 순서가 첫 frame이 아니라 attach 시점의 명시적 오류로 드러나야 한다.
6. **실제 부트 통합 테스트**: `main.js`와 동일한 조립 후 ready -> running -> paused 경로, 콘솔 오류, frame sample, update/draw sample을 함께 검증해야 한다.
7. **문서 동기화**: 구현 결정 후 `docs/ENGINE_ARCHITECTURE.md`, `docs/PROJECT_STRUCTURE.md`, `src/engine/README.md`, `src/engine/debug/README.md`, `src/engine/runtime/README.md`를 같은 변경 단위에서 갱신해야 한다.
8. **game scene 위치/명칭 정리**: `src/engine/game.js`를 Galaxy Runner 전용 scene/facade 위치로 옮기거나, engine 폴더의 명시적 예외로 문서화해야 한다. 이 작업은 debug hook 수정과 분리된 후속 TODO가 적절하다.

## QA 확인 요청 사항

- 이 review는 코드 변경 권한이 없는 조사 결과다. 후속 구현은 `src/engine/**`의 하드닝 계약을 변경하므로 사용자에게 명시적 수정 허가를 받은 뒤 별도 TODO로 수행해야 한다.
- 구현 순서는 다음 책임 단위를 권장한다.
  1. canonical frame/phase 계약과 observer API 결정
  2. `EngineRuntime` observer 등록/해제 및 실패 계약 구현
  3. `DebugOverlay`와 `FrameProfiler`를 observer 소비자로 전환
  4. 조합/해제/metric 통합 테스트 추가
  5. 실제 부트 브라우저 검증
  6. 엔진/debug/구조 문서 동기화
- 최소 수정으로 `runtime.frame.bind(runtime)`만 추가하면 profiler 단독 crash는 막을 수 있지만, monkey patch 소유권, detach 부재, update/draw metric 불일치는 남는다. 이를 하드닝 완료로 판정하면 안 된다.
