# REVIEW-RUNTIME-QA-001: Browser smoke와 Pages 배포 gate

## 대상

- TODO: `mulAg/md/todo/TODO-RUNTIME-QA-001.md`
- 범위: Playwright dependency, browser smoke, Pages workflow, 관련 README
- 제외: 실제 commit/push, Pages workflow run, live URL SHA 확인

## 이벤트 리스트와 흐름

1. 문서 load
   - `dist/galaxy-runner.html`을 임시 `127.0.0.1` port에서 제공한다.
   - classic scripts가 `src/main.js`까지 로드되고 runtime이 시작되면 `GalaxyRunnerStatus()`가 `ready`와 `runtimeRunning: true`를 반환한다.
2. Space start
   - Playwright keyboard → `InputController` → `GameSessionSystem.start` → `state.mode = running`.
   - `GameLoopSystem.update`가 distance를 증가시키고 status snapshot으로 관찰한다.
3. P pause/resume
   - Playwright keyboard → pause action → `GameSessionSystem.togglePause`.
   - paused 구간에는 `GameLoopSystem.update`가 진행되지 않아 distance가 고정되고, 재입력 후 다시 증가한다.
4. Restart button
   - DOM click → restart action → `game.reset()` → `game.start()`.
   - 같은 event task에서 running과 distance 0을 status snapshot으로 확인한다.
5. debug off/on
   - query 없음과 `?debug=1`을 격리된 browser context에서 각각 로드한다.
   - 두 경우 모두 runtime/profiler 실행과 pageerror, console.error, request failure, 모든 HTTP 4xx/5xx 응답 부재를 확인한다.
6. Pages gate
   - frozen install → test:run → build → Chromium install → test:browser 성공 후에만 `dist` configure/upload/deploy 단계로 진입한다.

## 책임 경계 확인

- browser smoke는 공개 read-only `GalaxyRunnerStatus()`만 읽고 실제 keyboard/button 입력만 발생시킨다.
- gameplay 객체를 노출·변조하거나 테스트 전용 제어 API를 추가하지 않았다.
- HTTP server는 `dist` 밖 경로를 거부하고 OS가 배정한 port 0을 사용한다.
- browser context, Chromium, HTTP server는 실패 여부와 관계없이 `finally`에서 정리한다.
- workflow는 repository root가 아니라 검증된 `dist`만 배포한다.
- `scripts/README.md`와 `tests/README.md`가 새 검증 폴더의 주요 파일 책임과 실행 경계를 고정한다.

## 로컬 검증

- Playwright dependency: `playwright@1.61.1` (`devDependency`, pnpm lockfile 동기화)
- `corepack pnpm install --frozen-lockfile`: lockfile 변경 없이 성공
- `corepack pnpm run test:run`: 20/20 통과, static 66 JS·2 HTML·42 local script reference 검증
- `corepack pnpm run build`: 성공, `dist` 147 files·13,586,365 bytes 및 artifact 59 JS·42 local script reference 검증
- `corepack pnpm exec playwright install chromium`: Chromium/Headless Shell 149.0.7827.55 설치 성공
- `corepack pnpm run test:browser`: debug off/on 두 시나리오 통과
- `tests/browser-smoke.mjs` line count: 170줄, 300줄 제한 충족

## 남은 배포 증거

- 최종 commit SHA와 `origin/main` SHA 일치
- 해당 SHA로 실행된 `pages.yml` run URL과 성공 conclusion
- Pages deployment environment가 보고한 URL
- cache-busted live URL의 HTTP 성공과 실제 browser smoke

## 판정

**PASS (local gate).** 요구된 static/unit/build/browser 검증은 모두 통과했다. 실제 Pages 배포 증거는 commit/push 뒤 별도 기록한다.
