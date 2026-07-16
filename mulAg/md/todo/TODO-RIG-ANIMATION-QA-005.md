# TODO: 공통 Rig 애니메이션 엔진 통합 QA

## 목적

공통 engine, 자산 contract, Player adapter, opening route 선택이 같은 계약을 사용하며 게임별 예외 구현이 남지 않았는지 독립 검증한다.

## 참조 plan

- `mulAg/md/plan/PLAN-2026-07-16-opening-player-animation-redesign.md`

## 작업 범위

- engine 게임 비종속성과 공개 API 검증
- exception/fallback/interruption/reduced-motion 검증
- Player adapter와 opening 통합 계약 검증
- 자산 manifest/pivot/alpha/visual phase 검증
- line count, docs, script order, test/build/browser/soak 검증

## 실행 조건

- TODO-001~004 review가 모두 작성된 뒤 실행한다.
- QA 중 구현 파일을 수정하지 않는다. 실제 문제는 새 corrective TODO로 반환한다.

## 수정 가능한 파일

- 없음

## 생성 가능한 파일

- `mulAg/md/review/REVIEW-RIG-ANIMATION-QA-005.md`

## 읽기 전용 파일

- TODO-001~004의 모든 생성/수정 파일
- TODO-001~004 review
- 참조 plan
- 관련 tests, docs, assets

## 수정 금지 파일

- review 출력 파일을 제외한 프로젝트 전체

## 입력

- 입력 파일: 참조 plan, TODO/review, 전체 diff, 관련 code/docs/assets/tests
- 입력 데이터 구조: engine/adapter/frame/run phase snapshots
- 참조해야 할 함수/클래스: `RigAnimationEngine`, `RigAnimationRenderer`, `PlayerRigAnimationAdapter`
- 변경하지 말아야 할 인터페이스: QA는 read-only

## 출력

- 생성 파일: `REVIEW-RIG-ANIMATION-QA-005.md`
- 반환 형식: PASS 또는 corrective TODO가 필요한 FAIL
- 외부에서 참조할 근거: 명령 결과, file/line, browser screenshot/check
- 유지해야 할 인터페이스: plan의 완료 기준과 repo 검증 gate

## 작업 단계

- [x] 1. engine source와 adapter의 token/branch 경계를 검사한다.
- [x] 2. 모든 exception/fallback contract test를 확인한다.
- [x] 3. asset manifest와 시각 phase를 검증한다.
- [x] 4. opening/route lock/Restart/Continue를 브라우저에서 검증한다.
- [x] 5. test/build/browser/soak, diff, line count, docs를 검증한다.
- [x] 6. PASS 또는 corrective TODO 근거를 review에 기록한다.

## 완료 기준

- 모든 애니메이션이 공통 engine API를 사용한다.
- feature adapter에 독자 phase timer/diff/easing/fallback 알고리즘이 없다.
- fallback은 실패를 성공처럼 숨기지 않고 degraded/error를 노출한다.
- gameplay state와 animation state가 분리된다.
- 기본 기체, route lock, bank, assembly transition이 브라우저에서 확인된다.
- `pnpm run test:run`, `pnpm run build`, `pnpm run test:browser`, `pnpm run test:soak`가 통과한다.
- 신규 code가 300라인 이하이고 기존 대형 파일이 증가하지 않는다.

## 주의사항

- QA 실패를 review 문구로만 완화하지 않는다.
- 예외가 발견되면 feature 분기가 아니라 engine primitive/profile 확장 corrective TODO를 요구한다.
