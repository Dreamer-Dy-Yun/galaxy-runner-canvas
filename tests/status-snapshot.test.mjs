import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

function createCanvasContext() {
  return {
    save() {},
    fillRect() {},
    fillText() {},
    restore() {},
  };
}

test("main publishes a frozen read-only status snapshot without gameplay controls", async () => {
  class CanvasElement {}
  const canvas = new CanvasElement();
  const control = {};
  const pageListeners = new Map();
  let accessibilityDetachCount = 0;
  let audioDestroyCount = 0;
  const globals = {
    HTMLCanvasElement: CanvasElement,
    document: {
      currentScript: { src: "https://test.invalid/src/main.js" },
      getElementById(id) { return id === "game" ? canvas : control; },
      createElement() { throw new Error("all runtime globals should already be loaded"); },
      head: { appendChild() {} },
    },
    PLAYFIELD: { width: 960, height: 540 },
    GAME_CONFIG: { dprFallback: 1, maxFrameDelta: 0.05 },
    addEventListener(type, listener) { pageListeners.set(type, listener); },
  };
  const context = await loadClassicScripts([
    "src/engine/debug/frame-profiler.js",
    "src/engine/debug/debug-overlay.js",
  ], { globals });

  for (const name of [
    "AssetLoader", "AssetPreloader", "RenderHelpers", "SpriteAtlas", "Scene",
    "ActionMap", "InputState", "EntityStore", "EntityGroups", "World", "CollisionQuery",
  ]) {
    context[name] = class Placeholder {};
  }

  context.CanvasSurface = class CanvasSurface {
    constructor(target) {
      this.canvas = target;
      this.context = createCanvasContext();
      this.dpr = 1;
    }
  };
  context.FrameClock = class FrameClock {};
  context.Game = class Game {
    constructor() {
      this.state = {
        mode: "ready",
        distance: 12.5,
        score: 42,
        continues: 0,
        startingWeaponKind: "rapid",
      };
      this.player = { health: 7, activeWeaponKind() { return null; } };
      this.feedback = { subscribe() { return () => true; }, current() { return null; } };
      this.input = { isDown() { return false; } };
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.items = [];
      this.explosions = [];
      this.particles = [];
      this.infoPanelOpen = false;
    }
  };
  context.RunRules = { isAssisted() { return false; } };
  context.GameAccessibility = class GameAccessibility {
    attach() { return this; }
    detach() { accessibilityDetachCount += 1; return this; }
  };
  context.GameAudio = class GameAudio {
    attach() { return this; }
    destroy() { audioDestroyCount += 1; return this; }
    isMuted() { return false; }
  };
  context.SceneManager = class SceneManager {
    register(name, scene) { this.currentName = name; this.currentScene = scene; }
    switchTo() {}
    activeScene() { return this.currentScene; }
  };
  context.EngineRuntime = class EngineRuntime {
    constructor({ scene, surface }) {
      this.scene = scene;
      this.surface = surface;
      this.running = false;
      this.observers = new Set();
    }
    subscribe(observer) {
      this.observers.add(observer);
      return () => this.observers.delete(observer);
    }
    start() { this.running = true; }
  };

  await loadClassicScripts(["src/main.js"], { context });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const status = context.GalaxyRunnerStatus();
  assert.equal(Object.isFrozen(status), true);
  assert.deepEqual(
    {
      mode: status.mode,
      distance: status.distance,
      score: status.score,
      hp: status.hp,
      selected: status.selectedStartingWeapon,
      active: status.activeWeapon,
      assisted: status.assisted,
      entityTotal: status.entities.total,
    },
    {
      mode: "ready",
      distance: 12.5,
      score: 42,
      hp: 7,
      selected: "rapid",
      active: null,
      assisted: false,
      entityTotal: 0,
    }
  );
  assert.equal(Object.isFrozen(status.entities), true);
  assert.equal(Object.isFrozen(status.frame), true);
  assert.equal(status.runtimeRunning, true);
  assert.equal(status.debugEnabled, false);
  assert.equal(status.profilerSampleCount, 0);
  assert.equal("start" in status, false);
  assert.equal("game" in status, false);

  context.GalaxyRunnerDebug.enable();
  assert.equal(context.GalaxyRunnerStatus().debugEnabled, true);

  pageListeners.get("pagehide")({ persisted: true });
  assert.equal(accessibilityDetachCount, 0, "bfcache pagehide must preserve presenters");
  assert.equal(audioDestroyCount, 0);
  pageListeners.get("pagehide")({ persisted: false });
  assert.equal(accessibilityDetachCount, 1);
  assert.equal(audioDestroyCount, 1);
});
