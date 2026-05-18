# TODO-005: 멀티 에이전트 거버넌스 및 폴더 문서 정비

## 목적

- 향후 작업의 지속 가능성을 위해 폴더/모듈 문서화를 최신화한다.
- Plan/todo/review/done 흐름을 실수 없이 계속 사용할 수 있는 운영 규칙을 보강한다.

## 상태 추적 (2026-05-18)

- 진행 상태: 진행중(문서 정비 실행)
- 증빙: 현재 작업에서 `mulAg/md` 하위 README/Plan/Todo/Review/DONE 규격 및 `docs/PROJECT_STRUCTURE.md` 동기화 예정
- 완료 전 조건: 각 todo와 review 상태의 추적이 README 간 일관적으로 보이도록 갱신
- 경계 판단: 코드 수정은 금지이며, `PLAN-2026-05-18-game-improvement.md` 및 `todo/*`의 구조 변경은 최소화.

## 작업 범위

- `mulAg` 하위 운영 문서의 최신 상태 반영.
- 주요 `src` 폴더별 책임 문서(`PROJECT_STRUCTURE` 및 모듈별 요약) 보완.
- 각 폴더/파일 레벨 역할 설명을 300줄 제한과 책임 분리 규칙 내에서 정리.

## 수정 가능 파일

- `mulAg/md/README.md`
- `mulAg/md/plan/README.md`
- `mulAg/md/todo/README.md`
- `mulAg/md/review/README.md`
- `mulAg/md/done/README.md`
- `docs/PROJECT_STRUCTURE.md`

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`
- `src` 코드 전체
- `README.md` (루트)

# 수정 금지 파일

- `mulAg/md/done/*` (완료 기록 원본)
- `mulAg/md/review/*` (미완료 리뷰 원본)

## 입력

- 입력 파일:
  - [Plan 문서](D:/PROJ/galaxy-runner-canvas/mulAg/md/plan/PLAN-2026-05-18-game-improvement.md)
  - `mulAg/md/roles/*`
- 입력 데이터 구조:
  - 폴더별 역할·권한 맵, todo 템플릿
- 참조해야 할 문서/섹션:
  - `mulAg/md/roles/orchestrator.md`
  - `mulAg/md/roles/sub-agent.md`
  - `mulAg/md/roles/qa.md`
  - `mulAg/md/roles/common-rules.md`
- 변경하지 말아야 할 인터페이스:
  - `todo`와 `review`의 템플릿 스키마(필수 항목 구조)

## 출력

- 생성/수정 파일:
  - `mulAg/md/README.md`
  - `mulAg/md/plan/README.md`
  - `mulAg/md/todo/README.md`
  - `mulAg/md/review/README.md`
  - `mulAg/md/done/README.md`
  - `docs/PROJECT_STRUCTURE.md`
- 반환 형식:
- 변경된 문서 내 역할-권한 표와 완료 기준 표준 템플릿
- 외부에서 참조할 함수/클래스:
  - 없음 (문서 중심 작업)
- 유지해야 할 호환성:
  - 문서 템플릿과 폴더 룰의 하위 호환 유지

## 작업 단계

- [ ] 폴더/파일 책임 문서를 읽기용 기준으로 업데이트
- [ ] 각 todo의 완성 기준 템플릿 체크 항목 정합성 점검
- [ ] review/done 이동 규칙을 운영 체크리스트로 정리
- [ ] 프로젝트 구조 문서를 실제 폴더 구조와 정렬
- [ ] 완료 후 문서 간 교차 참조 링크 일관성 점검

## 완료 기준

- `mulAg` 하위 문서가 같은 기준으로 해석되며, 신규 todo 생성 시 애매한 파일 권한이 줄어든다.
- TODO 001~004의 수행/검수 기준이 문서로 추적 가능하다.
- `PROJECT_STRUCTURE.md`와 실제 폴더 구조가 크게 어긋나지 않는다.

## 주의사항

- Done/Review 기록 문서는 실수로 덮어쓰지 않는다.
- 문서만 수정하는 작업이므로 코드 동작 변경을 직접 수행하지 않는다.
