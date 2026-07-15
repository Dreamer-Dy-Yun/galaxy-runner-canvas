import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

const diagnosticScripts = [
  "src/engine/runtime/frame-clock.js",
  "src/engine/runtime/engine-runtime.js",
  "src/engine/debug/frame-profiler.js",
  "src/engine/debug/debug-overlay.js",
];

async function loadDiagnostics(globals = {}) {
  return loadClassicScripts(diagnosticScripts, { globals });
}

function createRuntime(context, { surface = null, scene = null } = {}) {
  const activeScene = scene || { update() {}, draw() {}, afterFrame() {} };
  return new context.EngineRuntime({
    scene: activeScene,
    surface,
    clock: { start() {}, stop() {} },
  });
}

function busyWork(milliseconds = 1) {
  const until = performance.now() + milliseconds;
  while (performance.now() < until) {
    // Deterministic synthetic CPU work for positive runtime phase durations.
  }
}

function createCanvasContext() {
  const calls = [];
  return {
    calls,
    save() { calls.push("save"); },
    fillRect() { calls.push("fillRect"); },
    fillText() { calls.push("fillText"); },
    restore() { calls.push("restore"); },
  };
}

test("FrameProfiler records runtime durations without replacing runtime or scene methods", async () => {
  const context = await loadDiagnostics();
  let updates = 0;
  let draws = 0;
  const scene = {
    update() { updates += 1; busyWork(); },
    draw() { draws += 1; busyWork(); },
    afterFrame() {},
  };
  const runtime = createRuntime(context, { scene });
  const originalFrame = runtime.frame;
  const originalUpdate = scene.update;
  const originalDraw = scene.draw;
  const profiler = new context.FrameProfiler({ spikeThresholdMs: 1000 });

  assert.equal(profiler.attach({ runtime }), profiler);
  assert.equal(profiler.attach({ runtime }), profiler);
  assert.equal(runtime.frame, originalFrame);
  assert.equal(scene.update, originalUpdate);
  assert.equal(scene.draw, originalDraw);
  assert.equal("drawOverlay" in profiler, false);

  runtime.frame({ deltaSeconds: 0.016 });
  const snapshot = profiler.snapshot();
  assert.equal(snapshot.sampleCount, 1);
  assert.ok(snapshot.frame.avg > 0);
  assert.ok(snapshot.update.avg > 0);
  assert.ok(snapshot.draw.avg > 0);
  assert.equal(Object.isFrozen(snapshot), true);

  profiler.disable();
  runtime.frame({ deltaSeconds: 0.016 });
  assert.equal(profiler.snapshot().sampleCount, 1);
  profiler.enable();
  runtime.frame({ deltaSeconds: 0.016 });
  assert.equal(profiler.snapshot().sampleCount, 2);

  profiler.detach().detach();
  runtime.frame({ deltaSeconds: 0.016 });
  assert.equal(profiler.snapshot().sampleCount, 2);
  assert.equal(updates, 4);
  assert.equal(draws, 4);
});

test("DebugOverlay is disabled by default and detach stops display observation only", async () => {
  const context = await loadDiagnostics();
  const canvasContext = createCanvasContext();
  let draws = 0;
  const scene = {
    state: { mode: "running" },
    world: { groups: new Map([["actors", [1, 2]]]) },
    update() {},
    draw() { draws += 1; },
    afterFrame() {},
  };
  const runtime = createRuntime(context, { scene, surface: { context: canvasContext } });
  const originalFrame = runtime.frame;
  const overlay = new context.DebugOverlay({ surface: runtime.surface });

  overlay.attach(runtime).attach(runtime);
  runtime.frame({ deltaSeconds: 0.02 });
  assert.equal(overlay.enabled, false);
  assert.equal(overlay.latestSnapshot, null);
  assert.deepEqual(canvasContext.calls, []);
  assert.equal(runtime.frame, originalFrame);

  overlay.enable();
  runtime.frame({ deltaSeconds: 0.02 });
  assert.equal(overlay.latestSnapshot.sceneState, "running");
  assert.equal(overlay.latestSnapshot.entityTotal, 2);
  assert.ok(canvasContext.calls.includes("fillRect"));

  const displayedSnapshot = overlay.latestSnapshot;
  overlay.detach().detach();
  runtime.frame({ deltaSeconds: 0.02 });
  assert.equal(overlay.latestSnapshot, displayedSnapshot);
  assert.equal(draws, 3);
});

test("profiler and overlay work in either observer attachment order", async () => {
  for (const order of ["profiler-first", "overlay-first"]) {
    const context = await loadDiagnostics();
    const canvasContext = createCanvasContext();
    let updates = 0;
    let draws = 0;
    const scene = {
      state: { mode: "running" },
      update() { updates += 1; busyWork(0.25); },
      draw() { draws += 1; busyWork(0.25); },
      afterFrame() {},
    };
    const runtime = createRuntime(context, { scene, surface: { context: canvasContext } });
    const profiler = new context.FrameProfiler({ spikeThresholdMs: 1000 });
    const overlay = new context.DebugOverlay({
      enabled: true,
      surface: runtime.surface,
      profiler,
    });

    if (order === "profiler-first") {
      profiler.attach({ runtime });
      overlay.attach(runtime);
    } else {
      overlay.attach(runtime);
      profiler.attach({ runtime });
    }

    runtime.frame({ deltaSeconds: 0.016 });
    runtime.frame({ deltaSeconds: 0.016 });
    assert.equal(updates, 2, order);
    assert.equal(draws, 2, order);
    assert.equal(profiler.snapshot().sampleCount, 2, order);
    assert.ok(overlay.latestSnapshot.profiler.sampleCount >= 1, order);
    assert.ok(canvasContext.calls.includes("fillText"), order);

    overlay.detach();
    profiler.detach();
    const sampleCount = profiler.snapshot().sampleCount;
    runtime.frame({ deltaSeconds: 0.016 });
    assert.equal(profiler.snapshot().sampleCount, sampleCount, order);
  }
});

test("debug query flag remains opt-in and explicit false values stay disabled", async () => {
  const enabledContext = await loadDiagnostics({ location: { search: "?debug=1" } });
  assert.equal(enabledContext.DebugOverlay.readEnabledFlag({ queryParam: "debug" }), true);

  const disabledContext = await loadDiagnostics({ location: { search: "?debug=false" } });
  assert.equal(disabledContext.DebugOverlay.readEnabledFlag({ queryParam: "debug" }), false);
});

test("diagnostic observer failures are reported without changing gameplay", async () => {
  const context = await loadDiagnostics();
  const reported = [];
  let gameplayFrames = 0;
  const runtime = new context.EngineRuntime({
    scene: {
      update() { gameplayFrames += 1; },
      draw() {},
      afterFrame() {},
    },
    surface: { context: { save() { throw new Error("overlay failed"); } } },
    clock: { start() {}, stop() {} },
    onObserverError(error, details) { reported.push([error.message, details.phase]); },
  });
  new context.DebugOverlay({ enabled: true, surface: runtime.surface }).attach(runtime);

  assert.doesNotThrow(() => runtime.frame({ deltaSeconds: 0.016 }));
  assert.doesNotThrow(() => runtime.frame({ deltaSeconds: 0.016 }));
  assert.equal(gameplayFrames, 2);
  assert.deepEqual(reported, [
    ["overlay failed", "afterFrame"],
    ["overlay failed", "afterFrame"],
  ]);
});
