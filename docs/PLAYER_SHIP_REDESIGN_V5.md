# Player Ship Final-Form Direction

The current ship art direction starts every weapon at its final silhouette. Level files are still kept from 01 to 10 so later visual progression can be added by replacing files, not by changing code.

## Why this structure exists

- The game can load level-specific art now.
- Development can use repeated final-form files for every level.
- Later art passes can replace `rapid_04.PNG`, `nova_10.PNG`, or any single file without touching gameplay code.

## Runtime rule

Weapon visuals are complete ship images under `assets/player/final-forms`. The runtime should not assemble weapon upgrade visuals from base parts.

## Development workflow

1. Pick the weapon folder.
2. Replace one or more numbered PNG files.
3. Reload the browser. Use hard reload if browser cache keeps the old image.

## Prompt rule

Prompts for new ship art must be self-contained. Describe the full ship, silhouette, weapon identity, color accents, transparency, and centered 512x512 canvas requirements directly in the prompt.
