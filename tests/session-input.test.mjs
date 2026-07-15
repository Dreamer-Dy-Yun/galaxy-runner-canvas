import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts, readClassicBinding } from "./helpers/load-classic-scripts.mjs";

const sessionScripts = [
  "src/core/constants.js",
  "src/gameplay/weapon-definition.js",
  "src/gameplay/weapon-catalog.js",
  "src/gameplay/weapon-definitions.js",
  "src/gameplay/run-rules.js",
  "src/gameplay/game-config.js",
  "src/systems/game-session-system.js",
  "src/engine/game.js",
];

const inputScripts = [
  "src/core/constants.js",
  "src/gameplay/game-config.js",
  "src/engine/input/action-map.js",
  "src/engine/input/input-state.js",
  "src/engine/input.js",
];

function createEventTarget(properties = {}) {
  const listeners = new Map();
  return {
    ...properties,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    emit(type, values = {}) {
      const event = {
        type,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        ...values,
      };
      for (const listener of [...(listeners.get(type) || [])]) listener(event);
      return event;
    },
    listenerCount(type) {
      return listeners.get(type)?.size || 0;
    },
  };
}

async function createInputHarness() {
  const context = await loadClassicScripts(inputScripts);
  const InputController = readClassicBinding(context, "InputController");
  const actions = [];
  const keyTarget = createEventTarget();
  const visibilityTarget = createEventTarget({ hidden: false, visibilityState: "visible" });
  const canvas = createEventTarget({ focus() {} });
  const restartButton = createEventTarget();
  const target = {
    handleAction(action) {
      actions.push({ name: action.name, phase: action.phase, code: action.code });
      return true;
    },
  };
  const controller = new InputController({ canvas }, restartButton, {
    target,
    keyTarget,
    visibilityTarget,
  });
  return { actions, canvas, controller, keyTarget, restartButton, visibilityTarget };
}

function createSessionGame(Game) {
  const clearedGroups = [];
  const weaponLevels = { rapid: 0, energy: 0, spread: 0, nova: 0 };
  const player = {
    continueCount: 0,
    resetCount: 0,
    upgradeMarker: 0,
    reset() {
      this.resetCount += 1;
      for (const kind of Object.keys(weaponLevels)) weaponLevels[kind] = 0;
    },
    equipWeapon(kind) {
      for (const weaponKind of Object.keys(weaponLevels)) weaponLevels[weaponKind] = 0;
      weaponLevels[kind] = 1;
      return true;
    },
    continue() { this.continueCount += 1; },
  };
  const game = Object.create(Game.prototype);
  game.state = { startingWeaponKind: "rapid" };
  game.player = player;
  game.feedback = { clear() {} };
  game.projectileCollisionContext = { energyAbsorbers: [], novaMines: [] };
  game.world = { clearGroup(group) { clearedGroups.push(group); } };
  game.resetEntityGroups = () => {};
  game.infoPanelOpen = false;
  game.reset();
  return { clearedGroups, game, player, weaponLevels };
}

async function loadSession() {
  const context = await loadClassicScripts(sessionScripts);
  context.EntityGroups = Object.freeze({
    friendlyProjectiles: "friendlyProjectiles",
    hostileProjectiles: "hostileProjectiles",
    actors: "actors",
    effects: "effects",
    particles: "particles",
  });
  return { context, Game: readClassicBinding(context, "Game") };
}

test("input dispatches Space once in start-then-fire order and clears transients", async () => {
  const { actions, controller, keyTarget } = await createInputHarness();
  const firstDown = keyTarget.emit("keydown", { code: "Space" });

  assert.equal(firstDown.defaultPrevented, true);
  assert.deepEqual(actions.map((action) => action.name), ["start", "fire"]);
  assert.equal(controller.wasPressed("start"), true);
  assert.equal(controller.wasPressed("fire"), true);

  keyTarget.emit("keydown", { code: "Space", repeat: true });
  assert.deepEqual(actions.map((action) => action.name), ["start", "fire"]);
  controller.endFrame();
  assert.equal(controller.wasPressed("start"), false);

  keyTarget.emit("keyup", { code: "Space" });
  assert.equal(controller.wasReleased("start"), true);
  controller.endFrame();
  assert.equal(controller.wasReleased("start"), false);

  keyTarget.emit("keydown", { code: "Space" });
  assert.deepEqual(actions.map((action) => action.name), ["start", "fire", "start", "fire"]);
});

test("action map exposes movement and numeric loadout actions", async () => {
  const { actions, keyTarget } = await createInputHarness();
  const cases = [
    ["ArrowLeft", "moveLeft"],
    ["KeyD", "moveRight"],
    ["Digit1", "selectWeapon1"],
    ["Digit2", "selectWeapon2"],
    ["Digit3", "selectWeapon3"],
    ["Digit4", "selectWeapon4"],
  ];

  for (const [code, expectedAction] of cases) {
    keyTarget.emit("keydown", { code });
    keyTarget.emit("keyup", { code });
    assert.equal(actions.at(-1).name, expectedAction);
  }
});

