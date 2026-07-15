# REVIEW: 테스트와 실제 실행 증거 조사

## 수행 일시

2026-07-15 23:42:40 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-QA-EVIDENCE-001.md`

## 수행 내용

- 현재 `HEAD`, 브랜치, 작업 트리와 배포 workflow를 확인했다.
- package script, 테스트 파일, 정적 검증 경로의 실제 존재 여부를 확인했다.
- 실제 부트와 같은 debug/profiler 연결 순서와 모듈 단독·역순 연결을 별도 smoke 명령으로 비교했다.
- 상위 Orchestrator가 동일 배포 URL에서 확인한 브라우저 상태 전이 증거를 인계받아, 이 Sub-Agent의 격리 재현과 분리해 기록했다.
- 코드 변경 없이 현재 검증 사각지대와 필요한 회귀 테스트를 우선순위화했다.

조사 범위는 테스트·빌드·실행 증거로 한정했다. 런타임 계약의 최종 수정안과 게임 기획 평가는 다른 TODO의 소유 범위다.

## 변경 파일

- 없음

## 생성 파일

- `mulAg/md/review/REVIEW-QA-EVIDENCE-001.md`

## 미변경 파일

- `src/**`
- `tests/**` 및 `scripts/**` — 현재 디렉터리 자체가 없음
- `package.json`, `pnpm-lock.yaml` — 현재 파일 자체가 없음
- `galaxy-runner.html`
- `.github/workflows/**`
- `README.md`
- 기존 `mulAg/**`
- `.git/**`, `assets/**`

## 검증 내용

### 1. 현재 조사 기준

실행 명령:

```powershell
git rev-parse --short HEAD
git status --short --branch
git log -5 --oneline --decorate
git diff --stat
git diff --cached --stat
```

결과:

- 브랜치: `main`
- HEAD: `8e5c713`
- 원격 추적: `main...origin/main`
- 코드 diff와 staged diff: 없음
- 조사 시작 시 untracked 파일은 Orchestrator가 생성한 이번 재조사 plan/TODO 4개뿐이었다.
- 가장 최근 커밋: `8e5c713 refactor: harden galaxy-runner module boundaries`

### 2. package script, 테스트, 빌드 경로

존재 여부 확인:

```powershell
Test-Path package.json
Test-Path pnpm-lock.yaml
Test-Path package-lock.json
Test-Path yarn.lock
Test-Path scripts
Test-Path tests
Get-Command pnpm -ErrorAction SilentlyContinue
git ls-files | rg -i '(^|/)(__tests__|tests?|scripts?)(/|$)|\.(test|spec)\.[cm]?[jt]sx?$'
```

결과:

| 항목 | 결과 | 해석 |
|---|---|---|
| `package.json` 및 lockfile | 없음 | `test:run`, `build`를 정의할 package 계약이 없다. |
| `tests/`, `test/`, `__tests__/` | 없음 | 자동 회귀 테스트 suite가 없다. |
| `scripts/` | 없음 | repo 전용 정적·통합 검증 진입점이 없다. |
| 현재 환경의 `pnpm` | 없음 | 명령 실행 전 `CommandNotFoundException`이 발생한다. |
| tracked test/spec 경로 | 없음 | 커밋된 테스트 파일이 없다. |

요구된 최소 명령도 실제 실행했다.

```powershell
pnpm run test:run
pnpm run build
```

두 명령 모두 현재 환경에서 `pnpm` 미설치로 실패했다. 다만 환경에 pnpm이 있더라도 루트 `package.json`과 해당 script가 없으므로 현재 저장소에서는 성공시킬 실행 계약이 없다. 이것은 게임의 현재 브라우저 실행 실패 증거가 아니라 **자동 검증 경로 부재**의 증거다.

`README.md:62`는 이 프로젝트를 build가 필요 없는 정적 사이트로 설명하고, `src/README.md:5`는 classic script 순서가 모듈 의존 순서라고 명시한다. 따라서 bundling build 부재 자체는 설계와 일치한다. 그러나 사용자 작업 원칙의 `pnpm run test:run`, `pnpm run build` 완료 조건을 충족하거나 대체한다고 합의된 검증 script는 현재 없다.

### 3. 현재 수행 가능한 정적 검증

#### JavaScript 문법 검사

실행 명령:

```powershell
$files = rg --files -g '*.js'
foreach ($file in $files) { node --check $file }
```

결과: `PASS 59 JavaScript files`

초기 시도에서 사용한 `node --experimental-default-type=module --check`는 현재 Node `v24.14.0`이 해당 option을 지원하지 않아 명령 자체가 실패했다. 파일 문법 실패와 혼동하지 않도록, 이 저장소의 classic script 형식에 맞는 `node --check`로 다시 실행했고 59개 전부 통과했다.

#### HTML script 참조 존재 검사

`galaxy-runner.html`의 `<script src>`를 추출해 각 로컬 경로의 존재 여부를 검사했다.

결과:

- script 참조: 42개
- 누락: 0개

이 검사는 파일 존재와 개별 문법만 확인한다. 전역 이름 제공 순서, 부트 side effect, 브라우저 API 호환성은 증명하지 않는다.

### 4. 배포 workflow와 현재 배포본 일치 증거

실행 명령:

```powershell
gh run list --workflow pages.yml --limit 1 --json databaseId,headSha,headBranch,status,conclusion,createdAt,updatedAt,url
```

결과:

- workflow run: `27730760162`
- branch: `main`
- SHA: `8e5c7134ff28b810608892e302ee670bfc4aade1`
- status/conclusion: `completed/success`
- URL: `https://github.com/Dreamer-Dy-Yun/galaxy-runner-canvas/actions/runs/27730760162`

`Invoke-WebRequest`로 아래 배포 파일을 읽어 로컬 파일과 CRLF/LF를 정규화한 내용을 비교했다.

| 배포 파일 | HTTP | 로컬과 정규화 내용 동일 |
|---|---:|---|
| `galaxy-runner.html` | 200 | 예 |
| `src/main.js` | 200 | 예 |

`.github/workflows/pages.yml:24-38`은 checkout 후 저장소 전체를 그대로 Pages artifact로 업로드한다. test, syntax check, browser smoke, build 단계는 없다. 따라서 workflow 성공은 **현재 HEAD가 배포됐다는 증거**이지, 동작 회귀가 자동 검출됐다는 증거가 아니다.

### 5. 실제 부트 순서와 격리 조합 재현

#### 코드상 실제 순서

`src/main.js`의 관련 순서는 다음과 같다.

1. `SceneManager`, `EngineRuntime` 생성 (`src/main.js:68-76`)
2. `DebugOverlay` 생성 후 `debugOverlay.attach(runtime)` (`src/main.js:77-84`)
3. `FrameProfiler` 생성 후 `frameProfiler.attach(...)` (`src/main.js:85-92`)
4. `runtime.start()` (`src/main.js:94`)

`DebugOverlay`의 UI flag가 false여도 `attach`는 항상 실행된다. `DebugOverlay.attach`는 `runtime.frame.bind(runtime)`을 저장한 뒤 arrow wrapper로 `runtime.frame`을 교체한다 (`src/engine/debug/debug-overlay.js:25-38`). 그다음 `FrameProfiler.attach`는 이미 교체된 `runtime.frame`을 `const originalFrame = runtime.frame`으로 저장하고 다시 wrapper로 교체한다 (`src/engine/debug/frame-profiler.js:27-74`).

현재 성공 호출 사슬은 다음과 같다.

```text
FrameClock callback
  -> EngineRuntime.runFrame
  -> FrameProfiler wrapper
  -> DebugOverlay arrow wrapper
  -> bound EngineRuntime.frame
  -> SceneManager.frame
  -> Game.frame
```

#### 실제 클래스 기반 조합 smoke

실제 `SceneManager`, `EngineRuntime`, `DebugOverlay`, `FrameProfiler`를 로드하고 stub game 및 1-frame fake clock을 사용해 `runtime.start()`를 실행했다. 전체 게임·DOM 재현이 아니라 **부트 조합의 호출 계약만 분리한 격리 smoke**다.

| 조합 | runtime | game frame | profiler sample | 오류 |
|---|---|---:|---:|---|
| 실제 순서 `DebugOverlay -> FrameProfiler` | running | 1 | 1 | 없음 |
| `FrameProfiler` 단독 | start rollback | 0 | 1 | `TypeError: Cannot read properties of undefined (reading 'normalizeFrameState')` |
| 역순 `FrameProfiler -> DebugOverlay` | start rollback | 0 | 1 | 같은 `TypeError` |

추가로 `FrameProfiler({ enabled: false })` 단독 연결 후 직접 frame 호출도 같은 `TypeError`가 발생했다. disabled profiler도 원본 frame을 호출하기 때문에 순서 위험을 제거하지 못한다.

원인은 `EngineRuntime.frame`이 `this.normalizeFrameState(...)`를 사용하는 인스턴스 메서드인데 (`src/engine/runtime/engine-runtime.js:44-69`), `FrameProfiler`가 이를 bind 없이 저장하고 일반 함수로 호출하기 때문이다 (`src/engine/debug/frame-profiler.js:32, 58-68`). 실제 부트에서는 앞서 설치된 DebugOverlay arrow wrapper가 우연히 `this` 보존 adapter 역할을 하므로 통과한다.

판정:

- **현재 실제 부트 순서:** 통과
- **현재 배포본 사용자 실행:** 아래 브라우저 실측에서 통과
- **FrameProfiler 독립 결합성:** 실패
- **연결 순서 교환 가능성:** 실패
- **모듈 하드닝:** 이 계약에 대해서는 미완료
- **현재 사용자 장애:** 아님

즉, “현재 게임이 실행된다”와 “디버그 모듈이 정상적이고 독립적인 계약으로 조합된다”는 동시에 참이 아니다. 실행 성공이 optional한 DebugOverlay의 선행 wrapper side effect에 의존한다.

### 6. 브라우저 실제 상태 전이 증거

이 항목은 **상위 Orchestrator가 2026-07-15 동일 배포 URL에서 직접 실측한 결과를 인계받은 것**이다. 이 Sub-Agent의 독립 브라우저 재현으로 표시하지 않는다. Sub-Agent 세션에서는 in-app browser 연결을 사용할 수 없어 독립 UI 자동화는 수행하지 못했다.

대상 URL:

`https://dreamer-dy-yun.github.io/galaxy-runner-canvas/galaxy-runner.html`

상위 실측 결과:

| 상태/동작 | 관측 결과 |
|---|---|
| 초기 `ready` | ready 화면 정상 렌더링 |
| `Space` 입력 | 게임 시작 |
| running 진행 | 약 1.8초 후 `DIST 79m` |
| 추가 진행 | `DIST 614m`, 적·투사체 표시, HP `36/100` 변화 |
| `P` 입력 | `PAUSED` 표시 |
| 콘솔 | error 0건, warning 0건 |

이 증거는 현재 부트 조합, 입력 진입점, running update/render, 전투 상태 변화, paused 전환이 실제 배포 브라우저에서 동작함을 지지한다. 다만 다음은 이 실측에 포함되지 않았다.

- paused 동안 distance/timer가 실제로 고정되는지
- paused -> running resume
- restart와 gameover -> continue
- debug flag on/off 양쪽의 장시간 실행
- asset load 실패, 느린 로드, tab background/foreground 복귀
- 브라우저·viewport 다양성

### 7. 현재 자동 검증 범위 대조

| 계약 | 현재 증거 | 자동 회귀 검출 |
|---|---|---|
| 개별 JS 문법 | 로컬 `node --check` 59개 통과 | CI에 없음 |
| HTML script 파일 존재 | 42/42 로컬 검사 통과 | CI에 없음 |
| 현재 HEAD 배포 | Pages run 성공, live entry 파일 일치 | 배포 단계만 있음 |
| 현재 부트 순서 | 조합 smoke 및 상위 브라우저 실측 통과 | 테스트 없음 |
| profiler 단독·역순 | 격리 smoke 실패 | 테스트 없음 |
| ready -> running -> paused | 상위 브라우저 실측 통과 | 테스트 없음 |
| 콘솔 error/warning 없음 | 상위 브라우저 실측 시 0건 | 테스트 없음 |
| pause freeze/resume/restart/continue | 미검증 | 테스트 없음 |

### 8. 필요한 회귀 테스트

#### P0 — 하드닝 완료 주장 전 필수: runtime instrumentation 조합 테스트

- `EngineRuntime` 단독 1-frame 실행
- Debug observer 단독 연결
- Profiler 단독 연결
- Debug + Profiler 양쪽 연결 순서
- observer disabled 상태의 완전한 투명성
- 한 frame당 scene frame 정확히 1회 호출
- 원래 frame의 `this`와 인수 보존
- 중복 attach와 detach/복구 계약
- 내부 scene 오류가 숨겨지지 않고 profiler 상태가 정리되는지

목표는 현재의 실패를 테스트에 고정하는 것이 아니라, 런타임 계약 TODO에서 결정한 observer/hook 계약을 기준으로 optional 진단 모듈의 유무·순서가 게임 실행 가능성을 바꾸지 않음을 검증하는 것이다.

#### P0 — 배포 전 필수: 실제 페이지 browser smoke

- `galaxy-runner.html` 로드와 `pageerror`, `console.error` 수집
- `ready -> Space -> running -> P -> paused -> P -> running`
- running에서 distance 증가, paused에서 distance 고정
- restart 후 상태·entity group 초기화
- 주요 asset 404와 script load 실패 0건
- debug flag off/on 각각 최소 smoke

Canvas 텍스트의 시각 판독만 사용하지 말고, 테스트가 읽을 수 있는 안정적인 상태 계약 또는 명시적 test/debug adapter를 먼저 정의해야 한다.

#### P0 — CI gate

- 저장소가 지원하는 package manager와 version을 명시한다.
- `test:run`과 정적 사이트 검증 진입점을 실제 script로 정의한다.
- build가 없는 설계를 유지한다면 `build`의 의미를 “배포 artifact 조립·참조 검증”처럼 검증 가능한 계약으로 명시한다. 단순 성공 no-op은 피한다.
- Pages artifact upload 전에 syntax, script-reference, unit/integration, browser smoke를 순서대로 실행한다.

#### P1 — session/input 단위 테스트

- `Space`가 start와 fire action을 만들되 ready에서 한 번만 start하는지
- `P`, `Escape`의 running/paused toggle
- key repeat가 중복 pressed action을 만들지 않는지
- ready/gameover에서 pause가 무시되는지
- restart, continue의 state와 field clear side effect

#### P1 — classic script 의존 순서 검사

- HTML의 42개 참조 존재뿐 아니라 각 script가 요구하는 global이 선행 제공되는지 확인한다.
- `main.js`의 동적 engine script 로드 실패가 boot catch와 콘솔에 드러나는지 확인한다.
- script 순서 변경 시 의미 있는 계약 오류가 발생하도록 한다.

#### P2 — 장시간·성능 회귀

- 일정 시간 autoplay 또는 deterministic simulation
- frame profiler sample/spike 상한, entity count 누수
- tab background/foreground 후 delta clamp와 입력 상태 복구

## 남은 이슈

1. `FrameProfiler`가 공개적으로 독립 attach 가능한 형태처럼 보이지만 실제로는 DebugOverlay 선행 attach가 없으면 첫 frame에서 실패한다. 이는 현재 실행 장애가 아니라 P0 하드닝 결함이다.
2. disabled 상태의 DebugOverlay도 `runtime.frame`을 교체하며, 그 side effect가 현재 profiler 실행을 성립시킨다. optional 진단 기능이 런타임 생존 조건이 된 상태다.
3. 자동 테스트, package script, repo 검증 script가 모두 없어 같은 문제가 재발해도 Pages workflow는 그대로 배포한다.
4. `node --check`와 파일 존재 검사는 현재 syntax/참조 누락만 잡으며 전역 초기화 순서와 브라우저 상태 전이를 보장하지 않는다.
5. 브라우저 실측은 상위 Orchestrator 증거이며 이 Sub-Agent가 독립 재현하지 못했다. 향후 CI browser smoke가 이 수동 의존을 대체해야 한다.
6. pause freeze/resume/restart/continue 및 장시간 안정성은 이번 증거로 확인되지 않았다.

## QA 확인 요청 사항

1. 런타임 계약 review에서 observer/hook 또는 wrapper 소유권을 먼저 확정한 뒤, 그 계약을 P0 조합 테스트의 기대값으로 사용해야 한다.
2. 후속 구현 TODO는 최소한 `runtime instrumentation 계약`, `test harness/package scripts`, `Pages CI gate`, `browser state smoke`를 파일 소유권이 겹치지 않게 분리해야 한다.
3. 현재 배포본은 usable로 판정할 수 있지만, 위 P0 테스트와 순서 의존 제거 전에는 runtime/debug 모듈을 hardening-complete로 판정하지 않아야 한다.
4. QA 종료 전 `git status`에서 이 review 외 코드·기존 문서 변경이 없는지 다시 확인해야 한다.
