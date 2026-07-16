// Gameplay-agnostic rig pose and assembly transition coordinator.
(() => {
  if (globalThis.RigAnimationEngine) return;
  const EMPTY_RIG = Object.freeze({ id: "empty", parts: Object.freeze([]) });
  const ROLES = Object.freeze(["source", "target"]);
  class RigAnimationEngine {
    constructor({ profiles, strategies = {}, onError = null } = {}) {
      for (const dependency of ["RigAnimationTimeline", "PoseChannelState", "PartAssemblyDiff", "TransitionProfile"]) {
        if (typeof globalThis[dependency] !== "function") throw new Error(`Missing engine dependency: ${dependency}`);
      }
      if (onError !== null && typeof onError !== "function") {
        throw new TypeError("RigAnimationEngine.onError must be a function");
      }
      this.strategies = globalThis.TransitionProfile.createStrategyRegistry(strategies);
      this.profiles = globalThis.TransitionProfile.createRegistry(profiles, new Set(this.strategies.keys()));
      this.poseState = new globalThis.PoseChannelState();
      this.onError = onError;
      this.reducedMotion = false;
      this.paused = false;
      this.reset(EMPTY_RIG);
    }
    start(request) {
      const validated = globalThis.TransitionProfile.validateRequest(request, {
        profiles: this.profiles,
        currentRevision: this.revision,
        pendingRevision: this.pending?.revision ?? -1,
      });
      if (this.active) {
        if (validated.profile.interruption === "queue-latest") {
          this.pending = validated;
          return this.frame;
        }
        const source = validated.profile.interruption === "finish-current"
          ? this.active.to
          : globalThis.PartAssemblyDiff.fromFrame(this.frame, `frame-${this.revision}`);
        this.active = null;
        this.pending = null;
        return this.begin({ ...validated, from: source });
      }
      return this.begin(validated);
    }
    begin(request) {
      const diff = globalThis.PartAssemblyDiff.create(request.from, request.to);
      const transientChanges = request.transitionParts.map((part) => Object.freeze({
        kind: "transient", id: part.id, from: part, to: part,
      }));
      this.revision = request.revision;
      this.currentRig = request.from;
      this.activeProfile = request.profile;
      this.poseState.configure(this.activeProfile.poseChannels);
      this.unavailable = request.unavailable;
      this.errors = [];
      this.degraded = false;
      const requestedParts = [...request.to.parts, ...request.transitionParts];
      const missing = requestedParts.filter((part) => request.unavailable.has(part.assetKey));
      if (missing.length > 0 && request.profile.fallback.asset !== "skip-part") {
        this.recordFailure("asset-unavailable", new Error("Target rig assets are unavailable"), {
          assetKeys: Object.freeze(missing.map((part) => part.assetKey)),
        });
        this.currentRig = request.profile.fallback.asset === "settle-target" ? request.to : request.from;
        this.active = null;
        this.frame = this.stableFrame(false);
        return this.frame;
      }
      if ((!diff.changed && transientChanges.length === 0)
        || (this.reducedMotion && request.profile.reducedMotion.mode === "settle-target")) {
        this.currentRig = request.to;
        this.active = null;
        this.frame = this.stableFrame();
        return this.frame;
      }
      const phases = this.reducedMotion
        ? [{ id: "reduced-motion", duration: request.profile.reducedMotion.duration, easing: "linear" }]
        : request.profile.phases;
      this.active = {
        ...request,
        diff,
        changes: Object.freeze([...diff.all, ...transientChanges]),
        timeline: new globalThis.RigAnimationTimeline(phases),
      };
      if (missing.length > 0) {
        this.recordFailure("asset-unavailable", new Error("Some rig parts were skipped"), {
          assetKeys: Object.freeze(missing.map((part) => part.assetKey)),
        });
      }
      this.active.timeline.setPaused(this.paused);
      this.recompose();
      return this.frame;
    }
    setPose(channel, value) {
      if (!this.poseState.setTarget(channel, value)) return this.frame;
      this.recompose();
      return this.frame;
    }
    setPaused(paused) {
      this.paused = Boolean(paused);
      this.active?.timeline.setPaused(this.paused);
      this.poseState.setPaused(this.paused);
      this.recompose();
      return this.frame;
    }
    setReducedMotion(reduced) {
      const next = Boolean(reduced);
      if (next === this.reducedMotion) return this.frame;
      this.reducedMotion = next;
      this.poseState.setReducedMotion(next);
      if (next && this.active) {
        if (this.active.profile.reducedMotion.mode === "settle-target") return this.settle();
        const source = globalThis.PartAssemblyDiff.fromFrame(this.frame, `frame-${this.revision}`);
        const request = { ...this.active, from: source };
        request.diff = globalThis.PartAssemblyDiff.create(source, request.to);
        request.changes = Object.freeze([...request.diff.all, ...request.changes.filter(
          (change) => change.kind === "transient"
        )]);
        request.timeline = new globalThis.RigAnimationTimeline([{
          id: "reduced-motion",
          duration: request.profile.reducedMotion.duration,
          easing: "linear",
        }]);
        request.timeline.setPaused(this.paused);
        this.currentRig = source;
        this.active = request;
      }
      this.recompose();
      return this.frame;
    }
    update(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
        throw new TypeError("RigAnimationEngine.update requires a finite non-negative deltaSeconds");
      }
      const poseChanged = this.poseState.update(deltaSeconds);
      if (!this.active) {
        if (poseChanged) this.recompose();
        return this.frame;
      }
      this.active.timeline.update(deltaSeconds);
      if (this.active.timeline.snapshot().completed) return this.completeTransition();
      this.recompose();
      return this.frame;
    }
    completeTransition() {
      this.currentRig = this.active.to;
      this.active = null;
      this.frame = this.stableFrame();
      if (this.pending) {
        const pending = this.pending;
        this.pending = null;
        return this.begin({ ...pending, from: this.currentRig });
      }
      return this.frame;
    }
    settle() {
      if (this.active) this.currentRig = this.active.to;
      this.active = null;
      this.pending = null;
      this.frame = this.stableFrame();
      return this.frame;
    }
    reset(rig = EMPTY_RIG, profileId = null) {
      const validated = globalThis.PartAssemblyDiff.snapshot(rig);
      const profile = profileId === null ? null : this.profiles.get(profileId);
      if (profileId !== null && !profile) throw new TypeError(`Unknown transition profile: ${profileId}`);
      this.currentRig = validated;
      this.active = null;
      this.pending = null;
      this.activeProfile = profile;
      this.revision = -1;
      this.poseState.reset(profile?.poseChannels ?? {});
      this.poseState.setReducedMotion(this.reducedMotion);
      this.unavailable = new Set();
      this.errors = [];
      this.degraded = false;
      this.paused = false;
      this.frame = this.stableFrame(false);
      return this.frame;
    }
    snapshot() { return this.frame; }
    recompose() {
      try {
        this.frame = this.active ? this.transitionFrame() : this.stableFrame();
      } catch (error) {
        this.handleStrategyFailure(error);
      }
    }
    transitionFrame() {
      const timeline = this.active.timeline.snapshot();
      const totalProgress = timeline.totalDuration === 0 ? 1 : timeline.elapsed / timeline.totalDuration;
      const parts = [];
      for (const change of this.active.changes) {
        const motion = this.active.profile.motions[change.kind];
        const timingPart = change.to ?? change.from;
        const timingBasis = motion.timing.scope === "phase" ? timeline.progress : totalProgress;
        const localProgress = globalThis.RigAnimationTimeline.partProgress(timingPart, motion.timing, timingBasis);
        const phase = motion.timing.scope === "phase"
          ? Object.freeze({ ...timeline, progress: localProgress, easedProgress: localProgress })
          : timeline;
        const output = this.invoke(motion.strategyId, Object.freeze({
          kind: "transition",
          change,
          phase,
          transitionProgress: motion.timing.scope === "transition" ? localProgress : totalProgress,
          profileParameters: this.active.profile.parameters,
          motionParameters: motion.parameters,
          requestParameters: this.active.parameters,
        }));
        for (const role of ROLES) {
          if (!output?.[role]) continue;
          const part = role === "source" ? change.from : change.to;
          if (!part || this.shouldSkip(part)) continue;
          const transform = this.patchTransform(part.transform, output[role], `strategy ${motion.strategyId}`);
          parts.push(globalThis.PartAssemblyDiff.framePart(part, transform, change.kind, role));
        }
      }
      return this.makeFrame(parts, timeline);
    }
    stableFrame(applyPose = true) {
      const visible = this.currentRig.parts.filter((part) => this.activeProfile?.fallback.asset !== "skip-part" || !this.unavailable.has(part.assetKey));
      const parts = visible.map((part) => globalThis.PartAssemblyDiff.framePart(
        part, part.transform, "retained", "target"
      ));
      return this.makeFrame(parts, Object.freeze({
        phase: "idle", progress: 1, easedProgress: 1, completed: true, paused: this.paused,
      }), applyPose);
    }
    makeFrame(parts, timeline, applyPose = true) {
      const posed = applyPose ? parts.map((part) => this.applyPose(part)) : parts;
      posed.sort((left, right) => left.zIndex - right.zIndex || left.renderId.localeCompare(right.renderId));
      return Object.freeze({
        revision: this.revision,
        rigId: this.active?.to.id ?? this.currentRig.id,
        active: Boolean(this.active),
        phase: timeline.phase,
        progress: timeline.progress,
        easedProgress: timeline.easedProgress,
        paused: this.paused,
        reducedMotion: this.reducedMotion,
        degraded: this.degraded,
        errors: Object.freeze([...this.errors]),
        parts: Object.freeze(posed),
      });
    }
    applyPose(part) {
      let transform = part.transform;
      if (!this.activeProfile) return part;
      for (const [channel, value] of this.poseState.entries()) {
        const motion = this.activeProfile.poseChannels[channel];
        if (!motion) continue;
        const output = this.invoke(motion.strategyId, Object.freeze({
          kind: "pose", channel, value, part, transform,
          profileParameters: this.activeProfile.parameters,
          motionParameters: motion.parameters,
        }));
        const delta = output?.delta ?? {};
        transform = this.patchTransform(transform, {
          x: transform.x + (delta.x ?? 0),
          y: transform.y + (delta.y ?? 0),
          rotation: transform.rotation + (delta.rotation ?? 0),
          opacity: transform.opacity * (delta.opacity ?? 1),
        }, `pose strategy ${motion.strategyId}`);
      }
      return globalThis.PartAssemblyDiff.framePart(part, transform, part.change, part.role);
    }
    invoke(strategyId, context) {
      const output = this.strategies.get(strategyId)(context);
      if (!output || typeof output !== "object" || Array.isArray(output)) throw new TypeError(`Invalid strategy output: ${strategyId}`);
      if (context.kind === "pose" && (!output.delta || typeof output.delta !== "object")) throw new TypeError(`Missing pose delta: ${strategyId}`);
      return output;
    }
    patchTransform(base, patch, label) {
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        throw new TypeError(`${label} must return a transform descriptor`);
      }
      return globalThis.PartAssemblyDiff.transform({ ...base, ...patch }, `${label} transform`);
    }
    shouldSkip(part) {
      return this.active?.profile.fallback.asset === "skip-part"
        && this.active.unavailable.has(part.assetKey);
    }
    handleStrategyFailure(error) {
      const fallback = this.activeProfile?.fallback.strategy ?? "hold-source";
      this.recordFailure("strategy-failed", error, { fallback });
      if (this.active) this.currentRig = fallback === "settle-target" ? this.active.to : this.active.from;
      this.active = null;
      this.pending = null;
      this.frame = this.stableFrame(false);
    }
    recordFailure(code, error, details) {
      const record = Object.freeze({ code,
        message: error instanceof Error ? error.message : String(error), ...details });
      this.degraded = true;
      this.errors.push(record);
      try {
        this.onError?.(error, Object.freeze({ engine: this, record }));
      } catch (handlerError) {
        globalThis.console?.error?.("[RigAnimationEngine] onError failed", handlerError);
      }
    }
  }
  globalThis.RigAnimationEngine = RigAnimationEngine;
})();
