# Diff Selection - 2026-05-18

## 수행 일시

2026-05-18 11:28:06 KST

## 목적

멀티 에이전트 개선 작업 이후 워킹트리에 섞인 변경을 커밋 후보, 부분 선별 필요, 보류 대상으로 분리한다.

## 현재 검증 상태

- `pnpm run test:run`: `pnpm` 명령이 없어 실패.
- `pnpm run build`: 프로젝트 안에서 `package.json`이 검색되지 않아 실행 대상 없음.
- `node --check` on `src/**/*.js`: 통과.

## 커밋 후보: 현재 TODO 범위로 볼 수 있는 파일

- `README.md`
- `docs/GAMEPLAY_SYSTEMS.md`
- `mulAg/md/**`
- `src/main.js`
- `src/engine/input.js`
- `src/entities/collectible-item.js`
- `src/entities/nova-explosion.js`
- `src/gameplay/game-info.js`
- `src/gameplay/item-definitions.js`
- `src/systems/special-system.js`
- `src/systems/weapon-system.js`
- `src/ui/game-hud.js`

## 부분 선별 필요: 같은 파일 안에 범위가 섞인 파일

- `src/engine/game.js`
  - 포함 후보: canvas guard, frame loop guard, projectile collision context cache, boss count cache, unordered removal, HUD text contract use.
  - 보류 후보: `FinalShipStartupPicker` 제거와 startup profile 제거 흐름.
- `src/entities/player.js`
  - 포함 후보: Spread fire delay 책임 이동, `WeaponSystem.spreadSideShot()`, drone slot cache, 특수/무기 정합화.
  - 보류 후보: weapon evolution atlas 제거, startup profile 제거, final-form-only visual 변경.
- `src/gameplay/game-config.js`
  - 포함 후보: `SPECIAL_CONFIG.tierCosts` 정규화/검증, 특수 설정 계약 warning.
  - 보류 후보: `PLAYER_CONFIG.assets.weaponEvolution` 제거와 파일 선두 BOM 변화.
- `src/gameplay/weapon-catalog.js`
  - 포함 후보: weapon definition 정규화, catalog contract warning, `scaledWeaponDamage` 기반 조회 안정화.
  - 보류 후보: layered evolution visual API 제거.
- `docs/PROJECT_STRUCTURE.md`
  - 포함 후보: `mulAg/md` 거버넌스 경로 설명.
  - 보류 후보: asset cleanup 방향과 runtime asset 문서 대규모 재작성.

## 보류 대상: 이번 TODO 개선 커밋에서 제외 권장

- `assets/player/**` 삭제 전체
- `tools/assets/*.ps1` 삭제 전체
- `src/ui/final-ship-startup-picker.js` 삭제
- `galaxy-runner.html`
- `galaxy-runner.css`
- `src/core/constants.js`
- `src/renderers/player-part-layout.js`
- `docs/AI_ASSET_PROMPT_RULES.md`
- `docs/PLAYER_RIG_SPEC.md`
- `docs/PLAYER_SHIP_REDESIGN_V5.md`

## 스테이징 판단

현재는 부분 선별이 필요한 핵심 파일이 있어 통째 `git add`를 수행하지 않았다.
커밋을 진행하려면 먼저 위의 "부분 선별 필요" 파일들을 hunk 단위로 나누거나, asset/runtime visual cleanup을 별도 커밋으로 분리해야 한다.
