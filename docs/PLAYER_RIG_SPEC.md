# Player Rig Spec

Current direction: each weapon and level uses a complete final-form ship image. Runtime does not stack weapon upgrade parts on top of a base body.

## Final-form contract

- Folder: `assets/player/final-forms/<weapon>/`
- File name: `<weapon>_01.PNG` through `<weapon>_10.PNG`
- Weapons: `rapid`, `energy`, `spread`, `nova`
- The game resolves the current weapon and level, then draws that exact PNG.
- During development the 01-10 files may be visually identical. Later, replacing only one level file must immediately change that level after reload.

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

## Removed direction

The old layered weapon evolution atlas is no longer part of runtime rendering. Do not reintroduce cropped floating weapon attachments or per-level weapon overlays unless the design direction changes again.
