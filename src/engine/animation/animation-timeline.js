// Generic deterministic phase timeline for rig and sprite animation.

(() => {
  if (globalThis.RigAnimationTimeline) return;

  const EASINGS = Object.freeze({
    linear: (value) => value,
    easeIn: (value) => value * value,
    easeOut: (value) => 1 - ((1 - value) * (1 - value)),
    easeInOut: (value) => (
      value < 0.5
        ? 2 * value * value
        : 1 - ((-2 * value + 2) ** 2) / 2
    ),
  });

  function requireDuration(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`${label} must be a finite number greater than or equal to zero`);
    }
    return value;
  }

  function normalizePhases(phases) {
    if (!Array.isArray(phases) || phases.length === 0) {
      throw new TypeError("RigAnimationTimeline requires at least one phase");
    }

    const ids = new Set();
    return Object.freeze(phases.map((phase, index) => {
      if (!phase || typeof phase !== "object") {
        throw new TypeError(`RigAnimationTimeline phase ${index} must be an object`);
      }
      const id = typeof phase.id === "string" ? phase.id.trim() : "";
      if (!id || ids.has(id)) {
        throw new TypeError(`RigAnimationTimeline phase ${index} requires a unique id`);
      }
      ids.add(id);

      const easing = phase.easing ?? "linear";
      if (!Object.hasOwn(EASINGS, easing)) {
        throw new TypeError(`RigAnimationTimeline phase ${id} has unknown easing: ${easing}`);
      }
      return Object.freeze({
        id,
        duration: requireDuration(phase.duration, `RigAnimationTimeline phase ${id} duration`),
        easing,
      });
    }));
  }

  function timingNumber(value, fallback, label, allowZero = true) {
    const result = value ?? fallback;
    if (!Number.isFinite(result) || result < 0 || (!allowZero && result === 0)) {
      throw new TypeError(`${label} must be a valid non-negative timing value`);
    }
    return result;
  }

  function normalizeTimingEntry(input = {}, label) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError(`${label} must be an object`);
    }
    const easing = input.easing ?? "linear";
    if (!Object.hasOwn(EASINGS, easing)) throw new TypeError(`${label} has unknown easing: ${easing}`);
    return Object.freeze({
      delay: timingNumber(input.delay, 0, `${label}.delay`),
      duration: timingNumber(input.duration, 1, `${label}.duration`, false),
      easing,
    });
  }

  class RigAnimationTimeline {
    constructor(phases) {
      this.phases = normalizePhases(phases);
      this.totalDuration = this.phases.reduce((sum, phase) => sum + phase.duration, 0);
      this.reset();
    }

    static supportsEasing(id) {
      return Object.hasOwn(EASINGS, id);
    }

    static ease(id, progress) {
      if (!RigAnimationTimeline.supportsEasing(id)) {
        throw new TypeError(`Unknown animation easing: ${id}`);
      }
      const safeProgress = Math.min(1, Math.max(0, progress));
      return EASINGS[id](safeProgress);
    }

    static normalizePartTiming(input = {}, label = "part timing") {
      const base = normalizeTimingEntry(input, label);
      const scope = input.scope ?? "transition";
      if (!new Set(["transition", "phase"]).has(scope)) {
        throw new TypeError(`${label}.scope must be transition or phase`);
      }
      const byTagInput = input.byTag ?? {};
      if (!byTagInput || typeof byTagInput !== "object" || Array.isArray(byTagInput)) {
        throw new TypeError(`${label}.byTag must be an object`);
      }
      const byTag = {};
      for (const [tag, timing] of Object.entries(byTagInput)) {
        if (!tag.trim()) throw new TypeError(`${label}.byTag keys must be non-empty`);
        byTag[tag] = normalizeTimingEntry({ ...base, ...timing }, `${label}.byTag.${tag}`);
      }
      return Object.freeze({ ...base, scope, byTag: Object.freeze(byTag) });
    }

    static partProgress(part, timing, progress) {
      const tagged = part?.tags?.find((tag) => timing.byTag[tag]);
      const selected = tagged ? timing.byTag[tagged] : timing;
      const local = (progress - selected.delay) / selected.duration;
      return RigAnimationTimeline.ease(selected.easing, Math.min(1, Math.max(0, local)));
    }

    reset() {
      this.index = 0;
      this.phaseElapsed = 0;
      this.elapsed = 0;
      this.paused = false;
      this.completed = this.totalDuration === 0;
      if (this.completed) this.index = this.phases.length - 1;
      return this.snapshot();
    }

    setPaused(paused) {
      this.paused = Boolean(paused);
      return this.snapshot();
    }

    update(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
        throw new TypeError("RigAnimationTimeline.update requires a finite non-negative deltaSeconds");
      }
      if (this.paused || this.completed || deltaSeconds === 0) return this.snapshot();

      let remaining = deltaSeconds;
      while (remaining > 0 && !this.completed) {
        const phase = this.phases[this.index];
        const available = phase.duration - this.phaseElapsed;
        if (available <= 0) {
          this.advancePhase();
          continue;
        }

        const consumed = Math.min(remaining, available);
        this.phaseElapsed += consumed;
        this.elapsed = Math.min(this.totalDuration, this.elapsed + consumed);
        remaining -= consumed;
        if (this.phaseElapsed >= phase.duration) this.advancePhase();
      }
      return this.snapshot();
    }

    advancePhase() {
      if (this.index >= this.phases.length - 1) {
        this.completed = true;
        this.elapsed = this.totalDuration;
        this.phaseElapsed = this.phases[this.index].duration;
        return;
      }
      this.index += 1;
      this.phaseElapsed = 0;
    }

    settle() {
      this.index = this.phases.length - 1;
      this.phaseElapsed = this.phases[this.index].duration;
      this.elapsed = this.totalDuration;
      this.completed = true;
      return this.snapshot();
    }

    snapshot() {
      const phase = this.phases[this.index];
      const progress = this.completed
        ? 1
        : phase.duration === 0 ? 1 : this.phaseElapsed / phase.duration;
      return Object.freeze({
        phase: phase.id,
        phaseIndex: this.index,
        progress,
        easedProgress: RigAnimationTimeline.ease(phase.easing, progress),
        elapsed: this.elapsed,
        totalDuration: this.totalDuration,
        completed: this.completed,
        paused: this.paused,
      });
    }
  }

  globalThis.RigAnimationTimeline = RigAnimationTimeline;
})();
