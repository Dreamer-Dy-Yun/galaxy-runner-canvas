# TODO-RUNTIME-HARDEN-003: Diagnostics observer 전환

## 목적

`DebugOverlay`와 `FrameProfiler`의 runtime/scene monkey patch를 제거하고 측정과 표시 책임을 분리한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`

## 작업 범위

- 두 diagnostics 모듈의 subscribe/unsubscribe 전환
- profiler의 frame/update/draw phase 측정
- overlay가 profiler snapshot을 표시하도록 책임 이동
- main bootstrap의 순서 독립적 diagnostics 조립과 상태 snapshot 계약
- debug 문서 동기화

## 선행 조건

- `TODO-RUNTIME-HARDEN-002` review 및 검증 통과

## 수정 가능 파일

- `src/engine/debug/debug-overlay.js`
- `src/engine/debug/frame-profiler.js`
- `src/engine/debug/README.md`
- `src/main.js`
- `src/README.md`

## 생성 가능 파일

- `tests/runtime-diagnostics.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-003.md`

## 읽기 전용 파일

- `src/engine/runtime/engine-runtime.js`
- `src/engine/scenes/**`
- `src/engine/game.js`
- `tests/helpers/load-classic-scripts.mjs`
- `tests/runtime-observer.test.mjs`
- `package.json`
- `docs/ENGINE_ARCHITECTURE.md`
- `mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`

## 수정 금지 파일

- `.git/**`
- `.github/**`
- `assets/**`
- `src/gameplay/**`
- `src/entities/**`
- 위 수정/생성 가능 파일 밖의 파일

## 입력

- 입력 파일: Phase 2 observer API와 기존 diagnostics 모듈
- 입력 데이터 구조: runtime phase events와 profiler snapshot
- 참조해야 할 함수/클래스: `EngineRuntime.subscribe`, `DebugOverlay`, `FrameProfiler`
- 변경하지 말아야 할 인터페이스: `GalaxyRunnerDebug`와 `GalaxyRunnerFrameProfiler` console 진입점

## 출력

- 생성/수정 파일: 지정 debug/main/docs/test/review 파일
- 반환 형식: 순서 독립적 attach/detach와 실제 phase metric
- 외부에서 참조할 함수/클래스: diagnostics `attach`, `detach`, `enable`, `disable`, `snapshot`
- 유지해야 할 호환성: `?debug=1` 표시와 기본 비활성 UI

## 작업 단계

- [x] 1. profiler를 순수 phase 측정 observer로 바꾼다.
- [x] 2. overlay를 표시 observer로 바꾸고 profiler snapshot을 소비한다.
- [x] 3. main 조립과 read-only runtime status snapshot을 정리한다.
- [x] 4. 양 연결 순서, disabled, detach, 실제 metric 테스트를 추가한다.
- [x] 5. 문서와 review를 갱신하고 전체 검증을 통과시킨다.

## 완료 기준

- diagnostics가 runtime/scene 메서드를 교체하지 않는다.
- profiler 단독·overlay 단독·양 순서가 모두 실행된다.
- synthetic workload에서 update/draw metric이 0보다 크다.
- detach 뒤 observer 호출이 멈추고 gameplay는 계속된다.
- 기본 페이지와 `?debug=1` 페이지가 모두 동작한다.

## 주의사항

- profiler에 Canvas drawing 책임을 남기지 않는다.
- runtime 파일을 수정하지 않는다.
