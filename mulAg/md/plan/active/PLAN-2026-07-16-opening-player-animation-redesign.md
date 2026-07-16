# PLAN: 기본 기체 오프닝과 공통 Rig 애니메이션 엔진 재설계

## 작성일

2026-07-16

## 상태

- 현재 상태: 구현 및 로컬 통합 QA 완료, feature branch 배포 대기
- 코드 수정: 공통 rig engine, 4노선 transition 자산, Player adapter, opening route choice 반영 완료
- 배포: feature branch와 main 모두 아직 미배포
- 하드닝 모듈 수정: 사용자가 전체 수정·배포를 명시 승인하여 이번 plan 범위에서 수행
- 2026-07-16 추가 결정: 파츠 pose·탈착·결합은 플레이어별 구현이 아니라 공통 엔진으로 처리

## 현재 기준

- 브랜치/기준 HEAD: `codex/rig-animation-engine` / `a2cea56`
- 원격 상태: `origin/main`과 일치
- 작업 트리: 조사 시작 시 clean
- `pnpm run test:run`: 76/76 PASS
- `pnpm run build`: PASS, 190 files
- `pnpm run test:browser`: PASS
- `pnpm run test:soak`: PASS, 12,000ms, entity high-water 33, final 11
- 배포 화면: `https://dreamer-dy-yun.github.io/galaxy-runner-canvas/galaxy-runner.html?v=a2cea56`
- 배포 화면에서 ready 선택 후 Space를 누르면 선택된 완성 기체 PNG가 즉시 표시되는 것을 확인

## 목표

다음 플레이 경험을 하나의 제품 계약으로 만든다.

```text
Ready
  -> Space
  -> 기본 기체 출격 연출
  -> 안전한 4종 기체 선택 아이템 등장
  -> 하나를 획득하면 진화 노선 확정
  -> 기본 기체에 선택 노선의 파츠가 조립됨
  -> 이후에는 선택 노선의 강화 아이템만 등장
  -> 좌우 이동과 강화 시 기체가 실제 파츠 애니메이션으로 반응
```

## 현재 이벤트 흐름

### 1. 시작 기체 선택

```text
ready에서 좌우/1~4 입력
  -> RunRules 시작 무기 선택
  -> Space
  -> GameSessionSystem.start
  -> Player.equipWeapon
  -> weapon level 1 즉시 확정
  -> running
  -> 다음 draw에서 선택 무기의 완성 PNG 표시
```

문제:

- 기본 기체가 화면에 등장할 시간이 없다.
- ready 화면의 선택은 영구 노선 선택처럼 보이지만 실제로는 시작 장비 선택일 뿐이다.
- 일반 랜덤 무기 아이템이 다른 무기로 즉시 전환시키므로 사용자가 선택한 기체 정체성이 유지되지 않는다.

### 2. 좌우 이동

```text
keydown
  -> ActionMap / InputState
  -> Player.move의 좌우 axis
  -> lean 보간
  -> PlayerRenderer.draw
  -> Player.applyBankProjection
  -> scale + skew + offset를 전체 로컬 합성에 적용
  -> FinalShipArt.drawImage
```

문제:

- 별도 자세나 프레임 애니메이션이 없다.
- `ctx.transform`으로 기체, 실드, 특수기 효과, 추진기까지 함께 찌그러뜨린다.
- bank 전용 시간·복귀·pause 계약이 없고 thrust easing 값을 공유한다.
- 좌우 이동 연출 전용 자동 테스트가 없다.

### 3. 무기 획득과 강화

```text
item collision
  -> PlayerProgressionSystem.collect/equipWeapon
  -> 무기 level, footprint, hitbox 즉시 변경
  -> item.collected feedback
  -> 다음 draw에서 목표 레벨 완성 PNG 즉시 표시
```

문제:

- 이전 kind/level과 목표 kind/level을 함께 가진 전이 snapshot이 없다.
- transition timer, phase, revision이 없다.
- 4개 무기의 01~10 PNG는 현재 무기별로 모두 같은 SHA다. 실제 레벨 외형 차이가 없다.
- `PLAYER_RIG_SPEC.md`는 runtime 파츠 조립을 금지한다. 새 요구사항은 현재 문서 계약을 명시적으로 변경해야 한다.

