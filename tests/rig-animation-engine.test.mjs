import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const scripts = [
  "src/engine/animation/animation-timeline.js",
  "src/engine/animation/pose-channel-state.js",
  "src/engine/animation/part-assembly-diff.js",
  "src/engine/animation/transition-profile.js",
  "src/engine/animation/rig-animation-engine.js",
  "src/engine/rendering/rig-animation-renderer.js",
];

async function bindings() {
  const context = await loadClassicScripts(scripts);
  return {
    RigAnimationTimeline: readClassicBinding(context, "RigAnimationTimeline"),
    PartAssemblyDiff: readClassicBinding(context, "PartAssemblyDiff"),
    RigAnimationEngine: readClassicBinding(context, "RigAnimationEngine"),
    RigAnimationRenderer: readClassicBinding(context, "RigAnimationRenderer"),
  };
}

function part(id, assetKey = id, overrides = {}) {
  return {
    id,
    assetKey,
    group: "body",
    zIndex: 0,
    pivot: { x: 256, y: 256 },
    transform: { x: 0, y: 0, rotation: 0, opacity: 1 },
    tags: [],
    ...overrides,
  };
}

function rig(id, parts = []) {
  return { id, parts };
}

function profile(id = "standard", overrides = {}) {
  return {
    id,
    phases: [
      { id: "detach", duration: 0.1, easing: "linear" },
      { id: "attach", duration: 0.1, easing: "easeOut" },
    ],
    interruption: "replace-latest",
    fallback: { asset: "hold-source", strategy: "hold-source" },
    ...overrides,
  };
}

function engineRequest(revision, from, to, profileId = "standard", extra = {}) {
  return { revision, from, to, profileId, ...extra };
}

test("timeline crosses exact and large boundaries deterministically", async () => {
  const { RigAnimationTimeline } = await bindings();
  const timeline = new RigAnimationTimeline([
    { id: "zero", duration: 0, easing: "linear" },
    { id: "move", duration: 0.1, easing: "easeIn" },
    { id: "settle", duration: 0.2, easing: "linear" },
  ]);

  assert.equal(timeline.update(0.1).phase, "settle");
  assert.equal(timeline.snapshot().progress, 0);
  assert.equal(timeline.update(10).completed, true);
  assert.ok(Math.abs(timeline.snapshot().elapsed - 0.3) < Number.EPSILON);
  assert.throws(() => timeline.update(-0.1), /non-negative/);
  assert.throws(() => timeline.update(Number.NaN), /non-negative/);
});

test("part diff classifies retained, added, removed, and replaced", async () => {
  const { PartAssemblyDiff } = await bindings();
  const diff = PartAssemblyDiff.create(
    rig("from", [part("keep"), part("remove"), part("swap", "old")]),
    rig("to", [
      part("keep", "keep", { transform: { x: 4, y: 0, rotation: 0, opacity: 1 } }),
      part("add"),
      part("swap", "new"),
    ])
  );

  assert.deepEqual(
    [diff.retained.length, diff.added.length, diff.removed.length, diff.replaced.length],
    [1, 1, 1, 1]
  );
  assert.ok(Object.isFrozen(diff.to.parts[0].transform));
  assert.throws(() => PartAssemblyDiff.snapshot(rig("bad", [part("same"), part("same")])), /duplicate/);
});

test("full-image crossfade, transient parts, and target settle share one contract", async () => {
  const { RigAnimationEngine } = await bindings();
  const configured = profile("standard", { motions: { transient: {
    strategyId: "detach-attach",
    parameters: { phaseModes: { detach: "detach", attach: "attach" }, offsetByTag: { left: { x: -40, y: 5 }, right: { x: 40, y: 5 } } },
  } } });
  const engine = new RigAnimationEngine({ profiles: { standard: configured } });
  const from = rig("old", [part("full", "approved-old")]);
  const to = rig("new", [part("full", "approved-new")]);

  engine.start(engineRequest(1, from, to, "standard", {
    transitionParts: [part("left", "temporary-left", { tags: ["left"] }), part("right", "temporary-right", { tags: ["right"] })],
  }));
  const detached = engine.update(0.05);
  assert.ok(detached.parts.find((entry) => entry.id === "left" && entry.role === "source").transform.x < 0);
  const attached = engine.update(0.1);
  assert.ok(attached.parts.find((entry) => entry.id === "right" && entry.role === "target").transform.x > 0);
  assert.equal(attached.parts.filter((entry) => entry.id === "full").length, 2);

  const settled = engine.update(0.05);
  assert.equal(settled.active, false);
  assert.deepEqual(settled.parts.map((entry) => entry.assetKey), ["approved-new"]);
  assert.ok(Object.isFrozen(settled.parts));
});

