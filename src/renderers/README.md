# src/renderers

## 역할

`src/renderers`는 Canvas에 그리는 시각 표현과 asset composition helper를 담당한다.

## 파일 책임

- `space-background.js`: 배경 별과 스크롤 효과.
- `game-scene-renderer.js`: world entity, projectile, HUD, overlay의 frame draw 순서.
- `projectile-renderer.js`: projectile atlas sprite와 공통 vector visual dispatch.
- `projectile-energy-renderer.js`: absorbed enemy-bullet energy core visual.
- `projectile-special-renderer.js`: rapid beam, nova, spread, drone projectile vector visual.
- `player-renderer.js`, `player-part-layout.js`, `final-ship-art.js`: 플레이어 ship 조립, final-form 이미지, fallback 렌더링.
- `item-icon-aux-renderer.js`: item icon fallback star와 weapon core 보조 vector shape.
- `item-icon-renderer.js`: item/HUD/help icon 이미지와 vector fallback 렌더링.

## 경계

- renderer는 gameplay 수치를 결정하지 않는다.
- renderer cache는 화면 출력 목적의 memoization만 허용한다.
- projectile entity의 수명, hit radius, homing, damage 계약은 `src/entities/projectile.js`에 둔다.
- asset 경로가 바뀌면 `assets/README.md`, `docs/PROJECT_STRUCTURE.md`, 관련 gameplay 설정도 함께 확인한다.
