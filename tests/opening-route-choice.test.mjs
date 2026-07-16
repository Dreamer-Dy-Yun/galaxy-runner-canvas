import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const scripts = [
  "src/core/constants.js",
  "src/gameplay/weapon-definition.js",
  "src/gameplay/weapon-catalog.js",
  "src/gameplay/weapon-definitions.js",
  "src/gameplay/run-rules.js",
  "src/gameplay/item-definitions.js",
  "src/gameplay/game-config.js",
  "src/entities/collectible-item.js",
  "src/systems/collectible-lifecycle-system.js",
  "src/systems/game-loop-system.js",
];

async function createHarness() {
  const context = await loadClassicScripts(scripts);
  const RunRules = context.RunRules;
  const CollectibleItem = readClassicBinding(context, "CollectibleItem");
  const CollectibleLifecycleSystem = readClassicBinding(context, "CollectibleLifecycleSystem");
  const GameLoopSystem = readClassicBinding(context, "GameLoopSystem");
  const items = [];
  const adapterCalls = [];
  const state = {
    mode: "ready",
    time: 0,
    distance: 0,
    danger: 0,
    spawnTimer: 0.72,
    itemTimer: 0,
    ...RunRules.createReadyState(),
  };
  const game = {
    state,
    items,
    feedback: { update() {}, emit() {} },
    player: {
      x: 480,
      y: 468,
      bodyRadius: 11,
      pickupRadius: 20,
      update() {},
      collect(item) {
        return Object.freeze({ kind: item.kind, outcome: "equipped", level: 1 });
      },
    },
    playerRigAnimationAdapter: {
      handleProgressionResult(result, options) {
        adapterCalls.push({ result, options });
      },
    },
    world: {
      add(_group, item) { items.push(item); },
      clearGroup() { items.length = 0; },
    },
    updateItems(dt) { CollectibleLifecycleSystem.update(game, dt); },
    updateExplosions() {},
    updateParticles() {},
  };

  context.EntityGroups = Object.freeze({ collectibles: "collectibles" });
  context.EntityStore = {
    compactKeptTail(target, firstKeptIndex) {
      const kept = target.slice(firstKeptIndex);
      target.length = 0;
      target.push(...kept);
    },
  };
  context.CollisionQuery = {
    overlaps(a, b, options) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return dx * dx + dy * dy <= (options.aRadius + options.bRadius) ** 2;
    },
  };
  return { adapterCalls, CollectibleItem, CollectibleLifecycleSystem, game, GameLoopSystem, RunRules };
}

test("base ship remains unarmed for one second before four fixed route choices appear", async () => {
  const { CollectibleLifecycleSystem, game, GameLoopSystem, RunRules } = await createHarness();
  RunRules.beginOpening(game.state);
  game.state.mode = "running";

  assert.equal(CollectibleLifecycleSystem.spawnItem(game), null, "ordinary items are gated during opening");
  GameLoopSystem.update(game, 0.99);
  assert.equal(game.state.runPhase, "baseLaunch");
  assert.equal(game.items.length, 0);
  assert.equal(game.state.time, 0, "combat difficulty time does not advance during launch");

  GameLoopSystem.update(game, 0.02);
  assert.equal(game.state.runPhase, "routeChoice");
  assert.deepEqual(game.items.map((item) => item.kind), ["rapid", "energy", "spread", "nova"]);
  assert.equal(game.items.every((item) => item.openingChoice), true);

  const positions = game.items.map((item) => [item.x, item.y]);
  for (let index = 0; index < 200; index += 1) GameLoopSystem.update(game, 0.04);
  assert.deepEqual(game.items.map((item) => [item.x, item.y]), positions);
  assert.deepEqual(game.items.map((item) => item.kind), ["rapid", "energy", "spread", "nova"]);
  assert.equal(game.items.every((item) => !item.expired && !item.blinkHidden), true);
});

test("one pickup locks the route, removes all choices, and notifies the rig adapter once", async () => {
  const { adapterCalls, CollectibleLifecycleSystem, game, GameLoopSystem, RunRules } = await createHarness();
  RunRules.beginOpening(game.state);
  game.state.mode = "running";
  GameLoopSystem.update(game, 1);

  const energy = game.items.find((item) => item.kind === "energy");
  game.player.x = energy.x;
  game.player.y = energy.y;
  CollectibleLifecycleSystem.update(game, 0);

  assert.equal(game.state.runPhase, "combat");
  assert.equal(game.state.selectedWeaponKind, "energy");
  assert.equal(game.items.length, 0);
  assert.equal(adapterCalls.length, 1);
  assert.deepEqual({ ...adapterCalls[0].result }, { kind: "energy", outcome: "equipped", level: 1 });
  assert.deepEqual({ ...adapterCalls[0].options }, { reason: "route-choice", runPhase: "combat" });
});

test("a later route upgrade forwards its immutable rig change to the adapter", async () => {
  const { adapterCalls, CollectibleItem, CollectibleLifecycleSystem, game } = await createHarness();
  Object.assign(game.state, { mode: "running", runPhase: "combat", selectedWeaponKind: "rapid" });
  const rigChange = Object.freeze({
    from: Object.freeze({ kind: "rapid", level: 1 }),
    to: Object.freeze({ kind: "rapid", level: 2 }),
  });
  game.player.collect = () => Object.freeze({
    kind: "rapid", outcome: "level", level: 2, rigChange,
  });
  const item = new CollectibleItem("rapid");
  Object.assign(item, { x: game.player.x, y: game.player.y });
  game.items.push(item);

  CollectibleLifecycleSystem.update(game, 0);

  assert.equal(adapterCalls.length, 1);
  assert.equal(adapterCalls[0].result.rigChange, rigChange);
  assert.deepEqual({ ...adapterCalls[0].options }, { reason: "upgrade", runPhase: "combat" });
});

test("route lock filters both later weapon candidates and weapon morphs", async () => {
  const { CollectibleItem, game } = await createHarness();
  Object.assign(game.state, { runPhase: "combat", selectedWeaponKind: "rapid" });

  const candidates = CollectibleItem.availableDefinitions(game.player, "weapon", null, "rapid");
  assert.deepEqual(Array.from(candidates, ([kind]) => kind), ["rapid"]);
  for (let index = 0; index < 20; index += 1) {
    assert.equal(CollectibleItem.pickKind(game.player, "weapon", null, "rapid"), "rapid");
  }

  const staleEnergy = new CollectibleItem("energy");
  staleEnergy.morphTimer = 0;
  staleEnergy.update(0.01, game);
  assert.equal(staleEnergy.kind, "rapid");
});