test("built-in rigid bank uses tags without scale or skew channels", async () => {
  const { RigAnimationEngine } = await bindings();
  const bank = profile("bank", {
    poseChannels: {
      bank: {
        strategyId: "rigid-bank",
        parameters: { x: 3, rotation: 0.05, tagMultipliers: { mirrored: -1 } },
      },
    },
  });
  const engine = new RigAnimationEngine({ profiles: { bank } });
  const stable = rig("stable", [part("left"), part("right", "right", { tags: ["mirrored"] })]);
  engine.start(engineRequest(1, stable, stable, "bank"));
  const frame = engine.setPose("bank", 1);

  assert.equal(frame.parts[0].transform.x, 3);
  assert.equal(frame.parts[1].transform.x, -3);
  assert.equal("scale" in frame.parts[0].transform, false);
  assert.equal("skew" in frame.parts[0].transform, false);
});

test("built-in detach-attach consumes declarative phase modes", async () => {
  const { RigAnimationEngine } = await bindings();
  const assembly = profile("assembly", {
    motions: {
      added: {
        strategyId: "detach-attach",
        parameters: {
          phaseModes: { detach: "hold-source", attach: "attach" },
          offsetByTag: { left: { x: -80, y: 10 }, right: { x: 80, y: 10 } },
        },
      },
    },
  });
  const engine = new RigAnimationEngine({ profiles: { assembly } });
  engine.start(engineRequest(1, rig("a"), rig("b", [
    part("left", "left", { tags: ["left"] }), part("right", "right", { tags: ["right"] }),
  ]), "assembly"));
  assert.equal(engine.update(0.05).parts.length, 0);
  const attaching = engine.update(0.1).parts;
  assert.ok(attaching.find((entry) => entry.id === "left").transform.x < 0);
  assert.ok(attaching.find((entry) => entry.id === "right").transform.x > 0);
});

test("motion timing supports per-tag delay and easing", async () => {
  const { RigAnimationEngine } = await bindings();
  const staggered = profile("staggered", {
    phases: [{ id: "move", duration: 1, easing: "linear" }],
    motions: {
      added: {
        strategyId: "interpolate",
        timing: {
          delay: 0,
          duration: 1,
          byTag: { late: { delay: 0.5, duration: 0.5, easing: "easeOut" } },
        },
      },
    },
  });
  const engine = new RigAnimationEngine({ profiles: { staggered } });
  engine.start(engineRequest(1, rig("from"), rig("to", [
    part("early"),
    part("late", "late", { tags: ["late"] }),
  ]), "staggered"));
  const frame = engine.update(0.25);
  assert.equal(frame.parts.find((entry) => entry.id === "early").transform.opacity, 0.25);
  assert.equal(frame.parts.find((entry) => entry.id === "late").transform.opacity, 0);
});

test("pause, reset, and reduced-motion settle are explicit lifecycle operations", async () => {
  const { RigAnimationEngine } = await bindings();
  const instant = profile("instant", { reducedMotion: { mode: "settle-target", duration: 0 } });
  const engine = new RigAnimationEngine({ profiles: { standard: profile(), instant } });
  const from = rig("from", [part("a")]);
  const to = rig("to", [part("b")]);
  engine.start(engineRequest(1, from, to));
  engine.setPaused(true);
  assert.equal(engine.update(1).phase, "detach");
  engine.setPaused(false);
  assert.equal(engine.update(0.1).phase, "attach");
  engine.reset(from);
  assert.equal(engine.snapshot().revision, -1);
  engine.setReducedMotion(true);
  assert.equal(engine.start(engineRequest(1, from, to, "instant")).active, false);
});

