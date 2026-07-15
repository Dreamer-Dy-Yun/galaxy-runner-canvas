// Galaxy Runner - engine debug overlay
// Disabled-by-default frame observer for FPS, entity count, and scene state.

(() => {
  if (globalThis.DebugOverlay) return;

  class DebugOverlay {
    constructor({
      enabled = false,
      runtime = null,
      sceneManager = null,
      surface = null,
      getWorld = null,
      profiler = null,
    } = {}) {
      this.enabled = enabled === true;
      this.runtime = runtime;
      this.sceneManager = sceneManager;
      this.surface = surface;
      this.getWorld = getWorld;
      this.profiler = profiler;
      this.fps = 0;
      this.latestSnapshot = null;
      this.latestFrameState = null;
      this.unsubscribe = null;
    }

    attach(runtime = this.runtime) {
      if (!runtime || typeof runtime.subscribe !== "function") {
        throw new TypeError("DebugOverlay.attach requires an observable EngineRuntime");
      }
      if (this.runtime === runtime && this.unsubscribe) return this;
      if (this.unsubscribe) this.detach();

      this.runtime = runtime;
      this.unsubscribe = runtime.subscribe(this);
      return this;
    }

    detach() {
      if (this.unsubscribe) this.unsubscribe();
      this.unsubscribe = null;
      this.runtime = null;
      return this;
    }

    enable() {
      this.enabled = true;
      return this;
    }

    disable() {
      this.enabled = false;
      return this;
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    afterFrame(event = {}) {
      const frameState = event.frameState || {};
      const runtime = event.runtime || this.runtime;
      this.latestFrameState = frameState;
      if (!this.enabled) return;

      this.latestSnapshot = this.snapshot(frameState, runtime);
      this.draw();
    }

    snapshot(frameState = {}, runtime = this.runtime) {
      const deltaSeconds = Number.isFinite(frameState.deltaSeconds) ? frameState.deltaSeconds : 0;
      const instantFps = deltaSeconds > 0 ? 1 / deltaSeconds : 0;
      this.fps = this.fps > 0 && instantFps > 0 ? this.fps * 0.88 + instantFps * 0.12 : instantFps;

      const scene = this.resolveScene();
      const entityCounts = this.countEntities(this.resolveWorld(scene));
      return Object.freeze({
        fps: this.fps,
        deltaMs: deltaSeconds * 1000,
        running: runtime?.running === true,
        sceneName: this.sceneManager?.currentName || scene?.name || "none",
        sceneState: DebugOverlay.sceneStateLabel(scene),
        entityTotal: entityCounts.total,
        profiler: this.readProfilerSnapshot(),
      });
    }

    draw(ctx = this.resolveContext()) {
      if (!ctx || !this.latestSnapshot) return;

      const rows = [
        `FPS ${this.latestSnapshot.fps.toFixed(1)}`,
        `dt ${this.latestSnapshot.deltaMs.toFixed(2)}ms`,
        `entities ${this.latestSnapshot.entityTotal}`,
        `scene ${this.latestSnapshot.sceneName}`,
        `state ${this.latestSnapshot.sceneState}`,
        ...this.profilerRows(this.latestSnapshot.profiler),
      ];
      const rect = {
        x: 10,
        y: 10,
        width: this.latestSnapshot.profiler ? 296 : 172,
        height: 12 + rows.length * 16,
      };
      const helper = globalThis.RenderHelpers;

      if (helper && typeof helper.fillPanel === "function" && typeof helper.fillTextRows === "function") {
        helper.fillPanel(ctx, rect);
        helper.fillTextRows(ctx, rows, rect.x + 10, rect.y + 10);
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(4, 10, 24, 0.78)";
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.fillStyle = "rgba(226, 248, 255, 0.95)";
      ctx.font = "12px Consolas, monospace";
      ctx.textBaseline = "top";
      for (let index = 0; index < rows.length; index += 1) {
        ctx.fillText(rows[index], rect.x + 10, rect.y + 10 + index * 16);
      }
      ctx.restore();
    }

    readProfilerSnapshot() {
      if (!this.profiler || typeof this.profiler.snapshot !== "function") return null;
      return this.profiler.snapshot();
    }

    profilerRows(snapshot) {
      if (!snapshot) return [];
      return [
        DebugOverlay.formatMetric("frame", snapshot.frame),
        DebugOverlay.formatMetric("update", snapshot.update),
        DebugOverlay.formatMetric("draw", snapshot.draw),
        `startup spikes ${snapshot.spikes?.length || 0}`,
      ];
    }

    resolveContext() {
      return this.surface?.context || this.runtime?.surface?.context || null;
    }

    resolveScene() {
      if (this.sceneManager && typeof this.sceneManager.activeScene === "function") {
        return this.sceneManager.activeScene();
      }
      return this.sceneManager?.currentScene || this.runtime?.scene || null;
    }

    resolveWorld(scene = this.resolveScene()) {
      if (typeof this.getWorld === "function") return this.getWorld();
      return scene?.world || null;
    }

    countEntities(world) {
      if (!world?.groups || typeof world.groups.forEach !== "function") return { total: 0 };

      let total = 0;
      world.groups.forEach((store) => {
        total += DebugOverlay.storeLength(store);
      });
      return { total };
    }

    static storeLength(store) {
      if (Number.isFinite(store?.length)) return store.length;
      if (Array.isArray(store?.items)) return store.items.length;
      if (Array.isArray(store)) return store.length;
      return 0;
    }

    static sceneStateLabel(scene) {
      if (!scene) return "none";
      if (typeof scene.state?.mode === "string") return scene.state.mode;
      if (scene.paused) return "paused";
      if (scene.active) return "active";
      return "ready";
    }

    static formatMetric(label, metric = {}) {
      const avg = Number.isFinite(metric.avg) ? metric.avg : 0;
      const p95 = Number.isFinite(metric.p95) ? metric.p95 : 0;
      const max = Number.isFinite(metric.max) ? metric.max : 0;
      return `${label} avg ${avg.toFixed(1)} p95 ${p95.toFixed(1)} max ${max.toFixed(1)}ms`;
    }

    static readEnabledFlag({ queryParam = "debug", storageKey = "" } = {}) {
      try {
        const search = globalThis.location?.search || "";
        const value = queryParam && search ? new URLSearchParams(search).get(queryParam) : null;
        if (value !== null) return value !== "0" && value !== "false";
      } catch {
        return false;
      }

      try {
        if (!storageKey || !globalThis.localStorage) return false;
        const value = globalThis.localStorage.getItem(storageKey);
        return value === "1" || value === "true";
      } catch {
        return false;
      }
    }
  }

  globalThis.DebugOverlay = DebugOverlay;
})();
