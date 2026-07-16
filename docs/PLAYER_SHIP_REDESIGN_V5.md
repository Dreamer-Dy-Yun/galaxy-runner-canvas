# Player Ship Final-Form and Transition Direction

The current ship art direction keeps each route's existing complete final-form as the approved settled silhouette. Level files remain from 01 to 10 so later visual progression can be added by replacing files, not by changing code. Generated rig parts exist only to animate the path between settled forms.

## Why this structure exists

- The game can load level-specific art now.
- Development can use repeated final-form files for every level.
- Later art passes can replace `rapid_04.PNG`, `nova_10.PNG`, or any single file without touching gameplay code.
- Transition art can evolve independently without changing the approved Rapid, Energy, Spread, or Nova settled design.

## Runtime rule

Stable weapon visuals are complete ship images under `assets/player/final-forms`. During a bounded upgrade transition, the animation engine may render registered parts from `assets/player/rig`. At completion it must discard the transition pose and settle to the selected existing final-form PNG.

Transition parts are not a second final-form system. They must not remain as persistent overlays, decide gameplay state, or replace a missing final-form.

## Development workflow

1. Pick the weapon folder.
2. Replace one or more numbered PNG files.
3. Reload the browser. Use hard reload if browser cache keeps the old image.

## Transition asset workflow

1. Request a 1024x1024 source on flat `#ff00ff`.
2. Accept that the current generator may deliver 1254x1254 and remove chroma at that delivered size.
3. Preserve the full RGBA image while normalizing it to canonical 1024x1024.
4. Use the direct registrar for one whole part, or the sheet cropper for explicit cells in an exact 1024x1024 2x2 sheet.
5. Validate the 512x512 RGBA runtime outputs and preview the transition settling to the existing final-form.

Do not put source normalization into the direct registrar or sheet cropper. Do not crop images at runtime.

## Prompt rule

Prompts for new ship art must be self-contained. Final-form prompts describe the full ship, silhouette, weapon identity, color accents, transparency, and centered 512x512 canvas. Transition-part prompts must also state that the image is transition-only, request the 1024 source and `#ff00ff` background, and define either one centered part or an exact 2x2 quadrant layout.
