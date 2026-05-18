# src/engine/assets

## 역할

`src/engine/assets`는 게임별 에셋 의미를 알지 않는 브라우저 에셋 로딩 helper를 둔다.

## 파일 책임

- `asset-loader.js`: 이미지 캐시, 단일 이미지 load, manifest preload, load/error 상태 조회를 제공한다.

## 경계

- 이 폴더는 어떤 이미지가 필수인지, 실패 시 어떤 fallback을 쓸지 결정하지 않는다.
- Galaxy Runner의 player final-form, 적, 아이템, HUD 에셋 선택 정책은 게임/렌더러 계층에 남긴다.
- 기존 `src/core/asset-loader.js`는 호환 진입점이며 같은 전역 `AssetLoader` 계약을 유지한다.
