# REVIEW-RUNTIME-HARDEN-003: Diagnostics observer 전환

## 기준

- 일시: 2026-07-16
- 실행 TODO: `mulAg/md/todo/TODO-RUNTIME-HARDEN-003.md`
- 선행 계약: `EngineRuntime.subscribe`의 `beforeFrame`, `afterUpdate`, `afterDraw`, `afterFrame`
- 범위: debug profiler/overlay, main 조립, status snapshot, 관련 문서와 테스트
- 제외: runtime/scenes/game, gameplay, assets, package/workflow 수정

## 관련 이벤트 목록

1. `FrameProfiler.attach({ runtime })`와 `detach()`
2. runtime `beforeFrame` -> profiler frame 표본 시작
3. runtime `afterUpdate` / `afterDraw` -> 실제 phase `durationMs` 기록
4. runtime `afterFrame` -> frame `durationMs` 기록과 표본 확정
5. `DebugOverlay.attach(runtime)`와 `detach()`
6. overlay `afterFrame` -> 상태 snapshot과 선택적 profiler snapshot 조회 -> Canvas 표시
7. `enable`, `disable`, `toggle` -> 수집 또는 표시 상태 전환
8. bootstrap -> profiler/overlay 조립 -> console 진입점과 `GalaxyRunnerStatus()` 공개 -> runtime 시작

## 기존 처리 흐름 역추적

### FrameProfiler

`attach`가 `scene.update`, `scene.draw`, `runtime.frame`을 직접 교체했다. update/draw 비용과 frame 비용을 자체 timer로 계산하고, profiler가 Canvas overlay까지 그렸다. receiver 보존과 실행 순서가 앞서 연결된 wrapper에 의존했다.

### DebugOverlay

`attach`가 `runtime.frame`을 bind한 뒤 다시 교체했다. profiler와 overlay의 연결 순서에 따라 profiler가 저장한 원본 frame receiver와 실제 호출 경로가 달라질 수 있었다.

### main

overlay를 먼저 runtime에 연결한 뒤 profiler가 runtime/scene/surface/overlay를 모두 받아 감쌌다. 브라우저 QA가 상태를 확인할 공개 read-only 계약은 없었다.

## 문제점

- optional diagnostics가 canonical runtime과 scene 메서드 identity를 변경했다.
- profiler가 측정과 Canvas 표시를 함께 소유했다.
- profiler update/draw 계측이 runtime의 공개 phase 계약이 아니라 wrapper 부작용에 의존했다.
- 중복 attach와 detach의 대칭 계약이 없었다.
- diagnostics 연결 순서가 runtime 호출 receiver와 실행 가능성에 영향을 줄 수 있었다.
- browser smoke가 mutable 내부 객체 없이 상태를 읽을 수 없었다.

## 수정 방안과 적용 내용

### FrameProfiler

- `runtime.subscribe(this)`만 사용하며 runtime/scene 메서드를 바꾸지 않는다.
- runtime event의 `durationMs`를 frame/update/draw metric에 그대로 기록한다.
- Canvas와 text formatting 책임을 제거했다.
- `attach`, `detach`, `enable`, `disable`, `snapshot` 계약을 idempotent lifecycle로 고정했다.
- snapshot과 metric 객체를 read-only로 반환한다.

### DebugOverlay

- `afterFrame` observer로만 표시한다.
- profiler는 선택적 `snapshot()` 공급자로만 참조한다.
- profiler metric 문자열과 Canvas 출력 책임을 overlay로 이동했다.
- 기본 disabled와 `?debug=1`/storage opt-in을 유지했다.
- attach/detach 반복과 overlay 단독 실행을 지원한다.

### main과 상태 계약

- profiler와 overlay를 독립 observer로 조립한다.
- `GalaxyRunnerDebug`, `GalaxyRunnerFrameProfiler` console 진입점을 유지했다.
- `GalaxyRunnerStatus()`는 frozen flat snapshot만 반환한다.
- 공개 필드는 `mode`, `distance`, `score`, `hp`, `runtimeRunning`, `debugEnabled`, `profilerSampleCount`다.
- gameplay 제어 함수, game/runtime 참조, mutable state는 노출하지 않는다.

## 검증 결과

- `corepack pnpm run test:run`: 성공, 20/20
- `corepack pnpm run build`: 성공, 147 files / 13,586,365 bytes
- 정적 참조 검사: 65 JavaScript / 2 HTML / 42 local script references 성공
- `git diff --check`: 성공
- 변경/생성 코드 line 수: profiler 136, overlay 210, main 131, diagnostics test 284

테스트로 확인한 항목:

- runtime/scene 메서드 identity 불변
- profiler의 synthetic positive frame/update/draw metric
- profiler와 overlay의 양 attach 순서
- overlay 기본 disabled와 query opt-in
- profiler disable/enable, 양 모듈의 반복 attach/detach
- detach 뒤 diagnostics 관측 중단과 gameplay 지속
- diagnostics callback 오류의 gameplay 격리
- frozen status snapshot과 gameplay control 미노출

## 남은 위험과 후속 검증

- classic script 구조이므로 unit test와 별도로 실제 브라우저에서 debug off/on Canvas 표시를 확인해야 한다.
- overlay가 profiler보다 먼저 등록되면 첫 표시에서 이전 snapshot을 보며 다음 frame부터 정상화된다. gameplay와 수집 결과에는 영향이 없다.
- `GalaxyRunnerStatus()`의 실제 ready/running/paused/restart 전이는 Phase 4 browser smoke에서 확인한다.
- Pages workflow gate와 live SHA 증거는 `TODO-RUNTIME-QA-001` 범위다.

## 판정

PASS — TODO 범위의 diagnostics observer 전환, 역할 분리, lifecycle, 상태 조회 계약과 자동 검증을 충족했다. 브라우저/배포 증거는 후속 Phase 4 조건으로 남긴다.