test("interruption supports replace, finish-current, and one latest queued request", async () => {
  const { RigAnimationEngine } = await bindings();
  const from = rig("from", [part("a")]);
  const middle = rig("middle", [part("b")]);
  const to = rig("to", [part("c")]);
  for (const policy of ["replace-latest", "finish-current", "queue-latest"]) {
    const configured = profile(policy, { interruption: policy });
    const engine = new RigAnimationEngine({ profiles: { [policy]: configured } });
    engine.start(engineRequest(1, from, middle, policy));
    engine.update(0.05);
    const afterSecond = engine.start(engineRequest(2, middle, to, policy));
    assert.equal(afterSecond.revision, policy === "queue-latest" ? 1 : 2);
    engine.update(1);
    if (policy === "queue-latest") engine.update(1);
    assert.equal(engine.snapshot().rigId, "to");
  }
});

test("invalid requests are atomic and declared failures remain visible", async () => {
  const { RigAnimationEngine } = await bindings();
  const source = rig("source", [part("a")]);
  const target = rig("target", [part("b", "missing")]);
  const engine = new RigAnimationEngine({ profiles: { standard: profile() } });
  const before = engine.snapshot();
  assert.throws(() => engine.start(engineRequest(0, source, target, "unknown")), /Unknown/);
  assert.throws(() => engine.start(engineRequest(
    0,
    rig("bad", [part("same"), part("same")]),
    target
  )), /duplicate/);
  assert.equal(engine.snapshot(), before);

  assert.throws(() => new RigAnimationEngine({
    profiles: { invalid: profile("invalid", { motions: { added: { strategyId: "missing" } } }) },
  }), /unknown strategy/);

  const failed = engine.start(engineRequest(1, source, target, "standard", {
    unavailableAssetKeys: ["missing"],
  }));
  assert.equal(failed.degraded, true);
  assert.equal(failed.errors[0].code, "asset-unavailable");
  assert.deepEqual(failed.parts.map((entry) => entry.assetKey), ["a"]);

  const skipProfile = profile("skip", { fallback: { asset: "skip-part", strategy: "hold-source" } });
  const skipEngine = new RigAnimationEngine({ profiles: { skip: skipProfile } });
  skipEngine.start(engineRequest(1, source, target, "skip", { unavailableAssetKeys: ["missing"] }));
  assert.deepEqual(skipEngine.update(1).parts, []);
  assert.equal(skipEngine.snapshot().degraded, true);
});

test("strategy errors report and follow the declared settle policy", async () => {
  const { RigAnimationEngine } = await bindings();
  let reported = 0;
  const broken = profile("broken", {
    motions: { added: { strategyId: "detach-attach", parameters: {
      phaseModes: { detach: "attach" }, offsetByTag: { broken: { x: "bad", y: 0 } },
    } } },
    fallback: { asset: "hold-source", strategy: "settle-target" },
  });
  const engine = new RigAnimationEngine({ profiles: { broken }, onError: () => { reported += 1; } });
  const targetPart = part("b", "b", { tags: ["broken"] });
  const frame = engine.start(engineRequest(1, rig("from"), rig("to", [targetPart]), "broken"));
  assert.equal(reported, 1);
  assert.equal(frame.active, false);
  assert.equal(frame.degraded, true);
  assert.equal(frame.parts[0].id, "b");
});

test("renderer consumes frozen frames without non-rigid canvas transforms", async () => {
  const { RigAnimationEngine, RigAnimationRenderer } = await bindings();
  const stable = rig("stable", [part("image")]);
  const engine = new RigAnimationEngine({ profiles: { standard: profile() } });
  const frame = engine.start(engineRequest(1, stable, stable));
  const calls = [];
  const ctx = {
    globalAlpha: 1,
    save: () => calls.push("save"),
    translate: () => calls.push("translate"),
    rotate: () => calls.push("rotate"),
    drawImage: () => calls.push("drawImage"),
    restore: () => calls.push("restore"),
  };
  const renderer = new RigAnimationRenderer({
    resolveAsset: () => ({ width: 512, height: 512 }),
  });
  assert.equal(renderer.draw(ctx, frame).drawn, 1);
  assert.deepEqual(calls, ["save", "translate", "rotate", "drawImage", "restore"]);
  assert.equal("scale" in ctx, false);
  assert.equal("transform" in ctx, false);
});

test("engine sources contain no game-specific tokens", async () => {
  const source = await Promise.all(scripts.slice(0, 5).map((file) => readFile(file, "utf8")));
  assert.doesNotMatch(source.join("\n"), /\b(?:Player|Rapid|Energy|Spread|Nova)\b/);
});
