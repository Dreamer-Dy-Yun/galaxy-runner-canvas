# Role Reference Map

이 문서는 각 역할이 어떤 Markdown 문서를 기준으로 움직이는지 연결한다.

## Orchestrator

읽는 문서:

- `mulAg/md/roles/orchestrator.md`
- `mulAg/md/roles/common-rules.md`
- `mulAg/md/plan/*.md`

작성하는 문서:

- `mulAg/md/todo/TODO-*.md`

사용하는 템플릿:

- `mulAg/md/templates/todo-template.md`

직접 처리하지 않는 문서:

- `mulAg/md/review/*.md`
- `mulAg/md/done/*.md`

## Sub-Agent

읽는 문서:

- `mulAg/md/roles/sub-agent.md`
- `mulAg/md/roles/common-rules.md`
- 자신에게 할당된 `mulAg/md/todo/TODO-*.md`

작성하는 문서:

- `mulAg/md/review/REVIEW-*.md`

사용하는 템플릿:

- `mulAg/md/templates/review-template.md`

직접 처리하지 않는 문서:

- `mulAg/md/plan/*.md`
- 자신에게 할당되지 않은 `mulAg/md/todo/*.md`
- `mulAg/md/done/*.md`

## QA

읽는 문서:

- `mulAg/md/roles/qa.md`
- `mulAg/md/roles/common-rules.md`
- `mulAg/md/review/REVIEW-*.md`
- review에 연결된 `mulAg/md/todo/TODO-*.md`

작성하는 문서:

- 완료 시: `mulAg/md/done/DONE-*.md`
- 보완 필요 시: `mulAg/md/todo/TODO-*.md`
- 설계 변경 필요 시: `mulAg/md/plan/*.md`

직접 처리하지 않는 문서:

- Sub-Agent의 실제 코드 수정 대상 파일
- todo에 명시된 수정 금지 파일

## 연결 규칙

- todo 문서는 반드시 참조 plan을 명시한다.
- todo 문서는 반드시 선행 조건, 수정 가능 파일, 생성 가능 파일, 읽기 전용 파일, 수정 금지 파일을 명시한다.
- review 문서는 반드시 참조 todo를 명시한다.
- done 문서는 반드시 원본 review와 todo를 추적할 수 있어야 한다.
- Sub-Agent가 참조해야 할 추가 문서가 있으면 todo의 `읽기 전용 파일`에 명시한다.
- 동일 파일을 여러 Sub-Agent가 동시에 수정하는 작업은 금지한다.
