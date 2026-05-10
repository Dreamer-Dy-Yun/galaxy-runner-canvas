// Galaxy Runner - special skill system
// Ctrl spends a slowly building meter. This is separate from any future hold-to-charge system.

class SpecialSystem {
  static isSpecialDown(input) {
    return SPECIAL_CONFIG.inputCodes.some((code) => input.isDown(code));
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
    player.specialMeter = clampNumber((player.specialMeter || 0) + amount, 0, SPECIAL_CONFIG.meterMax);
  }

  static awardKill(player, enemy) {
    const level = typeof enemy.specialRewardLevel === "function" ? enemy.specialRewardLevel() : 1;
    const bossBonus = enemy.role === "boss" ? SPECIAL_CONFIG.killGain.bossBonus : enemy.role === "midboss" ? SPECIAL_CONFIG.killGain.midBossBonus : 0;
    SpecialSystem.gain(player, SPECIAL_CONFIG.killGain.base + level * SPECIAL_CONFIG.killGain.perThreatLevel + bossBonus);
  }

  static percent(player) {
    return Math.floor(clampNumber(player.specialMeter || 0, 0, SPECIAL_CONFIG.meterMax));
  }

  static readiness(player) {
    const kind = player.activeWeaponKind?.();
    if (!kind) return 0;
    const cost = SpecialSystem.minimumCost(kind);
    if (cost <= 0) return 0;
    return clampNumber((player.specialMeter || 0) / cost, 0, 1);
  }

  static minimumCost(kind) {
    if (kind === "nova") return SPECIAL_CONFIG.nova.cost;
    return SPECIAL_CONFIG.tierCosts[SPECIAL_CONFIG.tierCosts.length - 1] ?? SPECIAL_CONFIG.meterMax;
  }

  static tierCost(player) {
    const meter = player.specialMeter || 0;
    for (const cost of SPECIAL_CONFIG.tierCosts) {
      if (meter >= cost) return cost;
    }
    return 0;
  }

  static spend(player, cost) {
    if ((player.specialMeter || 0) < cost) return false;
    if (player.specialOverdriveTimer > 0) {
      player.specialMeter = SPECIAL_CONFIG.meterMax;
      return true;
    }
    player.specialMeter = clampNumber(player.specialMeter - cost, 0, SPECIAL_CONFIG.meterMax);
    return true;
  }

  static tryUse(player, game) {
    const kind = player.activeWeaponKind?.();
    if (!kind) return false;

    if (kind === "nova") return SpecialSystem.dropNovaMine(player, game);

    const cost = SpecialSystem.tierCost(player);
    if (cost <= 0 || !SpecialSystem.spend(player, cost)) return false;

    if (kind === "rapid") SpecialSystem.fireRapid(player, game, cost);
    else if (kind === "energy") SpecialSystem.fireEnergy(player, game, cost);
    else if (kind === "spread") SpecialSystem.fireSpread(player, game, cost);
    else return false;

    return true;
  }

  static level(player, kind) {
    return player.weaponLevel?.(kind) || 1;
  }

  static scaledDamage(player, kind, baseScale, levelStep) {
    const level = SpecialSystem.level(player, kind);
    return WeaponSystem.applyCoreDamage(
      player,
      kind,
      BALANCE.statScale * baseScale * (1 + (level - 1) * levelStep) * WeaponCatalog.projectileDamageMultiplier(kind)
    );
  }

  static fireRapid(player, game, cost) {
    const tier = SPECIAL_CONFIG.rapid.tiers[cost];
    const level = SpecialSystem.level(player, "rapid");
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
    game.burst(player.x, player.y - PLAYER_CONFIG.fire.yOffset, SPECIAL_CONFIG.rapid.color, tier.burst + Math.floor(level / 2));
  }

  static fireEnergy(player, game, cost) {
    const tier = SPECIAL_CONFIG.energy.tiers[cost];
    const level = SpecialSystem.level(player, "energy");
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
    game.burst(player.x, player.y - SPECIAL_CONFIG.energy.yOffset, SPECIAL_CONFIG.energy.color, tier.burst + Math.floor(level / 2));
  }

  static fireSpread(player, game, cost) {
    const tier = SPECIAL_CONFIG.spread.tiers[cost];
    const level = SpecialSystem.level(player, "spread");
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
    game.burst(player.x, player.y - SPECIAL_CONFIG.spread.yOffset, SPECIAL_CONFIG.spread.color, tier.burst + Math.floor(level));
  }

  static dropNovaMine(player, game) {
    if (game.novaMineCount() >= SPECIAL_CONFIG.nova.maxMines) return false;
    if (!SpecialSystem.spend(player, SPECIAL_CONFIG.nova.cost)) return false;

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
    return true;
  }
}
