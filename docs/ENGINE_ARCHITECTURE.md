# Engine Architecture

## 문서 상태

- 작성일: 2026-05-18
- 최근 계약 갱신: 2026-07-16
- 기준 작업: `mulAg/md/plan/PLAN-2026-07-16-opening-player-animation-redesign.md`
- 기준 TODO: `TODO-RIG-ANIMATION-ENGINE-001`, `TODO-PLAYER-RIG-ADAPTER-003`, `TODO-OPENING-ROUTE-CHOICE-004`
- 범위: 엔진 계약과 책임 경계, 공통 rig transition/pose lifecycle, 게임 opening adapter 경계 문서화
- 제외 범위: 전체 `EngineRuntime` 재구축, 무기/특수기 밸런스 변경, 승인된 final-form 기체 디자인 교체

## 목적

이 문서는 Galaxy Runner 전용 `Game` 중심 구조를 재사용 가능한 2D Canvas 엔진과 Galaxy Runner 게임 책임으로 분리하기 위한 기준 계약이다. 후속 TODO는 이 문서만 보고 엔진 공통 모듈이 알아야 하는 것과 Galaxy Runner scene이 소유해야 하는 것을 구분할 수 있어야 한다.

## 목표 구조

```text
EngineRuntime
  -> CanvasSurface
  -> FrameClock
  -> InputState
  -> SceneManager
  -> World / EntityStore
  -> Collision / Render / Asset helpers
  -> RigAnimationEngine / RigAnimationRenderer

GalaxyRunnerScene
  -> Galaxy Runner state
  -> spawn / score / stage / continue
  -> weapon / special / item / enemy systems
  -> HUD and game info rendering
```

## 엔진 책임과 게임 책임

| 영역 | 엔진 책임 | Galaxy Runner 책임 |
| --- | --- | --- |
| Canvas | canvas element, 2D context, DPR, resize, clear 정책 | 게임별 화면 비율 해석, HUD 배치 의도, 화면 흔들림 연출 |
| Loop | `requestAnimationFrame`, dt 계산, dt clamp, pause gate | stage 진행, 난이도 증가, game over와 continue 판단 |
| Scene | scene 등록, 전환, lifecycle 호출 순서 | Galaxy Runner scene 상태와 전환 조건 |
| Input | raw keyboard/pointer/gamepad 상태 수집, action mapping 조회 | `firePrimary`, `useSpecial`, `moveLeft` 같은 action 의미 정의 |
| World | entity group 보관, update/draw 순서, 제거 예약과 cleanup | 어떤 entity를 언제 spawn/remove할지, score와 drop 규칙 |
| Collision | primitive, broad query, layer/mask 필터, pair 후보 제공 | damage, knockback, item 획득, 무기별 특수 충돌 효과 |
| Animation | rig diff, phase timeline, rigid pose, interruption, frozen frame | 기체 종류, 강화 단계, gameplay 상태, asset manifest 의미 |
| Render | canvas drawing helper, sprite/atlas draw helper, debug primitive | player final-form 정책, 적/보스/HUD의 Galaxy Runner 시각 규칙 |
| Asset | preload, load/error 상태, atlas frame 조회 | 어떤 asset을 필수로 볼지, fallback 허용 여부, asset manifest 구성 |
| Debug | frame metric, lifecycle hook, query trace hook | Galaxy Runner 규칙을 설명하는 debug label과 QA 시나리오 |

엔진은 Galaxy Runner 전용 무기명, 점수명, stage명, item 확률, boss 패턴, HUD 문구를 직접 알면 안 된다. 게임은 DOM event와 RAF를 직접 소유하지 않고 엔진 계약을 통해 입력, loop, scene lifecycle을 사용한다.

## Scene lifecycle 계약

Scene은 엔진이 호출하는 실행 단위이며, 게임별 상태와 시스템 조합은 scene 내부에 둔다. Scene은 canvas, RAF, raw DOM event listener를 직접 생성하거나 해제하지 않는다.

```ts
interface Scene {
  enter(context): void;
  update(deltaSeconds, frameState): void;
  draw(deltaSeconds, frameState): void;
  afterFrame(deltaSeconds, frameState): void;
  exit(reason): void;
}
```

| 단계 | 호출 주체 | 책임 |
| --- | --- | --- |
| `enter` | `SceneManager` | scene-local 상태 초기화, 필요한 world/entity 구성, action 사용 준비 |
| `update` | `EngineRuntime` | dt 기반 simulation, action snapshot 조회, spawn과 gameplay system 진행 |
| `draw` | `EngineRuntime` | 현재 상태를 canvas에 그리기, persistent gameplay state 변경 금지 |
| `afterFrame` | `EngineRuntime` | input transient와 frame-local 참조 정리 |
| `exit` | `SceneManager` | timer, scene-local cache, 임시 entity 참조 정리 |

