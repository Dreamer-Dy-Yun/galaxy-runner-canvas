import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const gameplayScripts = [
  "src/core/constants.js",
  "src/gameplay/weapon-definition.js",
  "src/gameplay/weapon-catalog.js",
  "src/gameplay/weapon-definitions.js",
  "src/gameplay/run-rules.js",
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

async function loadGameplay() {
  return loadClassicScripts(gameplayScripts, { globals: { Image: TestImage } });
}

async function createPlayer() {
  const context = await loadGameplay();
  context.FinalShipArt = class FinalShipArt {};
  context.PlayerRigArt = class PlayerRigArt {};
  context.PlayerRigAnimationAdapter = class PlayerRigAnimationAdapter {
    reset() {}
    update() {}
  };
  context.PlayerPartLayout = class PlayerPartLayout {
    constructor() { this.rigSize = 250; }
  };
  context.PlayerRenderer = { draw() {} };
  await loadClassicScripts(["src/entities/player.js"], { context });
  const Player = readClassicBinding(context, "Player");
  return { context, player: new Player() };
}

test("special results distinguish missing weapon, meter shortage, success, and Nova capacity", async () => {
  const context = await loadGameplay();
  const SpecialSystem = readClassicBinding(context, "SpecialSystem");
  const bullets = [];
  const game = {
    bullets,
    addBullet(...args) { bullets.push({ kind: args[7] }); },
    burst() {},
  };
  const player = {
    kind: null,
    specialMeter: 0,
    specialOverdriveTimer: 0,
    activeWeaponKind() { return this.kind; },
    weaponLevel() { return 1; },
    weaponCoreLevel() { return 0; },
    x: 480,
    y: 468,
  };

  assert.deepEqual(
    { ...SpecialSystem.tryUse(player, game) },
    { ok: false, kind: null, reason: "no-weapon" }
  );

  player.kind = "rapid";
  const insufficient = SpecialSystem.tryUse(player, game);
  assert.equal(insufficient.ok, false);
  assert.equal(insufficient.reason, "insufficient-meter");
  assert.equal(insufficient.required, 25);
  assert.equal(player.specialMeter, 0);

  player.specialMeter = 25;
  const success = SpecialSystem.tryUse(player, game);
  assert.equal(success.ok, true);
  assert.equal(success.kind, "rapid");
  assert.equal(success.cost, 25);
  assert.equal(player.specialMeter, 0);
  assert.equal(bullets.length, 1);

  player.kind = "nova";
  player.specialMeter = 100;
  bullets.length = 0;
  for (let index = 0; index < 5; index += 1) bullets.push({ kind: "novaMine" });
  const capped = SpecialSystem.tryUse(player, game);
  assert.equal(capped.ok, false);
  assert.equal(capped.reason, "nova-cap");
  assert.equal(capped.active, 5);
  assert.equal(player.specialMeter, 100, "failed special must not spend meter");
  assert.equal(Object.isFrozen(capped), true);
});

test("an input reset releases the held-special latch before an immediate re-press", async () => {
  const context = await loadGameplay();
  const SpecialSystem = readClassicBinding(context, "SpecialSystem");
  const feedbackEvents = [];
  const player = {
    specialMeter: 0,
    specialOverdriveTimer: 0,
    wasSpecialDown: true,
    specialInputResetVersion: 0,
    activeWeaponKind() { return "energy"; },
    weaponLevel() { return 1; },
    weaponCoreLevel() { return 0; },
  };
  const game = {
    input: {
      isDown(actionName) { return actionName === "special"; },
      resetVersion() { return 1; },
    },
    feedback: {
      emit(type, details) { feedbackEvents.push({ type, details }); },
    },
  };

  SpecialSystem.update(player, 0, game);
  assert.equal(player.specialInputResetVersion, 1);
  assert.equal(feedbackEvents.length, 1);
  assert.equal(feedbackEvents[0].type, "special.failed");
  assert.equal(feedbackEvents[0].details.reason, "insufficient-meter");

  SpecialSystem.update(player, 0, game);
  assert.equal(feedbackEvents.length, 1, "the same held edge must not fire twice");
});

test("pickup results expose healing, overflow score, and weapon progression semantics", async () => {
  const { context, player } = await createPlayer();
  const game = { state: { score: 0 }, burst() {} };
  const item = (kind) => ({ kind, x: 0, y: 0, color: "#fff" });

  player.health = 70;
  const healed = player.collect(item("repair"), game);
  assert.equal(healed.outcome, "healed");
  assert.equal(healed.amount, 30);
  assert.equal(Object.isFrozen(healed), true);

  const overflow = player.collect(item("repair"), game);
  assert.equal(overflow.outcome, "score");
  assert.equal(overflow.amount, 180);
  assert.equal(game.state.score, 180);

  const equipped = player.collect(item("rapid"), game);
  assert.equal(equipped.outcome, "equipped");
  assert.equal(equipped.level, 1);
  assert.equal(player.activeWeaponKind(), "rapid");
  assert.equal(Object.isFrozen(equipped.rigChange), true);
  assert.equal(Object.isFrozen(equipped.rigChange.from), true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(equipped.rigChange)),
    { from: { kind: null, level: 0 }, to: { kind: "rapid", level: 1 } }
  );

  let result = equipped;
  for (let index = 0; index < 10; index += 1) result = player.collect(item("rapid"), game);
  assert.equal(result.outcome, "core");
  assert.equal(result.level, 10);
  assert.equal(result.coreLevel, 1);
});
