# src/engine/rendering

## 역할

`src/engine/rendering`은 Canvas 2D를 안전하게 쓰기 위한 범용 렌더링 helper를 둔다.

## 파일 책임

- `render-helpers.js`: canvas state 저장/복구, panel, bounds, text rows 같은 primitive drawing helper를 제공한다.
- `sprite-atlas.js`: uniform grid atlas의 cell 크기 계산과 단일 frame draw를 담당한다.

## 경계

- 이 폴더는 어떤 sprite frame을 선택할지, player final-form을 어떻게 보일지, HUD 문구를 어떻게 구성할지 결정하지 않는다.
- 기존 `src/core/sprite-atlas.js`는 호환 진입점이며 같은 전역 `SpriteAtlas` 계약을 유지한다.
