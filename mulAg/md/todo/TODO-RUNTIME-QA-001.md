# TODO-RUNTIME-QA-001: Browser smoke, CI gate, 배포 검증

## 목적

핵심 상태 전이와 diagnostics 조합을 실제 브라우저에서 자동 검증하고, 성공한 SHA만 Pages에 배포한다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-15-runtime-hardening.md`

## 작업 범위

- Playwright 기반 정적 artifact browser smoke
- ready/running/paused/resume/restart와 debug on/off 확인
- Pages workflow에 install/test/build/browser gate 추가
- workflow와 프로젝트 검증 문서 동기화

## 선행 조건

- `TODO-RUNTIME-HARDEN-003` review 및 검증 통과

## 수정 가능 파일

- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/pages.yml`
- `.github/workflows/README.md`
- `README.md`
- `.gitignore`

## 생성 가능 파일

- `tests/browser-smoke.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-QA-001.md`

## 읽기 전용 파일

- `dist/**`
- `scripts/**`
- `src/**`
- `galaxy-runner.html`
- `galaxy-runner.css`
- `assets/**`
- `mulAg/md/plan/PLAN-2026-07-15-runtime-hardening.md`

## 수정 금지 파일

- `.git/**`
- `src/**`
- `assets/**`
- `docs/**`
- 위 수정/생성 가능 파일 밖의 파일

## 입력

- 입력 파일: Phase 1 build artifact, Phase 3 runtime status/diagnostics 계약
- 입력 데이터 구조: browser page state, console/page errors, workflow SHA
- 참조해야 할 함수/클래스: read-only `GalaxyRunnerStatus` snapshot
- 변경하지 말아야 할 인터페이스: keyboard controls와 Pages URL

## 출력

- 생성/수정 파일: package/workflow/browser test/docs/review
- 반환 형식: local test/build/browser 결과와 배포 workflow evidence
- 외부에서 참조할 함수/클래스: 없음
- 유지해야 할 호환성: main branch Pages 배포와 root URL

## 작업 단계

- [x] 1. browser smoke와 Playwright dependency를 추가한다.
- [x] 2. 로컬 test/build/browser 검증을 통과시킨다.
- [x] 3. Pages workflow가 동일 gate 후 `dist`를 배포하도록 갱신한다.
- [x] 4. 문서와 review를 작성한다.
- [x] 5. 전체 diff를 QA한 뒤 commit/push/deploy하고 SHA 증거를 확인한다.

## 완료 기준

- ready → running → paused → resume → restart가 브라우저에서 검증된다.
- pause 중 distance가 고정되고 resume 후 증가한다.
- debug off/on 모두 pageerror와 console error가 없다.
- workflow가 test/build/browser smoke 실패 시 artifact를 올리지 않는다.
- 배포된 workflow run과 live URL이 최종 commit SHA에 연결된다.

## 주의사항

- 배포는 모든 검증과 independent QA가 통과한 뒤 수행한다.
- workflow 성공과 live URL 접근을 별도 증거로 기록한다.
