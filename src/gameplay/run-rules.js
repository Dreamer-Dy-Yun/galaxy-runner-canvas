// Galaxy Runner - run setup and Continue contract
// Owns starting-loadout selection and the meaning of an assisted run.

(() => {
  const STARTING_WEAPON_KINDS = Object.freeze([...WEAPON_KINDS]);

  const RUN_RULES = Object.freeze({
    startingWeapon: Object.freeze({
      defaultKind: "rapid",
      cycleActions: Object.freeze({
        moveLeft: -1,
        moveRight: 1,
      }),
      directActions: Object.freeze({
        selectWeapon1: 0,
        selectWeapon2: 1,
        selectWeapon3: 2,
        selectWeapon4: 3,
      }),
    }),
    continue: Object.freeze({
      mode: "running",
      playerInvincibility: 2.4,
      spawnGraceSeconds: 1.2,
      itemGraceSeconds: 1.2,
    }),
  });

  class RunRules {
    static weaponKinds() {
      return STARTING_WEAPON_KINDS;
    }

    static normalizeStartingWeapon(kind) {
      if (STARTING_WEAPON_KINDS.includes(kind)) return kind;
      if (STARTING_WEAPON_KINDS.includes(RUN_RULES.startingWeapon.defaultKind)) {
        return RUN_RULES.startingWeapon.defaultKind;
      }
      return STARTING_WEAPON_KINDS[0] ?? null;
    }

    static cycleStartingWeapon(kind, step) {
      if (STARTING_WEAPON_KINDS.length <= 0) return null;

      const current = RunRules.normalizeStartingWeapon(kind);
      const currentIndex = Math.max(0, STARTING_WEAPON_KINDS.indexOf(current));
      const direction = Number.isFinite(step) ? Math.trunc(step) : 0;
      const nextIndex =
        ((currentIndex + direction) % STARTING_WEAPON_KINDS.length + STARTING_WEAPON_KINDS.length) %
        STARTING_WEAPON_KINDS.length;
      return STARTING_WEAPON_KINDS[nextIndex];
    }

    static weaponForAction(actionName, currentKind) {
      const directIndex = RUN_RULES.startingWeapon.directActions[actionName];
      if (Number.isInteger(directIndex)) return STARTING_WEAPON_KINDS[directIndex] ?? null;

      const step = RUN_RULES.startingWeapon.cycleActions[actionName];
      if (Number.isFinite(step)) return RunRules.cycleStartingWeapon(currentKind, step);
      return null;
    }

    static isAssisted(state) {
      return Number.isFinite(state?.continues) && state.continues > 0;
    }
  }

  globalThis.RUN_RULES = RUN_RULES;
  globalThis.RunRules = RunRules;
})();
