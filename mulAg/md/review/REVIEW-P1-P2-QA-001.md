# REVIEW-P1-P2-QA-001: P1/P2 독립 QA와 배포 준비 판정

## 수행 일시

2026-07-16 01:34:19 +09:00

## 참조 plan / todo

- `mulAg/md/plan/active/PLAN-2026-07-16-p1-p2-hardening.md`
- `mulAg/md/todo/TODO-P1-P2-QA-001.md`
- 구현 근거: `REVIEW-P1-RUN-CONTRACT-001.md`, `REVIEW-P1-CONTRACT-TESTS-001.md`, `REVIEW-P2-UX-FEEDBACK-001.md`, `REVIEW-P2-CAPACITY-001.md`

## 최종 판정

**PASS — 현재 P1/P2 working tree는 commit/push 및 Pages 배포 gate를 진행할 수 있다.**

이 판정은 로컬 변경 전체에 대한 배포 준비 판정이다. 아직 P1/P2 변경 commit, 원격 workflow, 배포 SHA, live URL 증거는 없으므로 실제 배포 완료 판정은 push 뒤 별도로 해야 한다.

## QA 실행 기준

- 구현에 참여하지 않은 독립 QA가 현재 working tree를 순차 검토했다.
- 검토 pass: 제품/session 계약 → 책임 경계와 hardening → 실패 가시성/입력 복구 → UI·접근성·audio → classic script/runtime capacity → 문서·diff·배포 gate.
- Backend, API server, DB는 존재하지 않는 정적 Canvas 프로젝트이므로 이번 범위에서 제외했다.
- 평가 기준점은 commit `a1f768ed08ea2a216cd11280d86db24ffd9ccfcd`와 그 위의 전체 unstaged/untracked P1/P2 변경이다.

## 현재 기준

- 브랜치: `main`
- HEAD: `a1f768e` (`a1f768ed08ea2a216cd11280d86db24ffd9ccfcd`)
- 원격 기준: 검증 시점의 `HEAD == origin/main`
- staged 변경: 없음
- working tree: P1/P2 구현과 MulAg 문서가 의도적으로 dirty인 상태
- tracked diff: 기존 파일 39개, `+572 / -380`
- diff target: `HEAD` 대비 working tree 전체와 모든 untracked 파일
- 신규 P1/P2 배포 SHA/workflow/live 증거: 아직 없음

## 점수

| 항목 | 점수 | 근거와 감점 사유 |
|---|---:|---|
| 사용자 표시 정확성 | 96 | 시작 무기, Assist, 방어, feedback 결과가 동일 계약을 사용한다. 장기 밸런스 평가는 범위 밖이다. |
| Async/stale/scope 안전성 | 94 | blur/hidden reset 세대와 특수기 latch를 동기화했고 runtime delta를 clamp한다. 실제 soak는 12초의 짧은 gate다. |
| API/계약 경계 | 96 | 별도 backend는 없으며 run/defense/progression/feedback 계약이 system과 UI 사이에 분리됐다. classic global manifest는 수동 갱신 책임이 남는다. |
| UI/접근성 | 94 | 한국어 문서, focusable Canvas, fallback, aria-live, 키보드 Info, mute 버튼을 확인했다. touch 조작은 명시적 제외다. |
| 테스트/문서 정합성 | 97 | 51개 Node 계약, 실제 artifact browser, soak, 폴더 README와 gameplay 문서가 일치한다. |
| 유지보수/하드닝 | 88 | 신규 파일은 모두 300라인 이하이고 큰 기존 파일은 증가하지 않았다. `player.js`, `game-config.js`, `enemy.js`의 기존 분리 부채는 남아 있다. |

종합: **94/100**

## Acceptance matrix

| 범위 | 판정 | 현재 코드/검증 근거 |
|---|---|---|
| 시작 무기 | PASS | `RunRules`가 Rapid 기본값, 순환, 1~4 직접 선택을 소유한다. `GameSessionSystem.start`는 선택한 무기만 level 1로 장착하고 Restart는 선택을 보존한 ready로 돌아간다. Node와 browser가 실제 전이를 검증한다. |
| Assist Continue | PASS | Continue는 거리·점수·시간·위험도·강화를 보존하고 danger field만 정리한다. `continues > 0`에서 파생한 Assist를 HUD와 game-over가 명시한다. 중복 저장 flag는 없다. |
| 방어 계약 | PASS | shield 선흡수 → outer flat → percent → inner flat 순서, 합산 flat cap 10.5, 양수 HP hit 최소 1을 순수 snapshot/system과 Player delegate가 공유한다. HUD는 armor/flat과 percent를 한 셀의 두 줄로 표시한다. |
| session/input | PASS | Space start→fire 순서, repeat 억제, pause 상태 제한, Restart/Continue side effect, blur/hidden reset, listener 해제를 검증했다. `resetVersion()`이 특수기 edge latch와 동기화된다. |
| classic script 순서 | PASS | 52개 허용 script, provider-before-consumer, 누락·중복·미등록, main 최종 위치를 manifest가 검사한다. 실제 provider VM load와 동적 runtime load 실패 노출도 통과한다. |
| feedback | PASS | special 성공/실패와 meter 미차감, pickup 결과, hit/kill/boss event가 immutable semantic payload로 연결된다. Canvas·aria-live·audio는 별도 presenter/subscriber다. |
| 접근성 | PASS | `lang=ko`, Canvas `tabindex=0`, label/description/fallback, live region, `I` 정보, `X/Ctrl` 특수기, focus-visible, 접근 가능한 mute 버튼을 실제 artifact에서 확인했다. |
| audio | PASS | 사용자 gesture 전 AudioContext를 만들지 않고 mute 저장·`aria-pressed`·반복 kill throttle을 제공한다. 오류는 gameplay 결과를 바꾸지 않는다. |
| capacity | PASS | FrameClock gap clamp, profiler sample/spike bound, EntityStore churn, immutable status, browser entity/frame finite 상태와 blur 복구가 통과했다. |
| 문서/책임 | PASS | root, gameplay, structure, `src/audio`, input, systems, UI, scripts, tests, workflow README가 실제 역할과 gate를 반영한다. 기존 300라인 부채와 touch 제외 범위도 숨기지 않는다. |