## 제품 결정

### Decision 1. ready에서는 기체를 선택하지 않는다

- ready 화면은 Space로 출격하는 역할만 가진다.
- 좌우/1~4 시작 무기 선택 UI와 입력 계약을 제거한다.
- Space 직후 플레이어는 모든 무기 레벨이 0인 기본 기체로 시작한다.

### Decision 2. 오프닝을 세 단계로 분리한다

`state.runPhase`를 다음처럼 둔다.

```text
baseLaunch -> routeChoice -> combat
```

- `baseLaunch`: 약 1.0초 동안 기본 기체 출격 모습을 보여 준다.
- `routeChoice`: Rapid, Energy, Spread, Nova 선택 아이템 4개를 안전 구역에 고정 배치한다.
- `combat`: 하나를 획득한 뒤 일반 적·아이템 spawn을 시작한다.
- 오프닝 선택 아이템은 만료, morph, 랜덤 재추첨 대상이 아니다.
- 하나를 획득하면 나머지 세 개를 즉시 제거한다.
- 선택 전에는 일반 적과 일반 랜덤 아이템을 spawn하지 않는다.

정확한 1.0초 값은 첫 브라우저 연출 QA에서 0.8~1.5초 범위로 조정할 수 있지만, 기본 기체가 한 프레임만 보이는 상태는 허용하지 않는다.

### Decision 3. 선택 기체는 run의 진화 노선이다

- 첫 선택을 `selectedWeaponKind`로 저장한다.
- 이후 일반 weapon drop과 weapon morph는 선택한 kind만 반환한다.
- 다른 기체로 바꾸는 일반 랜덤 전환은 제거한다.
- 다른 노선 변경은 향후 별도 재선택 이벤트가 기획될 때만 허용한다.
- Restart는 선택을 지우고 ready로 돌아간다.
- Continue는 선택 노선과 강화 상태를 보존하고 오프닝 선택을 재실행하지 않는다.

### Decision 4. 좌우 이동은 왜곡이 아닌 rig pose 애니메이션이다

- 기존 non-uniform scale과 skew 기반 `applyBankProjection`을 제거한다.
- 기체 전체 이미지를 찌그러뜨리지 않는다.
- 중심 동체, 좌우 날개, 엔진, 무기 파츠를 등록된 pivot 기준의 rigid transform으로만 움직인다.
- 허용 transform: translate, rotate, opacity. 기본안에서는 비균일 scale과 skew를 사용하지 않는다.
- 상태 전이는 `neutral -> bank-enter -> bank-hold -> bank-return`으로 둔다.
- 입력 방향 전환 시 현재 pose에서 반대 pose로 연속 보간한다.
- 권장 체감값:
  - enter: 120~160ms
  - return: 160~220ms
  - 최대 본체 회전: 약 3~4도
  - 좌우 날개 상대 이동: 화면 기준 약 2~4px
- 실드는 world-space 중심을 유지하고 찌그러뜨리지 않는다.
- 추진기와 wing-tip effect는 bank 방향에 맞춰 세기를 다르게 한다.
- pause에서는 pose를 정지하고 resume에서 이어 간다.
- Restart와 Continue 진입 시 neutral로 정리한다.

### Decision 5. 강화는 gameplay와 분리된 cosmetic transition이다

권장 상태 전이:

```text
idle
  -> charge   80ms
  -> detach  180ms
  -> bridge   60ms
  -> attach  260ms
  -> settle  160ms
  -> idle
```

- gameplay level, damage, footprint, hitbox는 획득 순간 목표 상태로 확정한다.
- 애니메이션은 immutable `{ from, to, reason, revision }` snapshot만 읽는다.
- 제거되는 파츠는 바깥으로 이탈하며 감쇠한다.
- 추가·교체되는 파츠는 외곽에서 접근해 pivot에 결합한다.
- 결합 순간 core flash와 lock spark를 표시한다.
- transition 중 새 강화가 오면 오래된 queue를 쌓지 않고 최신 revision을 목표로 재구성한다.
- reset/restart/gameover에서는 transition을 취소하고 현재 gameplay 상태의 안정 pose로 정리한다.
- pause에서는 phase timer를 정지한다.
- 자산 누락이나 로딩 지연은 gameplay를 막지 않으며 완성 PNG fallback 또는 짧은 crossfade를 사용한다.
- `prefers-reduced-motion`에서는 detach/attach 이동을 생략하고 짧은 opacity/core pulse만 사용한다.

