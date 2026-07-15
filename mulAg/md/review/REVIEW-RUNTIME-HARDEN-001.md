# REVIEW: 자동 검증과 정적 artifact 기반 마련

## 수행 일시

2026-07-16 00:06:36

- 후속 자동 탐색 보완 검증: 2026-07-16 00:09:06

## 참조한 todo

- `mulAg/md/todo/TODO-RUNTIME-HARDEN-001.md`

## 수행 내용

- Node `>=22.0.0`, pnpm `11.8.0` package manager 계약과 `verify:static`, `test:run`, `build` 명령을 정의했다.
- `test:run`은 특정 파일을 나열하지 않고 `node --test`의 기본 탐색으로 현재와 후속 `*.test.mjs` 테스트를 모두 실행한다.
- 저장소의 JavaScript 문법과 HTML의 local script 참조를 검사하는 정적 검증기를 추가했다.
- 원본 정적 사이트를 변경하지 않고 `dist`에 Pages용 artifact를 새로 조립하는 build script를 추가했다.
- classic script를 별도 `vm` context에 순서대로 로드하는 테스트 helper를 추가했다.
- 현재 `EngineRuntime`과 `SceneManager`의 전역 노출, frame 전달, zero-delta 처리, start/stop 위임을 baseline 테스트로 고정했다.

## 변경 파일

- 없음. TODO의 기존 읽기 전용 파일은 변경하지 않았다.

## 생성 파일

- `package.json`
- `pnpm-lock.yaml`
- `.gitignore`
- `scripts/verify-static-site.mjs`
- `scripts/build-static-site.mjs`
- `tests/helpers/load-classic-scripts.mjs`
- `tests/runtime-baseline.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-001.md`
- `dist/` — `pnpm run build`가 생성하는 ignored artifact이며 커밋 대상이 아니다.

## 미변경 파일

- `galaxy-runner.html`, `index.html`, `galaxy-runner.css`, `.nojekyll`
- `src/**`, `assets/**`
- `.github/workflows/pages.yml`
- `README.md`
- 참조 plan, role, template 및 TODO 문서

## 검증 내용

실행 환경:

- Node.js `v24.14.0`
- pnpm `11.8.0` (`corepack` 경유)

실행 명령과 결과:

1. `corepack pnpm install --lockfile-only`
   - exit code `0`
   - 의존성 없는 lockfile 생성 완료
2. `corepack pnpm run test:run`
   - exit code `0`
   - JavaScript `63`개 문법 검사 통과
   - HTML `2`개와 local script 참조 `42`개 검사 통과
   - `node --test` 자동 탐색으로 Node baseline test `4`개 통과, 실패 `0`
3. `corepack pnpm run build`
   - exit code `0`
   - `dist` artifact `147`개 파일, `13,573,539` bytes 조립
   - source JavaScript `63`개와 artifact JavaScript `59`개 문법 검사 통과
   - artifact local script 참조 `42`개 검사 통과
4. artifact 필수 항목 확인
   - `dist/index.html`, `dist/galaxy-runner.html`, `dist/galaxy-runner.css`, `dist/.nojekyll` 존재
   - `dist/src`, `dist/assets` 존재
5. `git diff -- src galaxy-runner.html index.html galaxy-runner.css .github README.md`
   - 출력 없음. 기존 runtime, 정적 진입점, workflow, README 변경 없음.

## 남은 이슈

- 이번 baseline은 현재 runtime 계약만 고정한다. observer 조합, attach/detach, 연결 순서 회귀 테스트는 후속 runtime/debug TODO에서 추가해야 한다.
- `.github/workflows/pages.yml`은 아직 저장소 루트 전체를 업로드하며 `test:run`과 `build`를 배포 gate로 사용하지 않는다. workflow는 이번 TODO에서 읽기 전용이므로 후속 Pages QA 범위에 남긴다.
- `README.md`의 “No build step is required” 설명은 새 검증/build 계약과 맞지 않지만 읽기 전용 범위라 이번 작업에서는 갱신하지 않았다.

## QA 확인 요청 사항

- `corepack pnpm run test:run`과 `corepack pnpm run build`를 독립 환경에서 반복 실행해 결과가 동일한지 확인한다.
- `dist`가 커밋 대상에서 제외되고, 후속 workflow가 검증을 통과한 `dist`만 배포하도록 연결되는지 확인한다.
- 후속 observer 구현이 baseline의 frame 전달과 start/stop 계약을 깨지 않는지 확인한다.
