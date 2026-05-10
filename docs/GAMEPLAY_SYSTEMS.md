# Gameplay systems

Owner: Yoon Dae Young
Codex partner: Codex GPT-5
Date: 2026-05-10

## Shield

- Shield is now a regenerating numeric pool, not a timed hit-count buff.
- Each `shield` pickup increases max shield by 10.
- Max shield is 50.
- Current shield is refilled to the new max when a shield pickup is collected.
- Shield regenerates from 0 to full in 10 seconds, regardless of max shield value.
- When shield absorbs damage, it flashes with a short faceted barrier impact effect.

## Shield defense

- After max shield reaches 50, `shield` pickups stop appearing.
- `shieldDefense` pickups appear instead.
- Shield defense can be upgraded up to level 10.
- Each level reduces incoming health damage by 0.5 after shield absorption.

## Ship defense

- Energy and Nova ships have built-in heavy armor.
- Energy and Nova grant 1 defense at weapon level 1.
- Each additional Energy/Nova weapon level adds 0.5 defense.
- Level 10 grants the max built-in ship defense of 5.5.
- Total defense is capped at 10.5.
- Damage is reduced by defense after shield absorption.
- If incoming health damage is equal to or lower than defense, final HP damage becomes 0.

## Damage and health scale

- `statScale` remains 10 for player weapon damage and enemy health.
- A level 1 basic player shot deals 10 damage.
- Enemy health is still scaled around that 10-damage baseline.
- Player base HP is 100.
- Each armor pickup adds 20 max HP.
- Repair restores 35 HP.
- Enemy bullet damage no longer uses `statScale`.
- Enemy bullet level 1 starts at 10 damage.
- Each enemy bullet level adds 5 damage.
- Enemy bullet danger scaling adds 1 damage per 5 danger levels.
- Danger is capped at 18.
- Normal enemy collision damage is 28.
- Boss collision damage is 42.

## Distance and score

- The old passive time-score display is now distance.
- Distance increases over time while the run is active.
- Distance is stored separately from score as `state.distance`.
- Score is no longer granted passively over time.
- Score is granted when enemies are destroyed.
- Enemy score depends on enemy role grade and current danger level.
- Enemy role base scores are owned by `GAME_CONFIG.scoring.enemyRoleScore`.
- Danger scaling is owned by `GAME_CONFIG.scoring.enemyDangerMultiplierPerLevel`.
- HUD uses compact labels: `DIST` for distance and `PTS` for destruction score.

## Enemy difficulty roles

- Difficulty should increase through enemy roles and behavior, not only through bullet count or spawn count.
- Advanced enemy role tuning is owned by `ENEMY_CONFIG`.
- Sniper enemies show an aiming warning line, then fire a fast aimed shot.
- Guardian enemies have a shield layer that absorbs damage before HP is damaged.
- Splitter enemies spawn child enemies when destroyed.
- Advanced roles begin appearing only after the configured danger threshold.
- Advanced role chance scales with danger up to the configured cap.

## Stage boss cycle

- The current stage is stored as `state.stage`.
- Stage boss profiles are owned by `ENEMY_CONFIG.stageBoss.stages`.
- Stage boss behavior is owned by `src/systems/boss-ai.js`.
- `Enemy` should delegate boss phase decisions, armor vulnerability, stage attack selection, and boss-specific visuals to `BossAi`.
- The first implementation has 3 stage bosses.
- Defeating the current stage boss advances to the next configured stage.
- After the last configured stage, the next boss cycles back to stage 1.
- The cycle uses the configured stage list length, so adding a future stage automatically extends the loop.
- Stage boss score can be scaled per stage through the stage boss profile.

## Stage boss armor gimmick

- Stage bosses are armored by default.
- Stage bosses cycle through closed, opening, focus, and closing phases.
- Player attacks damage a stage boss only during the focus phase.
- Closed armor still receives hit effects, but blocks HP damage.
- During focus, the armor panels open and the boss performs its concentrated attack.
- The boss uses one armor-panel image and mirrors it to draw both left and right armor plates.
- A damaged armor-panel image is used once boss HP falls below the configured damaged-health ratio.
- Stage-specific core images are used to make each boss visually distinct.
- Stage boss visual assets live under `assets/bosses`.

## Weapon core

- Weapon highest level is preserved per weapon during the current run.
- Picking a different weapon switches to that weapon at its highest reached level in the current run, with a minimum of level 1.
- Picking the currently equipped weapon item increases that weapon level up to level 10.
- Picking a maxed weapon item gives that weapon 1 core level instead of increasing level.
- Core level is tracked per weapon and survives weapon switches within the same run.
- Each core level gives that weapon 5% more damage.
- Max core level is 10 per weapon.

## Weapon catalog

- Weapon identity and weapon-specific tuning are owned by `src/gameplay/weapon-catalog.js`.
- The catalog owns weapon kind, label, item color, item drop weight, max level, core max level, core damage bonus, projectile speed, projectile damage multiplier, movement profile, visual footprint, hitbox footprint, HUD icon name, and final-form asset naming.
- Systems read from `WeaponCatalog` instead of owning weapon-specific constants.
- Adding a future weapon should start with a new catalog entry, then only add unique firing/rendering behavior if the existing systems cannot express it.

