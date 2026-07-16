# REVIEW: Base와 4노선 transition-only rig 자산

## 수행 일시

2026-07-16 12:27:38 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-RIG-ASSET-POC-002.md`

## 수행 내용

- 승인된 기존 final-form 40장은 수정하지 않고 stable rig 정본으로 등록했다.
- Base 4개와 Rapid 5개, Energy/Spread/Nova 각 4개의 transition-only runtime part를 구축했다.
- 생성 전송물 1254 RGBA, canonical 1024 RGBA, runtime 512 RGBA 책임을 분리했다.
- direct registrar와 exact-cell cropper를 분리하고 manifest orchestrator는 위임만 담당하게 했다.
- Rapid sheet는 cell 경계에 닿던 초기본을 폐기하고 안전 여백이 있는 새 생성본으로 교체했다.

## 변경/생성 파일

- `assets/player/rig/**`
- `tools/assets/**`
- `src/gameplay/player-rig-catalog.js`
- `src/gameplay/player-animation-profiles.js`
- asset/rig 책임 문서와 catalog tests

## 검증 내용

- Python asset tests 16/16 PASS.
- runtime validator가 네 코너뿐 아니라 상·하·좌·우 외곽선 전체 alpha 0을 요구한다.
- 새 Rapid bounds는 barrel-left `(217,101,352,426)`, barrel-right `(159,101,295,426)`, pod-left `(239,74,374,379)`, pod-right `(138,74,273,379)`로 경계에 닿지 않는다.
- runtime은 source sheet, normalizer, cropper를 참조하지 않는다.

## 남은 이슈

- 생성 파츠는 전환 중에만 사용하므로 승인된 완성 기체의 영구 실루엣 변화는 없다.

## QA 확인 요청 사항

- 모든 route/level의 stable snapshot이 기존 final-form 한 장으로만 settle하는지 확인한다.
