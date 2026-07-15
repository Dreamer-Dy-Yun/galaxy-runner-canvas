import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

async function loadAudio() {
  return loadClassicScripts(["src/audio/game-audio.js"]);
}

function createEventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event = {}) {
      for (const listener of Array.from(listeners.get(type) || [])) listener(event);
    },
  };
}

function createButton() {
  const target = createEventTarget();
  const attributes = new Map();
  return {
    ...target,
    attributes,
    dataset: {},
    textContent: "",
    setAttribute(name, value) { attributes.set(name, value); },
  };
}

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
  };
}

function createFeedbackSource() {
  const listeners = new Set();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(type, details = {}) {
      const event = Object.freeze({ type, details: Object.freeze({ ...details }) });
      for (const listener of Array.from(listeners)) listener(event);
    },
  };
}

function createAudioHarness() {
  const log = { contexts: 0, starts: [], stops: [], resumes: 0, suspends: 0, closes: 0 };
  const audioParam = () => ({
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  class FakeAudioContext {
    constructor() {
      log.contexts += 1;
      this.currentTime = 1;
      this.state = "running";
      this.destination = {};
    }
    createOscillator() {
      return {
        type: "sine",
        frequency: audioParam(),
        connect() {},
        start(value) { log.starts.push(value); },
        stop(value) { log.stops.push(value); },
      };
    }
    createGain() {
      return { gain: audioParam(), connect() {} };
    }
    resume() {
      this.state = "running";
      log.resumes += 1;
      return Promise.resolve();
    }
    suspend() {
      this.state = "suspended";
      log.suspends += 1;
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      log.closes += 1;
      return Promise.resolve();
    }
  }
  return { log, contextFactory: () => new FakeAudioContext() };
}

test("AudioContext stays lazy and repeated kill tones are throttled", async () => {
  const context = await loadAudio();
  const feedback = createFeedbackSource();
  const gestureTarget = createEventTarget();
  const harness = createAudioHarness();
  let now = 0;
  const audio = new context.GameAudio({
    contextFactory: harness.contextFactory,
    now: () => now,
    killThrottleMs: 70,
    storage: createStorage(),
  }).attach({ feedback, gestureTarget });

  assert.equal(harness.log.contexts, 0, "constructor and attach must not create AudioContext");
  feedback.emit("item.collected", { kind: "repair" });
  assert.equal(harness.log.contexts, 0, "feedback before a gesture must remain silent and lazy");

  gestureTarget.dispatch("keydown");
  assert.equal(harness.log.contexts, 1);
  feedback.emit("item.collected", { kind: "repair" });
  assert.equal(harness.log.starts.length, 1);

  feedback.emit("enemy.destroyed", { role: "normal" });
  feedback.emit("enemy.destroyed", { role: "normal" });
  assert.equal(harness.log.starts.length, 2, "second same-frame kill must be throttled");
  now = 80;
  feedback.emit("enemy.destroyed", { role: "normal" });
  assert.equal(harness.log.starts.length, 3);

  audio.detach();
  feedback.emit("special.used", { kind: "rapid" });
  assert.equal(harness.log.starts.length, 3, "detached audio must not receive gameplay feedback");
  audio.destroy();
  assert.equal(harness.log.closes, 1);
});

test("persisted mute suppresses context creation and aria-pressed follows toggles", async () => {
  const context = await loadAudio();
  const feedback = createFeedbackSource();
  const gestureTarget = createEventTarget();
  const muteButton = createButton();
  const storage = createStorage({ "galaxyRunner.audioMuted": "true" });
  const harness = createAudioHarness();
  const audio = new context.GameAudio({
    contextFactory: harness.contextFactory,
    storage,
  }).attach({ feedback, gestureTarget, muteButton });

  assert.equal(audio.isMuted(), true);
  assert.equal(muteButton.attributes.get("aria-pressed"), "true");
  assert.equal(muteButton.attributes.get("aria-label"), "게임 소리 켜기");
  assert.equal(muteButton.textContent, "소리 끔");
  assert.equal(muteButton.dataset.audioMuted, "true");
  gestureTarget.dispatch("pointerdown");
  assert.equal(harness.log.contexts, 0, "muted gesture must not allocate AudioContext");

  muteButton.dispatch("click");
  assert.equal(audio.isMuted(), false);
  assert.equal(harness.log.contexts, 1, "unmuting after a gesture may create the context");
  assert.equal(storage.values.get("galaxyRunner.audioMuted"), "false");
  assert.equal(muteButton.attributes.get("aria-pressed"), "false");
  assert.equal(muteButton.attributes.get("aria-label"), "게임 소리 끄기");
  assert.equal(muteButton.textContent, "소리 켬");
  feedback.emit("special.used", { kind: "energy" });
  assert.equal(harness.log.starts.length, 1);

  muteButton.dispatch("click");
  assert.equal(audio.isMuted(), true);
  assert.equal(storage.values.get("galaxyRunner.audioMuted"), "true");
  assert.equal(muteButton.attributes.get("aria-pressed"), "true");
  assert.equal(harness.log.suspends, 1);
  feedback.emit("boss.spawned", { stage: 1 });
  assert.equal(harness.log.starts.length, 1, "muted audio must not schedule tones");

  const snapshot = audio.snapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(snapshot.muted, true);
  assert.equal(snapshot.unlocked, true);
  assert.equal(snapshot.gestureSeen, true);
});
