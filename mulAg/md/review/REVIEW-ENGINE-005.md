# REVIEW-ENGINE-005

## Scope

- TODO-ENGINE-005: Asset, Render, Debug helper 최소 골격 추가 및 QA 회귀 검증 준비.
- Galaxy Runner 전용 player final-form 정책, 에셋 의미, HUD/시각 방향은 엔진으로 올리지 않았다.

## 변경 요약

- `src/engine/assets/asset-loader.js`: 브라우저 이미지 캐시, 단일 load, manifest preload, status 조회 helper를 추가했다.
- `src/engine/rendering/render-helpers.js`: Canvas state 저장/복구, panel, bounds, text rows primitive helper를 추가했다.
- `src/engine/rendering/sprite-atlas.js`: uniform grid atlas frame 계산과 draw helper를 엔진 렌더링 계층에 추가했다.
- `src/engine/debug/debug-overlay.js`: 기본 비활성 debug overlay hook을 추가했다. 활성화 시 FPS, dt, entity count, scene 이름/state를 표시한다.
- `src/core/asset-loader.js`, `src/core/sprite-atlas.js`: 기존 classic script 진입점을 유지하면서 전역 `AssetLoader`, `SpriteAtlas` 계약을 명시적으로 노출하도록 정리했다.
- `src/main.js`: asset/render/debug helper를 runtime loader 목록에 포함하고, `GalaxyRunnerDebug` console hook을 연결했다.

## 경계 기록

- 엔진 asset helper는 asset 목록의 의미, 필수 여부, fallback 정책을 결정하지 않는다.
- 엔진 render helper는 frame 선택, player final-form, enemy/boss/HUD 시각 정책을 소유하지 않는다.
- debug overlay는 관찰과 표시만 담당하며, scene/gameplay state를 변경하지 않는다.
- 대량 asset 삭제나 visual direction 변경은 수행하지 않았다.

## Debug 활성화 방법

- 기본 상태는 비활성화다.
- URL에 `?debug=1`을 붙이거나 콘솔에서 `GalaxyRunnerDebug.enable()`을 호출하면 overlay를 확인할 수 있다.
- 콘솔에서 `GalaxyRunnerDebug.disable()`을 호출하면 다시 숨길 수 있다.

## 문서 갱신 사항

- `src/engine/README.md`: asset/render/debug helper 계약과 legacy core 진입점 경계를 추가했다.
- `src/engine/assets/README.md`: asset helper 책임과 금지 범위를 기록했다.
- `src/engine/rendering/README.md`: render helper와 atlas 책임을 기록했다.
- `src/engine/debug/README.md`: debug overlay 책임, 활성화 방법, 금지 범위를 기록했다.
- `src/core/README.md`: legacy core helper 진입점의 현재 책임을 기록했다.

## 남은 이슈

- `src/core/asset-loader.js`와 `src/engine/assets/asset-loader.js`, `src/core/sprite-atlas.js`와 `src/engine/rendering/sprite-atlas.js`는 classic script 호환 때문에 동일 계약을 중복 보유한다. 후속 작업에서 HTML script 경로를 엔진 helper로 직접 전환하면 core legacy 파일은 더 얇은 호환 계층으로 줄일 수 있다.
- `src/engine/game.js`는 여전히 300라인을 크게 초과한다. 이번 작업 범위를 넘는 분리 대상이며, gameplay orchestration과 render 책임 분리가 필요하다.

## QA

- 작업 완료 후 `src/**/*.js` 범위에 대해 `node --check`를 실행하고 대화 결과로 보고한다.