## 독립 QA에서 발견 후 교정된 항목

### [P2] blur 직후 특수기 첫 재입력 누락 — 교정 완료

- 최초 상태에서 `InputController.resetInput()`은 raw down/transient만 비웠고 `SpecialSystem`은 `player.wasSpecialDown`을 유지했다.
- 특수기를 누른 채 blur 후 첫 frame 전에 KeyX를 다시 누르면 `input.isDown("special") == true`, latch도 `true`인 채 새 발동/실패 event가 생기지 않는 것을 Chromium에서 재현했다.
- 현재 `src/engine/input.js:68-76`의 `resetVersion()`과 `src/systems/special-system.js:12-24`의 reset 세대 동기화로 latch를 먼저 해제한다.
- Node 회귀 테스트와 debug off/on Chromium 재입력 시나리오가 추가됐다.
- 최종 custom Chromium 결과: `specialDown=true`, `latch=true`, 새 `special.failed / insufficient-meter` event 발행 확인.

### [P2] 방어 HUD 문자열의 다음 status icon 침범 — 교정 완료

- 최초 단일 문자열 `A5/D10.5/R12%`는 실제 font에서 83.3px였고 다음 icon 전 가용 폭은 56px였다.
- 현재 `src/ui/game-hud.js:43-57,164-171`의 `GameHud.defenseTag`와 `drawTagValue`가 `A5/D10.5`, `R8%`처럼 두 줄로 표시한다.
- 최종 Chromium 측정은 최대 flat line 49.0px, percent line 29.4px로 둘 다 56px 안이다.
- Node test가 값, frozen lines, 실제 두 번의 `fillText`를 고정한다.

### [P2] pause 정보 panel 겹침 — 교정 완료

- `src/gameplay/game-info.js:175-180`에서 `GAME_INFO_CONFIG.panel.y`를 12로 조정해 466px panel이 540px playfield 안의 12~478 범위를 사용한다.
- 실제 browser의 pause → Info open/close 경로와 console/page/network 오류 부재를 다시 검증했다.

## 독립 명령 결과

- `corepack pnpm run test:run`: **PASS, 51/51**
  - source: JavaScript 88개, HTML 2개
  - local/classic script: 52개 참조와 52개 순서 계약 PASS
- `corepack pnpm run build`: **PASS**
  - `dist` 158 files, 13,630,641 bytes
  - source 88 JS / artifact 69 JS
- `corepack pnpm run test:browser`: **PASS**
  - debug off/on에서 loadout, running, special feedback, pause/Info, restart-ready, 접근성, audio mute, blur와 즉시 특수기 재입력 확인
  - page error, console error, failed request, HTTP 4xx/5xx 없음
- `corepack pnpm run test:soak`: **PASS**
  - 12,000ms, entity high-water 35, final 16, Assist 0
  - finite status/frame, entity `< 1000`, p95 hang threshold, blur 복구 PASS
- 추가 custom Chromium: **PASS**
  - blur 직후 KeyX 재입력이 새 `special.failed`를 발행
  - compact defense line 실측 49.0px / 29.4px, 가용 폭 56px 이내
- `git diff --check`: **PASS (exit 0)**
  - whitespace 오류 없음. Windows CRLF 변환 예정 경고만 출력됐다.

## 라인 수와 책임 경계

신규 JavaScript/MJS는 전부 300라인 이하이다.

- 신규 production 최대: `src/audio/game-audio.js` 213라인
- 신규 script 최대: `scripts/classic-script-contract.mjs` 203라인
- 신규 test 최대: `tests/session-input.test.mjs` 268라인
- 기존 300라인 이하 경계: `src/engine/game.js` 291, `src/systems/special-system.js` 250, `src/main.js` 181, `src/ui/game-overlay.js` 191, `src/ui/game-hud.js` 184

기존 대형 파일은 순증하지 않았다.

