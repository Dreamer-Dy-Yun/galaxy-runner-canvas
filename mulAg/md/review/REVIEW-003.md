# REVIEW: TODO-003 특수능력/무기 정합화

## 수행 일시

2026-05-18 11:28:06 KST

## 참조한 todo

- `mulAg/md/todo/TODO-003.md`

## 수행 내용

- 특수 스킬 실행 흐름을 `kind -> cost -> tier config -> effect -> spend` 순서로 정리했다.
- 오버드라이브 중 특수 meter는 HUD, readiness, tier 선택, spend 판정에서 모두 100%로 취급하도록 통일했다.
- 일반/특수 무기 damage 계산을 `WeaponSystem.scaledWeaponDamage()` 경로로 모았다.
- Spread 일반 공격 쿨다운 책임을 `WeaponSystem.currentFireDelay()`로 이동했다.
- Nova mine 최대 개수 판정을 가능한 경우 live projectile list 기준으로 수행하도록 정리했다.
- 변경 의도와 남은 성능 리스크를 `docs/GAMEPLAY_SYSTEMS.md`에 기록했다.

## 변경 파일

- `src/systems/special-system.js`
- `src/systems/weapon-system.js`
- `src/entities/player.js`
- `docs/GAMEPLAY_SYSTEMS.md`

## 생성 파일

- `mulAg/md/review/REVIEW-003.md`

## 미변경 파일

- `mulAg/md/done/*`

## 검증 내용

- `pnpm run test:run`은 실행을 시도했으나 현재 환경에서 `pnpm` 명령을 찾을 수 없어 실패했다.
- 프로젝트 루트와 하위 경로에서 `package.json`이 검색되지 않아 `pnpm run build` 대상 스크립트도 확인할 수 없었다.
- 대체 검증으로 `src` 하위 모든 JavaScript 파일에 `node --check`를 실행했고 문법 오류는 없었다.

## 남은 이슈

- `src/entities/player.js`에는 TODO-003 변경과 별도로 final-form/startup-picker 관련 기존 변경이 함께 섞여 있어 커밋 전 부분 선별이 필요하다.
- `src/engine/game.js`, `src/gameplay/game-config.js`, `src/gameplay/weapon-catalog.js`, `docs/PROJECT_STRUCTURE.md`도 범위가 섞인 파일로 확인되어 통째 스테이징하지 않는 것이 안전하다.
- 실제 게임 플레이 검증은 아직 수행되지 않았다.

## QA 확인 요청 사항

- asset/runtime visual cleanup 변경을 이번 개선 작업 커밋에 포함할지 별도 커밋으로 분리할지 결정이 필요하다.