## Runtime config

- Shared runtime tuning is owned by `src/gameplay/game-config.js`.
- Player defaults, input keys, game timers, spawn rules, enemy role stats, projectile defaults, HUD layout, background tuning, burst tuning, and drone progression should live there instead of inside entity or system code.
- Entity and system code should express behavior and state transitions, not raw tuning numbers.

## HUD and item icons

- HUD layout and icon sizing are owned by `HUD_CONFIG` and `ITEM_ICON_CONFIG` in `src/gameplay/game-config.js`.
- The top scoreboard is intentionally compact so it does not dominate the playfield.
- Item and weapon pickup icons use image assets first.
- Item image assets live under `assets/items`.
- `ItemIconRenderer` must keep the old canvas vector icons as fallback only.
- If an image is still loading or missing, the fallback vector icon is drawn so gameplay remains readable.
- Item icon asset paths are owned by `ITEM_DEFINITIONS` and `WeaponCatalog`, not by HUD or renderer code.

## Field item behavior

- Field item movement tuning is owned by `ITEM_FIELD_CONFIG` in `src/gameplay/game-config.js`.
- Items spawn inside the playfield instead of immediately falling through from off-screen.
- Items bounce off playfield edges until their lifetime expires.
- Items blink near the end of their lifetime.
- Blink speed increases as the remaining lifetime approaches zero.
- While alive, items periodically reroll into another item of the same category at a slow readable pace.
- Weapon items reroll only within the weapon list.
- Defense items reroll only within the defense item list.
- Support items reroll only within the support item list.
- Current item categories are owned by `ITEM_CATEGORY_KINDS` in `src/gameplay/item-definitions.js`.

## Pause game information

- Pressing Esc or P pauses the game.
- The pause overlay includes a Game Info button.
- Clicking Game Info opens an in-game reference panel.
- The Game Info button stays near the top-right of the pause panel, not centered over the content.
- The panel uses ship profile cards with final ship previews instead of long text blocks.
- The panel uses item icons with compact effect labels instead of paragraph descriptions.
- Game Info content and layout tuning are owned by `src/gameplay/game-info.js`.
- The panel should be kept current whenever ship roles, item effects, or special skills change.

## Special skills

- Ctrl now uses the current weapon's special skill instead of charging while held.
- Special meter maxes at 100%.
- Special meter passively regenerates at 0.8% per second.
- Killing enemies grants special meter based on enemy threat level.
- Enemy kill gain is `2 + threatLevel * 2`.
- Mid-boss kills add 14 extra special meter.
- Boss kills add 30 extra special meter.
- Rapid, Energy, and Spread use the highest affordable tier among 75%, 50%, and 25% meter.
- Nova spends 20% meter per mine.
- Special system logic is owned by `src/systems/special-system.js`.
- Special tuning is owned by `SPECIAL_CONFIG` in `src/gameplay/game-config.js`.

## Special skill identities

- Rapid special fires an instant piercing beam. Higher tiers make it wider, longer lasting, and stronger.
- Energy special fires a slow barrier orb. Higher tiers make it larger, stronger, more piercing, and better at absorbing enemy bullets.
- Spread special fires a fan storm. Higher tiers increase shot count, spread width, pierce, and damage.
- Nova special places a stationary mine. Mines cost 20% meter each and are limited to 5 active mines.
- Nova mines detonate when touched by enemies or hit by enemy bullets.
- Nova mines do not detonate from player attacks.
- Nova mines do not damage the player.
- Nova mines display their expected blast radius as a preview ring.
- Nova mine blast radius is much larger than a normal Nova projectile blast.

## Rapid special tier spec

- Rapid special is a beam that follows the player while active.
- Rapid special pierces indefinitely.
- Rapid special applies repeat hits every 0.075 seconds while overlapping enemies.
- Rapid special damage also scales by weapon level, weapon catalog damage multiplier, and weapon core bonus.

| Meter cost | Beam width | Duration | Damage scale | Burst count |
|---:|---:|---:|---:|---:|
| 25 | 26 | 0.34s | 2.4x | 12 |
| 50 | 42 | 0.52s | 4.2x | 20 |
| 75 | 62 | 0.76s | 6.8x | 30 |

## Energy special tier spec

- Energy special creates one slow-moving shield core.
- The shield core is both an attack projectile and an enemy-bullet blocker.
- The shield core pierces indefinitely and deals repeated contact damage while overlapping enemies.
- Higher tiers make the core larger, slower, longer lived, faster at repeated hits, and able to absorb higher-level enemy bullets.
- Each absorbed enemy bullet is counted by the core.
- When the core expires, it releases stored energy based on the absorbed enemy bullet count.
- The shield core uses a distinct visual design instead of the normal Energy projectile sprite.
- The shield core visual is a layered cyan-white energy shell with rotating shield rings and a brighter pulse as it absorbs enemy bullets.
- Energy special damage also scales by weapon level, weapon catalog damage multiplier, and weapon core bonus.