### Decision 6. 파츠 애니메이션은 공통 RigAnimationEngine이 소유한다

- Player, weapon, boss 같은 기능 모듈이 phase timer, part diff, 보간, 중단 복구를 각자 구현하지 않는다.
- 공통 구현은 `src/engine/animation/`에 두고 Galaxy Runner 전용 이름과 규칙을 알지 못하게 한다.
- 엔진은 다음 책임을 가진다.
  - immutable rig snapshot 검증
  - `retained`, `added`, `removed`, `replaced` part diff 계산
  - phase timeline, easing, delay, progress 계산
  - 안정 pose와 transition pose 합성
  - pause, resume, reset, settle, interruption 처리
  - reduced-motion 처리
  - 누락 asset과 strategy 실패에 대한 선언된 fallback 처리
  - 현재 phase, degraded 상태, error를 포함한 read-only frame snapshot 제공
- 게임별 adapter는 gameplay 상태를 rig snapshot과 profile id로 변환하고 결과 frame을 renderer에 전달하는 역할만 가진다.
- 게임별 adapter와 renderer에는 detach/attach 시간 계산이나 weapon별 animation 분기문을 두지 않는다.
- 모든 기체·보스·드론의 향후 파츠 전환도 같은 공개 API를 사용한다.

공개 API 초안:

```js
const engine = new RigAnimationEngine({
  profiles,
  strategies,
  onError,
});

engine.start({ revision, from, to, profileId, parameters });
engine.setPose(channel, value);
engine.setPaused(paused);
engine.setReducedMotion(reduced);
engine.update(deltaSeconds);
engine.snapshot();
engine.settle();
engine.reset();
```

입력 snapshot 초안:

```js
{
  id,
  parts: [
    {
      id,
      assetKey,
      group,
      zIndex,
      pivot: { x, y },
      transform: { x, y, rotation, opacity },
      tags,
    },
  ],
}
```

엔진은 `assetKey`와 `tags`의 게임 의미를 해석하지 않는다. 같은 `id`의 part가 asset 또는 등록 속성을 바꾸면 `replaced`로 분류한다.

### 예외 흡수 정책

예외를 호출부의 임시 분기문으로 처리하지 않고 다음 순서로 엔진 계약 안에 흡수한다.

1. 선언형 profile
   - phase duration, easing id, part delay, change type별 motion, interruption, reduced-motion, fallback을 데이터로 표현한다.
2. 등록형 pure strategy
   - profile만으로 표현할 수 없는 motion은 엔진 생성 시 등록한 strategy id로 선택한다.
   - strategy는 frozen part/change/phase 입력을 받고 transform descriptor만 반환한다.
   - strategy는 gameplay 객체, Canvas context, engine private state에 접근하지 않는다.
3. 공통 primitive 확장
   - 새로운 사례가 기존 profile/strategy로 표현되지 않으면 Player 쪽에 예외를 추가하지 않는다.
   - 엔진에 재사용 가능한 primitive와 테스트를 먼저 추가한 뒤 profile에서 사용한다.

초기 엔진이 일반화해야 할 예외 목록:

- 추가만, 제거만, 교체, 유지 part
- 좌우 대칭과 비대칭 part
- part별 pivot, z-order, delay, duration, easing
- structure 변화 없는 pulse/crossfade
- transition 중 최신 revision 교체, 현재 transition 완료, 1개 대기 정책
- pause/resume, reset, gameover settle
- reduced-motion의 crossfade 또는 instant settle
- 누락/지연 asset의 `hold-source`, `skip-part`, `settle-target` 정책
- invalid dt, phase 경계 초과, 빈 rig, 동일 from/to
- strategy 예외와 잘못된 profile/strategy id

예외 흡수는 실패를 숨긴다는 뜻이 아니다.

