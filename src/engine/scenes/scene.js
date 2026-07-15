// Galaxy Runner - scene contract
// Provides a small lifecycle base for scenes without owning game-specific rules.

(() => {
  class Scene {
    constructor({ name = "scene" } = {}) {
      this.name = name;
      this.active = false;
      this.paused = false;
    }

    enter() {
      this.active = true;
      this.paused = false;
    }

    exit() {
      this.active = false;
      this.paused = false;
    }

    pause() {
      this.paused = true;
    }

    resume() {
      this.paused = false;
    }

    handleAction() {
      return false;
    }

    update() {}

    draw() {}

    afterFrame() {}
  }

  globalThis.Scene = Scene;
})();
