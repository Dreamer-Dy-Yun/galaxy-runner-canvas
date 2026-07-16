# src/engine/animation

## 역할

이 폴더는 게임 규칙을 해석하지 않고 immutable rig snapshot 사이의 pose와 assembly transition을 계산한다. 파츠 차이, phase 시간, 보간, 중단, reduced motion, 허용된 fallback을 공통 계약으로 처리하고 Canvas나 gameplay 객체에는 접근하지 않는다.

classic script 의존 순서는 다음과 같다.

```text
animation-timeline.js
  -> pose-channel-state.js
  -> part-assembly-diff.js
  -> transition-profile.js
  -> rig-animation-engine.js
  -> rendering/rig-animation-renderer.js
```

## 파일 책임

- `animation-timeline.js`: non-negative dt로 phase boundary와 easing progress를 결정한다.
- `pose-channel-state.js`: pose target의 진입·복귀·방향 반전 보간, pause, reduced motion 상태를 공통 처리한다.
- `part-assembly-diff.js`: rig 입력을 검증·동결하고 `retained`, `added`, `removed`, `replaced`를 계산한다.
- `transition-profile.js`: 선언형 profile, request data, 생성 시 등록하는 pure strategy registry를 검증한다.
- `rig-animation-engine.js`: timeline, diff, pose channel, interruption, fallback을 조립하고 frozen frame을 제공한다.
- `../rendering/rig-animation-renderer.js`: frozen frame과 asset resolver만 읽어 Canvas에 rigid transform을 그린다.

## RigSnapshot 계약

```js
{
  id: "rig-id",
  parts: [{
    id: "stable-part-id",
    assetKey: "opaque-asset-key",
    group: "opaque-group",
    zIndex: 0,
    pivot: { x: 256, y: 256 },
    transform: { x: 0, y: 0, rotation: 0, opacity: 1 },
    tags: ["declarative-tag"]
  }]
}
```

`id`, part `id`, `assetKey`는 비어 있으면 안 되고 part id는 rig 안에서 유일해야 한다. 수치는 finite여야 하며 opacity는 0~1이다. 같은 part id의 asset, group, z-index, pivot, tags가 바뀌면 `replaced`, transform만 바뀌면 `retained`다. 입력은 정규화된 새 객체로 복사되고 하위 값까지 동결된다.

## 공개 API

```js
const engine = new RigAnimationEngine({ profiles, strategies, onError });

engine.start({
  revision,
  from,
  to,
  profileId,
  reason,
  parameters,
  unavailableAssetKeys,
  transitionParts,
});
engine.setPose(channel, finiteValue);
engine.setPaused(paused);
engine.setReducedMotion(reduced);
engine.update(deltaSeconds);
engine.snapshot();
engine.settle();
engine.reset(optionalStableRig, optionalProfileId);
```

revision은 reset 이후 단조 증가해야 한다. `to`는 transition 완료 뒤의 유일한 stable rig 정본이다. 따라서 `to`가 단일 등록 이미지 part인 경우에도 full-image 유지 또는 교체 crossfade 뒤 정확히 그 이미지로 settle할 수 있다.

`transitionParts`는 from/to diff와 별도로 검증되는 선택 입력이다. 각 임시 파츠는 같은 part를 source와 target으로 가진 `transient` change가 되어 detach/bridge에서 밖으로 분해되고 attach에서 다시 결합될 수 있다. active frame에만 포함되며 완료 snapshot에는 남지 않는다. 파츠 조립 중의 flare, lock 표시, 임시 조각을 stable rig에 섞지 않을 때 사용한다.

## TransitionProfile 계약

```js
{
  id: "assembly",
  phases: [{ id: "attach", duration: 0.2, easing: "easeOut" }],
  motions: {
    retained: { strategyId: "interpolate", parameters: {} },
    added: { strategyId: "detach-attach", parameters: {} },
    removed: { strategyId: "detach-attach", parameters: {} },
    replaced: { strategyId: "detach-attach", parameters: {} },
    transient: { strategyId: "interpolate", parameters: {} }
  },
  poseChannels: {
    bank: {
      strategyId: "rigid-bank",
      parameters: {
        response: {
          enterDuration: 0.12,
          returnDuration: 0.16,
          reverseDuration: 0.2,
          easing: "easeInOut"
        }
      }
    }
  },
  interruption: "replace-latest",
  reducedMotion: { mode: "crossfade", duration: 0.08 },
  fallback: { asset: "hold-source", strategy: "hold-source" },
  parameters: {}
}
```

