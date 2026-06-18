// Galaxy Runner - special skill system
// Ctrl spends a slowly building meter. This is separate from any future hold-to-charge system.

class SpecialSystem {
  static isSpecialDown(input) {
    return input.isDown("special");
  }

  static update(player, dt, game) {
    SpecialSystem.gain(player, SPECIAL_CONFIG.passiveRegenPerSecond * dt);

    const specialDown = SpecialSystem.isSpecialDown(game.input);
    if (specialDown && !player.wasSpecialDown) {
      SpecialSystem.tryUse(player, game);
    }

    player.wasSpecialDown = specialDown;
  }

  static gain(player, amount) {
    if (SpecialSystem.hasOverdrive(player)) {
      player.specialMeter = SPECIAL_CONFIG.meterMax;
      return;
    }
    player.specialMeter = clampNumber((player.specialMeter || 0) + amount, 0, SPECIAL_CONFIG.meterMax);
  }

  static awardKill(player, enemy) {
    const level = typeof enemy.specialRewardLevel === "function" ? enemy.specialRewardLevel() : 1;
    const bossBonus = enemy.role === "boss" ? SPECIAL_CONFIG.killGain.bossBonus : enemy.role === "midboss" ? SPECIAL_CONFIG.killGain.midBossBonus : 0;
    SpecialSystem.gain(player, SPECIAL_CONFIG.killGain.base + level * SPECIAL_CONFIG.killGain.perThreatLevel + bossBonus);
  }

  static percent(player) {
    return Math.floor(SpecialSystem.currentMeter(player));
  }

  static readiness(player) {
    const kind = player.activeWeaponKind?.();
    if (!kind) return 0;
    const cost = SpecialSystem.minimumCost(kind);
    if (cost <= 0) return 0;
    return clampNumber(SpecialSystem.currentMeter(player) / cost, 0, 1);
  }

  static minimumCost(kind) {
    if (kind === "nova") return SPECIAL_CONFIG.nova.cost;
    return SPECIAL_CONFIG.tierCosts[SPECIAL_CONFIG.tierCosts.length - 1] ?? SPECIAL_CONFIG.meterMax;
  }

  static hasOverdrive(player) {
    return (player.specialOverdriveTimer || 0) > 0;
  }

  static currentMeter(player) {
    if (SpecialSystem.hasOverdrive(player)) return SPECIAL_CONFIG.meterMax;
    return clampNumber(player.specialMeter || 0, 0, SPECIAL_CONFIG.meterMax);
  }

  static tierCost(player) {
    const meter = SpecialSystem.currentMeter(player);
    for (const cost of SPECIAL_CONFIG.tierCosts) {
      if (meter >= cost) return cost;
    }
    return 0;
  }

  static canSpend(player, cost) {
    return Number.isFinite(cost) && cost > 0 && SpecialSystem.currentMeter(player) >= cost;
  }

  static spend(player, cost) {
    if (!SpecialSystem.canSpend(player, cost)) return false;
    if (SpecialSystem.hasOverdrive(player)) {
      player.specialMeter = SPECIAL_CONFIG.meterMax;
      return true;
    }
    player.specialMeter = clampNumber(SpecialSystem.currentMeter(player) - cost, 0, SPECIAL_CONFIG.meterMax);
    return true;
  }

  static tryUse(player, game) {
    const kind = player.activeWeaponKind?.();
    if (!kind) return false;

    if (kind === "nova") return SpecialSystem.dropNovaMine(player, game);

    const cost = SpecialSystem.tierCost(player);
    if (cost <= 0 || !SpecialSystem.canSpend(player, cost) || !SpecialSystem.tierConfig(kind, cost)) return false;

    let fired = false;
    if (kind === "rapid") fired = SpecialSystem.fireRapid(player, game, cost);
    else if (kind === "energy") fired = SpecialSystem.fireEnergy(player, game, cost);
    else if (kind === "spread") fired = SpecialSystem.fireSpread(player, game, cost);

    if (!fired) return false;
    SpecialSystem.spend(player, cost);

    return true;
  }

  static level(player, kind) {
    return WeaponSystem.weaponLevel(player, kind) || 1;
  }

  static scaledDamage(player, kind, baseScale, levelStep) {
    return WeaponSystem.scaledWeaponDamage(player, kind, baseScale, { levelStep });
  }

  static tierConfig(kind, cost) {
    const config = SPECIAL_CONFIG[kind];
    return config?.tiers?.[cost] ?? null;
  }

  static activeNovaMineCount(game) {
    if (Array.isArray(game?.bullets)) {
      return game.bullets.filter((bullet) => bullet.kind === SPECIAL_CONFIG.nova.mineKind).length;
    }
    if (typeof game?.novaMineCount === "function") return game.novaMineCount();
    return SPECIAL_CONFIG.nova.maxMines;
  }

