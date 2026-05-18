// Galaxy Runner - frame profiler
// Measures runtime frame/update/draw costs without coupling scenes to debug UI.

(() => {
  if (globalThis.FrameProfiler) return;

  class FrameProfiler {
    constructor({
      sampleSize = 120,
      spikeThresholdMs = 24,
      startupWindowMs = 5000,
      maxSpikes = 20,
      enabled = true,
    } = {}) {
      this.sampleSize = sampleSize;
      this.spikeThresholdMs = spikeThresholdMs;
      this.startupWindowMs = startupWindowMs;
      this.maxSpikes = maxSpikes;
      this.enabled = enabled;
      this.samples = [];
      this.spikes = [];
      this.startedAt = 0;
      this.current = null;
      this.attached = false;
    }

    attach({ runtime, scene, surface, debugOverlay = null } = {}) {
      if (this.attached || !runtime || !scene) return;
      this.attached = true;
      this.startedAt = performance.now();

      const originalFrame = runtime.frame;
      const originalUpdate = scene.update?.bind(scene);
      const originalDraw = scene.draw?.bind(scene);

      if (originalUpdate) {
        scene.update = (...args) => {
          const start = performance.now();
          try {
            return originalUpdate(...args);
          } finally {
            this.ensureCurrent().updateMs += performance.now() - start;
          }
        };
      }

      if (originalDraw) {
        scene.draw = (...args) => {
          const start = performance.now();
          try {
            return originalDraw(...args);
          } finally {
            this.ensureCurrent().drawMs += performance.now() - start;
          }
        };
      }

      runtime.frame = (timestamp) => {
        if (!this.enabled) {
          originalFrame(timestamp);
          return;
        }

        const start = performance.now();
        this.current = { frameMs: 0, updateMs: 0, drawMs: 0 };
        try {
          originalFrame(timestamp);
          if (surface && debugOverlay?.enabled) this.drawOverlay(surface.context);
        } finally {
          this.current.frameMs = performance.now() - start;
          this.record(this.current);
          this.current = null;
        }
      };
    }

    ensureCurrent() {
      if (!this.current) this.current = { frameMs: 0, updateMs: 0, drawMs: 0 };
      return this.current;
    }

    record(sample) {
      this.samples.push({
        frameMs: sample.frameMs,
        updateMs: sample.updateMs,
        drawMs: sample.drawMs,
      });
      if (this.samples.length > this.sampleSize) this.samples.shift();

      const sinceStart = performance.now() - this.startedAt;
      if (sample.frameMs >= this.spikeThresholdMs && sinceStart <= this.startupWindowMs) {
        this.spikes.push({
          atMs: Math.round(sinceStart),
          frameMs: sample.frameMs,
          updateMs: sample.updateMs,
          drawMs: sample.drawMs,
        });
        if (this.spikes.length > this.maxSpikes) this.spikes.shift();
      }
    }

    metric(name) {
      const values = this.samples.map((sample) => sample[name]).filter((value) => Number.isFinite(value));
      if (values.length <= 0) return { avg: 0, max: 0, p95: 0 };

      const sorted = [...values].sort((left, right) => left - right);
      const sum = values.reduce((total, value) => total + value, 0);
      const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
      return {
        avg: sum / values.length,
        max: sorted[sorted.length - 1],
        p95: sorted[p95Index],
      };
    }

    snapshot() {
      return {
        frame: this.metric("frameMs"),
        update: this.metric("updateMs"),
        draw: this.metric("drawMs"),
        spikes: [...this.spikes],
        sampleCount: this.samples.length,
      };
    }

    formatMetric(label, metric) {
      return `${label} avg ${metric.avg.toFixed(1)} p95 ${metric.p95.toFixed(1)} max ${metric.max.toFixed(1)}ms`;
    }

    lines() {
      const snapshot = this.snapshot();
      return [
        this.formatMetric("Frame", snapshot.frame),
        this.formatMetric("Update", snapshot.update),
        this.formatMetric("Draw", snapshot.draw),
        `Startup spikes ${snapshot.spikes.length}`,
      ];
    }

    drawOverlay(ctx) {
      if (!ctx) return;

      const lines = this.lines();
      const x = 12;
      const y = 132;
      const width = 270;
      const lineHeight = 16;
      const height = 18 + lines.length * lineHeight;

      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = "rgba(3, 8, 18, 0.78)";
      ctx.fillRect(x - 6, y - 14, width, height);
      ctx.globalAlpha = 1;
      ctx.font = "12px monospace";
      ctx.fillStyle = "#9af8ff";
      ctx.fillText("Frame profiler", x, y);
      ctx.fillStyle = "#f8fbff";
      for (let index = 0; index < lines.length; index += 1) {
        ctx.fillText(lines[index], x, y + 18 + index * lineHeight);
      }
      ctx.restore();
    }
  }

  globalThis.FrameProfiler = FrameProfiler;
})();
