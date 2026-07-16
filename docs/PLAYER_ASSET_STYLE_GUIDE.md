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

## Settled asset construction rule

For final forms, build each weapon-level image as a complete registered ship layer (not a detached part).
Each file should already sit in the correct position relative to the base ship so the game can draw it at the rig origin without offsets.

Current runtime flow:
- `rapid`, `energy`, `spread`, `nova` have 10 level-specific files each.
- Files are read from `assets/player/final-forms/{weapon}/{weapon}_{NN}.PNG`.
- The selected level is loaded by naming order (01~10), so swapping a file at the same level updates that state directly.
- The existing files are the approved complete forms for Rapid, Energy, Spread, and Nova.
- Generated transition parts must settle back to the selected existing final-form and must not redefine its silhouette.

## Transition part construction rule

- Transition parts are registered 512x512 RGBA PNGs under `assets/player/rig/{weapon}/`.
- They are visible only during bounded detach/attach animation phases.
- Use stable part ids, a centered registration origin, explicit pivots, and declarative z-order.
- Do not bake gameplay level, hitbox, or damage meaning into a part image.
- Do not use transition parts as a persistent overlay after settle.
- Current generated transition coverage includes Rapid, Energy, Spread, and Nova. Every route still returns to its approved final-form directly after the bounded transition.

Fallback note:
If a transition part is missing, skip or degrade the animation and settle to the target final-form. If the approved final-form itself is missing, use the documented emergency base fallback rather than assembling a ship from transition parts.

## AI asset prompt rule

Never rely on conversation context in image prompts. Do not write phrases like `the image above`, `the previous design`, `the one you pointed out`, or `approved reference`. Describe the visual features directly in text.

## Chroma and canvas rule

- Preferred final runtime output: transparent PNG.
- For generated transition sources, request a 1024x1024 image on flat `#ff00ff` with no shadows touching the background.
- The current service may deliver 1254x1254 despite the 1024 request. Remove chroma, then preserve the whole image while normalizing it to canonical 1024x1024 RGBA.
- Direct registration preserves one complete source and produces a 512x512 runtime part.
- Sheet cropping accepts only a canonical 1024x1024 2x2 sheet and extracts explicit 512x512 cells.
- Keep the full object inside the canvas with generous padding.
- Do not place multiple parts close together unless the tool is explicitly building a contact sheet.
