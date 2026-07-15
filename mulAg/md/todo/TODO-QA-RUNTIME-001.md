# TODO-QA-RUNTIME-001: 런타임 구성과 모듈 계약 조사

## 목적

실제 부트 순서와 런타임 메서드 교체 구조를 역추적하여, 실행 성공이 명시적 계약인지 암묵적 순서 결합인지 판단한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`

## 작업 범위

- `src/main.js`부터 초기화와 frame 호출 흐름 역추적
- `EngineRuntime`, `DebugOverlay`, `FrameProfiler`의 attach/detach 및 `this` 계약 대조
- engine/gameplay 경계와 문서의 하드닝 주장 확인
- 코드 변경 없이 조사 review 작성

## 선행 조건

없음

## 수정 가능 파일

없음

## 생성 가능 파일

- `mulAg/md/review/REVIEW-QA-RUNTIME-001.md`

## 읽기 전용 파일

- `src/main.js`
- `src/engine/**`
- `src/gameplay/**`
- `src/systems/**`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/PROJECT_STRUCTURE.md`
- `src/engine/README.md`
- `src/engine/debug/README.md`
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

- 입력 파일: 위 읽기 전용 파일
- 입력 데이터 구조: ES module import와 runtime/scene 객체 조합
- 참조해야 할 함수/클래스: `EngineRuntime`, `DebugOverlay`, `FrameProfiler`, `bootstrap`
- 변경하지 말아야 할 인터페이스: 전체 코드 계약

## 출력

- 생성/수정 파일: `mulAg/md/review/REVIEW-QA-RUNTIME-001.md` 생성만 허용
- 반환 형식: 근거 파일/라인, 실제 호출 순서, 확인된 문제, 불확실성, 수정 방향
- 외부에서 참조할 함수/클래스: 없음
- 유지해야 할 호환성: 코드와 기존 문서 무변경

## 작업 단계

- [ ] 1. 부트와 frame 호출 흐름을 순서도로 정리한다.
- [ ] 2. 각 attach/detach의 입력, 출력, 부작용, 순서 전제를 확인한다.
- [ ] 3. 문서 계약과 실제 구현 차이를 severity와 함께 기록한다.
- [ ] 4. review 문서를 작성한다.

## 완료 기준

- 실제 배포 경로와 격리 재현의 차이가 설명된다.
- 순서 의존성이 확인/기각되고 근거 라인이 제시된다.
- 사용자 실행 장애와 유지보수·하드닝 위험이 분리된다.
- 코드 파일을 변경하지 않는다.

## 주의사항

- 비전형적 구현을 곧바로 실행 불가로 간주하지 않는다.
- 다른 Sub-Agent가 다른 TODO를 동시에 조사 중이다.
