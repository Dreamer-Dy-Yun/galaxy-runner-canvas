// Galaxy Runner - run setup and Continue contract
// Owns the opening phase, route lock, and the meaning of an assisted run.

(() => {
  const ROUTE_WEAPON_KINDS = Object.freeze([...WEAPON_KINDS]);
  const RUN_PHASES = Object.freeze({
    baseLaunch: "baseLaunch",
    routeChoice: "routeChoice",
    combat: "combat",
  });
  const ROUTE_CHOICE_LAYOUT = Object.freeze(
    ROUTE_WEAPON_KINDS.map((kind, index) => Object.freeze({
      kind,
      xRatio: (index + 1) / (ROUTE_WEAPON_KINDS.length + 1),
      yRatio: 0.68,
    }))
  );

  const RUN_RULES = Object.freeze({
    opening: Object.freeze({
      phases: RUN_PHASES,
      baseLaunchSeconds: 1,
      choices: ROUTE_CHOICE_LAYOUT,
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
      return ROUTE_WEAPON_KINDS;
    }

    static createReadyState() {
      return {
        runPhase: null,
        runPhaseElapsed: 0,
        routeChoicesSpawned: false,
        selectedWeaponKind: null,
      };
    }

    static beginOpening(state) {
      if (!state || typeof state !== "object") return false;
      Object.assign(state, RunRules.createReadyState(), { runPhase: RUN_PHASES.baseLaunch });
      return true;
    }

    static enterRouteChoice(state) {
      if (state?.runPhase !== RUN_PHASES.baseLaunch) return false;
      state.runPhase = RUN_PHASES.routeChoice;
      state.runPhaseElapsed = 0;
      return true;
    }

    static lockRoute(state, kind) {
      if (state?.runPhase !== RUN_PHASES.routeChoice || !ROUTE_WEAPON_KINDS.includes(kind)) return false;
      state.selectedWeaponKind = kind;
      state.runPhase = RUN_PHASES.combat;
      state.runPhaseElapsed = 0;
      return true;
    }

    static isOpening(state) {
      return state?.runPhase === RUN_PHASES.baseLaunch || state?.runPhase === RUN_PHASES.routeChoice;
    }

    static isCombat(state) {
      return state?.runPhase === RUN_PHASES.combat;
    }

    static routeKind(state) {
      return ROUTE_WEAPON_KINDS.includes(state?.selectedWeaponKind) ? state.selectedWeaponKind : null;
    }

    static isAssisted(state) {
      return Number.isFinite(state?.continues) && state.continues > 0;
    }
  }

  globalThis.RUN_RULES = RUN_RULES;
  globalThis.RunRules = RunRules;
})();
