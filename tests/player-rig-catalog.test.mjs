import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const root = process.cwd();

async function loadCatalog() {
  const context = await loadClassicScripts([
    "src/gameplay/player-rig-catalog.js",
    "src/gameplay/player-animation-profiles.js",
  ]);
  return {
    PlayerRigCatalog: readClassicBinding(context, "PlayerRigCatalog"),
    PlayerAnimationProfiles: readClassicBinding(context, "PlayerAnimationProfiles"),
  };
}

test("base and every approved final route resolve frozen stable snapshots", async () => {
  const { PlayerRigCatalog } = await loadCatalog();
  const base = PlayerRigCatalog.snapshot();
  assert.equal(base.parts.length, 4);
  assert.ok(Object.isFrozen(base));
  assert.ok(Object.isFrozen(base.parts));

  for (const kind of PlayerRigCatalog.routeKinds()) {
    for (const level of [1, 5, 10]) {
      const snapshot = PlayerRigCatalog.snapshot(kind, level);
      assert.equal(snapshot.parts.length, 1);
      assert.match(snapshot.parts[0].assetKey, new RegExp(`player\\.final\\.${kind}`));
      assert.ok(Object.isFrozen(snapshot.parts[0]));
    }
  }
});

test("all catalog asset keys resolve to production files", async () => {
  const { PlayerRigCatalog } = await loadCatalog();
  for (const kind of PlayerRigCatalog.routeKinds()) {
    for (const key of PlayerRigCatalog.requiredAssetKeys(kind, 1)) {
      const relativePath = PlayerRigCatalog.assetPath(key);
      assert.ok(relativePath, `missing path for ${key}`);
      assert.equal(fs.existsSync(path.join(root, relativePath)), true, relativePath);
    }
  }
  for (const part of PlayerRigCatalog.snapshot().parts) {
    assert.equal(fs.existsSync(path.join(root, PlayerRigCatalog.assetPath(part.assetKey))), true);
  }
});

test("transition parts are temporary and never replace stable final art", async () => {
  const { PlayerRigCatalog } = await loadCatalog();
  for (const kind of PlayerRigCatalog.routeKinds()) {
    const transition = PlayerRigCatalog.transitionParts(kind);
    assert.ok(transition.length >= 4);
    assert.equal(new Set(transition.map((part) => part.id)).size, transition.length);
    assert.ok(transition.every((part) => part.tags.includes("transition")));
    assert.ok(PlayerRigCatalog.snapshot(kind, 1).parts.every(
      (part) => !part.assetKey.includes("transition")
    ));
  }
});

test("animation profiles contain declarative engine parameters only", async () => {
  const { PlayerAnimationProfiles } = await loadCatalog();
  const profiles = PlayerAnimationProfiles.all();
  assert.equal(PlayerAnimationProfiles.idFor("route-choice"), "player-route-assembly");
  assert.equal(PlayerAnimationProfiles.idFor("upgrade"), "player-upgrade-assembly");
  assert.ok(Object.isFrozen(profiles));
  assert.equal(profiles["player-route-assembly"].motions.transient.strategyId, "detach-attach");
  assert.deepEqual(
    Object.keys(profiles["player-route-assembly"].poseChannels),
    ["bank"]
  );
});
