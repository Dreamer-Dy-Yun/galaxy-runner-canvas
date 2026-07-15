// Galaxy Runner - optional gameplay audio feedback
// Subscribes to semantic feedback, creates Web Audio only after a user gesture, and owns mute persistence.

(() => {
  const TONES = Object.freeze({
    "special.used": Object.freeze({ start: 620, end: 980, duration: 0.18, gain: 0.055, wave: "sawtooth" }),
    "special.failed": Object.freeze({ start: 190, end: 125, duration: 0.13, gain: 0.045, wave: "square" }),
    "item.collected": Object.freeze({ start: 560, end: 880, duration: 0.12, gain: 0.045, wave: "sine" }),
    "player.hit": Object.freeze({ start: 155, end: 85, duration: 0.11, gain: 0.06, wave: "sawtooth" }),
    "enemy.destroyed": Object.freeze({ start: 320, end: 210, duration: 0.075, gain: 0.028, wave: "square" }),
    "boss.spawned": Object.freeze({ start: 105, end: 185, duration: 0.42, gain: 0.07, wave: "triangle" }),
  });

  function defaultContextFactory() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    return typeof AudioContextClass === "function" ? new AudioContextClass() : null;
  }

  function resolveStorage(explicitStorage) {
    if (explicitStorage !== undefined) return explicitStorage;
    try {
      return globalThis.localStorage || null;
    } catch {
      return null;
    }
  }

  class GameAudio {
    constructor(options = {}) {
      this.storageKey = options.storageKey || "galaxyRunner.audioMuted";
      this.storage = resolveStorage(options.storage);
      this.contextFactory = options.contextFactory || defaultContextFactory;
      this.now = typeof options.now === "function" ? options.now : () => performance.now();
      this.killThrottleMs = Number.isFinite(options.killThrottleMs) ? options.killThrottleMs : 70;
      this.onError = typeof options.onError === "function" ? options.onError : null;
      this.muted = typeof options.muted === "boolean" ? options.muted : this.readMuted();
      this.context = null;
      this.gestureSeen = false;
      this.lastKillAt = -Infinity;
      this.feedbackUnsubscribe = null;
      this.gestureTarget = null;
      this.muteButton = null;
      this.onGesture = () => this.unlock();
      this.onMuteClick = () => this.toggleMuted();
    }

    attach(options = {}) {
      this.detach();
      const feedback = options.feedback || null;
      this.gestureTarget = options.gestureTarget || globalThis.window || globalThis.document || null;
      this.muteButton = options.muteButton || null;

      if (feedback) {
        if (typeof feedback.subscribe !== "function") throw new TypeError("GameAudio feedback must support subscribe");
        this.feedbackUnsubscribe = feedback.subscribe((event) => this.playEvent(event));
      }
      if (!this.gestureSeen && this.gestureTarget?.addEventListener) {
        this.gestureTarget.addEventListener("pointerdown", this.onGesture, true);
        this.gestureTarget.addEventListener("keydown", this.onGesture, true);
      }
      this.muteButton?.addEventListener?.("click", this.onMuteClick);
      this.syncMuteButton();
      return this;
    }

    detach() {
      this.feedbackUnsubscribe?.();
      this.feedbackUnsubscribe = null;
      this.removeGestureListeners();
      this.muteButton?.removeEventListener?.("click", this.onMuteClick);
      this.gestureTarget = null;
      this.muteButton = null;
      return this;
    }

    destroy() {
      this.detach();
      if (this.context && typeof this.context.close === "function") this.settle(this.context.close());
      this.context = null;
      return this;
    }

    unlock() {
      this.gestureSeen = true;
      this.removeGestureListeners();
      if (this.muted) return false;
      const context = this.ensureContext();
      if (!context) return false;
      if (context.state === "suspended" && typeof context.resume === "function") this.settle(context.resume());
      return true;
    }

    ensureContext() {
      if (this.context) return this.context;
      try {
        this.context = this.contextFactory() || null;
      } catch (error) {
        this.report(error);
        this.context = null;
      }
      return this.context;
    }

    playEvent(event) {
      if (!event || this.muted || !this.context) return false;
      const tone = TONES[event.type];
      if (!tone) return false;
      if (event.type === "enemy.destroyed") {
        const currentTime = this.now();
        if (currentTime - this.lastKillAt < this.killThrottleMs) return false;
        this.lastKillAt = currentTime;
      }
      return this.playTone(tone);
    }

    playTone(tone) {
      try {
        const context = this.context;
        const startAt = Number.isFinite(context.currentTime) ? context.currentTime : 0;
        const stopAt = startAt + tone.duration;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = tone.wave;
        oscillator.frequency.setValueAtTime(tone.start, startAt);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, tone.end), stopAt);
        gain.gain.setValueAtTime(Math.max(0.0001, tone.gain), startAt);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(stopAt);
        return true;
      } catch (error) {
        this.report(error);
        return false;
      }
    }

    setMuted(muted) {
      this.muted = muted === true;
      this.writeMuted();
      this.syncMuteButton();
      if (this.muted) {
        if (this.context?.state === "running" && typeof this.context.suspend === "function") this.settle(this.context.suspend());
      } else if (this.gestureSeen) {
        const context = this.ensureContext();
        if (context?.state === "suspended" && typeof context.resume === "function") this.settle(context.resume());
      }
      return this.muted;
    }

    toggleMuted() {
      return this.setMuted(!this.muted);
    }

    isMuted() {
      return this.muted;
    }

    snapshot() {
      return Object.freeze({ muted: this.muted, unlocked: this.context !== null, gestureSeen: this.gestureSeen });
    }

    readMuted() {
      try {
        const value = this.storage?.getItem?.(this.storageKey);
        return value === "true" || value === "1";
      } catch {
        return false;
      }
    }

    writeMuted() {
      try {
        this.storage?.setItem?.(this.storageKey, String(this.muted));
      } catch (error) {
        this.report(error);
      }
    }

    syncMuteButton() {
      if (!this.muteButton) return;
      this.muteButton.setAttribute?.("aria-pressed", String(this.muted));
      this.muteButton.setAttribute?.("aria-label", this.muted ? "게임 소리 켜기" : "게임 소리 끄기");
      if ("textContent" in this.muteButton) this.muteButton.textContent = this.muted ? "소리 끔" : "소리 켬";
      if (this.muteButton.dataset) this.muteButton.dataset.audioMuted = String(this.muted);
    }

    removeGestureListeners() {
      if (!this.gestureTarget?.removeEventListener) return;
      this.gestureTarget.removeEventListener("pointerdown", this.onGesture, true);
      this.gestureTarget.removeEventListener("keydown", this.onGesture, true);
    }

    settle(result) {
      if (result && typeof result.catch === "function") result.catch((error) => this.report(error));
    }

    report(error) {
      if (this.onError) {
        try {
          this.onError(error);
          return;
        } catch {
          // Fall through to the console so reporting failures remain visible.
        }
      }
      if (typeof console !== "undefined" && console.warn) console.warn("[Galaxy Runner] Audio feedback failed.", error);
    }
  }

  globalThis.GameAudio = GameAudio;
})();
