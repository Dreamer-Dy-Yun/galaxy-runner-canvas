// Generic target-driven interpolation state for declarative rig pose channels.

(() => {
  if (globalThis.PoseChannelState) return;

  const DEFAULT_RESPONSE = Object.freeze({
    enterDuration: 0,
    returnDuration: 0,
    reverseDuration: 0,
    easing: "linear",
  });

  function duration(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`${label} must be a finite non-negative number`);
    }
    return value;
  }

  function normalizeResponse(motion, channel) {
    const input = motion?.parameters?.response ?? {};
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError(`Pose channel ${channel} response must be an object`);
    }
    const easing = input.easing ?? DEFAULT_RESPONSE.easing;
    if (!globalThis.RigAnimationTimeline.supportsEasing(easing)) {
      throw new TypeError(`Pose channel ${channel} has unknown easing: ${easing}`);
    }
    return Object.freeze({
      enterDuration: duration(
        input.enterDuration ?? DEFAULT_RESPONSE.enterDuration,
        `Pose channel ${channel} enterDuration`
      ),
      returnDuration: duration(
        input.returnDuration ?? DEFAULT_RESPONSE.returnDuration,
        `Pose channel ${channel} returnDuration`
      ),
      reverseDuration: duration(
        input.reverseDuration ?? input.enterDuration ?? DEFAULT_RESPONSE.reverseDuration,
        `Pose channel ${channel} reverseDuration`
      ),
      easing,
    });
  }

  function state(channel, motion, current = 0) {
    return {
      channel,
      response: normalizeResponse(motion, channel),
      current,
      start: current,
      target: current,
      elapsed: 0,
      duration: 0,
    };
  }

  class PoseChannelState {
    constructor() {
      if (typeof globalThis.RigAnimationTimeline !== "function") {
        throw new Error("PoseChannelState requires RigAnimationTimeline");
      }
      this.paused = false;
      this.reducedMotion = false;
      this.channels = new Map();
    }

    reset(motions = {}) {
      this.paused = false;
      this.channels = new Map(Object.entries(motions).map(
        ([channel, motion]) => [channel, state(channel, motion)]
      ));
      return this.snapshot();
    }

    configure(motions = {}) {
      const previous = this.channels;
      this.channels = new Map(Object.entries(motions).map(([channel, motion]) => {
        const current = previous.get(channel)?.current ?? 0;
        const next = state(channel, motion, current);
        next.target = previous.get(channel)?.target ?? current;
        next.start = current;
        return [channel, next];
      }));
      return this.snapshot();
    }

    setTarget(channel, value) {
      const item = this.channels.get(channel);
      if (!item) throw new TypeError(`Unknown rig pose channel: ${channel}`);
      if (!Number.isFinite(value)) throw new TypeError("Rig pose value must be finite");
      if (value === item.target) return false;

      const reversing = item.current !== 0 && value !== 0
        && Math.sign(item.current) !== Math.sign(value);
      const key = reversing ? "reverseDuration"
        : value === 0 ? "returnDuration" : "enterDuration";
      item.start = item.current;
      item.target = value;
      item.elapsed = 0;
      item.duration = this.reducedMotion ? 0 : item.response[key];
      if (item.duration === 0) item.current = value;
      return true;
    }

    setPaused(paused) {
      this.paused = Boolean(paused);
      return this.snapshot();
    }

    setReducedMotion(reduced) {
      this.reducedMotion = Boolean(reduced);
      if (this.reducedMotion) {
        for (const item of this.channels.values()) {
          item.current = item.target;
          item.start = item.target;
          item.elapsed = item.duration;
        }
      }
      return this.snapshot();
    }

    update(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
        throw new TypeError("PoseChannelState.update requires a finite non-negative deltaSeconds");
      }
      if (this.paused || deltaSeconds === 0) return false;
      let changed = false;
      for (const item of this.channels.values()) {
        if (item.current === item.target) continue;
        item.elapsed = Math.min(item.duration, item.elapsed + deltaSeconds);
        const progress = item.duration === 0 ? 1 : item.elapsed / item.duration;
        const eased = globalThis.RigAnimationTimeline.ease(item.response.easing, progress);
        item.current = item.start + ((item.target - item.start) * eased);
        if (progress === 1) item.current = item.target;
        changed = true;
      }
      return changed;
    }

    entries() {
      return Object.freeze([...this.channels].map(
        ([channel, item]) => Object.freeze([channel, item.current])
      ));
    }

    snapshot() {
      return Object.freeze(Object.fromEntries([...this.channels].map(([channel, item]) => [
        channel,
        Object.freeze({ current: item.current, target: item.target }),
      ])));
    }
  }

  globalThis.PoseChannelState = PoseChannelState;
})();
