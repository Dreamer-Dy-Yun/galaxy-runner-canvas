# tests

## 역할

`tests`는 gameplay 계약, classic global 제공 순서, engine/runtime 수명주기, 진단 기능, 실제 배포 artifact의 브라우저 동작을 검증한다. fixture와 helper는 production public contract를 대체하지 않는다.

## 계약 테스트

- `classic-script-order.test.mjs`: HTML manifest, 누락·중복·미등록·순서 오류, provider 일괄 VM load, 동적 runtime script 실패 가시성을 검증한다.
- `session-input.test.mjs`: action/repeat/transient, blur·visibility reset version, listener 해제, 시작 무기 선택, Restart, Assist Continue, pause 상태 전이를 검증한다.
- `run-rules.test.mjs`: 시작 무기 순서·정규화·순환·직접 선택과 Assist 판정을 검증한다.
- `player-defense.test.mjs`: shield 선흡수, flat 10.5 cap, outer-first 배분, percent 계층, 최소 HP 피해, compact HUD summary와 Player delegate를 검증한다.
- `gameplay-feedback-contract.test.mjs`: special 실패·성공·Nova cap, blur 직후 special 재입력과 pickup 회복·overflow·무기 진행 결과가 semantic feedback details를 제공하는지 검증한다.
- `game-feedback.test.mjs`: semantic feedback event, 우선순위·수명, Canvas 문구 표시, aria-live 구독 경계를 검증한다.
- `game-audio.test.mjs`: 사용자 gesture 전 지연 생성, mute 저장·표시, 반복 효과음 throttle을 검증한다.

## runtime 테스트

- `runtime-baseline.test.mjs`: runtime global, 양수·0 delta, clock start/stop의 최소 동작을 고정한다.
- `runtime-capacity.test.mjs`: FrameClock 장시간 gap clamp, profiler sample 상한, EntityStore 반복 churn의 bounded 동작을 검증한다.
- `runtime-observer.test.mjs`: canonical frame 순서, cleanup, 구독 세대, pause, 오류 격리·재전파를 검증한다.
- `runtime-diagnostics.test.mjs`: profiler/overlay 책임 분리, 연결 순서와 lifecycle을 검증한다.
- `status-snapshot.test.mjs`: `GalaxyRunnerStatus()`의 immutable 관측 필드와 gameplay 제어 객체 비노출을 검증한다.

## 브라우저 검증과 helper

- `helpers/load-classic-scripts.mjs`: classic script를 격리된 VM context에 순서대로 적재하고 lexical binding 조회를 지원한다.
- `helpers/artifact-browser.mjs`: `dist` 전용 임시 HTTP server와 browser console/page failure 수집을 제공한다.
- `browser-smoke.mjs`: build artifact에서 debug off/on, loadout → running → special feedback → pause/info → restart-ready, 접근성·mute·blur 직후 special 재입력을 검증한다.
- `browser-soak.mjs`: 제한된 시간 동안 running/Continue를 유지하며 상태·entity 수·frame 지표가 finite인지 검증한다.

## 실행 경계

- `pnpm run test:run`은 정적 검증 후 모든 `*.test.mjs`를 자동 발견한다.
- `pnpm run build` 후 `pnpm run test:browser`로 실제 `dist` smoke를 실행한다.
- soak는 `pnpm run test:soak`로 별도 실행하며 `GALAXY_RUNNER_SOAK_MS`로 5~60초 범위를 지정할 수 있다.