- 잘못된 snapshot/profile/strategy는 상태를 바꾸기 전에 명시적 오류로 실패한다.
- runtime asset 누락처럼 허용된 장애만 선언된 fallback으로 진행하고 snapshot에 `degraded: true`와 원인을 남긴다.
- strategy 실행 오류는 `onError`로 보고한 뒤 profile의 실패 정책에 따라 source 유지 또는 target settle을 수행한다.
- 엔진 내부에는 `if (weapon === "nova")` 같은 게임별 토큰 분기를 금지한다.

## 자산 방향

### 기존 방향을 그대로 복구하지 않는다

- 과거의 `player-weapon-part-states-v5.png`와 level preview는 Git 이력에 남아 있지만 production에서 제거된 자산이다.
- 과거 10x4 evolution atlas를 검증 없이 복구하지 않는다.
- 현재 레벨별 완성 PNG 40장은 무기별로 동일 이미지이므로 강화 애니메이션의 근거 자산으로 사용할 수 없다.

### 새 기준

```text
assets/player/rig/
  base/
  rapid/
  energy/
  spread/
  nova/
```

- 파츠는 512x512 투명 등록 캔버스에 동일 원점과 pivot 계약을 가진다.
- 예시 파츠: fuselage, cockpit, wing-left/right, engine, core, weapon-left/right, armor plate.
- 각 레벨 manifest는 전체 이미지를 새로 생성하지 않고 활성 파츠 목록과 variant를 선언한다.
- 각 레벨은 최소 하나의 눈에 보이는 delta를 가진다. 구조 변화가 없는 core 강화는 명시적으로 core pulse 전용 단계로 선언한다.
- 현재 Rapid, Energy, Spread, Nova final-form PNG는 각 노선의 승인된 완성 형태이자 settled visual 정본이다.
- rig part는 기본 기체에서 완성 형태로 전환하거나 강화할 때의 탈착·이동·재결합 transition layer로 사용한다.
- transition이 끝나면 생성 파츠를 계속 합성해 완성 실루엣을 바꾸지 않고 해당 노선의 기존 final-form PNG로 settle한다.
- 레벨별 final-form 파일이 현재 동일한 노선은 임의의 영구 외형 차이를 만들지 않는다. 대신 같은 완성 형태를 유지한 채 공통 engine profile로 분해·재결합 동작을 표현한다.

### 이미지 생성 원칙

- 한 번에 기체 40장이나 좌우 pose 수백 장을 생성하지 않는다.
- 현재 기본 기체와 승인된 완성 기체를 reference로 고정한다.
- 먼저 `base -> Rapid 완성본`과 `Rapid 강화 -> 같은 Rapid 완성본`만 제작해 전환 중 파츠 합성·분해·재조립 품질과 final-form settle을 확인한다.
- 대칭 파츠도 pivot과 방향을 명시한다. 단순 추측 crop이나 runtime 자동 분할은 사용하지 않는다.
- 각 파츠는 alpha bounds, pivot, 512x512 canvas, 합성 silhouette를 자동 검증한다.
- AI 생성 결과는 그대로 production에 넣지 않고 contact sheet와 실제 게임 배율 preview를 확인한 뒤 채택한다.
- 생성 파츠는 transition 전용임을 catalog에 표시하고 settled snapshot에는 승인된 final-form 단일 파츠만 남긴다.

### 이미지 크기와 직접 사용·크롭 책임 계약

런타임이 소비하는 모든 rig part는 다음 단일 규격을 사용한다.

```text
format: PNG
color: RGBA
canvas: 512x512
origin: canvas center
background: transparent
runtime crop: forbidden
```

생성·가공 경로는 두 가지로 분리한다.

Image generation 전송물이 요청한 1024x1024와 다른 정사각 크기로 돌아오는 경우는 별도 source preparation 단계에서 흡수한다.

- `tools/assets/rig_asset_source_normalizer.py`는 chroma 제거가 끝난 정사각 RGBA 전체를 보존해 정확한 1024x1024 source로만 정규화한다.
- 이 모듈은 512x512 runtime 등록, cell crop, chroma 제거, gameplay manifest 해석을 하지 않는다.
- 실제 이번 imagegen 전송물 1254x1254는 원본 이름에 크기를 기록해 보존하고, 이 단계로 1024x1024 canonical source를 만든다.

