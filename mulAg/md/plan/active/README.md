# plan/active

`plan/active/`는 Orchestrator가 현재 todo로 분해해야 하는 활성 계획을 보관하는 영역이다.

## 규칙

- Orchestrator는 `plan/active/` 문서를 우선 읽는다.
- 활성 계획을 todo로 분해할 때 각 todo의 `참조 plan`에 원본 active plan 경로를 명시한다.
- Sub-Agent에게는 active plan이 아니라 분해된 todo 파일 경로를 명시한다.
- 완료되었거나 보류된 계획은 필요에 따라 `plan/` 루트 또는 `done/` 기록에서 추적한다.