  static fireRapid(player, game, cost) {
    const tier = SpecialSystem.tierConfig("rapid", cost);
    if (!tier) return false;

    const beamLength = player.y + SPECIAL_CONFIG.rapid.beamLengthPadding;
    const damage = SpecialSystem.scaledDamage(player, "rapid", tier.damageScale, SPECIAL_CONFIG.rapid.levelDamageStep);

    game.addBullet(player.x, player.y - beamLength / 2, 0, 0, tier.width / 2, damage, SPECIAL_CONFIG.rapid.color, "rapidBeam", {
      beamWidth: tier.width,
      beamLength,
      pierce: Infinity,
      life: tier.duration,
      hitInterval: SPECIAL_CONFIG.rapid.hitInterval,
      followPlayer: true,
    });
    game.burst(player.x, player.y - PLAYER_CONFIG.fire.yOffset, SPECIAL_CONFIG.rapid.color, tier.burst);
    return true;
  }

  static fireEnergy(player, game, cost) {
    const tier = SpecialSystem.tierConfig("energy", cost);
    if (!tier) return false;

    const damage = SpecialSystem.scaledDamage(player, "energy", tier.damageScale, SPECIAL_CONFIG.energy.levelDamageStep);

    game.addBullet(player.x, player.y - SPECIAL_CONFIG.energy.yOffset, 0, tier.speed, tier.radius, damage, SPECIAL_CONFIG.energy.color, "energy", {
      pierce: Infinity,
      hitInterval: tier.hitInterval,
      absorbLevel: tier.absorbLevel,
      life: tier.life,
      energyCore: true,
      releaseRadius: tier.releaseRadius,
      releaseDamageScale: tier.releaseDamageScale,
      releaseBurst: tier.releaseBurst,
      releaseHitBurst: tier.releaseHitBurst,
    });
    game.burst(player.x, player.y - SPECIAL_CONFIG.energy.yOffset, SPECIAL_CONFIG.energy.color, tier.burst);
    return true;
  }

  static fireSpread(player, game, cost) {
    const tier = SpecialSystem.tierConfig("spread", cost);
    if (!tier) return false;

    const damage = SpecialSystem.scaledDamage(player, "spread", tier.damageScale, SPECIAL_CONFIG.spread.levelDamageStep);

    for (let i = 0; i < tier.shots; i += 1) {
      const angle = tier.shots === 1 ? 0 : -tier.span / 2 + (tier.span * i) / (tier.shots - 1);
      const rad = (angle * Math.PI) / 180;
      game.addBullet(
        player.x,
        player.y - SPECIAL_CONFIG.spread.yOffset,
        Math.sin(rad) * tier.speed,
        -Math.cos(rad) * tier.speed,
        tier.radius,
        damage,
        SPECIAL_CONFIG.spread.color,
        "spread",
        { pierce: tier.pierce, life: tier.life }
      );
    }
    game.burst(player.x, player.y - SPECIAL_CONFIG.spread.yOffset, SPECIAL_CONFIG.spread.color, tier.burst);
    return true;
  }

  static dropNovaMine(player, game) {
    const cost = SPECIAL_CONFIG.nova.cost;
    if (SpecialSystem.activeNovaMineCount(game) >= SPECIAL_CONFIG.nova.maxMines) return false;
    if (!SpecialSystem.canSpend(player, cost)) return false;

    const level = SpecialSystem.level(player, "nova");
    const damage = SpecialSystem.scaledDamage(player, "nova", SPECIAL_CONFIG.nova.damageScale, 0);
    const blastRadius = WeaponCatalog.projectileBlastRadius("nova", level) * SPECIAL_CONFIG.nova.blastRadiusScale;
    const blastDuration = WeaponCatalog.projectileBlastDuration("nova", level) * SPECIAL_CONFIG.nova.blastDurationScale;

    game.addBullet(
      player.x,
      player.y - SPECIAL_CONFIG.nova.yOffset,
      0,
      SPECIAL_CONFIG.nova.speed,
      SPECIAL_CONFIG.nova.radius,
      damage,
      SPECIAL_CONFIG.nova.color,
      SPECIAL_CONFIG.nova.mineKind,
      {
        life: SPECIAL_CONFIG.nova.life,
        blastRadius,
        blastDuration,
      }
    );
    game.burst(player.x, player.y - SPECIAL_CONFIG.nova.yOffset, SPECIAL_CONFIG.nova.color, SPECIAL_CONFIG.nova.burst);
    return SpecialSystem.spend(player, cost);
  }
}
