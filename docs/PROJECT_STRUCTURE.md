# Galaxy Runner project structure

Owner: Yoon Dae Young
Codex partner: Codex GPT-5
Current cleanup baseline: v5 player visual rig

## Runtime entry

- `galaxy-runner.html`: script loading order and DOM shell.
- `galaxy-runner.css`: page, HUD, canvas layout.
- `src/main.js`: creates and starts the game.

## Source boundaries

- `src/core`: small shared primitives such as constants, asset loading, sprite atlases, collision helpers.
- `src/gameplay`: gameplay definitions, catalogs, and named runtime configuration.
- `src/engine`: game loop, input, pause/restart orchestration.
- `src/entities`: gameplay objects with state and behavior, such as player, enemies, projectiles, items, particles.
- `src/systems`: rules and formulas that should not live inside entities, such as weapons, special skills, and drones.
- `src/renderers`: canvas drawing helpers and visual layout code.
- `src/ui`: HUD, dev start selector, and on-screen overlay logic.

## Gameplay docs

- `docs/GAMEPLAY_SYSTEMS.md`: shield, shield defense, and ship defense rules.

## Weapon extension rule

- Add or change weapon identity, color, item weight, max level, core bonus, projectile profile, movement profile, footprint, HUD icon name, and final-form asset naming in `src/gameplay/weapon-catalog.js`.
- Add support item metadata in `src/gameplay/item-definitions.js`.
- Add shared runtime numbers in `src/gameplay/game-config.js`.
- Systems should read weapon data from `WeaponCatalog` instead of hardcoding weapon names or balance values.

## Magic number rule

- Runtime, entity, system, and UI code should use named config values instead of raw tuning numbers.
- New gameplay numbers belong in `src/gameplay/game-config.js`, `src/gameplay/weapon-catalog.js`, or `src/gameplay/item-definitions.js`.
- Renderer vector path coordinates may stay local only when they define the literal shape being drawn.

## Active runtime assets

- `assets/enemies/enemy-ships-v1.png`
- `assets/projectiles/projectiles-v1.png`
- `assets/player/player-weapon-part-states-v5.png`
- `assets/player/player-registered-parts-v1.png`
- `assets/player/thruster-registered-v1.png`
- `assets/player/special-effects-registered-v1.png`
- `assets/player/final-forms/{rapid,energy,spread,nova}/{weapon}_01.PNG` ... `{weapon}_10.PNG`

## Active player source assets

- `assets/player/source/ship_redesign_v5/`: current AI source, alpha cutouts, and reference sheet for the player weapon evolution atlas.
- `assets/player/source/player-parts-ai-v1.png`: source sheet for the fallback player rig, armor, and drones.
- `assets/player/source/thruster-flames-ai-v1.png`: source sheet for registered thruster animation.

## Active asset tools

- `tools/assets/build-ship-redesign-v5.ps1`: builds the current v5 base ship and weapon part-state atlas.
- `tools/assets/compile-player-rig.ps1`: builds fallback player rig, armor, drones, thrusters, and special effect atlases.
- `tools/assets/clean-atlas-fringes.ps1`: utility for chroma/fringe cleanup when an atlas needs repair.
- `tools/assets/replace-rapid-projectile.ps1`: projectile replacement helper.

## Cleanup rule

Do not reintroduce cropped floating weapon attachments for player evolution. Player weapon visuals must be generated as registered full-canvas layers and drawn through `PlayerPartLayout.drawEvolutionLayer`.
