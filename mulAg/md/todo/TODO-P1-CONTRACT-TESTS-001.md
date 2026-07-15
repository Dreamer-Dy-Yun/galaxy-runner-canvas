# TODO-P1-CONTRACT-TESTS-001: session/input와 classic script 계약 테스트

## 목적

P1 상태 전이와 classic global 제공 순서를 자동 회귀 테스트로 고정한다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 작업 범위

- input action, repeat, transient, session 전이 테스트
- 시작 선택, Restart, Continue, 방어 계약 테스트
- HTML classic script provider-before-consumer 검증
- 동적 engine script load 실패 가시성 검증

## 선행 조건

- `TODO-P1-RUN-CONTRACT-001`의 공개 계약 확정

## 수정 가능 파일

- `scripts/verify-static-site.mjs`
- `scripts/README.md`
- `tests/helpers/load-classic-scripts.mjs`
- `tests/README.md`

## 생성 가능 파일

- `scripts/classic-script-contract.mjs`
- `tests/session-input.test.mjs`
- `tests/run-rules.test.mjs`
- `tests/player-defense.test.mjs`
- `tests/classic-script-order.test.mjs`
- `mulAg/md/review/REVIEW-P1-CONTRACT-TESTS-001.md`

## 읽기 전용 파일

- `galaxy-runner.html`
- `src/**`
- `package.json`
- `.github/workflows/pages.yml`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- production code 전체
- 위 목록에 없는 기존 파일

## 작업 단계

- [x] 1. session/input와 run/defense 테스트를 작성한다.
- [x] 2. classic script 계약 manifest와 검증을 작성한다.
- [x] 3. static verifier에 순서 검증을 연결한다.
- [x] 4. targeted test와 전체 `test:run`을 통과한다.
- [x] 5. review를 작성한다.

## 완료 기준

- P1 상태·방어 규칙 변경이 의미 있는 테스트 실패로 드러난다.
- 누락, 중복, consumer 선행, main 위치 오류가 정적 검증에서 실패한다.
- 현재 HTML 순서와 동적 load failure 경로가 통과한다.
