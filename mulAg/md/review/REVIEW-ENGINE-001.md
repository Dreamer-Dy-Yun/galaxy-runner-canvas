# REVIEW-ENGINE-001: 엔진 계약 및 책임 문서화

## 작업 일시

2026-05-18

## 기준 문서

- `mulAg/md/plan/PLAN-2026-05-18-engine-refactor.md`
- `mulAg/md/todo/TODO-ENGINE-001.md`

## 작업 범위

- 엔진 책임과 Galaxy Runner 게임 책임 문서화
- scene lifecycle 계약 문서화
- input action mapping 계약 문서화
- world/entity 계약 문서화
- collision/render/asset/debug helper 경계 문서화
- 하드닝 완료 모듈 수정 규칙 문서화
- 코드 변경 없음

## 변경 파일

- `docs/ENGINE_ARCHITECTURE.md`: 엔진 아키텍처 기준 계약 신규 작성
- `src/engine/README.md`: `src/engine` 폴더 책임과 금지 범위 신규 작성
- `docs/PROJECT_STRUCTURE.md`: 엔진/게임 책임 경계만 최소 반영
- `mulAg/md/review/REVIEW-ENGINE-001.md`: TODO-ENGINE-001 review 신규 작성

## 결정한 경계

- 엔진은 canvas/context/DPR, RAF loop, dt, scene lifecycle, action mapping input, world/entity 보관, collision primitive/query, render helper, asset preload, debug hook만 소유한다.
- Galaxy Runner는 weapon/special/item/enemy/boss/score/stage/continue/HUD/player final-form 정책을 소유한다.
- Scene은 `enter`, `update`, `draw`, `exit` 계약을 따르며 RAF, DOM input listener, canvas lifetime을 직접 소유하지 않는다.
- Input은 raw key가 아니라 action snapshot으로 scene과 system에 전달한다.
- Collision helper는 후보와 교차 여부만 제공하고 damage, score, drop, 무기별 hit effect는 게임 책임으로 둔다.
- Asset helper는 load/error 상태를 드러내고, 필수 asset 실패를 성공처럼 감추지 않는다.

## 검증

- 런타임 코드 변경이 없어 테스트와 빌드는 실행하지 않았다.
- 문서 작업만 수행했으며 asset 삭제, startup picker 제거, weapon/special balance 변경은 하지 않았다.

## 남은 이슈

- 계획 문서 기준으로 현재 `Game` 중심 구조가 남아 있으므로 `TODO-ENGINE-002` 이후 실제 runtime 분리가 필요하다.
- Scene 전환의 stack/pause/resume 세부 정책은 아직 확정하지 않았고 `TODO-ENGINE-003`에서 결정이 필요하다.
- Entity group 이름, collision layer/mask 목록, render order의 실제 등록 방식은 `TODO-ENGINE-004` 구현 시 확정해야 한다.
- Asset manifest 위치와 필수 asset 실패 UI는 `TODO-ENGINE-005`에서 구체화해야 한다.

## QA 확인 요청 사항

- 후속 코드 TODO에서 문서 계약과 실제 import 방향이 맞는지 확인이 필요하다.
- 하드닝 완료로 표시할 모듈이 생기면 해당 파일 README 또는 관련 문서에 공개 API와 수정 허가 규칙을 추가해야 한다.
