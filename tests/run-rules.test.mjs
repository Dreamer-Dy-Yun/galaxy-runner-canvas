import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

const runRuleScripts = [
  "src/core/constants.js",
  "src/gameplay/weapon-definition.js",
  "src/gameplay/weapon-catalog.js",
  "src/gameplay/weapon-definitions.js",
  "src/gameplay/run-rules.js",
];

async function loadRunRules() {
  return loadClassicScripts(runRuleScripts);
}

test("run rules expose one frozen canonical starting-weapon order", async () => {
  const context = await loadRunRules();
  const kinds = context.RunRules.weaponKinds();

  assert.deepEqual([...kinds], ["rapid", "energy", "spread", "nova"]);
  assert.equal(Object.isFrozen(kinds), true);
  assert.equal(Object.isFrozen(context.RUN_RULES), true);
  assert.equal(Object.isFrozen(context.RUN_RULES.startingWeapon), true);
  assert.equal(context.RUN_RULES.startingWeapon.defaultKind, "rapid");
});

test("starting-weapon normalization and cycling are deterministic and wrap", async () => {
  const { RunRules } = await loadRunRules();

  assert.equal(RunRules.normalizeStartingWeapon("energy"), "energy");
  assert.equal(RunRules.normalizeStartingWeapon("unknown"), "rapid");
  assert.equal(RunRules.normalizeStartingWeapon(null), "rapid");
  assert.equal(RunRules.cycleStartingWeapon("rapid", -1), "nova");
  assert.equal(RunRules.cycleStartingWeapon("nova", 1), "rapid");
  assert.equal(RunRules.cycleStartingWeapon("rapid", -5), "nova");
  assert.equal(RunRules.cycleStartingWeapon("rapid", 5), "energy");
  assert.equal(RunRules.cycleStartingWeapon("spread", 0), "spread");
});

test("movement and numeric actions resolve through the same selection contract", async () => {
  const { RunRules } = await loadRunRules();

  assert.equal(RunRules.weaponForAction("moveLeft", "rapid"), "nova");
  assert.equal(RunRules.weaponForAction("moveRight", "rapid"), "energy");
  assert.equal(RunRules.weaponForAction("selectWeapon1", "nova"), "rapid");
  assert.equal(RunRules.weaponForAction("selectWeapon2", "rapid"), "energy");
  assert.equal(RunRules.weaponForAction("selectWeapon3", "rapid"), "spread");
  assert.equal(RunRules.weaponForAction("selectWeapon4", "rapid"), "nova");
  assert.equal(RunRules.weaponForAction("start", "rapid"), null);
});

test("Assist status is derived only from a positive finite Continue count", async () => {
  const { RunRules, RUN_RULES } = await loadRunRules();

  assert.equal(RunRules.isAssisted({ continues: 0 }), false);
  assert.equal(RunRules.isAssisted({ continues: 1 }), true);
  assert.equal(RunRules.isAssisted({ continues: 8 }), true);
  assert.equal(RunRules.isAssisted({ continues: -1 }), false);
  assert.equal(RunRules.isAssisted({ continues: Infinity }), false);
  assert.equal(RunRules.isAssisted(null), false);
  assert.deepEqual(
    { ...RUN_RULES.continue },
    { mode: "running", playerInvincibility: 2.4, spawnGraceSeconds: 1.2, itemGraceSeconds: 1.2 }
  );
});
