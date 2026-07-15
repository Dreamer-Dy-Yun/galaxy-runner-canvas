import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

const runtimeScripts = [
  "src/engine/runtime/frame-clock.js",
  "src/engine/scenes/scene.js",
  "src/engine/scenes/scene-manager.js",
  "src/engine/runtime/engine-runtime.js",
];

async function loadRuntime() {
  return loadClassicScripts(runtimeScripts);
}

test("EngineRuntime owns the canonical phase order without scene.frame bypasses", async () => {
  const context = await loadRuntime();
  const events = [];
  const game = {
    frame() {
      events.push("legacy-frame");
    },
    update(dt, frameState) {
      events.push(["update", dt, frameState.marker]);
    },
    draw(dt, frameState) {
      events.push(["draw", dt, frameState.marker]);
    },
    afterFrame(dt, frameState) {
      events.push(["cleanup", dt, frameState.marker]);
    },
  };
  const manager = new context.SceneManager({ initialScene: game, initialName: "game" });
  const runtime = new context.EngineRuntime({
    scene: manager,
    surface: { name: "test-surface" },
    clock: { start() {}, stop() {} },
  });
  const observer = Object.fromEntries(
    ["beforeFrame", "afterUpdate", "afterDraw", "afterFrame"].map((phase) => [
      phase,
      (event) => {
        events.push(["observer", event.phase, event.executed, event.failed, event.error]);
        assert.equal(Object.isFrozen(event), true);
        assert.equal(Object.isFrozen(event.frameState), true);
      },
    ])
  );

  runtime.subscribe(observer);
  runtime.frame({ deltaSeconds: 0.016, marker: "canonical" });

  assert.deepEqual(events, [
    ["observer", "beforeFrame", false, false, null],
    ["update", 0.016, "canonical"],
    ["observer", "afterUpdate", true, false, null],
    ["draw", 0.016, "canonical"],
    ["observer", "afterDraw", true, false, null],
    ["cleanup", 0.016, "canonical"],
    ["observer", "afterFrame", true, false, null],
  ]);
  assert.equal(typeof manager.frame, "undefined");
  assert.equal(typeof context.Scene.prototype.frame, "undefined");
});

test("subscribe deduplicates observer identity and returns an idempotent unsubscribe", async () => {
  const context = await loadRuntime();
  let calls = 0;
  const observer = { afterFrame() { calls += 1; } };
  const runtime = new context.EngineRuntime({
    scene: { draw() {} },
    clock: { start() {}, stop() {} },
  });

  const firstUnsubscribe = runtime.subscribe(observer);
  const duplicateUnsubscribe = runtime.subscribe(observer);
  assert.equal(firstUnsubscribe, duplicateUnsubscribe);

  runtime.frame({ deltaSeconds: 0.01 });
  assert.equal(calls, 1);
  assert.equal(firstUnsubscribe(), true);
  assert.equal(firstUnsubscribe(), false);
  assert.equal(runtime.unsubscribe(observer), false);

  runtime.frame({ deltaSeconds: 0.01 });
  assert.equal(calls, 1);
});

test("observer failures are reported and isolated from gameplay and later observers", async () => {
  const context = await loadRuntime();
  const events = [];
  const reported = [];
  const runtime = new context.EngineRuntime({
    scene: {
      update() { events.push("update"); },
      draw() { events.push("draw"); },
      afterFrame() { events.push("cleanup"); },
    },
    clock: { start() {}, stop() {} },
    onObserverError(error, details) {
      reported.push([error.message, details.phase, details.observer.name]);
    },
  });
  const first = {
    name: "first",
    afterUpdate() {
      events.push("first");
      throw new Error("observer failed");
    },
  };
  const second = {
    name: "second",
    afterUpdate() { events.push("second"); },
  };

  runtime.subscribe(first);
  runtime.subscribe(second);
  runtime.frame({ deltaSeconds: 0.01 });
  runtime.frame({ deltaSeconds: 0.01 });

  assert.deepEqual(events, [
    "update", "first", "second", "draw", "cleanup",
    "update", "first", "second", "draw", "cleanup",
  ]);
  assert.deepEqual(reported, [
    ["observer failed", "afterUpdate", "first"],
    ["observer failed", "afterUpdate", "first"],
  ]);
});

test("scene failures remain visible after cleanup and terminal observer notification", async () => {
  const context = await loadRuntime();
  const sceneError = new Error("scene update failed");
  const events = [];
  const observed = [];
  const runtime = new context.EngineRuntime({
    scene: {
      update() {
        events.push("update");
        throw sceneError;
      },
      draw() { events.push("draw"); },
      afterFrame() { events.push("cleanup"); },
    },
    clock: { start() {}, stop() {} },
  });
  runtime.subscribe({
    afterUpdate(event) { observed.push([event.phase, event.executed, event.error]); },
    afterDraw(event) { observed.push([event.phase, event.executed, event.error]); },
    afterFrame(event) { observed.push([event.phase, event.executed, event.error]); },
  });

  assert.throws(() => runtime.frame({ deltaSeconds: 0.01 }), (error) => error === sceneError);
  assert.deepEqual(events, ["update", "cleanup"]);
  assert.deepEqual(observed, [
    ["afterUpdate", true, sceneError],
    ["afterDraw", false, sceneError],
    ["afterFrame", true, sceneError],
  ]);
});

