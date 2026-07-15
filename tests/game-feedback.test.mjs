import assert from "node:assert/strict";
import test from "node:test";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

const feedbackScripts = [
  "src/systems/game-feedback-system.js",
  "src/ui/game-feedback-messages.js",
  "src/ui/game-feedback.js",
  "src/ui/game-accessibility.js",
];

async function loadFeedback() {
  return loadClassicScripts(feedbackScripts);
}

function createCanvasContext() {
  const calls = [];
  return {
    calls,
    globalAlpha: 1,
    save() { calls.push(["save"]); },
    restore() { calls.push(["restore"]); },
    beginPath() { calls.push(["beginPath"]); },
    roundRect(...args) { calls.push(["roundRect", ...args]); },
    rect(...args) { calls.push(["rect", ...args]); },
    fill() { calls.push(["fill"]); },
    stroke() { calls.push(["stroke"]); },
    fillText(...args) { calls.push(["fillText", ...args]); },
    measureText(message) { return { width: message.length * 8 }; },
  };
}

function createLiveRegion() {
  const attributes = new Map();
  return {
    attributes,
    textContent: "",
    setAttribute(name, value) { attributes.set(name, value); },
  };
}

test("semantic feedback events are immutable, observable, prioritized, and transient", async () => {
  const context = await loadFeedback();
  const subscriberErrors = [];
  const feedback = new context.GameFeedbackSystem({
    onSubscriberError(error, event) { subscriberErrors.push([error.message, event.type]); },
  });
  const received = [];
  const listener = (event) => received.push(event);
  const unsubscribe = feedback.subscribe(listener);
  const duplicateUnsubscribe = feedback.subscribe(listener);
  feedback.subscribe(() => { throw new Error("observer failed"); });

  const sourceDetails = { reason: "insufficient-meter", required: 25, meta: { levels: [1, 2] } };
  const failed = feedback.emit("special.failed", sourceDetails);
  sourceDetails.meta.levels[0] = 99;

  assert.equal(Object.isFrozen(failed), true);
  assert.equal(Object.isFrozen(failed.details), true);
  assert.equal(Object.isFrozen(failed.details.meta), true);
  assert.equal(Object.isFrozen(failed.details.meta.levels), true);
  assert.equal(failed.details.meta.levels[0], 1, "event details must not retain caller-owned mutation");
  assert.equal(received.length, 1, "duplicate subscription must not duplicate delivery");
  assert.deepEqual(subscriberErrors, [["observer failed", "special.failed"]]);

  const lowPriority = feedback.emit("enemy.destroyed", { role: "normal" });
  assert.equal(received.length, 2, "all semantic events must still reach subscribers");
  assert.equal(feedback.current().id, failed.id, "low-priority kill must not replace a failure toast");
  assert.equal(Object.isFrozen(feedback.current()), true);
  assert.equal(lowPriority.type, "enemy.destroyed");

  feedback.update(failed.durationSeconds - 0.01);
  assert.ok(feedback.current().remainingSeconds > 0);
  feedback.update(0.02);
  assert.equal(feedback.current(), null);
  assert.equal(feedback.clear(), false);
  assert.equal(unsubscribe(), true);
  assert.equal(unsubscribe(), false);
  assert.equal(duplicateUnsubscribe(), false);
  assert.throws(() => feedback.emit("unknown.event", {}), /Unsupported feedback event type/);
  assert.throws(() => feedback.emit("special.used", null), /details must be an object/);
});

test("Korean copy and Canvas toast stay outside semantic state", async () => {
  const context = await loadFeedback();
  const feedback = new context.GameFeedbackSystem();
  const view = new context.GameFeedback({ messages: context.GameFeedbackMessages });
  const canvas = createCanvasContext();

  feedback.emit("item.collected", { kind: "repair", outcome: "score", amount: 250 });
  assert.equal(context.GameFeedbackMessages.text(feedback.current()), "HP 최대 · 점수 +250");
  assert.equal(view.draw(canvas, feedback, { width: 960 }), true);
  assert.ok(canvas.calls.some((call) => call[0] === "fillText" && call[1] === "HP 최대 · 점수 +250"));

  feedback.clear();
  feedback.emit("enemy.destroyed", { role: "normal" });
  assert.equal(context.GameFeedbackMessages.text(feedback.current()), "");
  assert.equal(view.draw(canvas, feedback, { width: 960 }), false, "ordinary kills should not create toast noise");

  assert.equal(
    context.GameFeedbackMessages.text({ type: "special.failed", details: { reason: "nova-cap", active: 5, maximum: 5 } }),
    "Nova 지뢰 한도 · 5/5"
  );
  assert.equal(
    context.GameFeedbackMessages.text({ type: "boss.spawned", details: { stage: 2 } }),
    "스테이지 2 보스 접근"
  );
});

test("aria-live presenter announces Korean feedback and detaches cleanly", async () => {
  const context = await loadFeedback();
  const feedback = new context.GameFeedbackSystem();
  const liveRegion = createLiveRegion();
  const accessibility = new context.GameAccessibility({
    liveRegion,
    messages: context.GameFeedbackMessages,
  }).attach(feedback);

  assert.equal(liveRegion.attributes.get("role"), "status");
  assert.equal(liveRegion.attributes.get("aria-live"), "polite");
  assert.equal(liveRegion.attributes.get("aria-atomic"), "true");

  feedback.emit("special.failed", { reason: "no-weapon" });
  assert.equal(liveRegion.textContent, "특수기 잠김 · 무기를 먼저 획득하세요");
  feedback.emit("enemy.destroyed", { role: "normal" });
  assert.equal(liveRegion.textContent, "특수기 잠김 · 무기를 먼저 획득하세요");

  accessibility.detach();
  feedback.emit("boss.spawned", { stage: 3 });
  assert.equal(liveRegion.textContent, "특수기 잠김 · 무기를 먼저 획득하세요");
  assert.equal(accessibility.clear(), true);
  assert.equal(liveRegion.textContent, "");
});
