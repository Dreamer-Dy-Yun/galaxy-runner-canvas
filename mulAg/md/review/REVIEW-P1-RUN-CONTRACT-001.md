# REVIEW-P1-RUN-CONTRACT-001: 시작·Continue·방어 계약 구현

## 수행 일시

2026-07-16 01:09:06 +09:00

## 참조 plan / todo

- `mulAg/md/plan/active/PLAN-2026-07-16-p1-p2-hardening.md`
- `mulAg/md/todo/TODO-P1-RUN-CONTRACT-001.md`

## 수행 내용

- ready 화면의 4종 시작 무기 선택과 Rapid 기본값을 `RunRules` 계약으로 만들었다.
- 좌우/A·D와 숫자 1~4가 같은 선택 계약을 사용하고, Space start가 선택한 무기만 level 1로 장착하게 했다.
- Restart는 자동 start를 제거하고 현재 선택을 보존한 ready로 돌아가게 했다.
- 기존 무제한 보존형 Continue를 유지하면서 `continues > 0`을 Assist 상태로 해석해 HUD와 game-over 화면에 표시했다.
- player defense profile과 실제 계산을 작은 rules/system으로 추출하고 outer-first flat cap 10.5, 별도 percent 감소, shield 이후 양수 HP hit 최소 1을 적용했다.
- 방어 HUD는 armor level/flat과 percent를 두 줄로 나눠 한 status cell 안에서 겹치지 않게 표시한다.
- 아이템 획득과 무기 장착 전이를 `PlayerProgressionSystem`으로 옮겨 `Player`에는 delegate만 남겼다.
- shield defense 단계당 0.45, Assist 의미, 시작 선택, 방어 cap/최소 피해를 gameplay 문서와 폴더 책임 문서에 맞췄다.

## 생성 파일

- `src/gameplay/run-rules.js`
- `src/gameplay/player-defense-rules.js`
- `src/systems/player-defense-system.js`
- `src/systems/player-progression-system.js`
- `src/ui/loadout-selector.js`
- `mulAg/md/review/REVIEW-P1-RUN-CONTRACT-001.md`

## 수정 파일

- `src/core/constants.js`
- `src/engine/input/action-map.js`
- `src/engine/game.js`
- `src/entities/player.js`
- `src/gameplay/game-config.js`
- `src/gameplay/game-info.js`
- `src/systems/game-session-system.js`
- `src/ui/game-hud.js`
- `src/ui/game-overlay.js`
- `galaxy-runner.html`
- `README.md`
- `docs/GAMEPLAY_SYSTEMS.md`
- `docs/PROJECT_STRUCTURE.md`
- `src/gameplay/README.md`
- `src/systems/README.md`
- `src/ui/README.md`
- `src/entities/README.md`

## 의도적으로 미변경한 범위

- `tests/**`, `scripts/**`: `TODO-P1-CONTRACT-TESTS-001` 소유 범위
- P2 feedback/audio/accessibility/capacity 파일과 연결부
- `src/entities/enemy.js`, engine runtime/debug, asset, workflow
- `player.js`, `game-config.js`의 P1 이외 대형 책임 분리

## 책임 경계 결과

- `RunRules`: 시작 선택 순서·기본값·Assist 판별과 Continue 설정만 소유한다.
- `PlayerDefenseSystem`: Player 상태를 입력으로 받아 immutable defense snapshot과 HP 피해만 계산한다.
- `PlayerProgressionSystem`: pickup과 weapon acquisition 전이를 수행하고 결과 상태는 Player가 보유한다.
- `GameSessionSystem`: action을 ready/start/restart/continue mode 전이로 조정한다.
- `LoadoutSelector`, HUD, overlay: game-owned 값을 계산하지 않고 표시만 한다.
- `player.js`는 824라인에서 759라인, `game-config.js`는 1,056라인에서 1,042라인으로 줄었지만 두 파일의 나머지 대형 분리는 후속 범위다.

## 검증 결과

- 변경 JavaScript `node --check`: PASS
- `corepack pnpm run verify:static`: PASS (`80` JavaScript, `2` HTML, `47` local/ordered classic scripts)
- P1 targeted contracts: `19/19` PASS
  - classic script order/load
  - 시작 무기 order/wrap/숫자 선택
  - chosen-only level 1, Restart ready/선택 보존
  - Assist Continue 진행·강화 보존과 danger field 정리
  - shield-first, flat cap 10.5, outer-first, percent 분리, 최소 HP 피해 1
- `corepack pnpm run build`: PASS (`158` files, `13,619,882` bytes)
- local Playwright manual smoke: Rapid ready → Digit3 Spread 선택 → Space running → Restart ready 및 선택 보존, page/console/network failure `0`건
- 신규 production 파일 최대 길이: `run-rules.js` 70, `player-defense-rules.js` 19, `player-defense-system.js` 56, `player-progression-system.js` 64, `loadout-selector.js` 47라인

## 남은 위험 / 후속

- 최종 `test:run`, browser smoke/soak, P2 통합, 전체 diff QA는 각각 후속 TODO와 Orchestrator가 수행한다.
- `player.js`와 `game-config.js`는 여전히 300라인을 초과한다. 이번에는 방어·획득 규칙만 추출했고 무기 발사/렌더와 나머지 config 분리는 범위 밖이다.
- P2 통합은 P1의 Digit1~4 action과 ready/restart 계약을 보존해야 한다.

## QA 질문

- Restart가 running으로 자동 진입하지 않고 선택을 보존한 ready에 머무르는가?
- 시작 시 선택한 무기 하나만 level 1이고 다른 무기는 0인가?
- Continue가 score/time/danger/upgrades를 보존하면서 field danger만 제거하고 Assist 횟수를 표시하는가?
- 실제 방어 snapshot의 flat 합계가 10.5를 넘지 않고 percent가 별도로 유지되는가?
- shield가 남아 있으면 완전 흡수하고, shield 이후 양수 HP hit은 최소 1인가?
