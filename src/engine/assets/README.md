# src/engine/assets

## 역할

- 이미지 등 런타임 에셋의 요청, 캐싱, 선로딩 보조 계약을 제공한다.

## 파일

- `asset-loader.js`
  - 이미지 객체를 생성하고 src 기준 캐시를 유지하는 기본 로더다.
- `asset-preloader.js`
  - 현재 활성화된 `AssetLoader`를 decode-aware preload 흐름으로 보강한다.
  - `AssetLoader.image()` 호출 후 가능한 경우 `HTMLImageElement.decode()`를 예약한다.
  - 여러 이미지를 idle batch로 분산 선로딩하는 `preloadImages()`를 제공한다.

## 경계

- 이 계층은 에셋을 어떻게 불러올지만 소유한다.
- 어떤 에셋이 critical/deferred인지 판단하는 책임은 게임 또는 scene bootstrap 쪽에 둔다.
