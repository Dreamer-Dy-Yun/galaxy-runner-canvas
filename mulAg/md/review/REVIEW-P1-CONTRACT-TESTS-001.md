# REVIEW-P1-CONTRACT-TESTS-001: session/input·run/defense·classic script 계약 테스트

## 기준

- 작업 TODO: `mulAg/md/todo/TODO-P1-CONTRACT-TESTS-001.md`
- 상위 plan: `mulAg/md/plan/active/PLAN-2026-07-16-p1-p2-hardening.md`
- 시작 기준: `main`, `HEAD a1f768e`
- production, HTML, package, workflow는 이 TODO에서 읽기 전용으로 확인했다.

## 1. 관련 이벤트 목록

1. keyboard `keydown` / `keyup`, browser `blur`, document `visibilitychange`
2. `start`, `fire`, `moveLeft`, `moveRight`, `selectWeapon1..4`, `pause`, `restart`
3. ready 시작 무기 선택·확정, Restart, gameover Continue
4. shield 흡수 후 HP 방어 계산
5. HTML classic script 평가와 `main.js`의 동적 runtime script load

## 2. 발생 지점과 처리 흐름

- 입력: browser event → `InputController` → `InputState` / `ActionMap` → action event → `Game.handleAction`
- 세션: `Game.handleAction` → `GameSessionSystem` → ready 선택 / start equip / restart reset / Continue
- 방어: `Player.hit` → shield pool 선흡수 → `PlayerDefenseSystem.snapshot` → outer flat → percent → inner flat → 최소 HP 피해
- 정적 load: `verify-static-site.mjs` → `classic-script-contract.mjs` → manifest set / provider 순서 / main 최종 위치 검증
- 동적 load: `main.js` → 누락 runtime provider용 script 생성 → `onerror` reject → 초기화 오류를 console에 노출

## 3. 확인한 문제

1. 기존 정적 검증은 local script 파일 존재만 확인해 global provider와 consumer의 순서를 보장하지 않았다.
2. 시작·Restart·Continue·방어 규칙을 production public API 기준으로 고정하는 회귀 테스트가 없었다.
3. held input이 blur·hidden 상태에서 해제되고 destroy 시 listener가 대칭 제거되는지 검증되지 않았다.
4. `RunRules.cycleStartingWeapon`의 큰 음수 step이 JavaScript 음수 나머지 때문에 `undefined`를 반환했다.
5. 기존 browser smoke가 변경 전 Restart 즉시 running 계약을 기대해 새 ready 계약과 불일치했다.

## 4. 수정 계획

1. session/input, run, defense를 독립 test file로 나누고 public contract만 관찰한다.
2. HTML 허용 script set과 직접 provider edge를 한 manifest에 선언한다.
3. source·artifact 정적 검증이 같은 manifest 검증을 사용하게 연결한다.
4. 실제 classic script를 VM에서 순서대로 평가하고 동적 load 실패도 별도 검증한다.
5. 폴더 책임 문서와 검증 결과를 갱신한다.

## 5. 수행 내용

- `tests/session-input.test.mjs`
  - Space의 `start → fire` 순서, repeat 억제, pressed/released transient clear를 고정했다.
  - 이동·숫자 선택 action, blur·hidden reset, destroy listener 제거를 검증했다.
  - 선택 무기만 level 1 시작, Restart의 선택 보존 ready, 무제한 Assist Continue의 진행·업그레이드 보존과 danger-field clear를 검증했다.
- `tests/run-rules.test.mjs`
  - 무기 순서, default, wrap, 직접 선택, Assist 판정을 검증했다.
  - 큰 음수 step 테스트로 modulo 결함을 드러냈고 production 담당 TODO에서 이중 modulo로 수정했다.
- `tests/player-defense.test.mjs`
  - shield 선흡수, flat cap 10.5, outer-first 배분, percent 별도 계층, 최소 HP 피해 1과 Player delegate를 검증했다.
- `scripts/classic-script-contract.mjs`, `tests/classic-script-order.test.mjs`
  - 52개 classic script의 등록·순서 계약과 P1/P2 provider 의존성을 선언했다.
  - 누락, 중복, 미등록, consumer 선행, main 비최종 위치를 실패로 고정했다.
  - provider 전체 VM 평가와 동적 runtime load 오류 노출을 검증했다.
- `scripts/verify-static-site.mjs`
  - 기존 문법·경로 검증 뒤 classic script 계약 검증을 source와 `dist`에 공통 적용했다.
- `tests/helpers/load-classic-scripts.mjs`
  - classic lexical class를 테스트에서 안전하게 조회하는 helper를 추가했다.
- `scripts/README.md`, `tests/README.md`
  - manifest, 계약 테스트, runtime capacity, browser helper·smoke·soak의 책임을 기록했다.

## 6. 검증 기록

- `node --test tests/classic-script-order.test.mjs tests/session-input.test.mjs tests/run-rules.test.mjs tests/player-defense.test.mjs`: 19/19 PASS
- `corepack pnpm run test:run`: 51/51 PASS, 52 classic scripts PASS
- `corepack pnpm run build`: PASS, `dist` 158 files
- `corepack pnpm run test:browser`: PASS, P1/P2 lifecycle·접근성·복구·browser failure 검증
- `corepack pnpm run test:soak`: PASS, 12초 running·Continue·finite 상태·bounded entity 검증
- 신규 파일 최대 길이: `tests/session-input.test.mjs` 264 lines, 모두 300 lines 이하

## 남은 경계

- classic HTML script를 변경할 때는 `scripts/classic-script-contract.mjs` manifest도 같은 변경 단위에서 갱신해야 한다.
- 발견된 browser smoke의 Restart·KeyX timing 불일치는 통합 TODO 담당자가 새 계약에 맞췄고 최종 smoke가 통과했다.
- 이 TODO는 production·HTML·배포 workflow를 직접 수정하거나 커밋·푸시하지 않았다.