각 motion에는 `timing: { scope, delay, duration, easing, byTag }`를 선택적으로 둘 수 있다. delay와 duration은 선택한 scope progress의 비율이며 scope는 전체 transition 또는 현재 phase다. `byTag`는 같은 motion 안에서 특정 파츠의 delay/duration/easing만 선언적으로 덮어쓴다. `detach-attach`를 phase마다 지연하려면 `scope: "phase"`를 사용한다.

지원 easing은 `linear`, `easeIn`, `easeOut`, `easeInOut`이다. interruption은 `replace-latest`, `finish-current`, `queue-latest` 중 하나다. queue는 최신 요청 하나만 유지한다.

asset fallback은 `hold-source`, `skip-part`, `settle-target`, strategy fallback은 `hold-source`, `settle-target`을 지원한다. reduced motion은 짧은 `crossfade` 또는 즉시 `settle-target`이다.

## 내장 pure strategy

- `interpolate`: retained transform 보간, added/removed/replaced crossfade, transient part의 중간 pulse를 처리한다.
- `rigid-bank`: pose 값과 `x`, `y`, `rotation`, `tagMultipliers` parameter만으로 translate/rotate delta를 반환한다. scale과 skew를 생성하지 않는다.
- `detach-attach`: `phaseModes`, `offsetByTag`, `origin`, `distance`, `distanceByTag`, `rotation`, `rotationByTag`로 source detach와 target attach의 rigid transform을 만든다. 태그별 `offsetByTag: { tag: { x, y } }`가 있으면 그 finite vector를 최대 이동 offset으로 직접 사용하고, 없으면 pivot-origin 방향과 distance를 사용한다. `phaseModes` 값은 `hold-source`, `detach`, `bridge`, `attach`, `hold-target`, `crossfade`다. part별 시차는 motion `timing`이 담당한다.

호출부는 request에 callback을 넣을 수 없다. 추가 strategy는 엔진 생성 시 이름과 pure function을 등록해야 한다. strategy 입력은 frozen change/part/phase와 선언형 parameter이며 gameplay 객체, Canvas context, 엔진 private state를 받지 않는다.

transition strategy 반환은 `{ source?: transformPatch, target?: transformPatch }`, pose strategy 반환은 `{ delta: transformDelta }`다. transform 결과에는 finite `x`, `y`, `rotation`, 0~1 `opacity`만 허용된다.

## FrameSnapshot과 렌더링

`snapshot()`은 revision, rig id, active, phase/progress, pause/reduced-motion, degraded/errors, z-index 순으로 정렬된 parts를 포함한 frozen 객체를 반환한다. renderer는 assetKey 의미를 해석하지 않으며 `resolveAsset` 결과를 pivot 기준 translate/rotate/opacity로만 그린다. draw는 frame이나 gameplay state를 변경하지 않고 `{ drawn, missing, degraded }` report를 반환한다.

## 실패와 부작용

- 잘못된 rig/profile/strategy/request/revision/dt는 상태 변경 전에 예외를 던진다.
- 선언된 unavailable asset만 fallback 대상이며 frame에 `degraded: true`와 `asset-unavailable` 원인을 남긴다.
- strategy 실행 오류는 `onError`로 보고하고 profile의 source 유지 또는 target settle 정책을 적용한다.
- pause는 timeline만 정지하고 pose/frame 조회는 가능하다.
- reset은 active/pending/pose/error/revision을 지우고 주어진 stable rig로 원자적으로 돌아간다.

게임별 토큰, asset 선택, level/damage/hitbox 변경, Canvas draw는 이 폴더의 책임이 아니다. 새 예외는 호출부 분기보다 선언형 parameter, 등록형 pure strategy, 재사용 가능한 공통 primitive 순으로 확장한다.