| Meter cost | Core radius | Speed | Hit interval | Absorbs enemy bullets | Lifetime | Damage scale | Release radius | Release damage per absorbed bullet |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 22 | -120 | 0.24s | Level 2 or lower | 3.4s | 2.2x | 84 | 32% of core damage |
| 50 | 34 | -85 | 0.20s | Level 3 or lower | 4.4s | 3.7x | 126 | 42% of core damage |
| 75 | 48 | -55 | 0.16s | Level 4 or lower | 5.6s | 5.6x | 176 | 52% of core damage |

## Special overdrive item

- The old score-only star bonus is now Special Overdrive.
- The internal item kind remains `bonus` for compatibility.
- Picking Special Overdrive immediately fills special meter to 100%.
- Special meter stays at 100% for 6 seconds.
- Spending special during overdrive does not reduce the meter.
- The HUD shows the remaining overdrive duration while active.
- The icon should look like an overdrive core, not a generic star.

## Spread special tier spec

- Spread special fires a wide fan storm.
- Higher tiers increase projectile count, fan angle, projectile speed, pierce, and damage.
- Spread special damage also scales by weapon level, weapon catalog damage multiplier, and weapon core bonus.

| Meter cost | Shots | Fan span | Speed | Radius | Pierce | Lifetime | Damage scale | Burst count |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 10 | 88 degrees | 340 | 4.4 | 0 | 2.0s | 1.25x | 16 |
| 50 | 18 | 128 degrees | 370 | 4.9 | 1 | 2.25s | 1.65x | 24 |
| 75 | 30 | 170 degrees | 410 | 5.4 | 2 | 2.55s | 2.1x | 36 |

## Nova special mine spec

- Nova special places a stationary mine.
- Each mine costs 20% special meter.
- Up to 5 Nova mines can be active at once.
- Nova mine projectile speed is 0.
- Nova mine trigger radius is separate from its blast radius.
- Nova mine blast radius is based on the normal Nova level-scaled blast radius, then multiplied by the mine blast-radius multiplier.
- Nova mine blast duration is based on the normal Nova level-scaled blast duration, then multiplied by the mine duration multiplier.
- Nova mine detonation consumes the enemy bullet that triggered it, so it blocks at least one enemy shot.

## Continue

- Pressing Space on game over continues the current run instead of resetting it.
- Continue preserves score, kills, time, danger, player upgrades, weapon level, weapon cores, shield capacity, shield defense, armor, and drones.
- Continue clears bullets, enemy bullets, enemies, nova explosions, and particles from the field.
- Continue restores player HP and shield to their current maximum values.
- Continue returns the player to the start position and grants short invincibility.
- Continue count is tracked on the current run and increments each time Continue is used.
- Pressing R or the Restart button still starts a fresh run.

## Nova projectile tuning

- Nova projectile speed is 50% of the previous runtime value.
- Normal Nova projectile speed is 220 units per second upward.
- Nova projectile radius uses level 1 as the baseline and grows by 10% per additional weapon level.
- Nova blast radius uses level 1 as the baseline and grows by 20% per additional weapon level.
- Nova explosion duration uses level 1 as the baseline and grows by 10% per additional weapon level.
- Nova mines use the same per-level blast-radius and duration growth, with mine-specific multipliers.

## Energy bullet absorption

- Energy bullets can block enemy bullets by collision.
- Enemy bullets are blocked only when their bullet level is equal to or lower than the Energy bullet absorb level.
- Normal Energy absorb level is 1 at weapon levels 1-4, 2 at levels 5-9, and 3 at level 10.
- Energy special barrier orbs have their own absorb levels and can block stronger enemy bullets at higher tiers.
- Absorb tuning is owned by `src/gameplay/weapon-catalog.js`.

## Energy and Nova projectile size

- Energy normal projectile radius grows by 10% per weapon level.
- Nova normal projectile radius grows by 10% per weapon level.
- Projectile size tuning is owned by `src/gameplay/weapon-catalog.js`.

## Rapid ship footprint

- Rapid is a smaller, high-speed ship profile.
- Rapid ship art is drawn at 70% of the base ship visual width.
- Rapid hitbox width and height are also 70% of the base ship hitbox.
- Rapid art and hitbox use the same scale ratio.
- Because both width and height are 70%, the final hitbox area is 49% of the base ship hitbox area.

## Projectile performance contract

- Spread's high projectile count is an intentional weapon spec and should not be reduced as a performance shortcut.
- Performance fixes should preserve projectile count, damage, speed, pierce, visual scale, and collision intent unless the design spec changes.
- Collision-heavy systems should prefer cheap broadphase checks before expensive exact checks.
- Repeated per-projectile scans should cache relevant candidates once per frame when possible.
- Hot projectile arrays should avoid repeated middle-of-array deletion in tight loops when many projectiles can expire in one frame.
