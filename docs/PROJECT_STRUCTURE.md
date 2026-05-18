# Project Structure

Galaxy Runner is a static Canvas shooter. The project is kept intentionally small: runtime code, runtime assets, docs, and the GitHub Pages workflow.

## Entry points

- `galaxy-runner.html`: loads the game canvas and runtime scripts.
- `galaxy-runner.css`: page and canvas presentation.
- `.github/workflows/pages.yml`: publishes the static game to GitHub Pages.

## Runtime source

- `src/engine`: reusable 2D Canvas runtime boundary for canvas/DPR, frame loop, scene lifecycle, action-mapped input, world/entity storage, collision query, render helpers, asset preload, and debug hooks. It must not own Galaxy Runner-specific weapon, score, stage, item, boss, or HUD rules.
- `src/core`: constants, math, collision, random, asset loading, and low-level drawing helpers.
- `src/gameplay`: Galaxy Runner configuration and catalogs that define balance, weapons, stages, items, and score/distance rules.
- `src/entities`: player, enemy, projectile, item, effect, and game object state.
- `src/systems`: bounded gameplay systems such as weapons, items, collisions, boss AI, special skills, and performance pools.
- `src/renderers`: canvas rendering boundaries and registered player part layout helpers.
- `src/ui`: HUD, overlays, and game information UI.
- `mulAg/md`: 멀티 에이전트 거버넌스 문서(Plan/TODO/Review/DONE)와 역할/템플릿 정의.

## Engine / game boundary

- Engine-owned responsibilities live behind `src/engine` contracts and cover runtime mechanics only: canvas surface, clock, scene manager, input action state, entity store, reusable collision/render/asset/debug helpers.
- Game-owned responsibilities stay in Galaxy Runner scene, gameplay, entities, systems, renderers, and UI: weapon identity, special meter rules, spawn/score/stage/continue, item effects, boss behavior, HUD copy, and player final-form rendering.
- If a module boundary changes, update `docs/ENGINE_ARCHITECTURE.md`, `src/engine/README.md`, and this structure note together.

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

## Cleanup rule

Do not keep source contact sheets, preview renders, or one-off asset generation scripts in the runtime project. If an asset is needed in-game, export it into the runtime asset folders above. If it is only a production aid, keep it outside the repo or delete it after export.
