// Galaxy Runner - player defense system
// Resolves the documented defense layers without owning Player state or rendering.

(() => {
  class PlayerDefenseSystem {
    static profile(player) {
      const kind = player?.activeWeaponKind?.() || "default";
      return PLAYER_DEFENSE_RULES.profiles[kind] || PLAYER_DEFENSE_RULES.profiles.default;
    }

    static shipDefense(player) {
      const level = Math.max(player?.energyLevel || 0, player?.novaLevel || 0);
      if (level <= 0) return 0;
      return Math.min(
        BALANCE.heavyShipDefenseMax,
        BALANCE.heavyShipBaseDefense + (level - 1) * BALANCE.heavyShipDefensePerLevel
      );
    }

    static shieldDefense(player) {
      return Math.max(0, player?.shieldDefenseLevel || 0) * BALANCE.shieldDefensePerLevel;
    }

    static snapshot(player) {
      const profile = PlayerDefenseSystem.profile(player);
      const flatCap = Math.max(0, PLAYER_DEFENSE_RULES.flatCap);
      const requestedOuter = Math.max(0, (profile.outerFlat || 0) + PlayerDefenseSystem.shipDefense(player));
      const outerFlat = Math.min(flatCap, requestedOuter);
      const requestedInner = Math.max(0, (profile.innerFlat || 0) + PlayerDefenseSystem.shieldDefense(player));
      const innerFlat = Math.min(Math.max(0, flatCap - outerFlat), requestedInner);
      const percent = clampNumber(profile.percent || 0, 0, PLAYER_DEFENSE_RULES.maxPercentReduction);

      return Object.freeze({
        outerFlat,
        percent,
        innerFlat,
        flatTotal: outerFlat + innerFlat,
        flatCap,
        minimumHealthDamage: PLAYER_DEFENSE_RULES.minimumHealthDamage,
      });
    }

    static resolveIncomingDamage(player, rawDamage) {
      const incoming = Number.isFinite(rawDamage) ? Math.max(0, rawDamage) : 0;
      if (incoming <= 0) return 0;

      const defense = PlayerDefenseSystem.snapshot(player);
      const afterOuter = Math.max(0, incoming - defense.outerFlat);
      const afterPercent = afterOuter * (1 - defense.percent);
      const afterInner = Math.max(0, afterPercent - defense.innerFlat);
      return Math.max(defense.minimumHealthDamage, afterInner);
    }
  }

  globalThis.PlayerDefenseSystem = PlayerDefenseSystem;
})();
