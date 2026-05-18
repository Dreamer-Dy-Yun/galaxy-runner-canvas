// Galaxy Runner - input
// Split from the original single-file prototype so each system can evolve independently.

class InputController {
  constructor(game, restartButton, options = {}) {
    this.game = game;
    this.target = options.target || game;
    this.actionMap =
      options.actionMap || (typeof ActionMap === "function" ? ActionMap.fromConfig() : null);
    this.inputState =
      options.inputState || (typeof InputState === "function" ? new InputState(this.actionMap) : null);
    this.keys = new Set();
    this.controlCodes = new Set(this.actionMap?.preventDefaultCodes || INPUT_CONFIG.preventDefaultCodes);
    this.restartButton = restartButton;

    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onKeyUp = (event) => {
      if (event?.code) {
        this.keys.delete(event.code);
        this.inputState?.releaseCode(event.code);
      }
    };
    this.onRestartClick = (event) => {
      this.dispatchAction({ name: "restart", phase: "pressed", source: "restartButton", sourceEvent: event });
    };
    this.onCanvasClick = (event) => {
      this.dispatchAction({ name: "info", phase: "pressed", source: "canvas", sourceEvent: event });
    };

    if (!game || !game.canvas) return;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    if (this.restartButton && this.restartButton.addEventListener) {
      this.restartButton.addEventListener("click", this.onRestartClick);
    }
    this.game.canvas.addEventListener("click", this.onCanvasClick);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    if (this.restartButton && this.restartButton.removeEventListener) {
      this.restartButton.removeEventListener("click", this.onRestartClick);
    }
    if (this.game?.canvas?.removeEventListener) {
      this.game.canvas.removeEventListener("click", this.onCanvasClick);
    }
    this.keys.clear();
    this.inputState?.reset();
  }

  handleKeyDown(event) {
    if (!this.target || !event?.code) return;
    if (this.controlCodes.has(event.code)) {
      event.preventDefault();
    }

    const isNewDown = !this.keys.has(event.code);
    this.keys.add(event.code);
    if (!isNewDown) return;

    const actionEvents = this.inputState
      ? this.inputState.pressCode(event.code)
      : this.fallbackActionEvents(event.code);
    for (const actionEvent of actionEvents) {
      this.dispatchAction({ ...actionEvent, source: "keyboard", sourceEvent: event });
    }
  }

  fallbackActionEvents(code) {
    const actions = [];
    if (INPUT_CONFIG.pauseCodes.includes(code)) actions.push("pause");
    if (code === INPUT_CONFIG.startCode) actions.push("start", "fire");
    if (code === INPUT_CONFIG.restartCode) actions.push("restart");
    return actions.map((name) => ({ name, phase: "pressed", code }));
  }

  dispatchAction(actionEvent) {
    if (!this.target || !actionEvent?.name || typeof this.target.handleAction !== "function") return false;
    return this.target.handleAction(actionEvent) === true;
  }

  isDown(code) {
    if (this.inputState) return this.inputState.isDown(code);
    return this.keys.has(code);
  }

  wasPressed(actionName) {
    return this.inputState?.wasPressed(actionName) || false;
  }

  wasReleased(actionName) {
    return this.inputState?.wasReleased(actionName) || false;
  }

  axis(negativeAction, positiveAction) {
    return this.inputState?.axis(negativeAction, positiveAction) || 0;
  }

  endFrame() {
    this.inputState?.clearTransient();
  }
}
