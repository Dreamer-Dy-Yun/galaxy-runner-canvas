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
- Do not generate floating weapon overlays for runtime use.

## Boss and enemy assets

- Boss parts may be separate SVG or PNG pieces when gameplay needs animation, armor opening, weak points, or partial destruction.
- Enemy atlases should keep rows and columns consistent with the runtime config.

## Production cleanup

Do not commit preview folders, prompt experiments, or one-off generation scripts as runtime files. Keep only the assets and docs that the current game actually uses.
