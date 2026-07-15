// Galaxy Runner - semantic gameplay feedback state
// Owns immutable feedback events and transient selection without rendering, DOM, or audio work.

(() => {
  const EVENT_CONFIG = Object.freeze({
    "special.used": Object.freeze({ durationSeconds: 0.9, priority: 3 }),
    "special.failed": Object.freeze({ durationSeconds: 1.25, priority: 4 }),
    "item.collected": Object.freeze({ durationSeconds: 1.35, priority: 3 }),
    "player.hit": Object.freeze({ durationSeconds: 0.55, priority: 2 }),
    "enemy.destroyed": Object.freeze({ durationSeconds: 0.3, priority: 1 }),
    "boss.spawned": Object.freeze({ durationSeconds: 1.8, priority: 5 }),
  });
  const EVENT_TYPES = Object.freeze(Object.keys(EVENT_CONFIG));
  const EVENT_TYPE_SET = new Set(EVENT_TYPES);

  function positiveNumber(value, fallback) {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function immutableCopy(value, seen = new WeakMap()) {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) throw new TypeError("Feedback details must not contain circular references");

    const copy = Array.isArray(value) ? [] : {};
    seen.set(value, copy);
    for (const key of Object.keys(value)) {
      copy[key] = immutableCopy(value[key], seen);
    }
    return Object.freeze(copy);
  }

  class GameFeedbackSystem {
    constructor(options = {}) {
      this.eventConfig = options.eventConfig || EVENT_CONFIG;
      this.onSubscriberError = typeof options.onSubscriberError === "function" ? options.onSubscriberError : null;
      this.listeners = new Set();
      this.activeEntry = null;
      this.nextId = 1;
    }

    emit(type, details = {}) {
      if (!EVENT_TYPE_SET.has(type)) {
        throw new RangeError(`Unsupported feedback event type: ${String(type)}`);
      }
      if (details === null || typeof details !== "object" || Array.isArray(details)) {
        throw new TypeError("Feedback event details must be an object");
      }

      const defaults = EVENT_CONFIG[type];
      const configured = this.eventConfig?.[type] || defaults;
      const durationSeconds = positiveNumber(configured?.durationSeconds, defaults.durationSeconds);
      const priority = positiveNumber(configured?.priority, defaults.priority);
      const event = Object.freeze({
        id: this.nextId,
        type,
        details: immutableCopy(details),
        durationSeconds,
        priority,
      });
      this.nextId += 1;

      if (!this.activeEntry || priority >= this.activeEntry.event.priority) {
        this.activeEntry = { event, remainingSeconds: durationSeconds };
      }
      this.notify(event);
      return event;
    }

    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("GameFeedbackSystem.subscribe requires a function");
      }
      if (this.listeners.has(listener)) return () => false;

      this.listeners.add(listener);
      let active = true;
      return () => {
        if (!active) return false;
        active = false;
        return this.listeners.delete(listener);
      };
    }

    update(dt) {
      if (!this.activeEntry || !Number.isFinite(dt) || dt <= 0) return this.current();

      this.activeEntry.remainingSeconds = Math.max(0, this.activeEntry.remainingSeconds - dt);
      if (this.activeEntry.remainingSeconds <= 0) this.activeEntry = null;
      return this.current();
    }

    current() {
      if (!this.activeEntry) return null;
      return Object.freeze({
        ...this.activeEntry.event,
        remainingSeconds: this.activeEntry.remainingSeconds,
      });
    }

    clear() {
      const hadActiveEvent = this.activeEntry !== null;
      this.activeEntry = null;
      return hadActiveEvent;
    }

    notify(event) {
      for (const listener of Array.from(this.listeners)) {
        try {
          listener(event);
        } catch (error) {
          this.reportSubscriberError(error, event);
        }
      }
    }

    reportSubscriberError(error, event) {
      if (this.onSubscriberError) {
        try {
          this.onSubscriberError(error, event);
          return;
        } catch (reportError) {
          if (typeof console !== "undefined" && console.error) console.error(reportError);
        }
      }
      if (typeof console !== "undefined" && console.error) {
        console.error("[Galaxy Runner] Feedback subscriber failed.", error);
      }
    }

    static supportedTypes() {
      return EVENT_TYPES;
    }

    static isSupportedType(type) {
      return EVENT_TYPE_SET.has(type);
    }
  }

  globalThis.GameFeedbackSystem = GameFeedbackSystem;
})();
