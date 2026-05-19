# Multi Agents

이 디렉터리는 멀티 에이전트 방식으로 작업을 나누고 검토하기 위한 문서 공간이다.

핵심 원칙:

```text
역할 분리보다 파일 수정 권한 분리를 우선한다.
작업 단위는 작게 나눈다.
각 작업에는 수정 가능 파일, 생성 가능 파일, 읽기 전용 파일, 수정 금지 파일을 명시한다.
각 todo에는 참조 plan을 명시한다.
Orchestrator는 각 Sub-Agent에게 참조할 todo 파일을 명시한다.
Sub-Agent는 todo에 적힌 범위 밖의 파일을 수정하지 않는다.
동일 파일을 여러 Sub-Agent가 동시에 수정하지 않는다.
QA는 review를 검토하여 done 처리하거나 plan/todo로 되돌린다.
```

## 폴더 구조

```text
mulAg/md/
├── plan/       # 계획 관련 문서 보관 - Orchestrator 참조 영역
│   └── active/ # 현재 todo 분해 대상인 활성 계획
├── todo/       # 수행 예정 단위 문서 보관 - Sub-Agent 참조 영역
├── review/     # 수행 결과 보관 - QA 검토 대기 영역
├── done/       # 완료 내용 보관
├── roles/      # 역할별 책임과 운영 규칙
└── templates/  # todo/review 문서 템플릿
```

## 전체 작업 흐름

```text
plan/
└── 요구사항 또는 설계 문서
    ↓
Orchestrator
    ↓
todo/
├── TODO-001.md
├── TODO-002.md
└── TODO-003.md
    ↓
Sub-Agent
    ↓
review/
├── REVIEW-001.md
├── REVIEW-002.md
└── REVIEW-003.md
    ↓
QA
    ↓
done/
├── DONE-001.md
├── DONE-002.md
└── DONE-003.md
```

## 문서 구성

- [Orchestrator](roles/orchestrator.md)
- [Sub-Agent](roles/sub-agent.md)
- [QA](roles/qa.md)
- [Common Rules](roles/common-rules.md)
- [Todo Template](templates/todo-template.md)
- [Review Template](templates/review-template.md)

## 역할별 참조 문서

```text
Orchestrator
├── 필수 참조: roles/orchestrator.md
├── 필수 참조: roles/common-rules.md
├── 입력 참조: plan/active/*.md
├── 보조 입력 참조: plan/*.md
├── 작성 참조: templates/todo-template.md
└── 출력 위치: todo/TODO-*.md

Sub-Agent
├── 필수 참조: roles/sub-agent.md
├── 필수 참조: roles/common-rules.md
├── 입력 참조: todo/TODO-*.md
├── 작성 참조: templates/review-template.md
└── 출력 위치: review/REVIEW-*.md

QA
├── 필수 참조: roles/qa.md
├── 필수 참조: roles/common-rules.md
├── 입력 참조: review/REVIEW-*.md
├── 대조 참조: todo/TODO-*.md
├── 완료 출력: done/DONE-*.md
└── 보완 출력: todo/TODO-*.md 또는 plan/*.md
```

역할별 상세 참조 흐름은 [Role Reference Map](roles/role-reference-map.md)을 따른다.
