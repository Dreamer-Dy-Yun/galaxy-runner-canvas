// Galaxy Runner - drone system
// Owns drone level progression, count, fire rate, and damage rules.

class DroneSystem {
  static maxLevel = DRONE_CONFIG.maxLevel;
  static maxCount = DRONE_CONFIG.maxCount;

  static count(level) {
    return Math.min(DroneSystem.maxCount, level);
  }

  static fireDelay(level, index) {
    const count = DroneSystem.count(level);
    const baseDroneRate = 1 / DRONE_CONFIG.baseFireInterval;

    if (level <= DRONE_CONFIG.earlyLevelMax) {
      const levelThreeTotalRate = baseDroneRate * DRONE_CONFIG.earlyLevelMax;
      const levelOneTotalRate = levelThreeTotalRate / DRONE_CONFIG.levelOneRateDivisor;
      const t = count <= 1 ? 0 : (count - 1) / (DRONE_CONFIG.earlyLevelMax - 1);
      const totalRate = levelOneTotalRate + (levelThreeTotalRate - levelOneTotalRate) * t;
      return count / totalRate;
    }

    return 1 / (baseDroneRate * (DRONE_CONFIG.upgradeRateMultiplier ** DroneSystem.upgradeCount(level, index)));
  }

  static upgradeCount(level, index) {
    const upgrades = Math.max(0, level - DRONE_CONFIG.earlyLevelMax);
    return (
      Math.floor(upgrades / DRONE_CONFIG.upgradesPerCycle) +
      (index < upgrades % DRONE_CONFIG.upgradesPerCycle ? 1 : 0)
    );
  }

  static damage(level) {
    return (
      (level >= DRONE_CONFIG.highDamageLevel ? DRONE_CONFIG.highDamageMultiplier : DRONE_CONFIG.baseDamageMultiplier) *
      BALANCE.statScale
    );
  }
}
