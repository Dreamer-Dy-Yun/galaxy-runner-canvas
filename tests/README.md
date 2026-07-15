# tests

## 역할

`tests`는 engine/runtime/diagnostics의 공개 계약과 실제 browser 상태 전이를 검증한다.

## 파일 책임

- `helpers/load-classic-scripts.mjs`: classic script를 격리된 VM context에 순서대로 로드하는 Node test helper다.
- `runtime-baseline.test.mjs`: runtime global, positive/zero delta, clock start/stop의 최소 동작을 고정한다.
- `runtime-observer.test.mjs`: canonical frame 순서, cleanup, 구독 세대, pause, 오류 격리·재전파 계약을 검증한다.
- `runtime-diagnostics.test.mjs`: profiler/overlay 책임 분리, 연결 순서, lifecycle, status snapshot을 검증한다.
- `browser-smoke.mjs`: build된 `dist`를 임시 localhost에서 제공하고 debug off/on의 ready → running → paused → resume → restart와 browser 오류 부재를 검증한다.

## 실행 경계

- `pnpm run test:run`은 `*.test.mjs` Node 계약 테스트를 자동 발견한다.
- `browser-smoke.mjs`는 unit test 자동 발견에 포함하지 않고, `pnpm run build` 뒤 `pnpm run test:browser`로 별도 실행한다.
- browser smoke는 `GalaxyRunnerStatus()`의 read-only 값과 실제 keyboard/button 입력만 사용하며 gameplay 내부 객체를 변조하지 않는다.
- fixture나 helper가 공개 runtime 계약을 대체하지 않도록 실제 classic script를 우선 로드한다.
