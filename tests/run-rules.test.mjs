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

test("run rules expose one frozen canonical route-choice layout", async () => {
  const context = await loadRunRules();
  const kinds = context.RunRules.weaponKinds();

  assert.deepEqual([...kinds], ["rapid", "energy", "spread", "nova"]);
  assert.equal(Object.isFrozen(kinds), true);
  assert.equal(Object.isFrozen(context.RUN_RULES), true);
  assert.equal(Object.isFrozen(context.RUN_RULES.opening.choices), true);
  assert.deepEqual(
    context.RUN_RULES.opening.choices.map((choice) => choice.kind).join(","),
    "rapid,energy,spread,nova"
  );
});

test("ready, base launch, route choice, and route lock are explicit", async () => {
  const { RunRules } = await loadRunRules();
  const state = RunRules.createReadyState();
  assert.deepEqual(
    { ...state },
    { runPhase: null, runPhaseElapsed: 0, routeChoicesSpawned: false, selectedWeaponKind: null }
  );
  assert.equal(RunRules.beginOpening(state), true);
  assert.equal(state.runPhase, "baseLaunch");
  assert.equal(RunRules.enterRouteChoice(state), true);
  assert.equal(state.runPhase, "routeChoice");
  assert.equal(RunRules.lockRoute(state, "unknown"), false);
  assert.equal(RunRules.lockRoute(state, "energy"), true);
  assert.equal(RunRules.routeKind(state), "energy");
  assert.equal(state.runPhase, "combat");
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