기본 frame 순서는 `FrameClock tick`, `beforeFrame observer`, active scene `update`, `afterUpdate observer`, active scene `draw`, `afterDraw observer`, active scene `afterFrame`, `afterFrame observer`다. `EngineRuntime`이 이 순서를 유일하게 조립하며 Scene, SceneManager, Galaxy Runner Game은 별도 `frame()` 우회 경로를 갖지 않는다. 후속 구현에서 성능 또는 pause 정책 때문에 순서를 바꿔야 하면 이 문서와 `src/engine/runtime/README.md`, `src/engine/scenes/README.md`를 함께 갱신한다.

`deltaSeconds`가 0이면 update는 생략하지만 draw와 afterFrame은 실행한다. scene update/draw가 실패해도 afterFrame에서 input transient cleanup을 시도하고 최초 scene 오류를 다시 던진다. cleanup도 함께 실패한 경우 최초 오류를 보존하고 후속 오류를 console에 표시한다.

Scene 전환은 이전 scene의 `exit`이 끝난 뒤 다음 scene의 `enter`를 호출한다. `enter` 실패나 asset preload 실패는 성공처럼 감추지 않고 error state 또는 명시적 fallback scene으로 드러낸다.

## Input action mapping 계약

엔진은 raw input을 수집하지만 게임 규칙은 raw key 이름을 직접 읽지 않는다. 게임은 action 이름과 binding을 제공하고, scene과 system은 action snapshot만 조회한다.

```ts
type ActionName = string;

interface ActionSnapshot {
  isDown(action: ActionName): boolean;
  wasPressed(action: ActionName): boolean;
  wasReleased(action: ActionName): boolean;
  axis(name: ActionName): number;
}
```