1. Direct image registration
   - 입력: 단일 파츠가 중앙에 있는 정사각 RGBA PNG. 기본 생성 요청 크기는 1024x1024.
   - 처리: 이미지 전체를 보존해 512x512 registered canvas로 정규화한다.
   - 금지: 셀 선택, 사각 영역 crop, 여러 파츠 분리.
   - 책임 모듈: `tools/assets/rig_asset_direct.py`.
2. Sheet cell cropping
   - 입력: 정확히 1024x1024인 2x2 sheet. 각 cell은 정확히 512x512.
   - 처리: manifest의 row/column으로 cell을 잘라 각각 512x512 RGBA PNG로 저장한다.
   - 금지: runtime asset 선택, gameplay manifest 해석, 자동 의미 추론.
   - 책임 모듈: `tools/assets/rig_asset_cropper.py`.

공통 orchestrator인 `tools/assets/rig_asset_pipeline.py`는 source manifest의 `mode: direct | sheet`만 해석하고 각 전용 모듈에 위임한다. direct와 sheet 알고리즘을 한 함수의 조건문으로 합치지 않는다.

생성 원본은 배포 자산과 분리한다.

```text
tools/assets/rig-sources/        # AI 생성 원본과 chroma 제거 중간물
assets/player/rig/               # 검증을 통과한 512x512 runtime PNG만
```

- Built-in image generation은 완전한 단색 `#ff00ff` chroma 배경을 요청한다.
- `#ff00ff`는 현재 흰색, navy, cyan, yellow, green, orange 기체 팔레트와 충돌이 가장 적어 공통 key로 사용한다.
- chroma 제거는 설치된 `remove_chroma_key.py`가 담당하고 direct registrar/cropper는 chroma 제거를 수행하지 않는다.
- 최종 등록 단계는 PNG signature, RGBA, 512x512, 완전 투명 외곽선, non-empty alpha bounds를 검증한다.
- 크기 또는 alpha 계약이 틀리면 자동 성공 처리하지 않고 source id와 이유를 포함해 실패한다.

## 책임 경계와 예상 파일

### 신규 파일

- `src/engine/animation/README.md`
  - 엔진 책임, 공개 API, 입력·출력, 부작용, 실패·확장 계약.
- `src/engine/animation/animation-timeline.js`
  - phase duration, easing, progress, boundary 이동을 처리하는 순수 timeline.
- `src/engine/animation/pose-channel-state.js`
  - pose target의 진입·복귀·방향 반전 보간과 pause/reduced-motion lifecycle.
- `src/engine/animation/part-assembly-diff.js`
  - 두 rig snapshot의 retained/added/removed/replaced diff.
- `src/engine/animation/transition-profile.js`
  - profile과 strategy id 검증, fallback·interruption 정책 정규화.
- `src/engine/animation/rig-animation-engine.js`
  - pose channel과 assembly transition의 공통 상태·수명주기.
- `src/engine/rendering/rig-animation-renderer.js`
  - read-only engine snapshot을 Canvas에 그리는 공통 renderer.
- `src/gameplay/player-animation-profiles.js`
  - bank·강화 profile과 게임별 parameter 데이터. 알고리즘을 포함하지 않는다.
- `src/gameplay/player-rig-catalog.js`
  - weapon/level을 immutable rig snapshot으로 변환하는 manifest catalog.
- `src/systems/player-rig-animation-adapter.js`
  - Player의 move/progression 상태를 공통 engine request로 변환.
- `src/renderers/player-rig-art.js`
  - assetKey를 image handle로 해석하고 readiness를 공통 renderer에 제공.
- `tests/rig-animation-engine.test.mjs`
  - 게임과 독립된 engine contract 테스트.
- `tests/player-rig-animation.test.mjs`
  - Player adapter와 manifest 통합 테스트.
- `assets/player/rig/README.md`
  - 파츠 원점, pivot, 파일명, 검수 계약.
- `tools/assets/rig_asset_direct.py`
  - 단일 이미지 전체를 runtime registered canvas로 정규화하는 direct 전용 처리.
- `tools/assets/rig_asset_cropper.py`
  - 2x2 sheet의 manifest cell을 추출하는 crop 전용 처리.
- `tools/assets/rig_asset_pipeline.py`
  - source manifest를 읽고 direct/crop 모듈에 위임하는 orchestration.
