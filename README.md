# Galaxy Runner Canvas

Canvas-based vertical space shooter prototype.

Play here:
[https://dreamer-dy-yun.github.io/galaxy-runner-canvas/](https://dreamer-dy-yun.github.io/galaxy-runner-canvas/)

## Project info

- Requested and directed by: YUN DAEYOUNG
- Built with: Codex / GPT-5.5 coding agent collaboration
- Development period: 2026-05-09 to 2026-05-10
- Purpose: vibe-coding test and playable canvas shooter prototype
- Repository: public GitHub Pages experiment

## Features

- Four weapon ships: Rapid, Energy, Spread, Nova
- Weapon levels 1-10 with per-weapon core upgrades after max level
- Special skills per weapon
- Shield, armor, shield defense, drones, and overdrive items
- Bouncing morphing field items
- Stage boss cycle with armor-open vulnerability phases
- GitHub Pages deployment through GitHub Actions

## Controls

| Key | Action |
|---|---|
| Arrow / WASD | Move |
| Space | Fire / Start / Continue |
| Ctrl | Special skill |
| P / Esc | Pause |
| R | Restart |

## Current weapon identity

| Weapon | Role |
|---|---|
| Rapid | Fast, small hitbox, high-speed shots, follow beam special |
| Energy | Heavy armor, bullet absorption, shield-core special |
| Spread | Wide coverage, many projectiles, fan storm special |
| Nova | Explosive shots, mines, growing blast radius |

## Project structure

```text
assets/      Game images and generated visual assets
docs/        Current gameplay and asset specifications
mulAg/       Multi-agent governance docs (PLAN/TODO/REVIEW/DONE)
src/core/    Legacy script entrypoints and primitive helpers
src/engine/  Game loop, input, world orchestration
src/entities Runtime game objects
src/gameplay Config, catalogs, game info data
src/renderers Canvas render helpers and scene draw order
src/systems  Gameplay orchestration such as session, loop, spawn, projectiles, enemies, items, specials
src/ui       HUD, pause overlay, and game information UI
scripts/     Static source verification and deterministic dist assembly
tests/       Node contract tests and Playwright browser smoke
dist/        Generated Pages artifact; source control에서 제외
```

## Development notes

- The game is a classic-script static site, but deployment uses a verified `dist` artifact.
- Node.js 22+ and the `packageManager` field에 명시된 pnpm version을 사용한다.
- Runtime tuning should live in `src/gameplay/game-config.js`.
- Weapon identity and progression data should live in `src/gameplay/weapon-definitions.js`; callers should use `WeaponCatalog`.
- Keep `docs/GAMEPLAY_SYSTEMS.md` aligned with current gameplay direction.

## Local verification

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run test:run
corepack pnpm run build
corepack pnpm exec playwright install chromium
corepack pnpm run test:browser
```

- `test:run`은 source script syntax/local script reference와 Node contract tests를 검증한다.
- `build`는 source를 다시 검증하고 Pages에 올릴 파일만 `dist`에 조립한 뒤 artifact도 검증한다.
- `test:browser`는 이미 생성된 `dist`를 임시 localhost port에서 제공한다. Chromium으로 debug off/on 각각 ready → running → paused → resume → restart를 실제 입력으로 검증하며 page/console/network 오류도 차단한다.

## Deployment contract

`main` push 또는 수동 workflow 실행 시 Pages job은 frozen dependency install, `test:run`, `build`, Chromium install, `test:browser`를 순서대로 통과해야 한다. 이후에만 `dist`를 Pages artifact로 업로드하고 배포한다. 배포 성공은 workflow 결과와 live URL을 각각 확인한다.

## Multi-agent operation guide

- Planning 문서는 `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`.
- 실행 단위는 `mulAg/md/todo/TODO-001.md` ... `TODO-005.md`.
- 성능/안정성/동작 검증 리뷰는 `mulAg/md/review/REVIEW-*.md`.
- TODO 완료 판단은 QA가 `mulAg/md/done`로 이동하기 전까지는 최종 확정되지 않는다.