test("zero delta still emits every observer phase and performs cleanup", async () => {
  const context = await loadRuntime();
  const phases = [];
  const calls = [];
  const runtime = new context.EngineRuntime({
    scene: {
      update() { calls.push("update"); },
      draw() { calls.push("draw"); },
      afterFrame() { calls.push("cleanup"); },
    },
    clock: { start() {}, stop() {} },
  });
  runtime.subscribe(Object.fromEntries(
    ["beforeFrame", "afterUpdate", "afterDraw", "afterFrame"].map((phase) => [
      phase,
      (event) => phases.push([event.phase, event.executed]),
    ])
  ));

  runtime.frame({ deltaSeconds: Number.NaN });

  assert.deepEqual(calls, ["draw", "cleanup"]);
  assert.deepEqual(phases, [
    ["beforeFrame", false],
    ["afterUpdate", false],
    ["afterDraw", true],
    ["afterFrame", true],
  ]);
});

for (const failingPhase of ["update", "draw", "afterFrame"]) {
  test(`falsy ${failingPhase} failures preserve the thrown value after cleanup`, async () => {
    const context = await loadRuntime();
    const falsyErrors = [null, undefined, 0, false, ""];
    for (const thrownValue of falsyErrors) {
      const calls = [];
      let terminalEvent = null;
      const scene = {
        update() {
          calls.push("update");
          if (failingPhase === "update") throw thrownValue;
        },
        draw() {
          calls.push("draw");
          if (failingPhase === "draw") throw thrownValue;
        },
        afterFrame() {
          calls.push("cleanup");
          if (failingPhase === "afterFrame") throw thrownValue;
        },
      };
      const runtime = new context.EngineRuntime({ scene, clock: { start() {}, stop() {} } });
      runtime.subscribe({ afterFrame(event) { terminalEvent = event; } });
      let caught = false;
      let caughtValue = Symbol("not thrown");
      try {
        runtime.frame({ deltaSeconds: 0.01 });
      } catch (error) {
        caught = true;
        caughtValue = error;
      }
      assert.equal(caught, true, `${failingPhase} must rethrow ${String(thrownValue)}`);
      assert.equal(Object.is(caughtValue, thrownValue), true);
      assert.equal(terminalEvent.failed, true);
      assert.equal(Object.is(terminalEvent.error, thrownValue), true);
      assert.deepEqual(calls,
        failingPhase === "update" ? ["update", "cleanup"] : ["update", "draw", "cleanup"]);
    }
  });
}

test("unsubscribe and same-identity resubscribe defers the new generation to the next phase", async () => {
  const context = await loadRuntime();
  const calls = [];
  let replacementUnsubscribe = null;
  const runtime = new context.EngineRuntime({ scene: { draw() {} }, clock: { start() {}, stop() {} } });
  const target = {
    beforeFrame() { calls.push("target-before"); },
    afterUpdate() { calls.push("target-after-update"); },
  };
  const controller = {
    beforeFrame() {
      calls.push("controller-before");
      assert.equal(runtime.unsubscribe(target), true);
      replacementUnsubscribe = runtime.subscribe(target);
    },
    afterUpdate() { calls.push("controller-after-update"); },
  };
  runtime.subscribe(controller);
  const originalUnsubscribe = runtime.subscribe(target);
  runtime.frame({ deltaSeconds: 0.01 });

  assert.deepEqual(calls, [
    "controller-before",
    "controller-after-update",
    "target-after-update",
  ]);
  assert.equal(originalUnsubscribe(), false);
  assert.equal(replacementUnsubscribe(), true);
});

test("pause boundaries report whether the runtime scene delegate was invoked", async () => {
  const context = await loadRuntime();
  const directCalls = [];
  let directUpdateEvent = null;
  const directScene = {
    paused: true,
    update() { directCalls.push("update"); },
    draw() { directCalls.push("draw"); },
    afterFrame() { directCalls.push("cleanup"); },
  };
  const directRuntime = new context.EngineRuntime({ scene: directScene, clock: { start() {}, stop() {} } });
  directRuntime.subscribe({ afterUpdate(event) { directUpdateEvent = event; } });

  directRuntime.frame({ deltaSeconds: 0.01 });

  assert.deepEqual(directCalls, ["draw", "cleanup"]);
  assert.equal(directUpdateEvent.executed, false);
  assert.equal(directUpdateEvent.failed, false);

  const managedCalls = [];
  let managedUpdateEvent = null;
  const pausedScene = {
    paused: true,
    update() { managedCalls.push("update"); },
    draw() { managedCalls.push("draw"); },
    afterFrame() { managedCalls.push("cleanup"); },
  };
  const manager = new context.SceneManager({ initialScene: pausedScene });
  const managedRuntime = new context.EngineRuntime({ scene: manager, clock: { start() {}, stop() {} } });
  managedRuntime.subscribe({ afterUpdate(event) { managedUpdateEvent = event; } });

  managedRuntime.frame({ deltaSeconds: 0.01 });

  assert.deepEqual(managedCalls, ["draw", "cleanup"]);
  assert.equal(managedUpdateEvent.executed, true);
  assert.equal(managedUpdateEvent.failed, false);
});
