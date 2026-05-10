// Galaxy Runner - weapon system
// Keeps weapon math out of Player so visuals can evolve independently.

class WeaponSystem {
  static coreDamageMultiplier(player, kind) {
    const coreLevel = typeof player.weaponCoreLevel === "function" ? player.weaponCoreLevel(kind) : 0;
    return WeaponCatalog.coreDamageMultiplier(kind, coreLevel);
  }

  static applyCoreDamage(player, kind, damage) {
    return damage * WeaponSystem.coreDamageMultiplier(player, kind);
  }

  static currentMoveSpeed(player) {
    const kind = typeof player.activeWeaponKind === "function" ? player.activeWeaponKind() : null;
    const level = typeof player.activeWeaponLevel === "function" ? player.activeWeaponLevel() : 0;
    return player.speed * WeaponCatalog.moveSpeedMultiplier(kind, level);
  }

  static visualScale(player) {
    const kind = typeof player.activeWeaponKind === "function" ? player.activeWeaponKind() : null;
    const level = typeof player.activeWeaponLevel === "function" ? player.activeWeaponLevel() : 0;
    return WeaponCatalog.visualScale(kind, level);
  }

  static hitboxScale(player) {
    const kind = typeof player.activeWeaponKind === "function" ? player.activeWeaponKind() : null;
    const level = typeof player.activeWeaponLevel === "function" ? player.activeWeaponLevel() : 0;
    return WeaponCatalog.hitboxScale(kind, level);
  }

  static currentFireDelay(player) {
    if (player.rapidLevel > 0) {
      const baseRate = 1 / player.fireDelay;
      const rapidRate = baseRate * (1.25 ** player.rapidLevel);
      return 1 / rapidRate;
    }

    if (player.energyLevel > 0) return player.fireDelay + 0.08;
    if (player.novaLevel > 0) return player.fireDelay + 0.16;
    return player.fireDelay;
  }

  static mainShot(player) {
    const energyLevel = player.energyLevel;
    const rapidLevel = player.rapidLevel;
    const novaLevel = player.novaLevel;

    if (energyLevel > 0) {
      return {
        radius: WeaponCatalog.projectileRadius("energy", energyLevel),
        damage: WeaponSystem.applyCoreDamage(player, "energy", (2 + energyLevel) * BALANCE.statScale),
        speed: -500,
        color: "#55f0ff",
        kind: "energy",
        pierce: Math.max(0, energyLevel - 4),
        blastRadius: 0,
        absorbLevel: WeaponCatalog.projectileAbsorbLevel("energy", energyLevel),
      };
    }

    if (novaLevel > 0) {
      return {
        radius: WeaponCatalog.projectileRadius("nova", novaLevel),
        damage: WeaponSystem.applyCoreDamage(player, "nova", (2 + Math.ceil(novaLevel * 0.75)) * BALANCE.statScale),
        speed: WeaponCatalog.projectileSpeed("nova", novaLevel),
        color: "#ff8f5a",
        kind: "nova",
        pierce: 0,
        blastRadius: WeaponCatalog.projectileBlastRadius("nova", novaLevel),
        blastDuration: WeaponCatalog.projectileBlastDuration("nova", novaLevel),
      };
    }

    if (rapidLevel > 0) {
      return {
        radius: 4.5,
        damage: WeaponSystem.applyCoreDamage(
          player,
          "rapid",
          (1 + Math.floor((rapidLevel - 1) / 5)) * BALANCE.statScale * WeaponCatalog.projectileDamageMultiplier("rapid")
        ),
        speed: WeaponCatalog.projectileSpeed("rapid"),
        color: "#ffe06a",
        kind: "rapid",
        pierce: 0,
        blastRadius: 0,
      };
    }

    return {
      radius: 4,
      damage: BALANCE.statScale,
      speed: -590,
      color: "#d8ff9d",
      kind: "bolt",
      pierce: 0,
      blastRadius: 0,
    };
  }

  static spreadAngles(level) {
    if (level <= 0) return [];
    const count = Math.min(11, Math.max(2, level + 1));
    if (count === 2) return [30, 60];

    const min = 15;
    const max = 75;
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, index) => min + step * index);
  }
}
