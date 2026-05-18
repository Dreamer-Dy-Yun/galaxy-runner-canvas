// Galaxy Runner - input action map
// Keeps raw browser input codes behind game-meaning action names.

(() => {
  const DEFAULT_BINDINGS = Object.freeze({
    start: Object.freeze(["Space"]),
    restart: Object.freeze(["KeyR"]),
    pause: Object.freeze(["KeyP", "Escape"]),
    fire: Object.freeze(["Space"]),
    special: Object.freeze([]),
    info: Object.freeze([]),
    moveLeft: Object.freeze(["ArrowLeft", "KeyA"]),
    moveRight: Object.freeze(["ArrowRight", "KeyD"]),
    moveUp: Object.freeze(["ArrowUp", "KeyW"]),
    moveDown: Object.freeze(["ArrowDown", "KeyS"]),
  });

  function configuredInput() {
    return typeof INPUT_CONFIG === "undefined" ? null : INPUT_CONFIG;
  }

  function configuredSpecial() {
    return typeof SPECIAL_CONFIG === "undefined" ? null : SPECIAL_CONFIG;
  }

  function uniqueCodes(codes) {
    return Array.from(new Set((codes || []).filter(Boolean)));
  }

  class ActionMap {
    constructor(bindings = {}, options = {}) {
      this.bindings = new Map();
      this.codeActions = new Map();
      this.preventDefaultCodes = new Set(options.preventDefaultCodes || []);

      for (const [actionName, codes] of Object.entries(bindings)) {
        this.bind(actionName, codes);
      }
    }

    static fromConfig(inputConfig = configuredInput(), specialConfig = configuredSpecial()) {
      const bindings = { ...DEFAULT_BINDINGS };
      const preventDefaultCodes = new Set(inputConfig?.preventDefaultCodes || []);

      bindings.start = uniqueCodes([inputConfig?.startCode || DEFAULT_BINDINGS.start[0]]);
      bindings.restart = uniqueCodes([inputConfig?.restartCode || DEFAULT_BINDINGS.restart[0]]);
      bindings.pause = uniqueCodes(inputConfig?.pauseCodes || DEFAULT_BINDINGS.pause);
      bindings.fire = uniqueCodes([inputConfig?.startCode || DEFAULT_BINDINGS.fire[0]]);
      bindings.special = uniqueCodes(specialConfig?.inputCodes || DEFAULT_BINDINGS.special);

      return new ActionMap(bindings, { preventDefaultCodes });
    }

    bind(actionName, codes) {
      if (!actionName) return this;

      const normalizedCodes = uniqueCodes(codes);
      this.bindings.set(actionName, new Set(normalizedCodes));

      for (const code of normalizedCodes) {
        if (!this.codeActions.has(code)) {
          this.codeActions.set(code, new Set());
        }
        this.codeActions.get(code).add(actionName);
      }

      return this;
    }

    actionsForCode(code) {
      return Array.from(this.codeActions.get(code) || []);
    }

    codesForAction(actionName) {
      return Array.from(this.bindings.get(actionName) || []);
    }

    isActionName(actionName) {
      return this.bindings.has(actionName);
    }

    shouldPreventDefault(code) {
      return this.preventDefaultCodes.has(code);
    }
  }

  globalThis.ActionMap = ActionMap;
})();
