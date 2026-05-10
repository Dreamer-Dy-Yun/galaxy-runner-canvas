# Galaxy Runner Canvas

Canvas-based vertical space shooter prototype.

Play here:
[https://dreamer-dy-yun.github.io/galaxy-runner-canvas/](https://dreamer-dy-yun.github.io/galaxy-runner-canvas/)

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
