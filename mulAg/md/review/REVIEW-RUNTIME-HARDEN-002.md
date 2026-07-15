# REVIEW: Canonical frame과 observer 계약 구현

## 수행 일시

2026-07-16 00:14:42 +09:00

## 참조한 TODO

- `mulAg/md/todo/TODO-RUNTIME-HARDEN-002.md`
- 선행 결과: `mulAg/md/review/REVIEW-RUNTIME-HARDEN-001.md`

## 기준 상태

- 브랜치: `main`
- HEAD: `8e5c713`
- 최초 자체 판정: **PASS**
- 독립 QA 판정: **FAIL — falsy scene throw와 동일 phase 재구독 경계 누락**
- `TODO-RUNTIME-HARDEN-002A` 보정 후 독립 재QA: **PASS — 최초 blocker 2건 해소 확인**

## 구현한 계약

- `EngineRuntime`을 `beforeFrame -> update -> afterUpdate -> draw -> afterDraw -> scene afterFrame -> afterFrame` 순서의 유일한 frame 조립자로 만들었다.
- `Scene`, `SceneManager`, `Game`의 `frame()` 우회 경로를 제거했다.
- `Game.afterFrame()`에서 `InputController.endFrame()`을 호출해 pressed/released transient cleanup을 보존했다.
- `EngineRuntime.subscribe(observer)`와 `unsubscribe(observer)`를 추가했다.
- 같은 observer identity는 한 번만 등록하고 기존 unsubscribe 함수를 반환한다.
- unsubscribe는 최초 해제 때 `true`, 반복 해제 때 `false`를 반환한다.
- observer callback은 등록 순서로 호출하며 callback 오류는 `onObserverError` 또는 console에 표시하고 gameplay 및 다음 observer와 격리한다.
- 실패한 observer는 자동 해제하지 않아 lifetime 변경을 명시적 unsubscribe로 한정했다.
- observer event와 frameState snapshot은 shallow read-only이며 phase, 실행 여부, 비용, scene 오류를 전달한다.
- scene update/draw 오류가 발생하면 draw 후속 실행은 중단하지만 scene `afterFrame`과 observer `afterFrame`을 수행한 뒤 최초 scene 오류를 다시 던진다.
- 최초 scene 오류 뒤 cleanup도 실패하면 최초 오류를 보존하고 cleanup 오류를 console에 별도로 표시한다.
- `frameFailed`와 원본 `frameError`를 분리해 `null`, `undefined`, `0`, `false`, 빈 문자열 throw도 cleanup 뒤 같은 값으로 다시 던진다.
- observer event의 `failed`로 무오류와 falsy 오류를 구분하고 `error`에는 최초 throw 값을 원형 그대로 보존한다.
- observer identity마다 구독 generation record를 만들고 phase snapshot에서 record identity까지 비교한다.
- 같은 phase에서 해제 후 동일 identity를 재구독하면 이전 snapshot은 호출하지 않고 새 generation은 다음 phase부터 호출한다.
- 이전 generation의 unsubscribe가 새 generation을 제거하지 못하도록 unsubscribe closure를 record에 결합했다.

## 변경 파일

- `src/engine/runtime/engine-runtime.js`
- `src/engine/scenes/scene.js`
- `src/engine/scenes/scene-manager.js`
- `src/engine/game.js`
- `src/engine/runtime/README.md`
- `src/engine/scenes/README.md`
- `docs/ENGINE_ARCHITECTURE.md`

## 생성 파일

- `tests/runtime-observer.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-002.md`

## 미변경 경계

- `src/main.js`, `src/engine/debug/**`, `.github/**`, `assets/**`를 수정하지 않았다.
- `package.json`, Phase 1 helper/baseline, gameplay/entity 파일을 수정하지 않았다.
- 공유 worktree의 다른 untracked plan/review/test/build 파일은 이번 TODO의 변경으로 취급하지 않았다.
- 커밋과 푸시는 수행하지 않았다.

## 회귀 테스트

`tests/runtime-observer.test.mjs`가 다음 계약을 검증한다.

1. legacy `scene.frame`이 존재해도 canonical update/draw/afterFrame만 각각 한 번 호출된다.
2. 네 observer phase의 순서와 실행 여부가 고정된다.
3. 같은 observer 중복 등록이 callback을 중복 실행하지 않는다.
4. unsubscribe가 idempotent하다.
5. observer 등록 순서와 오류 격리가 gameplay 두 frame에 걸쳐 유지된다.
6. scene update 오류 뒤 draw는 생략하고 cleanup과 terminal observer를 거쳐 원본 오류를 다시 던진다.
7. zero delta에서 update는 생략하지만 draw, cleanup, 모든 observer phase는 유지된다.
8. update/draw/afterFrame 각각에서 다섯 falsy 값을 throw해도 cleanup, `failed`, 원본 재throw 계약이 유지된다.
9. dispatch 중 동일 observer 해제·재구독 시 현재 phase는 건너뛰고 다음 phase부터 새 generation을 호출한다.
10. direct paused scene과 paused active scene을 가진 SceneManager에서 `executed`가 runtime scene delegate 호출 여부를 뜻하는 경계를 검증한다.

