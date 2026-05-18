# REVIEW: TODO-002 게임플레이 계약 정합성

## 수행 일시

2026-05-18 12:22:52 KST

## 참조한 todo

- `mulAg/md/todo/TODO-002.md`

## 수행 내용

- gameplay 설정, 아이템 정의, 무기 카탈로그, 게임 정보 패널 데이터의 계약 검증과 안전 fallback을 보강했다.
- 계약 불일치 시 콘솔 경고를 남기고, UI가 임의의 비즈니스 값을 새로 만들지 않도록 정리했다.
- `SPECIAL_CONFIG.tierCosts` 정규화와 특수 티어 누락 경고를 추가했다.
- `WeaponCatalog`, `ITEM_DEFINITIONS`, `GAME_INFO`의 필수 필드와 kind 참조를 방어적으로 검증했다.
- `docs/GAMEPLAY_SYSTEMS.md`에 계약 정합성 결정사항을 기록했다.

## 변경 파일

- `src/gameplay/game-config.js`
- `src/gameplay/item-definitions.js`
- `src/gameplay/weapon-catalog.js`
- `src/gameplay/game-info.js`
- `docs/GAMEPLAY_SYSTEMS.md`

## 생성 파일

- `mulAg/md/review/REVIEW-002.md`

## 미변경 파일

- `mulAg/md/done/*`

## 검증 내용

- `src/**/*.js` 대상 `node --check` 통합 검증 통과.
- Chrome headless smoke 검증에서 ready 화면 렌더링 확인.
- `pnpm run test:run`, `pnpm run build`는 현재 `pnpm`과 `package.json` 부재로 실행하지 못했다.

## 남은 이슈

- `src/gameplay/game-config.js`, `src/gameplay/weapon-catalog.js`에는 asset/final-form 정리와 관련된 보류 변경이 함께 존재한다.
- 해당 보류 변경은 현재 QA 완료 범위에 포함하지 않는다.

## QA 확인 요청 사항

- 경고 prefix를 프로젝트 전역 규칙으로 더 엄격히 통일할지 후속 판단이 필요하다.
