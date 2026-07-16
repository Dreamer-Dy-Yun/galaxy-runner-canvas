// Player rig asset catalog. Stable snapshots keep approved final-form art.

(() => {
  const ROUTE_KINDS = Object.freeze(["rapid", "energy", "spread", "nova"]);
  const MAX_LEVEL = 10;
  const CENTER = Object.freeze({ x: 256, y: 256 });
  const TRANSFORM = Object.freeze({ x: 0, y: 0, rotation: 0, opacity: 1 });

  function part(id, assetKey, zIndex, tags = []) {
    return Object.freeze({
      id,
      assetKey,
      group: "player-ship",
      zIndex,
      pivot: CENTER,
      transform: TRANSFORM,
      tags: Object.freeze([...tags]),
    });
  }

  const BASE_PARTS = Object.freeze([
    part("wings", "player.base.wings", 10, ["base", "wings"]),
    part("engine", "player.base.engine", 20, ["base", "engine"]),
    part("fuselage", "player.base.fuselage", 30, ["base", "core"]),
    part("cockpit", "player.base.cockpit", 40, ["base", "nose"]),
  ]);

  const TRANSITION_NAMES = Object.freeze({
    rapid: Object.freeze(["core", "pod-left", "pod-right", "barrel-left", "barrel-right"]),
    energy: Object.freeze(["core", "nose", "pod-left", "pod-right"]),
    spread: Object.freeze(["core", "nose", "pod-left", "pod-right"]),
    nova: Object.freeze(["core", "nose", "pod-left", "pod-right"]),
  });

  function tagForName(name) {
    if (name.endsWith("left")) return "left";
    if (name.endsWith("right")) return "right";
    if (name === "nose") return "nose";
    return "core";
  }

  function normalizeKind(kind) {
    return ROUTE_KINDS.includes(kind) ? kind : null;
  }

  function normalizeLevel(level) {
    const value = Number.isFinite(level) ? Math.trunc(level) : 1;
    return Math.min(MAX_LEVEL, Math.max(1, value));
  }

  function finalKey(kind, level) {
    return `player.final.${kind}.${String(level).padStart(2, "0")}`;
  }

  const ASSET_PATHS = new Map([
    ...["wings", "engine", "fuselage", "cockpit"].map((name) => [
      `player.base.${name}`,
      `assets/player/rig/base/${name}.png`,
    ]),
    ...ROUTE_KINDS.flatMap((kind) => Array.from({ length: MAX_LEVEL }, (_, index) => [
      finalKey(kind, index + 1),
      `assets/player/final-forms/${kind}/${kind}_${String(index + 1).padStart(2, "0")}.PNG`,
    ])),
    ...ROUTE_KINDS.flatMap((kind) => TRANSITION_NAMES[kind].map((name) => [
      `player.transition.${kind}.${name}`,
      `assets/player/rig/${kind}/${name}.png`,
    ])),
  ]);

  class PlayerRigCatalog {
    static routeKinds() {
      return ROUTE_KINDS;
    }

    static snapshot(kind = null, level = 0) {
      const route = normalizeKind(kind);
      if (!route || level <= 0) {
        return Object.freeze({ id: "player.base", parts: BASE_PARTS });
      }
      const resolvedLevel = normalizeLevel(level);
      return Object.freeze({
        id: `player.${route}.${resolvedLevel}`,
        parts: Object.freeze([
          part("ship", finalKey(route, resolvedLevel), 50, ["final", "core"]),
        ]),
      });
    }

    static transitionParts(kind) {
      const route = normalizeKind(kind);
      if (!route) return Object.freeze([]);
      return Object.freeze(TRANSITION_NAMES[route].map((name, index) => part(
        `transition-${route}-${name}`,
        `player.transition.${route}.${name}`,
        60 + index,
        Object.freeze(["transition", tagForName(name)])
      )));
    }

    static assetPath(assetKey) {
      return ASSET_PATHS.get(assetKey) ?? null;
    }

    static requiredAssetKeys(kind, level) {
      return Object.freeze([
        ...PlayerRigCatalog.snapshot(kind, level).parts.map((entry) => entry.assetKey),
        ...PlayerRigCatalog.transitionParts(kind).map((entry) => entry.assetKey),
      ]);
    }
  }

  globalThis.PlayerRigCatalog = PlayerRigCatalog;
})();