## 최초 구현 검증 결과

실행 환경:

- Node.js `v24.14.0`
- pnpm `11.8.0` (`corepack` 경유)

실행 명령과 결과:

1. `node --test tests/runtime-observer.test.mjs`
   - 신규 observer 테스트 `5`개 통과, 실패 `0`
2. `corepack pnpm run test:run`
   - JavaScript `64`개 문법 검사 통과
   - HTML `2`개와 local script 참조 `42`개 검사 통과
   - baseline과 observer 테스트 합계 `9`개 통과, 실패 `0`
3. `corepack pnpm run build`
   - `dist` artifact `147`개 파일, `13,581,043` bytes 조립
   - source JavaScript `64`개와 artifact JavaScript `59`개 문법 검사 통과
   - artifact local script 참조 `42`개 검사 통과
4. `git diff --check`
   - 오류 없음
5. 코드 파일 line 수
   - `engine-runtime.js` `211`, `scene.js` `42`, `scene-manager.js` `88`, `game.js` `286`
   - 수정한 코드 파일 모두 `300`라인 이하

## 후속 범위

- 이 Phase 2 직후에는 `DebugOverlay`와 `FrameProfiler`의 observer 전환이 후속 범위였다. 현재 트리에서는 `TODO-RUNTIME-HARDEN-003`과 `REVIEW-RUNTIME-HARDEN-003`으로 완료됐다.
- diagnostics 연결 순서 독립성, attach/detach, 실제 update/draw metric은 Phase 3 테스트에서 검증한다.
- ready/running/paused 브라우저 상태 전이와 Pages workflow gate는 `TODO-RUNTIME-QA-001`에서 검증한다.
- 이번 구현은 diagnostics와 browser QA가 소비할 runtime 계약을 제공하며, 해당 후속 검증 전에는 배포 완료로 판정하지 않는다.

## 독립 QA FAIL과 002A 보정 기록

독립 QA는 최초 구현에서 다음 두 계약 누락을 확인해 `TODO-RUNTIME-HARDEN-002`를 FAIL 판정했다.

1. frame 오류를 `if (frameError)`로 판단해 falsy throw가 성공으로 처리될 수 있었다.
2. phase snapshot이 observer 객체 identity만 담아, dispatch 중 해제 후 같은 identity를 재등록하면 오래된 snapshot이 새 구독을 현재 phase에 호출할 수 있었다.

`mulAg/md/todo/TODO-RUNTIME-HARDEN-002A.md`에 따라 다음과 같이 보정했다.

- scene 실패 여부를 `frameFailed` boolean으로 추적하고 throw 값은 별도 변수에 보존했다.
- observer event에 `failed`를 추가하고 실패한 경우 `error`를 truthiness 변환 없이 전달했다.
- 구독마다 generation record와 record 전용 unsubscribe를 생성했다.
- phase 시작 시점의 record snapshot과 현재 Map record가 동일할 때만 callback을 호출한다.
- `executed`를 runtime이 직접 보유한 scene delegate 메서드 호출 여부로 문서화했다. SceneManager 내부 pause gate가 active scene update를 생략해도 `SceneManager.update` delegate가 호출됐다면 `executed`는 `true`다.

### 002A 재검증

실행 시각: 2026-07-16

1. `node --test tests/runtime-observer.test.mjs`
   - runtime observer 테스트 `10`개 통과, 실패 `0`
2. `corepack pnpm run test:run`
   - JavaScript `65`개, HTML `2`개, local script 참조 `42`개 정적 검사 통과
   - 현재 공유 트리의 baseline, diagnostics, observer 테스트 합계 `20`개 통과, 실패 `0`
3. `corepack pnpm run build`
   - `dist` artifact `147`개 파일, `13,586,365` bytes 조립
   - source JavaScript `65`개와 artifact JavaScript `59`개 문법 검사 통과
   - artifact local script 참조 `42`개 검사 통과
4. `git diff --check`
   - 오류 없음
5. 현재 line 수
   - `engine-runtime.js` `234`, `scene.js` `42`, `scene-manager.js` `88`, `game.js` `286`, `runtime-observer.test.mjs` `299`
   - 수정한 코드와 테스트 파일 모두 `300`라인 이하

독립 QA의 최초 FAIL 근거를 숨기지 않고 위 보정과 재검증 결과를 최종 Phase 2 기록으로 사용한다.

### 독립 재QA

- `throw null` 직접 재현에서 draw를 생략하고 cleanup 뒤 `null`을 그대로 재전파했다.
- 같은 phase의 해제·동일 identity 재구독은 현재 phase 호출을 건너뛰고 다음 phase부터 호출했다.
- direct paused scene과 `SceneManager` delegate의 `executed` 의미가 코드·문서·테스트에서 일치했다.
- 전체 `test:run` `20/20` 통과를 재확인해 Phase 2를 최종 PASS로 승인했다.
