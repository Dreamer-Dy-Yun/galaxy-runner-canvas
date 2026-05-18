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
src/core/    Shared low-level utilities
src/engine/  Game loop, input, world orchestration
src/entities Runtime game objects
src/gameplay Config, catalogs, game info data
src/renderers Canvas render helpers
src/systems  Gameplay systems such as weapons, drones, specials, boss AI
src/ui       HUD and developer UI
```

## Development notes

- The game is a static site. No build step is required.
- Open `galaxy-runner.html` locally or use GitHub Pages.
- Runtime tuning should live in `src/gameplay/game-config.js`.
- Weapon identity and progression should live in `src/gameplay/weapon-catalog.js`.
- Keep `docs/GAMEPLAY_SYSTEMS.md` aligned with current gameplay direction.

## Multi-agent operation guide

- Planning 문서는 `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`.
- 실행 단위는 `mulAg/md/todo/TODO-001.md` ... `TODO-005.md`.
- 성능/안정성/동작 검증 리뷰는 `mulAg/md/review/REVIEW-*.md`.
- TODO 완료 판단은 QA가 `mulAg/md/done`로 이동하기 전까지는 최종 확정되지 않는다.
