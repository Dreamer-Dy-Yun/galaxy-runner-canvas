// Galaxy Runner - engine runtime
// Connects a frame clock to a scene without owning game-specific rules.

(() => {
  const OBSERVER_PHASES = Object.freeze([
    "beforeFrame",
    "afterUpdate",
    "afterDraw",
    "afterFrame",
  ]);

  class EngineRuntime {
    constructor({
      scene,
      clock = null,
      surface = null,
      autoStart = false,
      onObserverError = null,
    } = {}) {
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
      this.observerRecords = new Map();
      this.nextObserverGeneration = 1;
      this.onObserverError = typeof onObserverError === "function" ? onObserverError : null;
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

    subscribe(observer) {
      const isObserver = observer && (typeof observer === "object" || typeof observer === "function");
      const hasPhaseCallback = isObserver
        && OBSERVER_PHASES.some((phase) => typeof observer[phase] === "function");
      if (!hasPhaseCallback) {
        throw new TypeError("EngineRuntime.subscribe requires an observer phase callback");
      }

      const existingRecord = this.observerRecords.get(observer);
      if (existingRecord) return existingRecord.unsubscribe;

      const record = {
        observer,
        generation: this.nextObserverGeneration,
        unsubscribe: null,
      };
      this.nextObserverGeneration += 1;
      record.unsubscribe = () => this.unsubscribeRecord(record);
      this.observerRecords.set(observer, record);
      return record.unsubscribe;
    }

    unsubscribe(observer) {
      const record = this.observerRecords.get(observer);
      if (!record) return false;
      return this.unsubscribeRecord(record);
    }

    unsubscribeRecord(record) {
      if (this.observerRecords.get(record.observer) !== record) return false;
      this.observerRecords.delete(record.observer);
      return true;
    }

    frame(frameState = {}) {
      const state = this.normalizeFrameState(frameState);
      this.lastFrameState = state;
      const observerFrameState = Object.freeze({ ...state });
      const frameStartedAt = this.now();
      let frameFailed = false;
      let frameError;

      this.notifyObservers("beforeFrame", observerFrameState);

      const shouldUpdate = state.deltaSeconds > 0
        && this.scene.paused !== true
        && typeof this.scene.update === "function";
      const updateStartedAt = this.now();
      if (shouldUpdate) {
        try {
          this.scene.update(state.deltaSeconds, state);
        } catch (error) {
          frameFailed = true;
          frameError = error;
        }
      }
      this.notifyObservers("afterUpdate", observerFrameState, {
        durationMs: shouldUpdate ? this.now() - updateStartedAt : 0,
        executed: shouldUpdate,
        failed: frameFailed,
        error: frameError,
      });

      const shouldDraw = !frameFailed && typeof this.scene.draw === "function";
      const drawStartedAt = this.now();
      if (shouldDraw) {
        try {
          this.scene.draw(state.deltaSeconds, state);
        } catch (error) {
          frameFailed = true;
          frameError = error;
        }
      }
      this.notifyObservers("afterDraw", observerFrameState, {
        durationMs: shouldDraw ? this.now() - drawStartedAt : 0,
        executed: shouldDraw,
        failed: frameFailed,
        error: frameError,
      });

      const shouldCleanup = typeof this.scene.afterFrame === "function";
      if (shouldCleanup) {
        try {
          this.scene.afterFrame(state.deltaSeconds, state);
        } catch (error) {
          if (!frameFailed) {
            frameFailed = true;
            frameError = error;
          }
          else this.reportSecondaryFrameError(error, frameError);
        }
      }
      this.notifyObservers("afterFrame", observerFrameState, {
        durationMs: this.now() - frameStartedAt,
        executed: shouldCleanup,
        failed: frameFailed,
        error: frameError,
      });

      if (frameFailed) throw frameError;
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

    notifyObservers(phase, frameState, details = {}) {
      const event = Object.freeze({
        phase,
        runtime: this,
        scene: this.scene,
        frameState,
        deltaSeconds: frameState.deltaSeconds,
        durationMs: Number.isFinite(details.durationMs) ? details.durationMs : 0,
        executed: details.executed === true,
        failed: details.failed === true,
        error: details.failed === true ? details.error : null,
      });

      const records = [...this.observerRecords.values()];
      for (const record of records) {
        const { observer } = record;
        if (this.observerRecords.get(observer) !== record) continue;
        const callback = observer[phase];
        if (typeof callback !== "function") continue;

        try {
          callback.call(observer, event);
        } catch (error) {
          this.reportObserverError(error, observer, phase);
        }
      }
    }

    reportObserverError(error, observer, phase) {
      const details = Object.freeze({ runtime: this, observer, phase });
      if (this.onObserverError) {
        try {
          this.onObserverError(error, details);
          return;
        } catch (handlerError) {
          this.logError("[EngineRuntime] Observer error handler failed.", handlerError);
        }
      }
      this.logError(`[EngineRuntime] Observer failed during ${phase}.`, error);
    }

    reportSecondaryFrameError(error, primaryError) {
      this.logError("[EngineRuntime] afterFrame failed after an earlier scene error.", {
        error,
        primaryError,
      });
    }

    logError(message, error) {
      try {
        globalThis.console?.error?.(message, error);
      } catch {
        // Console reporting must not change gameplay control flow.
      }
    }

    now() {
      return globalThis.performance?.now?.() ?? Date.now();
    }
  }

  globalThis.EngineRuntime = EngineRuntime;
})();
