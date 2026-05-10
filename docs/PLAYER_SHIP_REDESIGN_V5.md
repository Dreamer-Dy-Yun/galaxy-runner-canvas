# Player Ship Redesign (Current Build Direction)

Project: Galaxy Runner
Owner / Director: Yoon Dae Young
Codex Collaborator: Codex
Version: ship-redesign-current
Date: 2026-05-10

## Why this direction

The current direction keeps one complete ship per weapon level as the gameplay visual source.
The active weapon chooses a full ship sprite directly, so stage mismatches from mixed per-part composition are eliminated.

### Core principle

1. Each weapon has a fixed file sequence:
   - `assets/player/final-forms/rapid/rapid_01.PNG` ... `rapid_10.PNG`
   - `assets/player/final-forms/energy/energy_01.PNG` ... `energy_10.PNG`
   - `assets/player/final-forms/spread/spread_01.PNG` ... `spread_10.PNG`
   - `assets/player/final-forms/nova/nova_01.PNG` ... `nova_10.PNG`
2. At runtime, the active weapon level selects the exact file.
3. The selected file is drawn as a full ship replacement centered on the player rig origin.
4. Replacing a single file updates only that level; the rest of the series stays untouched.

This supports fast iteration: one file change at 01~10 is enough to validate visual progression by stage.

## Active runtime behavior

- Active weapon: `rapid`, `energy`, `spread`, `nova`.
- Active level: `1 ~ 10`, mapped to `{weapon}_{NN}.PNG`.
- Final-form asset path has priority when present.
- If a level image is missing or not ready, fallback drawing uses the staged evolution atlas path.
- On reset/start, the selected startup profile can force an initial weapon + level.

## Development helper

`FinalShipStartupPicker` in `galaxy-runner.html` gives a dev-only selection panel for:

- start weapon (`none`, `rapid`, `energy`, `spread`, `nova`)
- each weapon level (`01` to `10`)

This is intentionally for iteration speed while keeping gameplay values untouched.

## Prompt rule for regenerated complete ships

Prompts must be self-contained and describe the full visual target. Do not reference prior conversation or ambiguous context.

Template:

```text
Create one complete 512x512 top-down anime sci-fi player spaceship on a perfectly flat #00ff00 chroma-key background.
The ship is for a vertical shooter and points upward toward y=0.
Use the same broad visual language as a clean white-armored anime spaceship family: large readable white armor panels, dark navy mechanical seams, crisp black outline, limited panel detail, and one clear weapon-color accent.
Do not create a part sheet. Do not create loose parts. Do not include text, labels, borders, shadows, gradients, watermark, or #00ff00 inside the ship.
```
