// Galaxy Runner - input state
// Tracks raw code state while exposing action-level queries to gameplay code.

(() => {
  class InputState {
    constructor(actionMap = null) {
      this.actionMap = actionMap;
      this.downCodes = new Set();
      this.pressedActions = new Set();
      this.releasedActions = new Set();
    }

    pressCode(code) {
      if (!code) return [];

      const wasDown = this.downCodes.has(code);
      this.downCodes.add(code);
      if (wasDown) return [];

      const actions = this.actionsForCode(code);
      for (const actionName of actions) {
        this.pressedActions.add(actionName);
      }

      return actions.map((actionName) => ({ name: actionName, phase: "pressed", code }));
    }

    releaseCode(code) {
      if (!code) return [];

      const wasDown = this.downCodes.delete(code);
      if (!wasDown) return [];

      const releasedActions = [];
      for (const actionName of this.actionsForCode(code)) {
        if (this.isActionDown(actionName)) continue;

        this.releasedActions.add(actionName);
        releasedActions.push({ name: actionName, phase: "released", code });
      }

      return releasedActions;
    }

    actionsForCode(code) {
      if (!this.actionMap || typeof this.actionMap.actionsForCode !== "function") return [];
      return this.actionMap.actionsForCode(code);
    }

    isDown(inputName) {
      if (!inputName) return false;
      if (this.actionMap?.isActionName(inputName)) {
        return this.isActionDown(inputName);
      }

      return this.downCodes.has(inputName);
    }

    isActionDown(actionName) {
      const codes = this.actionMap?.codesForAction(actionName) || [];
      return codes.some((code) => this.downCodes.has(code));
    }

    wasPressed(actionName) {
      return this.pressedActions.has(actionName);
    }

    wasReleased(actionName) {
      return this.releasedActions.has(actionName);
    }

    axis(negativeAction, positiveAction) {
      return (this.isDown(positiveAction) ? 1 : 0) - (this.isDown(negativeAction) ? 1 : 0);
    }

    clearTransient() {
      this.pressedActions.clear();
      this.releasedActions.clear();
    }

    reset() {
      this.downCodes.clear();
      this.clearTransient();
    }
  }

  globalThis.InputState = InputState;
})();
