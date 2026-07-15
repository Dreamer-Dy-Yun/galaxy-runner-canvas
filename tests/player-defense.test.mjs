import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const defenseScripts = [
  "src/core/constants.js",
  "src/gameplay/weapon-definition.js",
  "src/gameplay/weapon-catalog.js",
  "src/gameplay/weapon-definitions.js",
  "src/gameplay/player-defense-rules.js",
  "src/gameplay/item-definitions.js",
  "src/gameplay/game-config.js",
  "src/core/asset-loader.js",
  "src/core/sprite-atlas.js",
  "src/systems/weapon-system.js",
  "src/systems/drone-system.js",
  "src/systems/special-system.js",
  "src/systems/player-defense-system.js",
  "src/systems/player-progression-system.js",
];

class TestImage {
  addEventListener() {}
  removeEventListener() {}
}

async function createPlayer() {
  const context = await loadClassicScripts(defenseScripts, { globals: { Image: TestImage } });
  context.FinalShipArt = class FinalShipArt {};
  context.PlayerPartLayout = class PlayerPartLayout {
    constructor() { this.rigSize = 250; }
  };
  context.PlayerRenderer = { draw() {} };
  await loadClassicScripts(["src/entities/player.js"], { context });
  const Player = readClassicBinding(context, "Player");
  return { context, player: new Player() };
}

test("defense snapshot caps flat layers at 10.5 while preserving the outer layer first", async () => {
  const { context, player } = await createPlayer();
  player.setWeaponLevel("nova", 10);
  player.novaLevel = 10;
  player.shieldDefenseLevel = 10;

  const snapshot = context.PlayerDefenseSystem.snapshot(player);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(snapshot.outerFlat, 8.5);
  assert.equal(snapshot.innerFlat, 2);
  assert.equal(snapshot.flatTotal, 10.5);
  assert.equal(snapshot.flatCap, 10.5);
  assert.equal(snapshot.percent, 0.08);
  assert.equal(snapshot.minimumHealthDamage, 1);
  assert.equal(context.PlayerDefenseSystem.shieldDefense(player), 4.5);
});

test("positive HP damage cannot be reduced below one and zero input remains zero", async () => {
  const { context, player } = await createPlayer();
  player.setWeaponLevel("nova", 1);

  assert.equal(context.PlayerDefenseSystem.resolveIncomingDamage(player, 0), 0);
  assert.equal(context.PlayerDefenseSystem.resolveIncomingDamage(player, -5), 0);
  assert.equal(context.PlayerDefenseSystem.resolveIncomingDamage(player, Infinity), 0);
  assert.equal(context.PlayerDefenseSystem.resolveIncomingDamage(player, 0.25), 1);
});

test("percent reduction is applied between outer and inner flat defense", async () => {
  const { context, player } = await createPlayer();
  player.setWeaponLevel("nova", 10);
  player.novaLevel = 10;
  player.shieldDefenseLevel = 10;

  const expected = ((20 - 8.5) * (1 - 0.08)) - 2;
  assert.equal(context.PlayerDefenseSystem.resolveIncomingDamage(player, 20), expected);
  assert.equal(player.resolveIncomingDamage(20), expected);
  assert.equal(player.totalDefense(), 10.5);
  assert.equal(player.shipDefense(), 5.5);
  assert.equal(player.shieldDefense(), 4.5);
  assert.equal(player.defenseProfile(), context.PLAYER_DEFENSE_RULES.profiles.nova);
});

test("the shield pool absorbs damage before the HP defense contract", async () => {
  const { player } = await createPlayer();
  player.health = 10;
  player.maxHealth = 10;
  player.shield = 5;
  player.maxShield = 5;
  const game = {
    state: { mode: "running" },
    burst() {},
  };

  player.hit(game, 4);
  assert.equal(player.shield, 1);
  assert.equal(player.health, 10);

  player.invincible = 0;
  player.hit(game, 2);
  assert.equal(player.shield, 0);
  assert.equal(player.health, 9);
});

test("the defense HUD keeps armor, flat, and percent values in compact lines", async () => {
  const { context, player } = await createPlayer();
  player.armorLevel = 5;
  player.setWeaponLevel("nova", 10);
  player.novaLevel = 10;
  player.shieldDefenseLevel = 10;
  await loadClassicScripts(["src/ui/game-hud.js"], { context });
  const GameHud = readClassicBinding(context, "GameHud");

  const tag = GameHud.defenseTag(player, player.defenseStats());
  assert.equal(tag.value, "A5/D10.5");
  assert.deepEqual(Array.from(tag.lines), ["A5/D10.5", "R8%"]);
  assert.equal(Object.isFrozen(tag.lines), true);

  const draws = [];
  GameHud.drawTagValue({ fillText(...args) { draws.push(args); } }, tag, 0);
  assert.deepEqual(draws.map(([text]) => text), ["A5/D10.5", "R8%"]);
  assert.equal(draws[1][2] - draws[0][2], 11);
});
