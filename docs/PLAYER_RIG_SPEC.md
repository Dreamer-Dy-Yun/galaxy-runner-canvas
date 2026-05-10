# Player rig specification

Owner: Yoon Dae Young
Codex partner: Codex GPT-5
Current baseline: v5 full-canvas layer rig

## Runtime rule

The player ship is drawn from a shared rig coordinate system. Runtime must not crop arbitrary part rectangles and guess placement.

## Active layers

- Base ship: `assets/player/player-base-ship-v5.png`
- Weapon evolution atlas: `assets/player/player-weapon-part-states-v5.png`
- Support atlas: `assets/player/player-registered-parts-v1.png`
- Thruster atlas: `assets/player/thruster-registered-v1.png`
- Special effect atlas: `assets/player/special-effects-registered-v1.png`
- Final forms:
  - `assets/player/final-forms/rapid/rapid_01.PNG` ... `rapid_10.PNG`
  - `assets/player/final-forms/energy/energy_01.PNG` ... `energy_10.PNG`
  - `assets/player/final-forms/spread/spread_01.PNG` ... `spread_10.PNG`
  - `assets/player/final-forms/nova/nova_01.PNG` ... `nova_10.PNG`

## Weapon evolution contract

Primary path (new): final ship assets
- For active weapon states, runtime loads a level-specific full-canvas final image:
  - `assets/player/final-forms/{weapon}/{weapon}_{NN}.PNG`
  - `NN` ranges from 01 to 10.
- The selected final-form image is drawn centered on the player rig origin with `rigSize x rigSize` dimensions and replaces the base ship rig.
- If final assets are unavailable, the system falls back to a minimal overlay pass from the weapon evolution atlas.

Legacy atlas contract (fallback only):
- Atlas grid: 10 columns x 4 rows.
- Rows: rapid, energy, spread, nova.
- Column used by fallback path: 7.
- Every fallback atlas cell is drawn centered on the player rig origin; alignment comes from the image itself.

Visual behavior:
- Final-form path is authoritative for runtime visuals.
- Fallback path is a single full overlay only, without mixed stage stacking.
- Rapid should become visibly sharper and slightly smaller.
- Spread should become broader and increase hitbox scale.
- Energy should become heavier and slightly larger.
- Nova follows the same full-canvas replacement rule.

## Prohibited legacy paths

- Do not load `player-weapon-attachments-ai-*` for player evolution.
- Do not load `player-weapon-variants-*` for player evolution.
- Do not add per-part x/y offset tables for weapon visuals unless the asset itself is not a registered full-canvas layer.
