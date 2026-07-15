import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

test("FrameClock clamps a long foreground gap and resets its baseline after stop", async () => {
  const scheduled = [];
  const cancelled = [];
  const context = await loadClassicScripts(["src/engine/runtime/frame-clock.js"], {
    globals: {
      requestAnimationFrame(callback) {
        scheduled.push(callback);
        return scheduled.length;
      },
      cancelAnimationFrame(handle) {
        cancelled.push(handle);
      },
    },
  });
  const frames = [];
  const clock = new context.FrameClock({
    requestFrame(callback) {
      scheduled.push(callback);
      return scheduled.length;
    },
    cancelFrame(handle) {
      cancelled.push(handle);
    },
    maxDeltaSeconds: 0.04,
  });

  clock.start((frame) => frames.push(frame));
  clock.handleFrame(1_000);
  clock.handleFrame(11_000);

  assert.equal(frames[0].deltaSeconds, 0);
  assert.equal(frames[1].elapsedMs, 10_000);
  assert.equal(frames[1].deltaSeconds, 0.04);

  clock.stop();
  assert.equal(clock.lastTime, null);
  assert.equal(clock.running, false);
  assert.ok(cancelled.length > 0);
});

test("FrameProfiler keeps samples and startup spikes within configured bounds", async () => {
  const context = await loadClassicScripts(["src/engine/debug/frame-profiler.js"]);
  let now = 0;
  const profiler = new context.FrameProfiler({
    sampleSize: 3,
    spikeThresholdMs: 4,
    startupWindowMs: 1_000,
    maxSpikes: 2,
    now: () => now,
  });
  profiler.startedAt = 0;

  for (const duration of [1, 5, 6, 7, 2]) {
    now += 10;
    profiler.record({ frameMs: duration, updateMs: duration / 2, drawMs: duration / 2 });
  }

  const snapshot = profiler.snapshot();
  assert.equal(snapshot.sampleCount, 3);
  assert.equal(snapshot.spikes.length, 2);
  assert.equal(snapshot.frame.max, 7);
  assert.ok(Number.isFinite(snapshot.frame.p95));
  assert.equal(Object.isFrozen(snapshot), true);
});

test("EntityStore cleanup operations stay bounded across repeated churn", async () => {
  const context = await loadClassicScripts(["src/engine/world/entity-store.js"]);
  const items = [];
  let highWater = 0;

  for (let cycle = 0; cycle < 500; cycle += 1) {
    for (let index = 0; index < 12; index += 1) {
      items.push({ cycle, index, expired: index < 8 });
    }
    highWater = Math.max(highWater, items.length);

    let firstKept = items.length;
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].expired) continue;
      firstKept -= 1;
      items[firstKept] = items[index];
    }
    context.EntityStore.compactKeptTail(items, firstKept);

    while (items.length > 16) {
      context.EntityStore.removeAtUnordered(items, 0);
    }
  }

  assert.ok(highWater <= 28, `entity churn high-water should stay bounded, received ${highWater}`);
  assert.ok(items.length <= 16);
  assert.equal(items.every((item) => item.expired === false), true);
});
