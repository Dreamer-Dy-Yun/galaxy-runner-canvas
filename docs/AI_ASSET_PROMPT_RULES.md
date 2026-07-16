# AI Asset Prompt Rules

Use these rules when generating player, enemy, boss, projectile, or item art for Galaxy Runner.

## General rules

- Output runtime-ready assets whenever possible.
- Prefer transparent PNG or SVG assets that can be used directly by the game.
- Keep the subject centered and fully visible.
- Avoid relying on previous chat context. Prompts must describe the asset directly.
- Avoid text baked into images unless the asset is explicitly UI text.

## Player final-form ships

- Canvas: 512x512 transparent PNG.
- One complete ship per file.
- File name: `<weapon>_01.PNG` through `<weapon>_10.PNG`.
- Folder: `assets/player/final-forms/<weapon>/`.
- The ship should be readable at small in-game size with a strong silhouette.
- Existing Rapid, Energy, Spread, and Nova final-form PNGs are the approved settled designs.
- Do not replace an approved final-form with generated transition parts.
- Do not generate floating weapon overlays for persistent settled-state use.

## Player transition rig parts

- Purpose: detach/attach transition frames only. The animation must settle to the existing target final-form.
- Generation request: 1024x1024 with a flat `#ff00ff` chroma background.
- Actual current delivery: 1254x1254. Do not treat delivery size as the runtime or canonical source size.
- Chroma result: square RGBA PNG with fully transparent outer edges and non-empty alpha bounds.
- Canonical source: preserve the full delivery and normalize it to 1024x1024 before direct registration or sheet cropping.
- Direct input: one centered part in a canonical 1024x1024 RGBA PNG; output is one 512x512 runtime PNG.
- Sheet input: canonical 1024x1024 RGBA, exact 2x2 layout; each explicit cell is a 512x512 runtime PNG.
- Keep each sheet part inside its own quadrant with a safe empty margin on every cell edge; no alpha pixel may touch the cell boundary.
- Do not ask the build tools to infer weapon kind, level, part identity, or crop bounds from image contents.
- Source normalization, direct registration, and cell cropping are separate build-time steps. Runtime cropping is forbidden.

## Boss and enemy assets

- Boss parts may be separate SVG or PNG pieces when gameplay needs animation, armor opening, weak points, or partial destruction.
- Enemy atlases should keep rows and columns consistent with the runtime config.

## Production cleanup

Keep generated deliveries and normalization intermediates under `tools/assets/rig-sources`, not under runtime assets. Only validated 512x512 RGBA parts belong under `assets/player/rig`, and those parts remain transition-only.
