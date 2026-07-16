// Converts Player movement/progression into the generic rig engine contract.

(() => {
  class PlayerRigAnimationAdapter {
    constructor(player, art) {
      this.player = player;
      this.art = art;
      this.engine = new RigAnimationEngine({
        profiles: PlayerAnimationProfiles.all(),
        onError: (error, context) => console.error("[PlayerRigAnimationAdapter]", error, context.record),
      });
      this.nextRevision = 0;
      this.engine.setReducedMotion(this.prefersReducedMotion());
      this.reset();
    }

    reset() {
      const kind = this.player.activeWeaponKind?.() ?? null;
      const level = this.player.activeWeaponLevel?.() ?? 0;
      this.nextRevision = 0;
      return this.engine.reset(
        PlayerRigCatalog.snapshot(kind, level),
        PlayerAnimationProfiles.idFor("route-choice")
      );
    }

    update(deltaSeconds) {
      this.engine.setPose("bank", this.player.bankAmount());
      return this.engine.update(deltaSeconds);
    }

    handleProgressionResult(result, context = {}) {
      const change = result?.rigChange;
      if (!change?.from || !change?.to) return false;
      const from = PlayerRigCatalog.snapshot(change.from.kind, change.from.level);
      const to = PlayerRigCatalog.snapshot(change.to.kind, change.to.level);
      const transitionParts = PlayerRigCatalog.transitionParts(change.to.kind);
      const requiredKeys = Object.freeze([
        ...to.parts.map((part) => part.assetKey),
        ...transitionParts.map((part) => part.assetKey),
      ]);
      this.nextRevision += 1;
      this.engine.start({
        revision: this.nextRevision,
        from,
        to,
        transitionParts,
        profileId: PlayerAnimationProfiles.idFor(context.reason),
        reason: context.reason || result.outcome || "progression",
        parameters: Object.freeze({ outcome: result.outcome || "unknown" }),
        unavailableAssetKeys: this.art.unavailableAssetKeys(requiredKeys),
      });
      return true;
    }

    snapshot() {
      return this.engine.snapshot();
    }

    settle() {
      return this.engine.settle();
    }

    setPaused(paused) {
      return this.engine.setPaused(paused);
    }

    prefersReducedMotion() {
      return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }

  globalThis.PlayerRigAnimationAdapter = PlayerRigAnimationAdapter;
})();
