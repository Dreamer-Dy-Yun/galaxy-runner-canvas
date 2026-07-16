// Declarative Player parameters for the gameplay-agnostic rig animation engine.

(() => {
  const ASSEMBLY_MOTION = Object.freeze({
    strategyId: "detach-attach",
    parameters: Object.freeze({
      phaseModes: Object.freeze({
        detach: "detach",
        bridge: "bridge",
        attach: "attach",
        settle: "hold-target",
      }),
      origin: Object.freeze({ x: 256, y: 320 }),
      distance: 46,
      offsetByTag: Object.freeze({
        left: Object.freeze({ x: -74, y: 12 }),
        right: Object.freeze({ x: 74, y: 12 }),
        core: Object.freeze({ x: 0, y: -58 }),
        nose: Object.freeze({ x: 0, y: -82 }),
        engine: Object.freeze({ x: 0, y: 52 }),
        wings: Object.freeze({ x: 0, y: 28 }),
      }),
      rotationByTag: Object.freeze({ left: -0.11, right: 0.11, core: 0.035 }),
    }),
    timing: Object.freeze({
      scope: "phase",
      delay: 0,
      duration: 1,
      easing: "easeInOut",
      byTag: Object.freeze({
        core: Object.freeze({ delay: 0.06, duration: 0.88 }),
        nose: Object.freeze({ delay: 0.12, duration: 0.82 }),
      }),
    }),
  });

  const BANK_POSE = Object.freeze({
    strategyId: "rigid-bank",
    parameters: Object.freeze({
      x: 4.5,
      y: 0.8,
      rotation: 0.07,
      response: Object.freeze({
        enterDuration: 0.12,
        returnDuration: 0.16,
        reverseDuration: 0.2,
        easing: "easeInOut",
      }),
    }),
  });

  function profile(id, scale = 1) {
    return Object.freeze({
      id,
      phases: Object.freeze([
        Object.freeze({ id: "detach", duration: 0.16 * scale, easing: "easeIn" }),
        Object.freeze({ id: "bridge", duration: 0.09 * scale, easing: "easeInOut" }),
        Object.freeze({ id: "attach", duration: 0.22 * scale, easing: "easeOut" }),
        Object.freeze({ id: "settle", duration: 0.08 * scale, easing: "easeOut" }),
      ]),
      motions: Object.freeze({
        retained: ASSEMBLY_MOTION,
        added: ASSEMBLY_MOTION,
        removed: ASSEMBLY_MOTION,
        replaced: ASSEMBLY_MOTION,
        transient: ASSEMBLY_MOTION,
      }),
      poseChannels: Object.freeze({ bank: BANK_POSE }),
      interruption: "replace-latest",
      reducedMotion: Object.freeze({ mode: "crossfade", duration: 0.08 }),
      fallback: Object.freeze({ asset: "settle-target", strategy: "settle-target" }),
    });
  }

  const PROFILES = Object.freeze({
    "player-route-assembly": profile("player-route-assembly", 1.2),
    "player-upgrade-assembly": profile("player-upgrade-assembly", 1),
  });

  class PlayerAnimationProfiles {
    static all() {
      return PROFILES;
    }

    static idFor(reason) {
      return reason === "route-choice" ? "player-route-assembly" : "player-upgrade-assembly";
    }
  }

  globalThis.PlayerAnimationProfiles = PlayerAnimationProfiles;
})();
