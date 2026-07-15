// Galaxy Runner - feedback live-region presenter
// Subscribes semantic feedback to an existing aria-live node without owning gameplay or Canvas rendering.

(() => {
  class GameAccessibility {
    constructor(options = {}) {
      this.liveRegion = options.liveRegion || null;
      this.messages = options.messages || globalThis.GameFeedbackMessages || null;
      this.unsubscribe = null;
    }

    attach(feedbackSystem) {
      this.detach();
      if (!feedbackSystem || typeof feedbackSystem.subscribe !== "function") {
        throw new TypeError("GameAccessibility.attach requires a feedback system");
      }
      this.prepareLiveRegion();
      this.unsubscribe = feedbackSystem.subscribe((event) => this.announce(event));
      return this;
    }

    detach() {
      this.unsubscribe?.();
      this.unsubscribe = null;
      return this;
    }

    announce(event) {
      if (!this.liveRegion) return false;
      const message = this.messages?.text?.(event) || "";
      if (!message) return false;

      this.liveRegion.textContent = "";
      this.liveRegion.textContent = message;
      return true;
    }

    clear() {
      if (!this.liveRegion) return false;
      this.liveRegion.textContent = "";
      return true;
    }

    prepareLiveRegion() {
      if (!this.liveRegion || typeof this.liveRegion.setAttribute !== "function") return;
      this.liveRegion.setAttribute("role", "status");
      this.liveRegion.setAttribute("aria-live", "polite");
      this.liveRegion.setAttribute("aria-atomic", "true");
    }
  }

  globalThis.GameAccessibility = GameAccessibility;
})();
