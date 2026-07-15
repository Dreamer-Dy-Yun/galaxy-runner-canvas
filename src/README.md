# src

## 역할

`src`는 정적 classic script 방식으로 로드되는 Galaxy Runner 런타임 코드 전체를 담는다. 빌드는 이 구조를 변환하지 않고 배포 artifact에 복사하므로 `galaxy-runner.html`과 `src/main.js`의 script 순서가 모듈 의존 순서다.

## 하위 폴더

- `core`: legacy script 경로와 공통 primitive helper.
- `engine`: Canvas runtime, frame clock, scene/input/world/asset/render/debug 공통 계약.
- `entities`: 플레이어, 적, 투사체, 아이템, 효과 entity 상태와 동작.
- `gameplay`: balance, catalog, item/help data 같은 게임 계약 데이터.
- `renderers`: Canvas 시각 표현, asset composition helper, frame draw 순서.
- `systems`: 세션 전환, frame update, spawn, projectile, item, enemy lifecycle처럼 entity 밖 gameplay orchestration.
- `ui`: HUD와 화면 overlay 표시.

## 진입점

- `main.js`: engine/game 객체를 조립하고 runtime과 diagnostics를 연결한 뒤 frame clock을 시작한다.
- `GalaxyRunnerDebug`: overlay의 표시 lifecycle을 다루는 console 진입점이다.
- `GalaxyRunnerFrameProfiler`: profiler의 수집 lifecycle과 snapshot을 다루는 console 진입점이다.
- `GalaxyRunnerStatus()`: 브라우저 smoke와 수동 점검을 위한 shallow read-only snapshot을 반환한다. 필드는 `mode`, `distance`, `score`, `hp`, `runtimeRunning`, `debugEnabled`, `profilerSampleCount`이며 gameplay 제어 객체나 mutable 참조는 노출하지 않는다.

## 경계

- engine은 Galaxy Runner 전용 무기, 점수, 보스, HUD 규칙을 소유하지 않는다.
- game layer는 engine의 공개 action/world/runtime 계약을 사용하고 raw DOM 또는 RAF를 직접 소유하지 않는다.
- diagnostics는 `EngineRuntime.subscribe`만 사용하며 runtime/scene 메서드를 교체하지 않는다.
- 파일이 300라인을 넘는 경우 새 기능 추가보다 책임 분리 계획을 우선 검토한다.