test("blur, hidden visibility, and destroy reset held input and detach listeners", async () => {
  const harness = await createInputHarness();
  const { actions, canvas, controller, keyTarget, restartButton, visibilityTarget } = harness;

  assert.equal(controller.resetVersion(), 0);
  keyTarget.emit("keydown", { code: "KeyA" });
  assert.equal(controller.isDown("moveLeft"), true);
  keyTarget.emit("blur");
  assert.equal(controller.isDown("moveLeft"), false);
  assert.equal(controller.resetVersion(), 1);
  keyTarget.emit("keydown", { code: "KeyA" });
  assert.equal(actions.filter((action) => action.name === "moveLeft").length, 2);

  keyTarget.emit("keydown", { code: "KeyD" });
  visibilityTarget.hidden = true;
  visibilityTarget.visibilityState = "hidden";
  visibilityTarget.emit("visibilitychange");
  assert.equal(controller.isDown("moveRight"), false);
  assert.equal(controller.resetVersion(), 2);

  controller.destroy();
  assert.equal(controller.resetVersion(), 3);
  assert.equal(keyTarget.listenerCount("keydown"), 0);
  assert.equal(keyTarget.listenerCount("keyup"), 0);
  assert.equal(keyTarget.listenerCount("blur"), 0);
  assert.equal(visibilityTarget.listenerCount("visibilitychange"), 0);
  assert.equal(restartButton.listenerCount("click"), 0);
  assert.equal(canvas.listenerCount("click"), 0);
  const actionCount = actions.length;
  keyTarget.emit("keydown", { code: "Space" });
  assert.equal(actions.length, actionCount);
});

test("ready selection starts only the chosen weapon and Restart returns to ready", async () => {
  const { Game } = await loadSession();
  const { game, player, weaponLevels } = createSessionGame(Game);

  assert.equal(game.state.startingWeaponKind, "rapid");
  assert.equal(game.handleAction({ name: "moveRight", phase: "pressed" }), true);
  assert.equal(game.state.startingWeaponKind, "energy");
  assert.equal(game.handleAction({ name: "selectWeapon4", phase: "pressed" }), true);
  assert.equal(game.state.startingWeaponKind, "nova");

  game.handleAction({ name: "start", phase: "pressed" });
  assert.equal(game.state.mode, "running");
  assert.deepEqual(weaponLevels, { rapid: 0, energy: 0, spread: 0, nova: 1 });
  assert.equal(game.handleAction({ name: "moveLeft", phase: "pressed" }), false);
  assert.equal(game.state.startingWeaponKind, "nova");

  game.handleAction({ name: "restart", phase: "pressed" });
  assert.equal(game.state.mode, "ready");
  assert.equal(game.state.startingWeaponKind, "nova");
  assert.deepEqual(weaponLevels, { rapid: 0, energy: 0, spread: 0, nova: 0 });
  assert.equal(player.resetCount, 2);
});

test("Continue preserves run progress and upgrades while clearing the danger field", async () => {
  const { context, Game } = await loadSession();
  const { clearedGroups, game, player } = createSessionGame(Game);
  Object.assign(game.state, {
    mode: "gameover",
    continues: 0,
    distance: 1234,
    score: 5678,
    kills: 42,
    time: 77,
    danger: 9,
    spawnTimer: 0.4,
    itemTimer: 0.3,
    startingWeaponKind: "spread",
  });
  player.upgradeMarker = 7;

  game.handleAction({ name: "start", phase: "pressed" });
  assert.equal(game.state.mode, "running");
  assert.equal(game.state.continues, 1);
  assert.deepEqual(
    [game.state.distance, game.state.score, game.state.kills, game.state.time, game.state.danger],
    [1234, 5678, 42, 77, 9]
  );
  assert.equal(game.state.startingWeaponKind, "spread");
  assert.equal(game.state.spawnTimer, -1.2);
  assert.equal(game.state.itemTimer, -1.2);
  assert.equal(player.upgradeMarker, 7);
  assert.equal(player.continueCount, 1);
  assert.equal(context.RunRules.isAssisted(game.state), true);
  assert.deepEqual(clearedGroups, [
    "friendlyProjectiles", "hostileProjectiles", "actors", "effects", "particles",
  ]);

  game.state.mode = "gameover";
  game.handleAction({ name: "start", phase: "pressed" });
  assert.equal(game.state.continues, 2);
  assert.equal(player.continueCount, 2);
});

test("pause changes only running and paused modes and ignores released actions", async () => {
  const { Game } = await loadSession();
  const { game } = createSessionGame(Game);

  game.handleAction({ name: "pause", phase: "pressed" });
  assert.equal(game.state.mode, "ready");
  game.state.mode = "running";
  game.handleAction({ name: "pause", phase: "released" });
  assert.equal(game.state.mode, "running");
  game.handleAction({ name: "pause", phase: "pressed" });
  assert.equal(game.state.mode, "paused");
  game.handleAction({ name: "pause", phase: "pressed" });
  assert.equal(game.state.mode, "running");
  game.state.mode = "gameover";
  game.handleAction({ name: "pause", phase: "pressed" });
  assert.equal(game.state.mode, "gameover");
});
