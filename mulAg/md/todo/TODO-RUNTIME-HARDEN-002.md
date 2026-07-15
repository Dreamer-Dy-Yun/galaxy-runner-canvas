# TODO-RUNTIME-HARDEN-002: Canonical frame과 observer 계약 구현

## 목적

`EngineRuntime`을 유일한 frame/phase 소유자로 만들고, 메서드 교체 없이 진단 모듈이 구독할 수 있는 observer 계약을 구현한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`

## 작업 범위

- frame/update/draw/afterFrame 호출 순서 단일화
- subscribe/unsubscribe, 중복 등록, 오류 격리 계약
- input transient cleanup을 scene afterFrame으로 이동
- core runtime 회귀 테스트와 문서 동기화

## 선행 조건

- `TODO-RUNTIME-HARDEN-001` review 및 검증 통과

## 수정 가능 파일

- `src/engine/runtime/engine-runtime.js`
- `src/engine/scenes/scene.js`
- `src/engine/scenes/scene-manager.js`
- `src/engine/game.js`
- `src/engine/runtime/README.md`
- `src/engine/scenes/README.md`
- `docs/ENGINE_ARCHITECTURE.md`

## 생성 가능 파일

- `tests/runtime-observer.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-002.md`

## 읽기 전용 파일

- `src/main.js`
- `src/engine/debug/**`
- `tests/helpers/load-classic-scripts.mjs`
- `tests/runtime-baseline.test.mjs`
- `package.json`
- `mulAg/md/plan/active/PLAN-2026-07-15-runtime-hardening.md`

## 수정 금지 파일

- `.git/**`
- `.github/**`
- `assets/**`
- `src/engine/debug/**`
- `src/gameplay/**`
- `src/entities/**`
- 위 수정/생성 가능 파일 밖의 파일

## 입력

- 입력 파일: runtime/scene/game 현재 frame 경로와 Phase 1 test helper
- 입력 데이터 구조: normalized frame state와 observer phase event
- 참조해야 할 함수/클래스: `EngineRuntime`, `Scene`, `SceneManager`, `Game`
- 변경하지 말아야 할 인터페이스: `FrameClock.start(onFrame)`, `SceneManager.update/draw`, gameplay update/draw 의미

## 출력

- 생성/수정 파일: 지정 runtime/scene/game/docs/test/review 파일
- 반환 형식: phase 순서와 unsubscribe 동작이 검증된 runtime
- 외부에서 참조할 함수/클래스: `EngineRuntime.subscribe(observer)`와 반환 unsubscribe 함수
- 유지해야 할 호환성: 한 frame당 game update/draw 1회, scene 오류 가시성, input cleanup

## 작업 단계

- [x] 1. canonical phase와 observer 실패 정책을 테스트로 고정한다.
- [x] 2. runtime/scene/game frame 경로를 단일화한다.
- [x] 3. observer 등록·해제와 오류 가시성을 구현한다.
- [x] 4. 관련 계약 문서를 갱신한다.
- [x] 5. 전체 test/build를 통과시키고 review를 작성한다.

## 완료 기준

- `scene.frame` 우선 우회 없이 runtime이 update/draw/afterFrame을 소유한다.
- observer 유무와 오류가 gameplay frame 횟수를 바꾸지 않는다.
- 등록 순서, 중복 등록, idempotent unsubscribe가 테스트된다.
- 기존 페이지 ready/running 동작을 깨지 않는다.

## 주의사항

- debug 파일을 수정하지 않는다.
- 첫 scene 오류를 숨기거나 성공 상태로 바꾸지 않는다.
