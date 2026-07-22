# src/engine

## 역할

`src/engine`은 Galaxy Runner에 종속되지 않는 2D Canvas 런타임 계약과 공통 실행 모듈을 두는 폴더다. 현재 runtime, scene, input, world, physics, asset, rendering, debug helper를 단계적으로 포함한다.

## 폴더 책임

엔진은 canvas/context/DPR, frame loop, scene lifecycle, action mapping 기반 input, world/entity 보관, collision query, render helper, asset preload, debug hook을 담당한다.

엔진은 Galaxy Runner의 무기명, 특수기 규칙, score, stage, item drop, boss pattern, HUD 문구, player final-form 선택을 소유하지 않는다.

게임별 규칙은 `GalaxyRunnerScene` 또는 `src/gameplay`, `src/entities`, `src/systems`, `src/renderers`, `src/ui`의 게임 책임 파일에 둔다.

## 도입 예정 모듈 경계

| 모듈 | 책임 | 금지 범위 |
| --- | --- | --- |
| `EngineRuntime` | runtime 조립, RAF loop 시작/정지, active scene tick 호출 | stage, score, weapon, item 규칙 |
| `CanvasSurface` | canvas element, 2D context, DPR scale, resize, clear | HUD 레이아웃, Galaxy Runner 카메라 연출 |
| `FrameClock` | dt 계산, dt clamp, pause gate 입력 | 난이도 증가나 spawn timing 의미 |
| `InputState` | raw input 수집, action snapshot 제공 | raw key를 게임 규칙에 직접 노출 |
| `SceneManager` | scene 등록, enter/update/draw/exit 순서 보장 | scene 내부 gameplay state 결정 |
| `World` / `EntityStore` | entity group, stable iteration, remove cleanup | damage, score, drop, stage progression |
| `Collision` | primitive 판정, layer/mask query, pair 후보 | hit 결과, 무기별 충돌 효과 |
| `Render helpers` | sprite, atlas, primitive, debug bounds drawing | player final-form, enemy/boss/HUD 시각 정책 |
| `Asset helpers` | manifest preload, load/error 상태, atlas frame 조회 | asset 목록 의미, 필수 asset fallback 정책 |
| `Debug hooks` | frame/entity/input/collision/asset 관측 지점 | gameplay 규칙 변경 |

## Scene 계약

Scene은 `enter`, `update`, `draw`, `exit` lifecycle을 가진다. 엔진은 이전 scene의 `exit`을 호출한 뒤 다음 scene의 `enter`를 호출한다.

`update`는 simulation과 game system 진행을 담당한다. `draw`는 현재 상태의 렌더링만 담당하고 gameplay state를 변경하지 않는 것을 기본 원칙으로 한다.

Scene은 RAF, DOM input listener, canvas context lifetime을 직접 소유하지 않는다. 필요한 입력은 action snapshot으로 받고, 필요한 entity 접근은 World 계약을 통해 수행한다.

## Input 계약

게임은 action 이름과 binding을 등록한다. Scene과 system은 `isDown`, `wasPressed`, `wasReleased`, `axis` 같은 action query만 사용한다.

Action 이름은 `moveLeft`, `moveRight`, `firePrimary`, `useSpecial`, `pause`처럼 게임 의미를 표현한다. `KeyA`, `Space`, `Mouse0` 같은 raw input 이름은 mapping 내부에만 머문다.

## World와 Entity 계약

EntityStore는 entity 추가, group 조회, update/draw 순회, 제거 예약, frame cleanup을 담당한다. Entity의 최소 공개 정보는 `id`, `group`, `active`, 선택적 `update`, 선택적 `draw`, 선택적 collider 제공 함수다.

EntityStore는 Galaxy Runner의 score, damage, item drop, boss phase를 계산하지 않는다. 이 값들은 game scene 또는 game system이 entity와 collision 결과를 해석해 처리한다.

## Collision, Render, Asset 계약

Collision helper는 후보와 교차 여부만 제공한다. 충돌 결과로 체력이 줄거나 점수가 오르는 규칙은 게임 책임이다.

Render helper는 Canvas API를 안전하게 쓰기 위한 공통 도구다. 어떤 이미지를 어떤 상태에서 그릴지는 게임 renderer 또는 scene이 결정한다.

Asset helper는 preload와 조회 상태를 제공한다. 어떤 asset이 필수인지, 실패 시 fallback을 허용할지는 게임 manifest와 scene 정책이 결정한다.

## Asset, Render, Debug helper 계약

`src/engine/assets/asset-loader.js`는 이미지 캐시, 단일 load, manifest preload, status 조회만 담당한다. 에셋 필수 여부와 fallback 정책은 게임별 manifest 또는 scene이 결정한다.

`src/engine/rendering/render-helpers.js`는 Canvas state 저장/복구와 primitive drawing helper를 제공한다. `src/engine/rendering/sprite-atlas.js`는 uniform atlas frame 계산과 draw만 담당한다.

`src/engine/debug/debug-overlay.js`는 기본 비활성 관찰 hook이다. 활성화 시 FPS, dt, entity count, scene 이름/state만 표시하며 gameplay state를 변경하지 않는다.

기존 `src/core/asset-loader.js`와 `src/core/sprite-atlas.js`는 classic script 순서를 위한 호환 진입점으로 남긴다.

## 의존성 방향

`src/engine`은 게임별 폴더인 `src/gameplay`, `src/entities`, `src/systems`, `src/renderers`, `src/ui`의 구체 규칙에 의존하지 않는다.

게임 코드는 엔진의 공개 계약을 사용할 수 있다. 엔진 내부 구현을 우회하거나 문서화되지 않은 private 상태에 의존하지 않는다.

## 하드닝 규칙

하드닝 완료로 표시된 engine 모듈은 명시적 지시 없이 수정하지 않는다. 수정이 필요하면 사용자에게 먼저 허가를 받고, 책임, 공개 API, 부작용, 변경 가능 범위를 이 README 또는 관련 문서에 함께 갱신한다.

경계가 불명확한 경우 임의로 큰 구조 변경을 하지 않는다. 문제와 권장 수정 방향을 해당 TODO review 문서의 `남은 이슈` 또는 `QA 확인 요청 사항`에 기록한다.