권장 action 이름은 게임 의미를 드러낸다. 예시는 `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `firePrimary`, `useSpecial`, `pause`, `confirm`, `cancel`이다.

Mapping은 keyboard, pointer, gamepad 같은 입력 장치 차이를 숨긴다. 알 수 없는 action은 기본적으로 false 또는 0으로 반환하며, 누락을 숨겨야 하는 경우가 아니라면 debug hook에서 누락 mapping을 확인할 수 있어야 한다.

Galaxy Runner의 무기, 특수기, continue 규칙은 action 의미를 해석할 수 있지만 특정 키 코드나 DOM event 이름에 의존하면 안 된다.

## World / Entity 계약

World는 entity 보관과 순회 정책을 담당한다. Entity는 Galaxy Runner 전용 class일 수 있지만, 엔진이 요구하는 최소 계약은 group, 활성 상태, update/draw 가능 여부, collision primitive 제공 여부로 제한한다.

```ts
interface Entity {
  id: string;
  group: string;
  active: boolean;
  update?(frame): void;
  draw?(renderContext): void;
  getCollider?(): Collider | null;
}
```

World와 EntityStore의 책임은 entity 추가, group별 조회, stable iteration, 제거 예약, frame 끝 cleanup, draw order 기준 제공이다. EntityStore는 score, damage, drop, stage progression을 계산하지 않는다.

Galaxy Runner scene의 책임은 적과 아이템 spawn, projectile 발사, boss phase 전환, player 상태, score와 stage 상태, continue 상태, weapon/special 규칙이다.

Entity group 이름은 엔진이 의미를 해석하지 않는 문자열로 둔다. 충돌 layer와 render order가 필요한 경우 게임이 명시적으로 등록하고 엔진은 등록된 순서와 필터만 사용한다.

## Collision 경계

엔진 collision helper는 충돌 후보를 찾고 primitive 간 교차 여부를 계산한다. 처리 결과가 무엇을 의미하는지는 게임 책임이다.

엔진에서 허용되는 책임은 AABB, circle, point 같은 primitive 판정, layer/mask 필터, broad query, pair iteration, debug bounds drawing이다.

게임에서 유지해야 하는 책임은 damage 수치, 무적 시간, projectile pierce, item pickup, boss armor, 특수기 범위 효과, score 부여, hit effect spawn이다.

무기별 특수 충돌 정책이 필요하면 Galaxy Runner collision system 또는 scene 내부 system으로 둔다. 엔진 collision helper에 `rapid`, `energy`, `spread`, `nova` 같은 값을 추가하지 않는다.

## Render 경계

엔진 render helper는 Canvas API 접근을 안정화하는 얇은 계층이다. CanvasSurface는 DPR scale, clear, context reset, resize를 담당하고, draw helper는 sprite, atlas frame, primitive, text helper처럼 재사용 가능한 작업만 제공한다.

Galaxy Runner render 책임은 player final-form 선택, 등록 파츠 조합, enemy/boss 시각 규칙, projectile 스타일, HUD 문구, overlay, game info panel이다.

Draw 단계에서 simulation state를 변경하지 않는 것을 기본 원칙으로 한다. 단, 렌더 전용 cache나 atlas frame lookup cache처럼 화면 출력만 위한 memoization은 허용할 수 있으며, 허용한 경우 해당 모듈 README에 부작용을 적는다.

## Rig animation 경계

`RigAnimationEngine`은 immutable `from`/`to` rig snapshot과 선언형 profile을 받아 part diff, phase timeline, pose channel, interruption, reduced motion, 허용된 fallback을 계산한다. pose channel은 목표값과 선언된 진입·복귀·반전 응답 시간을 받아 엔진 내부에서 보간한다. 출력은 read-only frame이며 gameplay state와 Canvas context에 접근하지 않는다.

완료 상태의 정본은 항상 request의 `to` snapshot이다. 하나의 등록 이미지 part를 유지하거나 교체 crossfade할 수 있고, optional `transitionParts`는 active frame에만 포함한 뒤 target settle에서 제거한다. 이 계약으로 승인된 완성 이미지를 settled 정본으로 유지하면서도 조립 중 임시 파츠를 표시할 수 있다.

내장 strategy는 opaque part tags와 profile parameter만 해석한다. 엔진은 player, weapon, level 같은 게임 의미를 조건문으로 사용하지 않는다. 게임 adapter는 gameplay 상태를 rig와 profile id로 바꾸고, 게임 renderer는 assetKey를 image handle로 해석한다. generic renderer는 translate, rotate, opacity만 적용하며 non-uniform scale과 skew pose를 만들지 않는다.

invalid snapshot/profile/strategy/request는 상태 변경 전에 실패한다. runtime asset 누락과 strategy 실행 오류처럼 profile에 선언된 장애만 `degraded` frame과 오류 원인을 남기고 source 유지 또는 target settle로 진행한다. 상세 계약은 `src/engine/animation/README.md`를 따른다.

## Asset 경계

엔진 asset helper는 manifest 기반 preload, load 상태 추적, error 노출, image/audio handle 조회, atlas frame lookup을 담당한다.

게임은 manifest 내용을 정의하고 어떤 asset이 필수인지 결정한다. 필수 asset 실패는 성공 상태로 감추지 않고 scene 진입 실패, error overlay, 명시적 fallback 중 하나로 처리한다.

엔진은 존재하지 않는 비즈니스 값을 만들거나 누락된 Galaxy Runner asset을 임의 생성하지 않는다. 임시 asset 또는 mock asset이 필요한 경우 API/mock 원칙과 동일하게 계약을 드러내는 대체 구현으로 기록한다.

## Debug와 계측 경계

엔진 debug hook은 frame time, dt clamp, scene transition, input action 상태, entity count, collision pair count, asset load 상태 같은 공통 관측 지점을 제공한다.

Runtime 계측은 `EngineRuntime.subscribe(observer)`의 `beforeFrame`, `afterUpdate`, `afterDraw`, `afterFrame` callback을 사용한다. 같은 observer identity는 한 번만 등록하며, 반환된 unsubscribe가 observer lifetime을 소유한다. observer 오류는 `onObserverError` 또는 console에 표시하되 gameplay와 다음 observer의 실행을 중단하지 않고 자동 해제하지 않는다. observer event와 frameState snapshot은 shallow read-only이며 실제 scene state를 변경하는 통로로 사용하지 않는다.

Galaxy Runner debug 정보는 stage, danger, score, weapon tier, special meter, spawn budget처럼 게임 의미가 있는 값을 scene 또는 game system에서 label로 전달한다.

Debug hook은 production gameplay 규칙을 바꾸거나 runtime/scene 메서드를 교체하면 안 된다. debug UI가 필요하면 engine observer와 game label을 결합하되, 계산 주체는 원래 책임 위치에 둔다.

## 하드닝 완료 모듈 수정 규칙

하드닝 완료 모듈은 파일 또는 README에 책임, 공개 함수/클래스, 입력, 반환값, 부작용, 변경 가능 범위가 명시된 안정 단위로 본다.

하드닝 완료로 표시된 engine 모듈은 명시적 지시 없이 수정하지 않는다. 수정이 꼭 필요하면 권한과 무관하게 사용자에게 먼저 수정 허가를 요청하고, 허가 뒤 관련 문서를 함께 갱신한다.

하드닝 완료 모듈을 우회하기 위해 private 상태에 접근하거나, 문서화되지 않은 내부 구현을 전제로 후속 작업을 진행하지 않는다. 필요한 확장은 공개 계약을 먼저 제안하고 review 문서에 남긴다.

## 후속 TODO 기준

`TODO-ENGINE-002`는 EngineRuntime, FrameClock, CanvasSurface를 도입할 때 이 문서의 Loop와 Canvas 경계를 따른다.

`TODO-ENGINE-003`은 Scene lifecycle과 input action mapping을 분리할 때 이 문서의 scene/input 계약을 따른다.

`TODO-ENGINE-004`는 World, EntityStore, collision query를 도입할 때 이 문서의 world/entity/collision 경계를 따른다.

`TODO-ENGINE-005`는 asset/render/debug helper를 정리할 때 이 문서의 render/asset/debug 경계를 따른다.

경계가 불명확하거나 현재 코드 구조가 이 계약과 충돌하면 임의로 크게 수정하지 않고 해당 TODO의 review 문서에 문제와 수정 방향을 기록한다.
