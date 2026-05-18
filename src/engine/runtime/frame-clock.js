// Galaxy Runner - frame clock
// Owns requestAnimationFrame scheduling and frame delta calculation for engine runtimes.

(() => {
  class FrameClock {
    constructor({
      requestFrame = globalThis.requestAnimationFrame?.bind(globalThis),
      cancelFrame = globalThis.cancelAnimationFrame?.bind(globalThis),
      now = () => globalThis.performance?.now?.() ?? Date.now(),
      maxDeltaSeconds = 0.25,
    } = {}) {
      if (typeof requestFrame !== "function" || typeof cancelFrame !== "function") {
        throw new Error("FrameClock requires requestAnimationFrame and cancelAnimationFrame");
      }

      this.requestFrame = requestFrame;
      this.cancelFrame = cancelFrame;
      this.now = now;
      this.maxDeltaSeconds =
        Number.isFinite(maxDeltaSeconds) && maxDeltaSeconds >= 0 ? maxDeltaSeconds : 0.25;
      this.running = false;
      this.frameHandle = null;
      this.lastTime = null;
      this.onFrame = null;
      this.tick = (time) => this.handleFrame(time);
    }

    start(onFrame) {
      if (typeof onFrame !== "function") {
        throw new Error("FrameClock.start requires an onFrame callback");
      }

      this.onFrame = onFrame;
      if (this.running) return;

      this.running = true;
      this.lastTime = null;
      this.frameHandle = this.requestFrame(this.tick);
    }

    stop() {
      if (!this.running) return;

      this.running = false;
      if (this.frameHandle !== null) {
        this.cancelFrame(this.frameHandle);
      }
      this.frameHandle = null;
      this.lastTime = null;
    }

    handleFrame(time) {
      if (!this.running) return;

      const now = Number.isFinite(time) ? time : this.now();
      const elapsedMs = this.lastTime === null ? 0 : Math.max(0, now - this.lastTime);
      const deltaSeconds = Math.min(elapsedMs / 1000, this.maxDeltaSeconds);
      this.lastTime = now;

      this.onFrame({
        now,
        elapsedMs,
        deltaSeconds,
        clock: this,
      });

      if (this.running) {
        this.frameHandle = this.requestFrame(this.tick);
      }
    }
  }

  globalThis.FrameClock = FrameClock;
})();