- `src/entities/player.js`: 824 → 777 (`-47`)
- `src/gameplay/game-config.js`: 1,056 → 1,045 (`-11`)
- `src/entities/enemy.js`: 742 → 742 (`0`, 수정 없음)

run, defense, progression, feedback, loadout, accessibility, audio 책임은 전용 파일로 분리됐고 관련 README가 공개 책임과 변경 경계를 설명한다.

## 변경 파일

- root/workflow/docs: `.github/workflows/README.md`, `.github/workflows/pages.yml`, `README.md`, `docs/GAMEPLAY_SYSTEMS.md`, `docs/PROJECT_STRUCTURE.md`, `galaxy-runner.css`, `galaxy-runner.html`, `index.html`, `package.json`
- scripts/docs: `scripts/README.md`, `scripts/verify-static-site.mjs`
- runtime/docs: `src/README.md`, `src/core/constants.js`, `src/engine/game.js`, `src/engine/input.js`, `src/engine/input/README.md`, `src/engine/input/action-map.js`, `src/entities/README.md`, `src/entities/player.js`, `src/gameplay/README.md`, `src/gameplay/game-config.js`, `src/gameplay/game-info.js`, `src/main.js`, `src/renderers/README.md`, `src/renderers/game-scene-renderer.js`, `src/systems/README.md`, `src/systems/collectible-lifecycle-system.js`, `src/systems/enemy-lifecycle-system.js`, `src/systems/enemy-spawn-system.js`, `src/systems/game-loop-system.js`, `src/systems/game-session-system.js`, `src/systems/special-system.js`, `src/ui/README.md`, `src/ui/game-hud.js`, `src/ui/game-overlay.js`
- tests/docs: `tests/README.md`, `tests/browser-smoke.mjs`, `tests/helpers/load-classic-scripts.mjs`, `tests/runtime-diagnostics.test.mjs`

## 생성 파일

- gameplay/system/UI/audio: `src/gameplay/run-rules.js`, `src/gameplay/player-defense-rules.js`, `src/systems/player-defense-system.js`, `src/systems/player-progression-system.js`, `src/systems/game-feedback-system.js`, `src/ui/loadout-selector.js`, `src/ui/game-feedback-messages.js`, `src/ui/game-feedback.js`, `src/ui/game-accessibility.js`, `src/audio/game-audio.js`, `src/audio/README.md`
- scripts/tests: `scripts/classic-script-contract.mjs`, `tests/classic-script-order.test.mjs`, `tests/session-input.test.mjs`, `tests/run-rules.test.mjs`, `tests/player-defense.test.mjs`, `tests/gameplay-feedback-contract.test.mjs`, `tests/game-feedback.test.mjs`, `tests/game-audio.test.mjs`, `tests/runtime-capacity.test.mjs`, `tests/status-snapshot.test.mjs`, `tests/browser-soak.mjs`, `tests/helpers/artifact-browser.mjs`
- governance: active plan, P1/P2 TODO 5개, 구현 review 4개, 이 독립 QA review

## 미변경/제외 확인

- `assets/**`, `src/engine/runtime/**`, `src/engine/debug/**`, `src/engine/world/**`의 production 계약은 수정하지 않았다.
- `src/entities/enemy.js`는 수정하지 않았다.
- touch/mobile 조작, 장기 endurance profiling, 적/config/player 전체 분리는 계획대로 이번 범위 밖이다.
- `dist`는 build 산출물이며 commit 대상이 아니다.

## Security/runtime 오류 대조

- 사용자 입력이나 외부 API를 신뢰해 저장·전송하는 경로가 없는 정적 사이트다.
- status snapshot은 gameplay 제어 객체를 노출하지 않고 중첩 snapshot도 freeze한다.
- feedback subscriber, Web Audio, 동적 engine load 실패는 숨기지 않고 격리 또는 console 오류로 드러낸다.
- browser smoke와 soak에서 page/console/request/HTTP 오류가 없었다.
- secret, credential, 외부 asset URL, 임의 HTML 주입 변경은 없다.

## 남은 위험

- 12초 seeded soak는 명백한 폭증과 hang을 찾는 배포 gate이지 장시간 memory/performance 인증은 아니다.
- Chromium artifact만 자동 검증했으며 Safari/Firefox의 Web Audio와 Canvas 차이는 수동/추가 matrix 대상이다.
- desktop keyboard가 현재 제품 범위이며 touch/mobile 조작은 제공하지 않는다.
- 세 기존 대형 파일의 구조 부채는 명시되어 있으며 전체 프로젝트 hardening 완료로 간주하지 않는다.
- classic global manifest는 HTML 의존 변경 시 코드와 함께 수동 갱신해야 한다.
- P1/P2 실제 Pages 배포 성공과 live SHA는 push 이후에만 증명할 수 있다.

## 최종 verdict

- 사용 가능: **예**
- P1/P2 범위 hardening 완료: **예**
- 전체 프로젝트 hardening 완료: **아니오 — 명시된 기존 대형 파일 부채가 남음**
- 로컬 배포 준비: **예**
- 실제 배포 완료: **아니오 — commit/push/workflow/live 검증 전**
