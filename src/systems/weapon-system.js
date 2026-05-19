// Galaxy Runner - weapon system
// Keeps weapon math out of Player so visuals can evolve independently.

class WeaponSystem {
  static activeKind(player) {
    return typeof player.activeWeaponKind === "function" ? player.activeWeaponKind() : null;
  }

  static weaponLevel(player, kind) {
    if (!kind) return 0;
    return typeof player.weaponLevel === "function" ? player.weaponLevel(kind) : 0;
  }

  static activeLevel(player) {
    return WeaponSystem.weaponLevel(player, WeaponSystem.activeKind(player));
  }

  static baseDamage(scale = 1) {
    const safeScale = Number.isFinite(scale) ? scale : 1;
    return BALANCE.statScale * (BALANCE.weaponDamageMultiplier ?? 1) * safeScale;
  }

  static coreDamageMultiplier(player, kind) {
    const coreLevel = typeof player.weaponCoreLevel === "function" ? player.weaponCoreLevel(kind) : 0;
    return WeaponCatalog.coreDamageMultiplier(kind, coreLevel);
  }

  static applyCoreDamage(player, kind, damage) {
    return damage * WeaponSystem.coreDamageMultiplier(player, kind);
  }

  static scaledWeaponDamage(player, kind, baseScale = 1, options = {}) {
    const level = options.level ?? WeaponSystem.weaponLevel(player, kind);
    const levelStep = Number.isFinite(options.levelStep) ? options.levelStep : 0;
    const levelScale = 1 + Math.max(0, level - 1) * levelStep;
    const projectileScale = options.includeProjectileMultiplier === false
      ? 1
      : WeaponCatalog.projectileDamageMultiplier(kind);

    return WeaponSystem.applyCoreDamage(
      player,
      kind,
      WeaponSystem.baseDamage(baseScale) * levelScale * projectileScale
    );
  }

  static currentMoveSpeed(player) {
    const kind = WeaponSystem.activeKind(player);
    const level = WeaponSystem.activeLevel(player);
    return player.speed * WeaponCatalog.moveSpeedMultiplier(kind, level);
  }

  static visualScale(player) {
    const kind = WeaponSystem.activeKind(player);
    const level = WeaponSystem.activeLevel(player);
    return WeaponCatalog.visualScale(kind, level);
  }

  static hitboxScale(player) {
    const kind = WeaponSystem.activeKind(player);
    const level = WeaponSystem.activeLevel(player);
    return WeaponCatalog.hitboxScale(kind, level);
  }

  static currentFireDelay(player) {
    const kind = WeaponSystem.activeKind(player);
    const level = WeaponSystem.weaponLevel(player, kind);
    const baseDelay = Number.isFinite(player.fireDelay) ? player.fireDelay : BALANCE.baseFireDelay;

    if (kind === "spread") return PLAYER_CONFIG.fire.spreadDelay;

    if (kind === "rapid") {
      const baseRate = 1 / baseDelay;
      const rapidRate = baseRate * (1.25 ** level);
      return 1 / rapidRate;
    }

    if (kind === "energy") return baseDelay + 0.08;
    if (kind === "nova") return baseDelay + 0.16;
    return baseDelay;
  }

  static mainShot(player) {
    const kind = WeaponSystem.activeKind(player);
    const level = WeaponSystem.weaponLevel(player, kind);

    if (kind === "energy") {
      return {
        radius: WeaponCatalog.projectileRadius("energy", level),
        damage: WeaponSystem.scaledWeaponDamage(
          player,
          "energy",
          2.6 + level * 1.65 + Math.max(0, level - 6) * 0.45
        ),
        speed: -500,
        color: "#55f0ff",
        kind: "energy",
        pierce: Math.max(0, level - 4),
        blastRadius: 0,
        absorbLevel: WeaponCatalog.projectileAbsorbLevel("energy", level),
      };
    }

    if (kind === "nova") {
      return {
        radius: WeaponCatalog.projectileRadius("nova", level),
        damage: WeaponSystem.scaledWeaponDamage(player, "nova", 2.6 + level * 1.1),
        speed: WeaponCatalog.projectileSpeed("nova", level),
        color: "#ff8f5a",
        kind: "nova",
        pierce: 0,
        blastRadius: WeaponCatalog.projectileBlastRadius("nova", level),
        blastDuration: WeaponCatalog.projectileBlastDuration("nova", level),
      };
    }

    if (kind === "rapid") {
      return {
        radius: 4.5,
        damage: 25 + Math.max(0, level - 1) * (25 / 9),
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

  static spreadSideShot(player) {
    const level = WeaponSystem.weaponLevel(player, "spread");
    return {
      speed: WeaponCatalog.projectileSpeed("spread", level),
      radius: PLAYER_CONFIG.fire.spreadRadius,
      damage: WeaponSystem.scaledWeaponDamage(player, "spread", 1, {
        levelStep: 0.0631,
      }),
      color: "#b7ff7b",
      kind: "spread",
    };
  }

  static spreadAngles(level) {
    if (level <= 0) return [];
    const count = Math.min(11, Math.max(2, level + 1));
    if (count === 2) return [-7, 24];

    const min = -8;
    const max = 58;
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, index) => min + step * index);
  }
}
