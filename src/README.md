# src

## 역할

`src`는 정적 script 방식으로 로드되는 Galaxy Runner 런타임 코드 전체를 담는다. 빌드 단계가 없으므로 `galaxy-runner.html`의 script 순서가 곧 모듈 의존 순서다.

## 하위 폴더

- `core`: legacy script 경로와 공통 primitive helper.
- `engine`: Canvas runtime, frame clock, scene/input/world/asset/render/debug 공통 계약.
- `entities`: 플레이어, 적, 투사체, 아이템, 효과 entity 상태와 동작.
- `gameplay`: balance, catalog, item/help data 같은 게임 계약 데이터.
- `renderers`: Canvas 시각 표현, asset composition helper, frame draw 순서.
- `systems`: 세션 전환, frame update, spawn, projectile, item, enemy lifecycle처럼 entity 밖 gameplay orchestration.
- `ui`: HUD와 화면 overlay 표시.

## 경계

- engine은 Galaxy Runner 전용 무기, 점수, 보스, HUD 규칙을 소유하지 않는다.
- game layer는 engine의 공개 action/world/runtime 계약을 사용하고 raw DOM 또는 RAF를 직접 소유하지 않는다.
- 파일이 300라인을 넘는 경우 새 기능 추가보다 책임 분리 계획을 우선 검토한다.
