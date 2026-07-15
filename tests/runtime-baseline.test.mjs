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

test("classic loader exposes runtime globals in an isolated context", async () => {
  const first = await loadRuntime();
  const second = await loadRuntime();

  assert.equal(typeof first.FrameClock, "function");
  assert.equal(typeof first.Scene, "function");
  assert.equal(typeof first.SceneManager, "function");
  assert.equal(typeof first.EngineRuntime, "function");
  assert.notEqual(first.EngineRuntime, second.EngineRuntime);
});

test("EngineRuntime forwards one positive-delta frame through SceneManager", async () => {
  const context = await loadRuntime();
  const events = [];
  const scene = {
    enter(details) {
      events.push(["enter", details.to]);
    },
    update(dt, frameState) {
      events.push(["update", dt, frameState.marker, frameState.runtime]);
    },
    draw(dt, frameState) {
      events.push(["draw", dt, frameState.marker, frameState.surface]);
    },
  };
  const manager = new context.SceneManager({ initialScene: scene, initialName: "game" });
  const surface = { name: "test-surface" };
  const clock = { start() {}, stop() {} };
  const runtime = new context.EngineRuntime({ scene: manager, surface, clock });

  runtime.frame({ deltaSeconds: 0.016, marker: "baseline" });

  assert.equal(events.length, 3);
  assert.deepEqual(events[0], ["enter", "game"]);
  assert.deepEqual(events[1].slice(0, 3), ["update", 0.016, "baseline"]);
  assert.equal(events[1][3], runtime);
  assert.deepEqual(events[2].slice(0, 3), ["draw", 0.016, "baseline"]);
  assert.equal(events[2][3], surface);
  assert.equal(runtime.lastFrameState.runtime, runtime);
  assert.equal(runtime.lastFrameState.surface, surface);
});

test("zero-delta baseline skips update but still draws", async () => {
  const context = await loadRuntime();
  const calls = [];
  const scene = {
    update() {
      calls.push("update");
    },
    draw(dt) {
      calls.push(["draw", dt]);
    },
  };
  const manager = new context.SceneManager({ initialScene: scene });
  const runtime = new context.EngineRuntime({
    scene: manager,
    clock: { start() {}, stop() {} },
  });

  runtime.frame({ deltaSeconds: Number.NaN });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ["draw", 0]);
  assert.equal(runtime.lastFrameState.deltaSeconds, 0);
});

test("runtime start and stop delegate to the clock idempotently", async () => {
  const context = await loadRuntime();
  const calls = [];
  const clock = {
    start(callback) {
      calls.push(["start", callback]);
    },
    stop() {
      calls.push(["stop"]);
    },
  };
  const runtime = new context.EngineRuntime({ scene: { draw() {} }, clock });

  runtime.start();
  runtime.start();
  runtime.stop();
  runtime.stop();

  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], "start");
  assert.equal(typeof calls[0][1], "function");
  assert.deepEqual(calls[1], ["stop"]);
  assert.equal(runtime.running, false);
});
