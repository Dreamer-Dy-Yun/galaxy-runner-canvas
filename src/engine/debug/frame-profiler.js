// Galaxy Runner - frame profiler
// Records runtime observer durations without mutating runtime, scenes, or Canvas.

(() => {
  if (globalThis.FrameProfiler) return;

  class FrameProfiler {
    constructor({
      sampleSize = 120,
      spikeThresholdMs = 24,
      startupWindowMs = 5000,
      maxSpikes = 20,
      enabled = true,
      now = () => globalThis.performance?.now?.() ?? Date.now(),
    } = {}) {
      this.sampleSize = Math.max(1, Math.floor(sampleSize));
      this.spikeThresholdMs = Math.max(0, spikeThresholdMs);
      this.startupWindowMs = Math.max(0, startupWindowMs);
      this.maxSpikes = Math.max(0, Math.floor(maxSpikes));
      this.enabled = enabled === true;
      this.now = now;
      this.samples = [];
      this.spikes = [];
      this.startedAt = 0;
      this.current = null;
      this.runtime = null;
      this.unsubscribe = null;
    }

    attach({ runtime } = {}) {
      if (!runtime || typeof runtime.subscribe !== "function") {
        throw new TypeError("FrameProfiler.attach requires an observable EngineRuntime");
      }
      if (this.runtime === runtime && this.unsubscribe) return this;
      if (this.unsubscribe) this.detach();

      this.runtime = runtime;
      this.startedAt = this.now();
      this.unsubscribe = runtime.subscribe(this);
      return this;
    }

    detach() {
      if (this.unsubscribe) this.unsubscribe();
      this.unsubscribe = null;
      this.runtime = null;
      this.current = null;
      return this;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      this.current = null;
      return this;
    }

    beforeFrame() {
      if (!this.enabled) return;
      this.current = { frameMs: 0, updateMs: 0, drawMs: 0 };
    }

    afterUpdate(event) {
      if (!this.enabled || !this.current) return;
      this.current.updateMs = FrameProfiler.duration(event);
    }

    afterDraw(event) {
      if (!this.enabled || !this.current) return;
      this.current.drawMs = FrameProfiler.duration(event);
    }

    afterFrame(event) {
      if (!this.enabled || !this.current) return;

      this.current.frameMs = FrameProfiler.duration(event);
      this.record(this.current);
      this.current = null;
    }

    record(sample) {
      const recorded = Object.freeze({
        frameMs: FrameProfiler.duration({ durationMs: sample.frameMs }),
        updateMs: FrameProfiler.duration({ durationMs: sample.updateMs }),
        drawMs: FrameProfiler.duration({ durationMs: sample.drawMs }),
      });
      this.samples.push(recorded);
      if (this.samples.length > this.sampleSize) this.samples.shift();

      const sinceStart = Math.max(0, this.now() - this.startedAt);
      if (recorded.frameMs >= this.spikeThresholdMs && sinceStart <= this.startupWindowMs) {
        this.spikes.push(Object.freeze({
          atMs: Math.round(sinceStart),
          frameMs: recorded.frameMs,
          updateMs: recorded.updateMs,
          drawMs: recorded.drawMs,
        }));
        if (this.spikes.length > this.maxSpikes) this.spikes.shift();
      }
    }

    metric(name) {
      const values = this.samples.map((sample) => sample[name]).filter(Number.isFinite);
      if (values.length === 0) return Object.freeze({ avg: 0, max: 0, p95: 0 });

      const sorted = [...values].sort((left, right) => left - right);
      const sum = values.reduce((total, value) => total + value, 0);
      const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
      return Object.freeze({
        avg: sum / values.length,
        max: sorted[sorted.length - 1],
        p95: sorted[p95Index],
      });
    }

    snapshot() {
      return Object.freeze({
        frame: this.metric("frameMs"),
        update: this.metric("updateMs"),
        draw: this.metric("drawMs"),
        spikes: Object.freeze([...this.spikes]),
        sampleCount: this.samples.length,
      });
    }

    static duration(event) {
      return Number.isFinite(event?.durationMs) ? Math.max(0, event.durationMs) : 0;
    }
  }

  globalThis.FrameProfiler = FrameProfiler;
})();