- `tools/assets/rig-sources/manifest.json`
  - source mode, input, output, cell 좌표의 build-time 계약.

### 변경 예상 파일

- `src/gameplay/run-rules.js`
  - ready 시작 무기 선택 제거, run phase·route lock 계약 반영.
- `src/systems/game-session-system.js`
  - 기본 기체 출격과 Restart/Continue phase 처리.
- `src/systems/collectible-lifecycle-system.js`
  - 고정 opening choice 생성·제거와 transition trigger 전달.
- `src/entities/collectible-item.js`
  - 선택 노선 이후 weapon 후보 필터 및 opening item 예외.
- `src/systems/player-progression-system.js`
  - 기존 결과에 immutable `change.from` / `change.to` 추가.
- `src/systems/game-loop-system.js`
  - opening phase spawn gate와 adapter update 호출.
- `src/entities/player.js`
  - 새 애니메이션 로직을 추가하지 않는다. 현재 ship/draw 책임을 renderer로 이동한다.
- `src/renderers/player-renderer.js`
  - shield, 공통 rig renderer, thruster의 draw 순서 조정만 담당한다.
- `src/engine/game.js`
  - 공통 engine과 Player adapter 생성·reset 연결만 추가하고 300라인을 넘기지 않는다.
- `galaxy-runner.html`
  - classic provider-before-consumer script 순서 추가.
- `src/ui/game-overlay.js`
  - ready 선택 UI를 Space 출격 안내로 교체.
- `src/engine/README.md`, `docs/ENGINE_ARCHITECTURE.md`
  - gameplay 비종속 animation engine의 책임과 금지 범위 추가.

### 파일 크기와 하드닝 경계

- `src/entities/player.js`는 현재 777라인이다. 애니메이션 코드를 직접 추가하지 않는다.
- 이 작업과 직접 겹치는 ship, effect, drone draw 책임을 renderer로 추출해 파일을 순감소시킨다.
- 전체 300라인 이하 달성이 이 범위를 넘어가면 남은 combat/state 분리 문제와 후속 방향을 문서화한다.
- `src/gameplay/game-config.js`는 현재 대형 설정 파일이므로 새 visual 설정을 추가하지 않고 전용 config 파일을 둔다.
- 기존 P1/P2에서 하드닝한 session, progression, loop 계약을 바꾸므로 구현 전 사용자 명시 승인이 필요하다.

## 실행 단계

### Phase 0. 계약 문서와 4노선 transition 자산

1. `RigAnimationEngine`의 공개 API, snapshot, profile, strategy, failure 계약을 문서에 먼저 고정한다.
2. base launch, route choice, route lock과 Player adapter 계약을 제품 문서에 반영한다.
3. base와 Rapid, Energy, Spread, Nova용 transition 등록 파츠를 제작한다.
4. 정지 합성, bank 좌/우 pose, detach/attach, final-form settle을 실제 게임 경로에서 확인한다.
5. 실제 게임 배율에서 silhouette, alpha edge, pivot 흔들림을 검수한다.

완료 gate: 공통 엔진 계약과 모든 노선의 transition-only 자산을 승인된 final-form 정본과 독립 검증할 수 있어야 한다.

### Phase 1. 기본 기체 오프닝과 노선 잠금

1. ready 시작 무기 선택 UI와 입력 계약을 제거한다.
2. `baseLaunch -> routeChoice -> combat` phase를 구현한다.
3. 고정 4종 선택 아이템과 선택 후 나머지 제거를 구현한다.
4. 이후 weapon drop/morph를 선택 노선으로 제한한다.
5. Restart와 Continue 계약을 테스트한다.

완료 gate: 기본 기체가 확실히 보이고 선택한 노선과 다른 일반 weapon item이 나오지 않는다.

### Phase 2. 좌우 비행 애니메이션

1. 브라우저 native `AnimationTimeline`과 충돌하지 않는 `RigAnimationTimeline`, `PartAssemblyDiff`, `TransitionProfile`, `RigAnimationEngine`을 구현한다.
2. 공통 `RigAnimationRenderer`와 engine-only contract test를 추가한다.
3. Player의 visual state와 Canvas draw 책임을 adapter/renderer로 분리한다.
4. Player adapter가 bank 값을 engine pose channel로만 전달하게 한다.
5. global scale/skew를 제거하고 engine snapshot의 rigid part pose를 적용한다.
6. shield, thruster, special effect의 bank 적용 범위를 분리한다.
7. hold, release, reverse, pause, reset을 자동 테스트한다.

