# src/core

## 역할

`src/core`는 초기 분리 단계에서 만들어진 legacy 공통 helper 진입점을 보관한다.

## 파일 책임

- `asset-loader.js`: 기존 script 순서를 깨지 않기 위한 `AssetLoader` 호환 진입점이다. 새 책임 기준은 `src/engine/assets/asset-loader.js`와 동일하다.
- `sprite-atlas.js`: 기존 script 순서를 깨지 않기 위한 `SpriteAtlas` 호환 진입점이다. 새 책임 기준은 `src/engine/rendering/sprite-atlas.js`와 동일하다.
- `collision.js`, `constants.js`: 아직 기존 게임 구조에서 직접 사용하는 core 파일이다.

## 경계

- 신규 엔진 공통 책임은 `src/engine/*` 아래에 우선 둔다.
- 이 폴더의 legacy helper는 gameplay 정책이나 player final-form 시각 정책을 소유하지 않는다.
