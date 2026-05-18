// Galaxy Runner - scene manager
// Owns scene registration, switching, and forwarding runtime frames/actions.

(() => {
  class SceneManager {
    constructor({ initialScene = null, initialName = "main" } = {}) {
      this.scenes = new Map();
      this.currentName = "";
      this.currentScene = null;

      if (initialScene) {
        this.register(initialName, initialScene);
        this.switchTo(initialName);
      }
    }

    register(name, scene) {
      if (!name) throw new Error("SceneManager.register requires a scene name");
      if (!scene) throw new Error(`SceneManager.register requires a scene for ${name}`);

      this.scenes.set(name, scene);
      return scene;
    }

    unregister(name) {
      const scene = this.scenes.get(name);
      if (scene && scene === this.currentScene) {
        this.switchTo(null);
      }
      return this.scenes.delete(name);
    }

    switchTo(name, context = {}) {
      const nextScene = name ? this.scenes.get(name) : null;
      if (name && !nextScene) {
        throw new Error(`SceneManager cannot find scene: ${name}`);
      }

      const previousScene = this.currentScene;
      const previousName = this.currentName;
      if (previousScene && typeof previousScene.exit === "function") {
        previousScene.exit({ ...context, from: previousName, to: name, manager: this });
      }

      this.currentName = name || "";
      this.currentScene = nextScene;

      if (nextScene && typeof nextScene.enter === "function") {
        nextScene.enter({ ...context, from: previousName, to: name, manager: this });
      }

      return nextScene;
    }

    activeScene() {
      return this.currentScene;
    }

    handleAction(action, context = {}) {
      if (!this.currentScene || typeof this.currentScene.handleAction !== "function") return false;
      return this.currentScene.handleAction(action, { ...context, manager: this }) === true;
    }

    update(dt, frameState = {}) {
      if (this.currentScene && typeof this.currentScene.update === "function") {
        this.currentScene.update(dt, frameState);
      }
    }

    draw(dt, frameState = {}) {
      if (this.currentScene && typeof this.currentScene.draw === "function") {
        this.currentScene.draw(dt, frameState);
      }
    }

    frame(frameState = {}) {
      if (!this.currentScene) return;

      if (typeof this.currentScene.frame === "function") {
        this.currentScene.frame(frameState);
        return;
      }

      const dt = Number.isFinite(frameState.deltaSeconds) ? frameState.deltaSeconds : 0;
      if (dt > 0) {
        this.update(dt, frameState);
      }
      this.draw(dt, frameState);
    }
  }

  globalThis.SceneManager = SceneManager;
})();
