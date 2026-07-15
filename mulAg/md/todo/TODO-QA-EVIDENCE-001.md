# TODO-QA-EVIDENCE-001: 테스트와 실제 실행 증거 조사

## 목적

현재 테스트가 실제 부트 조합과 게임 상태 전이를 얼마나 검증하는지 확인하고, 격리 재현과 브라우저 실행 증거를 분리한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`

## 작업 범위

- package script, 테스트 파일, 빌드·정적 검증 경로 확인
- 실제 부트와 모듈 단독 조합을 구분한 재현
- ready → running → paused 핵심 상태와 콘솔 오류 확인
- 테스트 사각지대와 필요한 회귀 테스트 제안
- 코드 변경 없이 조사 review 작성

## 선행 조건

없음

## 수정 가능 파일

없음

## 생성 가능 파일

- `mulAg/md/review/REVIEW-QA-EVIDENCE-001.md`

## 읽기 전용 파일

- `package.json`
- `pnpm-lock.yaml`
- `scripts/**`
- `tests/**`
- `src/**`
- `galaxy-runner.html`
- `.github/workflows/**`
- `README.md`
- `mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`
- `mulAg/md/roles/sub-agent.md`
- `mulAg/md/roles/common-rules.md`
- `mulAg/md/templates/review-template.md`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- 위 생성 가능 파일을 제외한 모든 파일

## 입력

- 입력 파일: 위 읽기 전용 파일과 현재 GitHub Pages 배포본
- 입력 데이터 구조: npm/pnpm scripts, 테스트 suite, 브라우저 상태와 콘솔 로그
- 참조해야 할 함수/클래스: 실제 bootstrap과 상태 전이 진입점
- 변경하지 말아야 할 인터페이스: 전체 코드·배포 계약

## 출력

- 생성/수정 파일: `mulAg/md/review/REVIEW-QA-EVIDENCE-001.md` 생성만 허용
- 반환 형식: 실행 명령, 성공/실패, 검증 범위, 미검증 영역, 필요한 테스트
- 외부에서 참조할 함수/클래스: 없음
- 유지해야 할 호환성: 코드와 기존 문서 무변경

## 작업 단계

- [ ] 1. 테스트와 빌드 명령의 실제 존재 여부를 확인한다.
- [ ] 2. 현재 자동 검증 범위와 실제 부트 조합을 대조한다.
- [ ] 3. 핵심 브라우저 상태 전이를 확인한다.
- [ ] 4. review 문서를 작성한다.

## 완료 기준

- 실행한 명령과 결과가 구체적으로 기록된다.
- 실제 부트 경로와 격리 테스트 결과가 섞이지 않는다.
- 현재 테스트가 잡지 못하는 실패가 우선순위와 함께 제시된다.
- 코드 파일을 변경하지 않는다.

## 주의사항

- 테스트 부재를 곧바로 사용자 실행 실패로 확대하지 않는다.
- 다른 Sub-Agent가 다른 TODO를 동시에 조사 중이다.
