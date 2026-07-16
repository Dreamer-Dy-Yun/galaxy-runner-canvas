import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const scripts = [
  "src/engine/animation/animation-timeline.js",
  "src/engine/animation/pose-channel-state.js",
  "src/engine/animation/part-assembly-diff.js",
  "src/engine/animation/transition-profile.js",
  "src/engine/animation/rig-animation-engine.js",
  "src/gameplay/player-rig-catalog.js",
  "src/gameplay/player-animation-profiles.js",
  "src/systems/player-rig-animation-adapter.js",
];

async function createAdapter(unavailable = []) {
  const context = await loadClassicScripts(scripts, {
    globals: {
      matchMedia: () => ({ matches: false }),
      console: { error() {} },
    },
  });
  const Adapter = readClassicBinding(context, "PlayerRigAnimationAdapter");
  const PlayerRigCatalog = readClassicBinding(context, "PlayerRigCatalog");
  const player = {
    kind: null,
    level: 0,
    bank: 0,
    activeWeaponKind() { return this.kind; },
    activeWeaponLevel() { return this.level; },
    bankAmount() { return this.bank; },
  };
  const art = { unavailableAssetKeys: () => Object.freeze([...unavailable]) };
  return { adapter: new Adapter(player, art), player, PlayerRigCatalog };
}

function change(fromKind, fromLevel, toKind, toLevel) {
  return Object.freeze({
    outcome: fromKind ? "level" : "equipped",
    rigChange: Object.freeze({
      from: Object.freeze({ kind: fromKind, level: fromLevel }),
      to: Object.freeze({ kind: toKind, level: toLevel }),
    }),
  });
}

test("route choice detaches registered parts and settles only approved final art", async () => {
  const { adapter } = await createAdapter();
  assert.equal(adapter.handleProgressionResult(
    change(null, 0, "energy", 1),
    { reason: "route-choice" }
  ), true);

  const detached = adapter.update(0.08);
  assert.equal(detached.active, true);
  assert.ok(detached.parts.some((part) => part.tags.includes("transition")));
  const left = detached.parts.find((part) => part.tags.includes("left"));
  const right = detached.parts.find((part) => part.tags.includes("right"));
  assert.ok(left.transform.x < 0);
  assert.ok(right.transform.x > 0);

  const settled = adapter.update(2);
  assert.equal(settled.active, false);
  assert.equal(settled.parts.map((part) => part.assetKey).join(","), "player.final.energy.01");
  assert.equal(settled.parts.some((part) => part.tags.includes("transition")), false);
});

test("same-route upgrade reassembles parts and keeps rigid bank transforms", async () => {
  const { adapter, player, PlayerRigCatalog } = await createAdapter();
  adapter.engine.reset(PlayerRigCatalog.snapshot("rapid", 1));
  assert.equal(adapter.handleProgressionResult(
    change("rapid", 1, "rapid", 2),
    { reason: "upgrade" }
  ), true);
  adapter.update(2);
  player.bank = 1;
  adapter.update(0);
  const banked = adapter.update(0.12);
  assert.equal(banked.parts[0].assetKey, "player.final.rapid.02");
  assert.ok(banked.parts[0].transform.rotation > 0);
  assert.equal("scale" in banked.parts[0].transform, false);
  assert.equal("skew" in banked.parts[0].transform, false);
});

test("base rig bank enters, reverses, pauses, and returns inside the engine", async () => {
  const { adapter, player } = await createAdapter();
  player.bank = 1;
  adapter.update(0);
  const entering = adapter.update(0.06);
  assert.ok(entering.parts.every((part) => part.transform.rotation > 0));

  adapter.setPaused(true);
  const held = adapter.snapshot();
  assert.equal(adapter.update(1), held);
  assert.equal(held.paused, true);
  adapter.setPaused(false);

  player.bank = -1;
  adapter.update(0);
  const reversed = adapter.update(0.2);
  assert.ok(reversed.parts.every((part) => part.transform.rotation < 0));

  player.bank = 0;
  adapter.update(0);
  const neutral = adapter.update(0.16);
  assert.ok(neutral.parts.every((part) => Math.abs(part.transform.rotation) < 1e-12));
});

test("missing transition art degrades directly to the approved target", async () => {
  const { adapter } = await createAdapter(["player.transition.energy.core"]);
  adapter.handleProgressionResult(change(null, 0, "energy", 1), { reason: "route-choice" });
  const frame = adapter.snapshot();
  assert.equal(frame.active, false);
  assert.equal(frame.degraded, true);
  assert.equal(frame.parts.map((part) => part.assetKey).join(","), "player.final.energy.01");
});

test("non-rig progression leaves animation state unchanged", async () => {
  const { adapter } = await createAdapter();
  const before = adapter.snapshot();
  assert.equal(adapter.handleProgressionResult({ kind: "repair", outcome: "healed" }), false);
  assert.equal(adapter.snapshot(), before);
});
