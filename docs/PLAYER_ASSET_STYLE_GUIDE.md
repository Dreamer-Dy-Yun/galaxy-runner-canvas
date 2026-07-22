# Player asset style guide

Owner: Yoon Dae Young
Codex partner: Codex GPT-5
Current visual target: clean, readable arcade sci-fi ships

## Style priorities

- Readability beats micro detail.
- Large silhouette changes should communicate weapon identity immediately.
- White armor, dark navy mechanical understructure, and weapon-color accents should stay consistent.
- Avoid tiny decorative fragments that become noise at gameplay scale.

## Weapon identity

- Rapid: narrow, sharp, yellow cockpit or yellow energy accents, forward-focused silhouette, smaller hitbox.
- Spread: wider wings, green accents, broad area-control silhouette, larger hitbox.
- Energy: heavier body, cyan core, shield/absorption feel, slightly slower movement.
- Nova: orange core, circular reactor language, explosive identity; exact gameplay direction remains open.

## Asset construction rule

For final forms, build each weapon-level image as a complete registered ship layer (not a detached part).
Each file should already sit in the correct position relative to the base ship so the game can draw it at the rig origin without offsets.

Current runtime flow:
- `rapid`, `energy`, `spread`, `nova` have 10 level-specific files each.
- Files are read from `assets/player/final-forms/{weapon}/{weapon}_{NN}.PNG`.
- The selected level is loaded by naming order (01~10), so swapping a file at the same level updates that state directly.

Fallback note:
If a final-form image is missing, gameplay should fall back to the part-state overlays currently in the engine.

## AI asset prompt rule

Never rely on conversation context in image prompts. Do not write phrases like `the image above`, `the previous design`, `the one you pointed out`, or `approved reference`. Describe the visual features directly in text.

## Chroma and canvas rule

- Preferred final runtime output: transparent PNG.
- If chroma is used, use a flat pure green background with no shadows touching the background.
- Keep the full object inside the canvas with generous padding.
- Do not place multiple parts close together unless the tool is explicitly building a contact sheet.
