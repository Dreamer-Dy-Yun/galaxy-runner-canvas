# REVIEW: 게임 비종속 Rig 애니메이션 엔진

## 수행 일시

2026-07-16 12:27:38 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-RIG-ANIMATION-ENGINE-001.md`

## 수행 내용

- immutable rig diff, phase timeline, pure strategy registry, interruption, fallback, reduced motion을 공통 엔진으로 구현했다.
- `PoseChannelState`가 pose 목표값의 진입·복귀·방향 반전 보간과 pause를 소유하게 했다.
- transient part는 active frame에만 존재하고 완료 시 request의 target rig로 settle한다.
- 누락 자산과 strategy 실패는 `degraded/errors`를 남기며 선언된 target settle 정책을 따른다.

## 변경/생성 파일

- `src/engine/animation/**`
- `src/engine/rendering/rig-animation-renderer.js`
- `scripts/classic-script-contract.mjs`
- `galaxy-runner.html`
- `tests/rig-animation-engine.test.mjs`
- `tests/rig-animation-browser-globals.test.mjs`
- engine/rendering 책임 문서

## 검증 내용

- 엔진 source에 Player/Rapid/Energy/Spread/Nova 토큰이 없음을 자동 검증했다.
- native browser `AnimationTimeline`과 이름 충돌하지 않는다.
- retained/added/removed/replaced/transient, pause/reset, interruption 3종, reduced motion, invalid request 원자성, fallback을 검증했다.
- 신규 엔진 code는 `rig-animation-engine.js` 300라인, 나머지는 300라인 미만이다.
- 최종 `pnpm run test:run` 76/76, build/browser/soak PASS.

## 남은 이슈

- 실제 feature branch와 main 배포 증거는 아직 없다.

## QA 확인 요청 사항

- adapter에 독자 보간/phase/fallback이 남지 않았는지와 target settle 오류 가시성을 확인한다.
