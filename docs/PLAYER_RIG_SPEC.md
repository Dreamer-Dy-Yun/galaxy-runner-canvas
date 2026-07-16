# Player Rig Spec

Current direction: each weapon and level uses its existing complete final-form ship image as the approved settled visual. Generated rig parts may appear only while a detach/attach transition is running; they never replace the settled final-form source of truth.

## Final-form contract

- Folder: `assets/player/final-forms/<weapon>/`
- File name: `<weapon>_01.PNG` through `<weapon>_10.PNG`
- Weapons: `rapid`, `energy`, `spread`, `nova`
- The game resolves the current weapon and level, then draws that exact PNG.
- The existing PNGs are the approved complete silhouettes for all four routes. Generated transition parts must not redesign or overwrite them.
- During development the 01-10 files may be visually identical. Later, replacing only one level file must immediately change that level after reload.

## Transition-only rig contract

- Folder: `assets/player/rig/<weapon>/`
- File contract: 512x512 RGBA PNG, transparent background and fully transparent outer edges, centered registration origin.
- Current asset coverage: generated transition-only parts for Rapid, Energy, Spread, and Nova.
- The animation engine may render registered parts during charge, detach, bridge, attach, and settle phases.
- When the transition completes, rendering returns to the selected route and level's existing final-form PNG.
- Part transforms, delays, pivots, and z-order are declarative rig data. They do not own weapon level or gameplay state.
- Runtime code must not crop source sheets or infer parts from image contents.

If a transition part is missing or invalid, mark the transition degraded and settle directly or crossfade to the target final-form. Do not assemble a substitute settled ship from incomplete transition parts.

## Transition source sizes

The generation request is 1024x1024, but the current imagegen delivery is 1254x1254. Build-time processing uses this exact boundary:

1. Remove the `#ff00ff` chroma background from the delivered image.
2. Preserve the complete square source while normalizing 1254x1254 RGBA to canonical 1024x1024 RGBA.
3. Register a single direct source as 512x512, or crop explicit 512x512 cells from a canonical 1024x1024 2x2 sheet.
4. Validate PNG signature, RGBA mode, fully transparent outer edges, and non-empty alpha bounds before placing a part under `assets/player/rig`.

Source normalization, direct registration, and sheet cell cropping are separate build-time responsibilities under `tools/assets`. None of them run during gameplay.

## Scale and hitbox

- Ship visual scale and hitbox scale are gameplay data, not image-offset hacks.
- Rapid is drawn at 70% of the base visual scale, so its hitbox area is 49% of the base when width and height both use the same ratio.
- Spread is intentionally larger and uses the same ratio for visual size and hitbox size.
- Do not make graphics and hitbox ratios diverge unless the design explicitly calls for that exception.

## Support atlases

`player-registered-parts-v1.png` remains only for non-final-form support visuals:

- armor overlay
- drone visuals
- emergency base fallback if a final-form asset is unavailable

`thruster-registered-v1.png` and `special-effects-registered-v1.png` are separate registered atlases so effects can be drawn under or over the ship in the correct order.

Transition rig parts are not the fallback for a missing final-form asset. A missing approved final-form remains an asset error and uses the documented emergency base fallback.

## Removed direction

The old layered weapon evolution atlas is no longer a source of settled weapon-level visuals. Do not reintroduce cropped floating attachments as persistent overlays. The new registered parts are allowed only for bounded transition animation before the renderer settles to the approved final-form.
