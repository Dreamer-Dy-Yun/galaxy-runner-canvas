# TODO-ENGINE-001: 엔진 계약 및 책임 문서화

## 목적

엔진화 작업의 기준 계약을 먼저 문서화해 후속 서브에이전트가 같은 경계 위에서 작업하게 한다.

## 작업 범위

- `docs/ENGINE_ARCHITECTURE.md` 신규 작성
- `src/engine/README.md` 신규 또는 갱신
- `docs/PROJECT_STRUCTURE.md`에 엔진/게임 책임 경계 반영
- `mulAg/md/plan/PLAN-2026-05-18-engine-refactor.md`와 교차 참조 확인

## 포함할 내용

- 엔진 책임과 게임 책임
- scene lifecycle 계약
- input action mapping 계약
- world/entity 계약
- collision/render/asset helper 경계
- 하드닝 완료 모듈 수정 규칙

## 제외할 내용

- 실제 런타임 코드 분리
- asset 삭제 또는 startup picker 제거
- weapon/special balance 변경

## 완료 기준

- 후속 TODO가 문서만 보고 파일 책임과 금지 범위를 알 수 있다.
- 경계가 불명확한 부분은 임의 수정하지 않고 `남은 이슈`로 기록한다.
- `REVIEW-ENGINE-001.md`를 작성한다.
