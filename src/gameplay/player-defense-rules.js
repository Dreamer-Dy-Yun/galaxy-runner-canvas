// Galaxy Runner - player defense rules
// Owns player defense profiles, the effective flat cap, and minimum HP damage.

(() => {
  const PLAYER_DEFENSE_RULES = Object.freeze({
    flatCap: BALANCE.playerFlatDefenseMax,
    minimumHealthDamage: 1,
    maxPercentReduction: 0.85,
    profiles: Object.freeze({
      default: Object.freeze({ outerFlat: 1, percent: 0.05, innerFlat: 1 }),
      rapid: Object.freeze({ outerFlat: 0, percent: 0.04, innerFlat: 0 }),
      spread: Object.freeze({ outerFlat: 1, percent: 0.06, innerFlat: 1 }),
      energy: Object.freeze({ outerFlat: 2, percent: 0.12, innerFlat: 2 }),
      nova: Object.freeze({ outerFlat: 3, percent: 0.08, innerFlat: 2 }),
    }),
  });

  globalThis.PLAYER_DEFENSE_RULES = PLAYER_DEFENSE_RULES;
})();
