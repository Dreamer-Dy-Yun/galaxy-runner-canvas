# TODO-VISUAL-001: 보류된 visual/asset cleanup 의사결정

## 목적

현재 워킹트리에 남아 있는 asset 삭제, startup picker 제거, player visual rig/final-form 정책 변경을 엔진화/게임 개선 커밋과 분리해 판단한다.

## 보류 변경 범위

- `assets/player/**` 삭제
- `tools/assets/*.ps1` 삭제
- `src/ui/final-ship-startup-picker.js` 삭제
- `galaxy-runner.html`, `galaxy-runner.css`의 startup picker 제거
- `src/core/constants.js`의 dev tool flag 제거
- `src/entities/player.js`, `src/renderers/player-part-layout.js`의 final-form-only 방향 변경
- `src/gameplay/game-config.js`, `src/gameplay/weapon-catalog.js`의 weapon evolution atlas 계약 제거
- 관련 docs 재작성

## 처리 선택지

- 별도 cleanup 커밋으로 인정하고 문서/런타임 계약을 함께 갱신한다.
- 개발용 startup picker와 source/preview assets는 유지하고 cleanup 변경을 되돌린다.
- runtime에 필요한 asset만 유지하고 source/preview/tool은 별도 archive 정책을 세운다.

## 완료 기준

- asset 보관/삭제 기준이 문서화되어야 한다.
- startup picker 유지/제거 여부가 명시되어야 한다.
- runtime에서 참조하는 asset 삭제 여부가 검증되어야 한다.
- 결정 후 별도 `REVIEW-VISUAL-001.md`를 작성한다.