완료 gate: 엔진에 Player/weapon 토큰이 없고, 좌우 이동 시 기체가 찌그러지지 않으며 enter/hold/return이 보인다.

### Phase 3. 강화 전이 애니메이션

1. progression result에 from/to snapshot을 추가한다.
2. Player adapter가 progression 결과를 engine `start()` request로 변환한다.
3. 기존 엔진 profile로 네 노선의 same-route level 강화를 production 경로에 연결한다.
4. Player 전용 detach/attach 알고리즘이나 phase timer가 생기지 않았는지 확인한다.
5. 누락 자산, strategy 오류, interruption, reduced motion, pause/reset fallback을 검증한다.

완료 gate: gameplay 수치와 무관하게 파츠 탈착·재조립이 끝까지 재현된다.

### Phase 4. 네 노선과 level final-form mapping 확장

1. Rapid, Energy, Spread, Nova의 01~10 승인 final-form mapping을 확정한다.
2. 모든 노선을 같은 snapshot/profile 계약으로 확장한다.
3. 각 노선의 size/hitbox 시각 정합성을 확인한다.
4. 불필요한 중복 PNG preload를 줄이고 선택 노선의 다음 단계만 우선 로드한다.
5. 새 노선에서 feature-specific animation 분기가 필요하지 않은지 확인한다.

완료 gate: 모든 강화 단계가 정확한 기존 final-form으로 settle하고, 영구 외형을 임의 생성하지 않으면서 bounded detach/attach transition을 가진다.

### Phase 5. 통합 QA와 배포

1. Node contract tests, static script order, asset manifest tests를 실행한다.
2. 브라우저에서 base launch, 4종 선택, 좌우 bank, 강화 phase를 확인한다.
3. console/page/network error, reduced motion, pause/resume, Restart/Continue를 확인한다.
4. browser smoke와 soak에서 frame p95, entity high-water, asset request를 비교한다.
5. `pnpm run test:run`, `pnpm run build`, `pnpm run test:browser`, `pnpm run test:soak`를 통과한 뒤에만 commit/push/deploy한다.

사용자가 feature branch 배포 후 main 병합·재배포를 명시 승인했으므로 모든 gate 통과 뒤 수행한다.

## 테스트 계획

### Node/contract

- Space 시작 시 무기 level 0과 `baseLaunch` 상태
- 약속된 시간 전 기본 기체가 유지됨
- opening choice 4종이 중복 없이 한 번만 생성됨
- 선택 후 나머지 세 개 제거와 `selectedWeaponKind` 확정
- 이후 weapon drop/morph가 선택 kind만 반환함
- Restart는 선택 제거, Continue는 선택 보존
- bank 좌우 대칭, release neutral 복귀, 큰 dt clamp
- bank renderer가 non-uniform scale/skew를 호출하지 않음
- rig snapshot의 retained/added/removed/replaced diff
- timeline의 exact boundary, zero/invalid/large dt 처리
- profile/strategy id 검증과 invalid request 원자적 실패
- part별 pivot/z-order/delay/easing과 비대칭 part
- interruption 세 정책과 revision 안정성
- 누락 asset/strategy 오류 fallback의 degraded/error 가시성
- engine source에 Player, Rapid, Energy, Spread, Nova 토큰이 없음
- direct registrar가 cell crop 책임을 갖지 않음
- sheet cropper가 runtime/gameplay manifest를 해석하지 않음
- 1024x1024 2x2 sheet에서 정확한 512x512 RGBA output 생성
- final runtime asset의 512x512, fully transparent outer edge, alpha bounds 검증
- progression from/to snapshot 불변성
- evolution phase 순서, 종료, 최신 revision 우선
- transition이 level, damage, hitbox를 다시 변경하지 않음
- 자산 누락 시 fallback과 max-level core 처리
- reduced-motion 전환
- classic script provider-before-consumer 순서

