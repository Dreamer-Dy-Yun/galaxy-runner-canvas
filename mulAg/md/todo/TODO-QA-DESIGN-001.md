# TODO-QA-DESIGN-001: 게임 기획과 사용자 경험 조사

## 목적

기술 구조 평가와 분리하여 현재 게임의 핵심 루프, 밸런스, 피드백, 화면 리듬과 접근성의 완성도를 조사한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`

## 작업 범위

- gameplay 문서와 실제 시스템 설정 대조
- ready, running, paused, game-over 흐름과 사용자 피드백 확인
- 무기, 방어, 적 패턴, 난이도 전개, 보상 루프 평가
- 코드 변경 없이 조사 review 작성

## 선행 조건

없음

## 수정 가능 파일

없음

## 생성 가능 파일

- `mulAg/md/review/REVIEW-QA-DESIGN-001.md`

## 읽기 전용 파일

- `docs/GAMEPLAY_SYSTEMS.md`
- `docs/PROJECT_STRUCTURE.md`
- `README.md`
- `src/gameplay/**`
- `src/systems/**`
- `src/entities/**`
- `src/ui/**`
- `src/renderers/**`
- `src/config.js`
- `src/main.js`
- `galaxy-runner.html`
- `mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`
- `mulAg/md/roles/sub-agent.md`
- `mulAg/md/roles/common-rules.md`
- `mulAg/md/templates/review-template.md`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- `.github/**`
- 위 생성 가능 파일을 제외한 모든 파일

## 입력

- 입력 파일: 위 읽기 전용 파일과 현재 배포 화면
- 입력 데이터 구조: 게임 상태, 밸런스 설정, UI 피드백, 문서화된 시스템 규칙
- 참조해야 할 함수/클래스: scene 상태 전이와 gameplay system 공개 함수
- 변경하지 말아야 할 인터페이스: 전체 코드·기획 계약

## 출력

- 생성/수정 파일: `mulAg/md/review/REVIEW-QA-DESIGN-001.md` 생성만 허용
- 반환 형식: 강점, 기획 문제, 사용자 영향, 근거, 우선순위 제안
- 외부에서 참조할 함수/클래스: 없음
- 유지해야 할 호환성: 코드와 기존 문서 무변경

## 작업 단계

- [ ] 1. 핵심 게임 루프와 상태 전이를 정리한다.
- [ ] 2. 기획 문서와 실제 코드 설정을 대조한다.
- [ ] 3. 플레이 피드백과 접근성 위험을 확인한다.
- [ ] 4. review 문서를 작성한다.

## 완료 기준

- 기술적 실행 여부와 게임 기획 완성도를 분리해 평가한다.
- 주요 판단마다 코드·문서·화면 근거 중 하나 이상을 제시한다.
- 작은 수정과 설계 결정이 필요한 변경을 구분한다.
- 코드 파일을 변경하지 않는다.

## 주의사항

- 개인 취향을 결함처럼 확정하지 않는다.
- 다른 Sub-Agent가 다른 TODO를 동시에 조사 중이다.
