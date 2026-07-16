import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const scripts = [
  "src/engine/animation/animation-timeline.js",
  "src/engine/animation/pose-channel-state.js",
  "src/engine/animation/part-assembly-diff.js",
  "src/engine/animation/transition-profile.js",
  "src/engine/animation/rig-animation-engine.js",
];

test("rig timeline does not collide with the browser native AnimationTimeline", async () => {
  class NativeAnimationTimeline {
    constructor() { throw new TypeError("Illegal constructor"); }
  }
  const context = await loadClassicScripts(scripts, {
    globals: { AnimationTimeline: NativeAnimationTimeline },
  });
  const Timeline = readClassicBinding(context, "RigAnimationTimeline");
  const Engine = readClassicBinding(context, "RigAnimationEngine");
  assert.equal(readClassicBinding(context, "AnimationTimeline"), NativeAnimationTimeline);
  assert.doesNotThrow(() => new Timeline([{ id: "ready", duration: 0 }]));
  assert.equal(typeof Engine, "function");
});
