# AI asset prompt rules

Owner: Yoon Dae Young
Codex partner: Codex GPT-5
Purpose: prompts for regenerating Galaxy Runner bitmap assets

## Non-context rule

Prompts must be self-contained. Avoid any phrase that requires the image model to know this chat history.

Bad:
- `like the image you pointed out`
- `same as the approved final reference`
- `use the previous one`

Good:
- `top-down white sci-fi fighter with very long forward-swept outer wings, yellow canopy, yellow circular wing cores, dark navy inner structure, cyan edge glows, pure green background`

## Final-form rule

For player final forms, generate a complete ship for each level as an independent 512x512 transparent PNG.

Runtime expects this naming pattern:

`assets/player/final-forms/{weapon}/{weapon}_{NN}.PNG`

- `{weapon}`: `rapid`, `energy`, `spread`, `nova`
- `{NN}`: `01` through `10`

The image should already be registered at the game rig origin (centered as a full-canvas ship layer). Empty space is expected and correct.

## Legacy per-layer rule (fallback only)

For non-final staged overlays, keep using the established part-state workflow and coordinate system, but do not replace the final-form pipeline with per-part assembly.

## Contact sheet rule

Only request a contact sheet when the goal is visual review. Do not use a contact sheet as the runtime source unless a build script explicitly crops and registers each cell.

## Cropping rule

The generated object must not touch canvas edges. Prompt for at least 48 px safe padding on every side unless a deliberate oversized boss asset is being generated.

## Complexity rule

Large readable shapes first. Small greebles are allowed only after the silhouette is clear at gameplay size.
