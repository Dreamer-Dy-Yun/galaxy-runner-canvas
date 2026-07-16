// Declarative transition profile validation for RigAnimationEngine.

(() => {
  if (globalThis.TransitionProfile) return;

  const CHANGE_TYPES = Object.freeze(["retained", "added", "removed", "replaced", "transient"]);
  const INTERRUPTION_POLICIES = new Set(["replace-latest", "finish-current", "queue-latest"]);
  const ASSET_FALLBACKS = new Set(["hold-source", "skip-part", "settle-target"]);
  const STRATEGY_FALLBACKS = new Set(["hold-source", "settle-target"]);
  const REDUCED_MODES = new Set(["crossfade", "settle-target"]);

  function interpolate(from, to, progress) {
    return from + ((to - from) * progress);
  }

  function interpolateStrategy(context) {
    if (context.kind === "pose") return Object.freeze({ delta: Object.freeze({}) });
    const { change, transitionProgress: progress } = context;
    if (change.kind === "retained") {
      const transform = {};
      for (const key of ["x", "y", "rotation", "opacity"]) {
        transform[key] = interpolate(change.from.transform[key], change.to.transform[key], progress);
      }
      return Object.freeze({ target: Object.freeze(transform) });
    }
    if (change.kind === "added") {
      return Object.freeze({ target: Object.freeze({ opacity: change.to.transform.opacity * progress }) });
    }
    if (change.kind === "removed") {
      return Object.freeze({ source: Object.freeze({ opacity: change.from.transform.opacity * (1 - progress) }) });
    }
    if (change.kind === "transient") {
      return Object.freeze({
        target: Object.freeze({ opacity: change.to.transform.opacity * Math.sin(Math.PI * progress) }),
      });
    }
    return Object.freeze({
      source: Object.freeze({ opacity: change.from.transform.opacity * (1 - progress) }),
      target: Object.freeze({ opacity: change.to.transform.opacity * progress }),
    });
  }

  function tagNumber(part, values, fallback) {
    if (!values || typeof values !== "object") return fallback;
    const tag = part.tags.find((candidate) => Number.isFinite(values[candidate]));
    return tag ? values[tag] : fallback;
  }

  function rigidBankStrategy(context) {
    if (context.kind !== "pose") throw new TypeError("rigid-bank is a pose-only strategy");
    const parameters = context.motionParameters;
    const multiplier = tagNumber(context.part, parameters.tagMultipliers, 1);
    return Object.freeze({ delta: Object.freeze({
      x: context.value * (parameters.x ?? 0) * multiplier,
      y: context.value * (parameters.y ?? 0) * multiplier,
      rotation: context.value * (parameters.rotation ?? 0) * multiplier,
      opacity: 1,
    }) });
  }

  function detachAttachStrategy(context) {
    if (context.kind !== "transition") throw new TypeError("detach-attach is transition-only");
    const { change, phase, motionParameters: parameters } = context;
    const mode = parameters.phaseModes?.[phase.phase] ?? "crossfade";
    if (mode === "crossfade") return interpolateStrategy(context);
    const sourceMode = ["hold-source", "detach", "bridge"].includes(mode);
    const role = sourceMode ? "source" : "target";
    const part = sourceMode ? change.from : change.to;
    if (!part) return Object.freeze({});
    const offsetTag = part.tags.find((tag) => Object.hasOwn(parameters.offsetByTag ?? {}, tag));
    const hasOffset = offsetTag !== undefined;
    const offset = hasOffset ? parameters.offsetByTag[offsetTag] : null;
    if (hasOffset && (!offset || typeof offset !== "object"
      || !Number.isFinite(offset.x) || !Number.isFinite(offset.y))) {
      throw new TypeError(`detach-attach offsetByTag.${offsetTag} requires finite x and y`);
    }
    const origin = parameters.origin ?? { x: 0, y: 0 };
    let dx = hasOffset ? offset.x : part.pivot.x - (origin.x ?? 0);
    let dy = hasOffset ? offset.y : part.pivot.y - (origin.y ?? 0);
    const length = hasOffset ? 1 : Math.hypot(dx, dy) || 1;
    dx /= length; dy /= length;
    const phaseProgress = phase.easedProgress;
    const amount = mode === "detach" || mode === "bridge" ? phaseProgress
      : mode === "attach" ? 1 - phaseProgress : 0;
    const alpha = mode === "bridge" ? 1 - phaseProgress
      : mode === "attach" ? phaseProgress : 1;
    const distance = hasOffset ? 1 : tagNumber(part, parameters.distanceByTag, parameters.distance ?? 0);
    const rotation = tagNumber(part, parameters.rotationByTag, parameters.rotation ?? 0);
    return Object.freeze({ [role]: Object.freeze({
      x: part.transform.x + (dx * distance * amount),
      y: part.transform.y + (dy * distance * amount),
      rotation: part.transform.rotation + (rotation * amount),
      opacity: part.transform.opacity * alpha,
    }) });
  }

  function plainObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`${label} must be an object`);
    }
    return value;
  }

  function nonEmpty(value, label) {
    const result = typeof value === "string" ? value.trim() : "";
    if (!result) throw new TypeError(`${label} must be a non-empty string`);
    return result;
  }

  function cloneData(value, label) {
    if (value === null || ["string", "boolean"].includes(typeof value)) return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${label} numbers must be finite`);
      return value;
    }
    if (Array.isArray(value)) {
      return Object.freeze(value.map((entry, index) => cloneData(entry, `${label}[${index}]`)));
    }
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      const clone = {};
      for (const [key, entry] of Object.entries(value)) {
        clone[key] = cloneData(entry, `${label}.${key}`);
      }
      return Object.freeze(clone);
    }
    throw new TypeError(`${label} must contain only plain serializable data`);
  }

  function selected(value, allowed, label) {
    if (!allowed.has(value)) throw new TypeError(`${label} has unsupported value: ${value}`);
    return value;
  }

  function normalizeMotion(input, label) {
    const motion = input ?? { strategyId: "interpolate" };
    plainObject(motion, label);
    return Object.freeze({
      strategyId: nonEmpty(motion.strategyId ?? "interpolate", `${label}.strategyId`),
      parameters: cloneData(motion.parameters ?? {}, `${label}.parameters`),
      timing: globalThis.RigAnimationTimeline.normalizePartTiming(motion.timing, `${label}.timing`),
    });
  }

  function normalizeMotions(input = {}) {
    plainObject(input, "TransitionProfile.motions");
    const motions = {};
    for (const kind of CHANGE_TYPES) {
      motions[kind] = normalizeMotion(input[kind], `TransitionProfile.motions.${kind}`);
    }
    return Object.freeze(motions);
  }

  function normalizePoseChannels(input = {}) {
    plainObject(input, "TransitionProfile.poseChannels");
    const channels = {};
    for (const [channel, motion] of Object.entries(input)) {
      const id = nonEmpty(channel, "TransitionProfile pose channel id");
      channels[id] = normalizeMotion(motion, `TransitionProfile.poseChannels.${id}`);
    }
    return Object.freeze(channels);
  }

  function normalizeReducedMotion(input = {}) {
    if (typeof input === "string") input = { mode: input };
    plainObject(input, "TransitionProfile.reducedMotion");
    const mode = selected(input.mode ?? "crossfade", REDUCED_MODES, "reducedMotion.mode");
    const duration = input.duration ?? 0.08;
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("reducedMotion.duration must be a finite non-negative number");
    }
    return Object.freeze({ mode, duration });
  }

  function normalizeFallback(input = {}) {
    plainObject(input, "TransitionProfile.fallback");
    return Object.freeze({
      asset: selected(input.asset ?? "hold-source", ASSET_FALLBACKS, "fallback.asset"),
      strategy: selected(
        input.strategy ?? "hold-source",
        STRATEGY_FALLBACKS,
        "fallback.strategy"
      ),
    });
  }

  class TransitionProfile {
    constructor(input, knownStrategyIds = new Set(["interpolate"])) {
      plainObject(input, "TransitionProfile");
      if (typeof globalThis.RigAnimationTimeline !== "function") {
        throw new Error("TransitionProfile requires RigAnimationTimeline to be loaded");
      }

      this.id = nonEmpty(input.id, "TransitionProfile.id");
      const timeline = new globalThis.RigAnimationTimeline(input.phases);
      this.phases = timeline.phases;
      this.motions = normalizeMotions(input.motions);
      this.poseChannels = normalizePoseChannels(input.poseChannels);
      this.interruption = selected(
        input.interruption ?? "replace-latest",
        INTERRUPTION_POLICIES,
        "TransitionProfile.interruption"
      );
      this.reducedMotion = normalizeReducedMotion(input.reducedMotion);
      this.fallback = normalizeFallback(input.fallback);
      this.parameters = cloneData(input.parameters ?? {}, "TransitionProfile.parameters");
      TransitionProfile.requireStrategies(this, knownStrategyIds);
      Object.freeze(this);
    }

    static createRegistry(input, knownStrategyIds = new Set(["interpolate"])) {
      const entries = input instanceof Map
        ? [...input.entries()]
        : Object.entries(plainObject(input, "RigAnimationEngine profiles"));
      if (entries.length === 0) throw new TypeError("RigAnimationEngine requires at least one profile");

      const registry = new Map();
      for (const [fallbackId, value] of entries) {
        const profileInput = value?.id ? value : { ...value, id: fallbackId };
        const profile = value instanceof TransitionProfile
          ? value
          : new TransitionProfile(profileInput, knownStrategyIds);
        if (registry.has(profile.id)) throw new TypeError(`Duplicate transition profile: ${profile.id}`);
        registry.set(profile.id, profile);
      }
      return registry;
    }

    static createStrategyRegistry(input = {}) {
      const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
      const registry = new Map([
        ["interpolate", interpolateStrategy],
        ["rigid-bank", rigidBankStrategy],
        ["detach-attach", detachAttachStrategy],
      ]);
      for (const [rawId, strategy] of entries) {
        const id = typeof rawId === "string" ? rawId.trim() : "";
        if (!id || typeof strategy !== "function" || registry.has(id)) {
          throw new TypeError(`Invalid or duplicate rig animation strategy: ${rawId}`);
        }
        registry.set(id, strategy);
      }
      return registry;
    }

    static requireStrategies(profile, knownStrategyIds) {
      const required = [
        ...Object.values(profile.motions).map((motion) => motion.strategyId),
        ...Object.values(profile.poseChannels).map((motion) => motion.strategyId),
      ];
      for (const strategyId of required) {
        if (!knownStrategyIds.has(strategyId)) {
          throw new TypeError(`TransitionProfile ${profile.id} references unknown strategy: ${strategyId}`);
        }
      }
    }

    static cloneData(value, label = "data") {
      return cloneData(value, label);
    }

    static validateRequest(input, { profiles, currentRevision = -1, pendingRevision = -1 }) {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("RigAnimationEngine.start requires a request object");
      }
      const revision = input.revision;
      const maxRevision = Math.max(currentRevision, pendingRevision);
      if (!Number.isSafeInteger(revision) || revision < 0 || revision <= maxRevision) {
        throw new TypeError("Rig transition revision must be a new non-negative safe integer");
      }
      const profileId = typeof input.profileId === "string" ? input.profileId.trim() : "";
      const profile = profiles.get(profileId);
      if (!profile) throw new TypeError(`Unknown rig transition profile: ${input.profileId}`);
      const unavailable = input.unavailableAssetKeys ?? [];
      if (!Array.isArray(unavailable) || unavailable.some(
        (key) => typeof key !== "string" || !key.trim()
      )) {
        throw new TypeError("unavailableAssetKeys must be an array of non-empty strings");
      }
      const transitionRig = globalThis.PartAssemblyDiff.snapshot({
        id: `transition-${revision}`,
        parts: input.transitionParts ?? [],
      });
      return Object.freeze({
        revision,
        profile,
        from: globalThis.PartAssemblyDiff.snapshot(input.from),
        to: globalThis.PartAssemblyDiff.snapshot(input.to),
        transitionParts: transitionRig.parts,
        parameters: cloneData(input.parameters ?? {}, "request.parameters"),
        unavailable: new Set(unavailable.map((key) => key.trim())),
        reason: typeof input.reason === "string" ? input.reason : "unspecified",
      });
    }
  }

  globalThis.TransitionProfile = TransitionProfile;
})();
