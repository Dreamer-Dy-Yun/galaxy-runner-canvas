# TODO: 게임 비종속 Rig 애니메이션 엔진 구축

## 목적

파츠 pose, assembly diff, phase timeline, interruption, reduced-motion, fallback을 게임별 구현 없이 처리하는 공통 `RigAnimationEngine` 계약을 만든다.

## 참조 plan

- `mulAg/md/plan/PLAN-2026-07-16-opening-player-animation-redesign.md`

## 작업 범위

- immutable rig snapshot과 transition request 검증
- retained/added/removed/replaced part diff
- timeline/profile/strategy/fallback 처리
- pose channel과 assembly transition frame 합성
- read-only frame snapshot과 generic Canvas renderer
- engine-only contract test와 책임 문서

## 실행 조건

- 사용자가 이 활성 plan의 구현을 명시적으로 승인한 뒤 실행한다.
- TODO-002~005와 같은 파일을 동시에 수정하지 않는다.

## 수정 가능한 파일

- `src/engine/README.md`
- `src/engine/rendering/README.md`
- `docs/ENGINE_ARCHITECTURE.md`

## 생성 가능한 파일

- `src/engine/animation/README.md`
- `src/engine/animation/animation-timeline.js`
- `src/engine/animation/pose-channel-state.js`
- `src/engine/animation/part-assembly-diff.js`
- `src/engine/animation/transition-profile.js`
- `src/engine/animation/rig-animation-engine.js`
- `src/engine/rendering/rig-animation-renderer.js`
- `tests/rig-animation-engine.test.mjs`
- `mulAg/md/review/REVIEW-RIG-ANIMATION-ENGINE-001.md`

## 읽기 전용 파일

- `src/engine/runtime/engine-runtime.js`
- `src/engine/assets/asset-loader.js`
- `src/engine/rendering/sprite-atlas.js`
- `src/engine/runtime/README.md`
- `src/engine/assets/README.md`
- 참조 plan

## 수정 금지 파일

- `src/gameplay/**`
- `src/entities/**`
- `src/systems/**`
- `src/renderers/**`
- `src/ui/**`
- `src/engine/game.js`
- `assets/**`
- `galaxy-runner.html`

## 입력

- 입력 파일: 참조 plan, 현재 engine/runtime/render/asset 공개 계약
- 입력 데이터 구조: `RigSnapshot`, `TransitionRequest`, `TransitionProfile`, strategy registry
- 참조해야 할 함수/클래스: `EngineRuntime`, `AssetLoader`, `SpriteAtlas`
- 변경하지 말아야 할 인터페이스: scene frame 순서, `EngineRuntime.subscribe`, `AssetLoader`, `SpriteAtlas`

## 출력

- 생성/수정 파일: 위 engine core, generic renderer, contract test, engine 문서
- 반환 형식: frozen animation frame snapshot
- 외부에서 참조할 클래스: `RigAnimationTimeline`, `PoseChannelState`, `PartAssemblyDiff`, `TransitionProfile`, `RigAnimationEngine`, `RigAnimationRenderer`
- 유지해야 할 인터페이스: classic global provider 방식과 provider-before-consumer 순서

## 작업 단계

- [x] 1. public input/output/failure contract를 README와 테스트에 먼저 고정한다.
- [x] 2. timeline, pose target lifecycle, part diff를 순수 모듈로 구현한다.
- [x] 3. profile/strategy registry와 원자적 validation을 구현한다.
- [x] 4. pose/transition/interruption/fallback을 engine에 구현한다.
- [x] 5. generic renderer가 snapshot만 소비하도록 구현한다.
- [x] 6. 게임 비종속성, 결정성, 오류 가시성 테스트를 실행한다.
- [x] 7. review 문서를 작성한다.

## 완료 기준

- engine source와 테스트 fixture에 Player, Rapid, Energy, Spread, Nova 같은 게임 토큰이 없다.
- 추가/제거/교체/유지, pause/reset, reduced-motion, interruption, 빈 rig, 동일 rig가 테스트된다.
- invalid snapshot/profile/strategy는 상태 변경 전에 실패한다.
- 허용된 fallback은 `degraded`와 원인을 snapshot에 남긴다.
- strategy 오류가 숨겨지지 않고 선언된 settle 정책을 따른다.
- 모든 신규 코드 파일이 300라인 이하이다.
- `pnpm run test:run`, `pnpm run build`가 통과한다.

## 주의사항

- 엔진에 weapon, level, boss 같은 게임 의미를 넣지 않는다.
- arbitrary callback을 request마다 받지 않는다. 생성 시 검증된 strategy registry만 사용한다.
- renderer는 gameplay state를 변경하지 않는다.
