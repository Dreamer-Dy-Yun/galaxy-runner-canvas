# plan

`plan/`은 요구사항, 설계, 재계획 문서를 보관하는 영역이다.

`plan/active/`는 현재 Orchestrator가 todo로 분해해야 하는 활성 계획을 보관하는 영역이다.

주 사용 역할:

- Orchestrator: `plan/active/`를 우선 읽고 작업 단위를 todo로 분해한다.
- QA: 설계 변경이 필요하다고 판단되면 plan을 갱신하거나 보완 요청을 남긴다.

참조 규칙:

- Sub-Agent는 plan을 직접 실행 기준으로 삼지 않는다.
- Sub-Agent에게 필요한 내용은 Orchestrator가 todo에 옮겨야 한다.
- plan 문서는 todo 생성의 근거로 사용된다.
- 활성 작업은 가능하면 `plan/active/`에 둔다.
- 각 todo는 어떤 plan에서 분해되었는지 `참조 plan`에 명시해야 한다.
- Orchestrator는 Sub-Agent에게 plan이 아니라 참조할 todo 파일을 명시한다.
- 동일 파일을 여러 Sub-Agent가 동시에 수정해야 하는 설계는 plan 단계에서 분리, 통합, 순차화 중 하나로 정리해야 한다.
- 선행 조건이 필요한 작업은 plan에서 근거를 남기고 todo에 명시해야 한다.
