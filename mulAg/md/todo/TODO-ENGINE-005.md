# TODO-ENGINE-005: Asset, Render, Debug helper 및 QA 회귀 검증

## 목적

엔진 분리 후 asset/render/debug 공통 helper를 정리하고 전체 동작 회귀를 확인한다.

## 작업 범위

- `src/engine/assets/*`
- `src/engine/rendering/*`
- `src/engine/debug/*`
- 기존 `src/core/asset-loader.js`, `src/core/sprite-atlas.js` 또는 동일 책임 파일
- `docs/ENGINE_ARCHITECTURE.md`
- `mulAg/md/review/REVIEW-ENGINE-005.md`

## 구현 방향

- image preload와 load/error 상태를 엔진 asset helper로 정리한다.
- sprite atlas draw helper는 범용 rendering 계층에 둔다.
- debug hook은 기본 비활성화 상태로 FPS, entity count, scene state를 확인할 수 있게 한다.
- player final-form 정책은 게임 렌더러/플레이어 책임으로 유지한다.

## 제외할 내용

- runtime asset 대량 삭제
- visual direction 변경
- weapon/special balance 변경

## 완료 기준

- asset/render/debug helper가 Galaxy Runner 전용 값을 직접 알지 않는다.
- 문서가 실제 폴더 책임과 맞다.
- 가능한 검증을 실행하고, 불가능한 검증은 이유를 review에 기록한다.
- `REVIEW-ENGINE-005.md`를 작성한다.
