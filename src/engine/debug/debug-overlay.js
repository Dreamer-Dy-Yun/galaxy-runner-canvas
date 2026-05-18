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
    } = {}) {
      this.enabled = enabled === true;
      this.runtime = runtime;
      this.sceneManager = sceneManager;
      this.surface = surface;
      this.getWorld = getWorld;
      this.fps = 0;
      this.latestSnapshot = null;
      this.latestFrameState = null;
    }

    attach(runtime = this.runtime) {
      if (!runtime || typeof runtime.frame !== "function") {
        throw new TypeError("DebugOverlay.attach requires an EngineRuntime-like object");
      }
      if (runtime.__debugOverlayHook?.overlay === this) return this;

      const originalFrame = runtime.frame.bind(runtime);
      runtime.frame = (frameState = {}) => {
        const result = originalFrame(frameState);
        this.afterFrame(runtime.lastFrameState || frameState, runtime);
        return result;
      };
      runtime.__debugOverlayHook = { overlay: this, originalFrame };
      this.runtime = runtime;
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

    afterFrame(frameState = {}, runtime = this.runtime) {
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
      return {
        fps: this.fps,
        deltaMs: deltaSeconds * 1000,
        running: runtime?.running === true,
        sceneName: this.sceneManager?.currentName || scene?.name || "none",
        sceneState: DebugOverlay.sceneStateLabel(scene),
        entityTotal: entityCounts.total,
      };
    }

    draw(ctx = this.resolveContext()) {
      if (!ctx || !this.latestSnapshot) return;

      const rows = [
        `FPS ${this.latestSnapshot.fps.toFixed(1)}`,
        `dt ${this.latestSnapshot.deltaMs.toFixed(2)}ms`,
        `entities ${this.latestSnapshot.entityTotal}`,
        `scene ${this.latestSnapshot.sceneName}`,
        `state ${this.latestSnapshot.sceneState}`,
      ];
      const rect = { x: 10, y: 10, width: 172, height: 92 };
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
