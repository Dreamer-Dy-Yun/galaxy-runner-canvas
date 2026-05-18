// Galaxy Runner - engine runtime
// Connects a frame clock to a scene without owning game-specific rules.

(() => {
  class EngineRuntime {
    constructor({ scene, clock = null, surface = null, autoStart = false } = {}) {
      if (!scene) {
        throw new Error("EngineRuntime requires a scene or game object");
      }

      if (!clock && typeof globalThis.FrameClock !== "function") {
        throw new Error("EngineRuntime requires FrameClock to be loaded");
      }

      this.scene = scene;
      this.surface = surface;
      this.clock = clock || new globalThis.FrameClock();
      this.running = false;
      this.lastFrameState = null;
      this.runFrame = (frameState) => this.frame(frameState);

      if (autoStart) this.start();
    }

    start() {
      if (this.running) return;

      this.running = true;
      try {
        this.clock.start(this.runFrame);
      } catch (error) {
        this.running = false;
        throw error;
      }
    }

    stop() {
      if (!this.running) return;

      this.running = false;
      this.clock.stop();
    }

    frame(frameState = {}) {
      const state = this.normalizeFrameState(frameState);
      this.lastFrameState = state;

      if (typeof this.scene.frame === "function") {
        this.scene.frame(state);
        return;
      }

      if (state.deltaSeconds > 0 && typeof this.scene.update === "function") {
        this.scene.update(state.deltaSeconds, state);
      }
      if (typeof this.scene.draw === "function") {
        this.scene.draw(state.deltaSeconds, state);
      }
    }

    normalizeFrameState(frameState) {
      const deltaSeconds = Number.isFinite(frameState.deltaSeconds) ? frameState.deltaSeconds : 0;
      return {
        ...frameState,
        deltaSeconds,
        runtime: this,
        surface: frameState.surface || this.surface,
      };
    }
  }

  globalThis.EngineRuntime = EngineRuntime;
})();
