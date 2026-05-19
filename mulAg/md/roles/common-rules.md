# Common Rules

## 파일 접근 권한

모든 todo에는 파일 접근 권한을 명시한다.

```text
수정 가능 파일
├── 해당 Sub-Agent가 직접 수정할 수 있는 파일

생성 가능 파일
├── 해당 Sub-Agent가 새로 만들 수 있는 파일

읽기 전용 파일
├── 참조 가능하지만 수정할 수 없는 파일

수정 금지 파일
└── 읽기, 수정, 삭제 모두 피해야 하는 파일
```

## 작업 단위

작업 단위는 가능한 작게 유지한다.

각 작업 단위는 상위 plan에서 todo로 분해되어야 하며, todo에는 참조 plan을 명시한다.

나쁜 예:

```text
TODO-001: 전체 백엔드 리팩토링
```

좋은 예:

```text
TODO-001: DB 연결 설정 분리
TODO-002: UserRepository 인터페이스 정리
TODO-003: 인증 미들웨어 책임 분리
```

단, 작업 단위를 작게 나누더라도 동일 파일을 여러 Sub-Agent가 동시에 수정하게 만들면 안 된다.

## 입력/출력 계약

Sub-Agent 간 연결이 필요한 경우 Orchestrator는 입력/출력 계약을 명시한다.

Orchestrator는 Sub-Agent 호출 시 해당 Sub-Agent가 참조할 todo 파일 경로를 직접 명시한다.

입력:

- 입력 파일
- 입력 데이터 구조
- 참조해야 할 함수/클래스
- 변경하지 말아야 할 인터페이스

출력:

- 생성/수정 파일
- 반환 형식
- 외부에서 참조할 함수/클래스
- 유지해야 할 호환성

## review 필수 항목

review에는 반드시 다음 항목을 포함한다.

```text
수행 일시
참조한 todo
수행 내용
변경 파일
생성 파일
검증 내용
남은 이슈
QA 확인 요청 사항
```

## done 처리

QA가 완료 기준을 만족한다고 판단한 경우에만 `done/`으로 이동한다.

`done/` 문서는 완료된 작업의 기록이며, 이후 동일 작업을 반복하지 않기 위한 기준 자료로 사용한다.

## 금지 사항

```text
금지 사항
├── todo에 없는 파일 수정
├── 수정 가능 파일에 없는 파일 수정
├── 생성 가능 파일에 없는 파일 생성
├── 동일 파일을 여러 Sub-Agent가 동시에 수정
├── 선행 조건이 완료되지 않은 후속 todo 수행
├── review 없이 done 처리
├── QA 검토 없이 plan/todo 임의 변경
└── 참조 todo 파일 없이 Sub-Agent에게 직접 구현 지시
```

## 최소 실행 예시

```text
1. 사용자가 plan/에 요구사항 작성
2. Orchestrator가 plan을 읽고 TODO-001.md, TODO-002.md 작성
3. Orchestrator가 각 Sub-Agent에게 참조할 todo 파일을 명시
4. Sub-Agent가 각 todo를 기준으로 작업 수행
5. Sub-Agent가 review/에 REVIEW-001.md 작성
6. QA가 review 검토
7. 문제가 없으면 done/으로 이동
8. 문제가 있으면 todo 또는 plan으로 되돌림
```
