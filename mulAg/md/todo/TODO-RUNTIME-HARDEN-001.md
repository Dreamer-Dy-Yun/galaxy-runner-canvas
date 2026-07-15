# TODO-RUNTIME-HARDEN-001: 자동 검증과 정적 artifact 기반 마련

## 목적

현재 classic-script 정적 사이트에 반복 가능한 `test:run`과 실제 artifact를 만드는 `build` 계약을 추가한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`

## 작업 범위

- Node 내장 test runner 기반 검증 진입점
- JavaScript 문법과 HTML local script 참조 검사
- GitHub Pages에 올릴 `dist` 정적 artifact 조립
- 후속 runtime 테스트가 classic script를 격리 로드할 helper

## 선행 조건

- 사용자 하드닝 수정·배포 허가 완료

## 수정 가능 파일

없음

## 생성 가능 파일

- `package.json`
- `pnpm-lock.yaml`
- `.gitignore`
- `scripts/verify-static-site.mjs`
- `scripts/build-static-site.mjs`
- `tests/helpers/load-classic-scripts.mjs`
- `tests/runtime-baseline.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-001.md`

## 읽기 전용 파일

- `galaxy-runner.html`
- `index.html`
- `galaxy-runner.css`
- `.nojekyll`
- `src/**`
- `assets/**`
- `.github/workflows/pages.yml`
- `README.md`
- `mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`
- `mulAg/md/roles/sub-agent.md`
- `mulAg/md/roles/common-rules.md`
- `mulAg/md/templates/review-template.md`

## 수정 금지 파일

- `.git/**`
- `.github/**`
- `docs/**`
- 위 생성 가능 파일을 제외한 기존 파일 전체

## 입력

- 입력 파일: 현재 정적 runtime 파일과 HTML script 목록
- 입력 데이터 구조: classic script 전역 계약, 정적 Pages artifact
- 참조해야 할 함수/클래스: `EngineRuntime`, `SceneManager`
- 변경하지 말아야 할 인터페이스: 현재 게임 runtime 코드

## 출력

- 생성/수정 파일: 생성 가능 파일 목록
- 반환 형식: `pnpm run test:run`, `pnpm run build` 실행 결과와 생성 artifact
- 외부에서 참조할 함수/클래스: classic script test loader helper
- 유지해야 할 호환성: build 전 원본 정적 사이트 동작과 Pages 경로

## 작업 단계

- [x] 1. package manager와 script 계약을 정의한다.
- [x] 2. syntax/script-reference 검증과 static build script를 작성한다.
- [x] 3. classic script 격리 loader와 현재 baseline 테스트를 작성한다.
- [x] 4. `pnpm run test:run`, `pnpm run build`를 통과시킨다.
- [x] 5. review를 작성한다.

## 완료 기준

- test/build 명령이 no-op가 아니며 현재 저장소에서 반복 실행된다.
- `dist`에는 실행에 필요한 HTML, CSS, `src`, `assets`, `.nojekyll`이 있다.
- 현재 runtime 코드는 변경하지 않는다.
- review에 실행 명령과 결과를 기록한다.

## 주의사항

- asset과 source를 삭제하거나 변경하지 않는다.
- 후속 observer 계약을 미리 구현하지 않는다.
