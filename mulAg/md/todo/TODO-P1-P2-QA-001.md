# TODO-P1-P2-QA-001: P1/P2 독립 QA와 배포 판정

## 목적

구현자가 아닌 관점에서 P1/P2 계약, 접근성, capacity, 문서, diff를 재검토하고 배포 가능 여부를 판정한다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 작업 범위

- current HEAD와 전체 diff 확인
- P1/P2 acceptance matrix 대조
- 테스트·build·browser·soak 증거 검토
- 300라인, 책임 README, 의도하지 않은 변경 확인

## 선행 조건

- P1/P2 구현 TODO와 1차 검증 완료

## 수정 가능 파일

없음

## 생성 가능 파일

- `mulAg/md/review/REVIEW-P1-P2-QA-001.md`

## 읽기 전용 파일

- `src/**`
- `tests/**`
- `scripts/**`
- `docs/**`
- `README.md`
- `galaxy-runner.html`
- `galaxy-runner.css`
- `package.json`
- `.github/**`
- 관련 plan/TODO/review

## 수정 금지 파일

- `.git/**`
- 위 review를 제외한 모든 파일

## 작업 단계

- [x] 1. 기준 HEAD와 diff scope를 확인한다.
- [x] 2. P1/P2 acceptance matrix를 재검토한다.
- [x] 3. 검증 명령을 독립 실행한다.
- [x] 4. PASS/FAIL과 잔여 위험을 review에 기록한다.

## 완료 기준

- 구현 성공 주장과 실제 증거가 분리되어 있다.
- 실패가 있으면 배포를 중단할 구체적 이유가 기록된다.
- PASS이면 의도한 diff, 문서 정합성, 모든 gate 통과가 확인된다.