### 브라우저/시각 QA

- Space 후 0.5초 시점 기본 기체 screenshot
- route choice 4종 배치 screenshot
- 각 노선 선택 직후 다른 세 아이템 제거 확인
- 좌/우 hold, release, reverse pose screenshot
- detach/attach phase 0/25/50/75/100% screenshot
- 실제 게임 배율에서 alpha edge, pivot jump, silhouette 흔들림 확인
- pause/resume, Restart, Continue, gameover 확인
- console/page/network error 0건
- 장시간 soak 중 transition entity·asset cache 증가 없음

## 문서 갱신 범위

- `docs/PLAYER_RIG_SPEC.md`
- `docs/PLAYER_SHIP_REDESIGN_V5.md`
- `docs/PLAYER_ASSET_STYLE_GUIDE.md`
- `docs/AI_ASSET_PROMPT_RULES.md`
- `docs/GAMEPLAY_SYSTEMS.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `assets/README.md`
- `src/engine/README.md`
- 신규 `src/engine/animation/README.md`
- `src/engine/rendering/README.md`
- `src/gameplay/README.md`
- `src/systems/README.md`
- `src/renderers/README.md`
- `src/entities/README.md`
- `tests/README.md`
- 신규 `assets/player/rig/README.md`
- 신규 `tools/assets/README.md` 또는 기존 문서 갱신

## 최종 완료 기준

- 기본 기체 출격 장면이 사라지지 않는다.
- 선택한 기체와 다른 일반 기체 아이템이 등장하지 않는다.
- 좌우 이동 시 전체 이미지를 scale/skew로 비틀지 않는다.
- 기체가 bank 진입, 유지, 복귀 애니메이션을 가진다.
- 강화 시 변경 파츠가 탈착·결합되고 최종 level manifest와 일치한다.
- 시각 transition이 gameplay 상태를 소유하거나 지연하지 않는다.
- 모든 part pose·detach·attach·interruption·fallback은 공통 engine API를 통한다.
- Player, weapon, boss adapter에 독자 phase timer와 animation 알고리즘이 없다.
- 예상 예외는 profile/strategy/fallback으로 표현되며 실패 상태가 숨겨지지 않는다.
- 모든 신규 코드 파일은 300라인 이하이고 Player에 애니메이션 책임을 추가하지 않는다.
- 코드, 테스트, 폴더 책임 문서, 자산 계약 문서가 같은 규칙을 설명한다.
- 전체 test/build/browser/soak gate가 통과한 뒤 배포 SHA와 live URL을 증명한다.

## 승인 기록

사용자는 2026-07-16에 이미지 생성부터 전체 수정, feature branch 배포, main 병합·재배포까지 명시 승인했다. 또한 기존 각 기체 이미지는 완성본이라고 확정했다. 다음 범위는 그 승인 안에서 수행했다.

- 하드닝된 run/session/progression/loop 모듈 수정
- ready 시작 선택 제거와 opening choice 도입
- 일반 랜덤 무기 전환 제거와 route lock 도입
- final-form-only 계약을 animation-ready rig 계약으로 교체
- `src/engine/animation` 공통 모듈 추가와 engine/render 경계 문서 변경
- 네 노선 transition-only 자산 생성 및 적용

## MulAg 실행 TODO

- `mulAg/md/todo/TODO-RIG-ANIMATION-ENGINE-001.md`
  - 게임 비종속 engine core, generic renderer, contract tests.
- `mulAg/md/todo/TODO-RIG-ASSET-POC-002.md`
  - rig asset 계약과 base/4노선 transition-only 자산.
- `mulAg/md/todo/TODO-PLAYER-RIG-ADAPTER-003.md`
  - Player adapter, progression trigger, renderer integration.
- `mulAg/md/todo/TODO-OPENING-ROUTE-CHOICE-004.md`
  - 기본 기체 오프닝, 4종 선택, route lock.
- `mulAg/md/todo/TODO-RIG-ANIMATION-QA-005.md`
  - 독립 boundary/exception/visual/performance QA.

TODO-003과 TODO-004의 기존 하드닝 파일 수정은 위 승인에 따라 수행했으며 같은 파일을 동시에 수정하지 않도록 TODO별 editable 범위를 분리했다.
