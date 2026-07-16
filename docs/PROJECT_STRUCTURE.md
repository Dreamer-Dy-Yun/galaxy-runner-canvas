# Project Structure

Galaxy Runner is a static Canvas shooter. The project is kept intentionally small: runtime code, runtime assets, docs, and the GitHub Pages workflow.

## Entry points

- `galaxy-runner.html`: loads the game canvas and runtime scripts.
- `galaxy-runner.css`: page and canvas presentation.
- `.github/workflows/pages.yml`: publishes the static game to GitHub Pages.

## Runtime source

- `src/engine`: reusable 2D Canvas runtime boundary for canvas/DPR, frame loop, scene lifecycle, action-mapped input, world/entity storage, collision query, render helpers, asset preload, and debug hooks. It must not own Galaxy Runner-specific weapon, score, stage, item, boss, or HUD rules.
- `src/core`: legacy script entrypoints and shared primitive helpers. New reusable runtime contracts should prefer `src/engine/*` unless a compatibility path is required.
- `src/audio`: optional Web Audio presentation for semantic gameplay feedback, including lazy unlock and persistent mute state.
- `src/gameplay`: Galaxy Runner configuration and catalogs that define the base-launch/route-lock run setup, Assist Continue, defense, weapons, stages, items, and score/distance rules.
- `src/entities`: player, enemy, projectile, item, effect, and game object state.
- `src/systems`: bounded gameplay systems such as session mode, player defense/progression, semantic feedback, frame loop orchestration, enemy spawn/lifecycle, projectile lifecycle, item pickup, boss AI, special skills, and performance pools.
- `src/renderers`: canvas rendering boundaries, scene draw order, and registered player part layout helpers.
- `src/ui`: HUD plus non-running overlays, including the base-ship ready prompt and pause information panel. Route selection itself is a running-world collectible flow.
- `mulAg/md`: 멀티 에이전트 거버넌스 문서(Plan/TODO/Review/DONE)와 역할/템플릿 정의.

## Engine / game boundary

- Engine-owned responsibilities live behind `src/engine` contracts and cover runtime mechanics only: canvas surface, clock, scene manager, input action state, entity store, reusable collision/render/asset/debug helpers.
- Game-owned responsibilities stay in Galaxy Runner scene, gameplay, entities, systems, renderers, and UI: weapon identity, special meter rules, spawn/score/stage/continue, item effects, boss behavior, HUD copy, and player final-form rendering.
- If a module boundary changes, update `docs/ENGINE_ARCHITECTURE.md`, `src/engine/README.md`, and this structure note together.
- Folder-level README files under `assets`, `docs`, and `src/**` are the local responsibility boundary for LLM and maintenance work.

## Runtime assets

- `assets/player/final-forms/<weapon>/<weapon>_01.PNG` ... `<weapon>_10.PNG`: authoritative player ship visuals. Replace any level file directly to change that level.
- `assets/player/player-registered-parts-v1.png`: support atlas for armor, drone, and emergency base fallback only.
- `assets/player/thruster-registered-v1.png`: registered thruster frames.
- `assets/player/special-effects-registered-v1.png`: registered player special-effect frames.
- `assets/projectiles/projectiles-v1.png`: projectile atlas.
- `assets/items/*.svg`: item icons.
- `assets/enemies/enemy-ships-v1.png`: enemy ship atlas.
- `assets/bosses/*.svg`: stage boss parts and boss visual states.

## Docs & governance

- `docs/GAMEPLAY_SYSTEMS.md`: gameplay 규칙/밸런스 설명서.
- `docs/PLAYER_SHIP_REDESIGN_V5.md`, `docs/PLAYER_RIG_SPEC.md`, `docs/PLAYER_ASSET_STYLE_GUIDE.md`, `docs/AI_ASSET_PROMPT_RULES.md`: 자산 및 디자인 보조 문서.
- `mulAg/md/README.md`: 작업 운영 메타 문서.

## Known boundary debt

The current hardening passes reduced `src/engine/game.js`, `src/entities/projectile.js`, `src/renderers/item-icon-renderer.js`, and `src/gameplay/weapon-catalog.js` below the 300-line project guideline by moving session, loop, spawn, projectile lifecycle, projectile rendering, item, effect, enemy lifecycle, overlay, scene draw, item icon fallback, and weapon definition responsibilities into focused files. The following legacy files still exceed 300 lines and should be split in separate hardening passes rather than mixed into unrelated fixes:

- `src/gameplay/game-config.js`: continue splitting remaining balance groups and contract validation by gameplay domain. Run and player-defense rules have moved to focused modules.
- `src/entities/player.js`: split remaining weapon firing, shield/special/thruster, and drone helpers. Item progression, damage/defense, rig animation, and ship asset rendering now delegate to focused modules.
- `src/entities/enemy.js`: split role stats, AI movement, boss behavior bridges, and drawing helpers.

## Cleanup rule

Runtime code must not load source contact sheets or generation intermediates. Reusable, manifest-driven asset build tools and the exact sources needed to reproduce approved runtime exports live under `tools/assets`; validated runtime PNGs alone live under `assets/player/rig`. One-off experiments that are not referenced by the documented pipeline still stay outside the runtime asset tree or are removed after review.
