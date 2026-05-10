// Galaxy Runner - core
// Split from the original single-file prototype so each system can evolve independently.

const PLAYFIELD = Object.freeze({
  width: 960,
  height: 540,
});

const DEV_TOOLS = Object.freeze({
  finalShipStartupPicker: false,
});

const BALANCE = Object.freeze({
  statScale: 10,
  basePlayerHealth: 100,
  armorMaxLevel: 5,
  armorHealthStep: 20,
  repairAmount: 35,
  repairOverflowScore: 180,
  armorPickupMinHeal: 20,
  baseFireDelay: 1 / 3,
  enemyBulletBaseDamage: 10,
  enemyBulletLevelDamage: 5,
  enemyBulletDangerStep: 1,
  enemyFallbackDamage: 10,
  enemyCollisionDamage: 28,
  bossCollisionDamage: 42,
  novaExplosionDuration: 0.72,
  novaExplosionTickDelay: 0.18,
  novaExplosionDamageRatio: 0.22,
  shieldMax: 50,
  shieldPickupAmount: 10,
  shieldRechargeSeconds: 10,
  shieldDefenseMaxLevel: 10,
  shieldDefensePerLevel: 0.5,
  heavyShipBaseDefense: 1,
  heavyShipDefensePerLevel: 0.5,
  heavyShipDefenseMax: 5.5,
  totalDefenseMax: 10.5,
  shieldImpactDuration: 0.45,
});

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
