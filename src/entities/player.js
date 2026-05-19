// Galaxy Runner - player
// Owns player state, weapon collection, and final-form/support-atlas visual composition.

class Player {
  constructor() {
    this.playerPartSheet = new SpriteAtlas(
      AssetLoader.image(PLAYER_CONFIG.assets.parts.src),
      PLAYER_CONFIG.assets.parts.columns,
      PLAYER_CONFIG.assets.parts.rows
    );
    this.thrusterSheet = new SpriteAtlas(
      AssetLoader.image(PLAYER_CONFIG.assets.thruster.src),
      PLAYER_CONFIG.assets.thruster.columns,
      PLAYER_CONFIG.assets.thruster.rows
    );
    this.specialEffectSheet = new SpriteAtlas(
      AssetLoader.image(PLAYER_CONFIG.assets.specialEffect.src),
      PLAYER_CONFIG.assets.specialEffect.columns,
      PLAYER_CONFIG.assets.specialEffect.rows
    );
    this.finalShips = new FinalShipArt();
    this.partLayout = new PlayerPartLayout(this.playerPartSheet);
    this.reset();
  }

  reset() {
    this.x = PLAYFIELD.width * PLAYER_CONFIG.basePosition.xRatio;
    this.y = PLAYFIELD.height - PLAYER_CONFIG.basePosition.yFromBottom;
    this.baseBodyRadius = PLAYER_CONFIG.radii.body;
    this.bodyRadius = this.baseBodyRadius;
    this.baseHitRadius = PLAYER_CONFIG.radii.hit;
    this.hitRadius = this.baseHitRadius;
    this.basePickupRadius = PLAYER_CONFIG.radii.pickup;
    this.pickupRadius = this.basePickupRadius;
    this.armorLevel = 0;
    this.maxHealth = BALANCE.basePlayerHealth;
    this.health = this.maxHealth;
    this.visualScale = PLAYER_CONFIG.visual.scale;
    this.visualHitboxPadding = PLAYER_CONFIG.visual.hitboxPadding;
    this.speed = PLAYER_CONFIG.movement.speed;
    this.fireTimer = 0;
    this.fireDelay = BALANCE.baseFireDelay;
    this.invincible = 0;
    this.shield = 0;
    this.maxShield = 0;
    this.shieldDefenseLevel = 0;
    this.shieldImpactTimer = 0;
    this.shieldImpactAngle = 0;
    this.rapidLevel = 0;
    this.energyLevel = 0;
    this.spreadLevel = 0;
    this.novaLevel = 0;
    this.weaponHighestLevels = this.createWeaponLevelStore();
    this.weaponCores = this.createWeaponCoreStore();
    this.droneFireTimers = [0, 0, 0];
    this.droneSlotsCache = [];
    this.droneLevel = 0;
    this.drones = 0;
    this.lean = 0;
    this.thrust = 1;
    this.moveX = 0;
    this.moveY = 0;
    this.specialMeter = 0;
    this.specialOverdriveTimer = 0;
    this.wasSpecialDown = false;
    this.updateWeaponFootprint();
  }

  syncVisualRigToScale(scale = 1) {
    const targetScreenSize = this.baseHitRadius * 2 * this.visualHitboxPadding * scale;
    this.partLayout.rigSize = targetScreenSize / Math.max(0.01, this.visualScale);
  }

  updateWeaponFootprint() {
    const visualScale = WeaponSystem.visualScale(this);
    const hitboxScale = WeaponSystem.hitboxScale(this);
    this.bodyRadius = this.baseBodyRadius * hitboxScale;
    this.hitRadius = this.baseHitRadius * hitboxScale;
    this.pickupRadius = Math.max(this.basePickupRadius, this.hitRadius + 7);
    this.syncVisualRigToScale(visualScale);
  }

  update(dt, game) {
    this.updateTimers(dt);
    this.move(dt, game.input);
    this.updateWeaponFootprint();

    SpecialSystem.update(this, dt, game);
    const specialDown = SpecialSystem.isSpecialDown(game.input);

    if (!specialDown && game.input.isDown("Space") && this.fireTimer <= 0) {
      if (this.spreadLevel > 0) {
        this.fireSpread(game);
      } else {
        this.fire(game);
      }
      this.fireTimer = this.currentFireDelay();
    }

    this.updateDrones(dt, game);
  }

  updateTimers(dt) {
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.shieldImpactTimer = Math.max(0, this.shieldImpactTimer - dt);
    this.updateSpecialOverdrive(dt);
    this.rechargeShield(dt);
  }

  updateSpecialOverdrive(dt) {
    if (this.specialOverdriveTimer <= 0) return;
    this.specialOverdriveTimer = Math.max(0, this.specialOverdriveTimer - dt);
    this.specialMeter = SPECIAL_CONFIG.meterMax;
  }

  rechargeShield(dt) {
    if (this.maxShield <= 0 || this.shield >= this.maxShield) return;

    const rechargePerSecond = this.maxShield / BALANCE.shieldRechargeSeconds;
    this.shield = Math.min(this.maxShield, this.shield + rechargePerSecond * dt);
  }

  move(dt, input) {
    let mx = 0;
    let my = 0;
    if (input.isDown("ArrowLeft") || input.isDown("KeyA")) mx -= 1;
    if (input.isDown("ArrowRight") || input.isDown("KeyD")) mx += 1;
    if (input.isDown("ArrowUp") || input.isDown("KeyW")) my -= 1;
    if (input.isDown("ArrowDown") || input.isDown("KeyS")) my += 1;

    this.moveX = mx;
    this.moveY = my;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      const moveSpeed = WeaponSystem.currentMoveSpeed(this);
      this.x += (mx / len) * moveSpeed * dt;
      this.y += (my / len) * moveSpeed * dt;
    }

    const leanTarget = mx * PLAYER_CONFIG.movement.leanMax;
    const thrustTarget = clampNumber(
      PLAYER_CONFIG.movement.thrust.base +
        (my < 0 ? PLAYER_CONFIG.movement.thrust.upBoost : my > 0 ? PLAYER_CONFIG.movement.thrust.downPenalty : 0) +
        Math.abs(mx) * PLAYER_CONFIG.movement.thrust.sideBoost,
      PLAYER_CONFIG.movement.thrust.min,
      PLAYER_CONFIG.movement.thrust.max
    );
    const motionEase = clampNumber(dt * PLAYER_CONFIG.movement.thrust.ease, 0, 1);
    this.lean += (leanTarget - this.lean) * motionEase;
    this.thrust += (thrustTarget - this.thrust) * motionEase;

    this.x = clampNumber(
      this.x,
      PLAYER_CONFIG.movement.bounds.left,
      PLAYFIELD.width - PLAYER_CONFIG.movement.bounds.rightPadding
    );
    this.y = clampNumber(
      this.y,
      PLAYER_CONFIG.movement.bounds.top,
      PLAYFIELD.height - PLAYER_CONFIG.movement.bounds.bottomPadding
    );
  }

  currentFireDelay() {
    return WeaponSystem.currentFireDelay(this);
  }

  fire(game) {
    const shot = WeaponSystem.mainShot(this);
    game.addBullet(this.x, this.y - PLAYER_CONFIG.fire.yOffset, 0, shot.speed, shot.radius, shot.damage, shot.color, shot.kind, {
      pierce: shot.pierce,
      blastRadius: shot.blastRadius,
      blastDuration: shot.blastDuration,
      absorbLevel: shot.absorbLevel,
    });
  }

  spreadFireDelay() {
    return WeaponSystem.currentFireDelay(this);
  }

  spreadAngles() {
    return WeaponSystem.spreadAngles(this.spreadLevel);
  }

  fireSpread(game) {
    const shot = WeaponSystem.spreadSideShot(this);

    for (const angle of this.spreadAngles()) {
      const rad = (angle * Math.PI) / 180;
      const vx = Math.sin(rad) * shot.speed;
      const vy = -Math.cos(rad) * shot.speed;
      game.addBullet(
        this.x - PLAYER_CONFIG.fire.spreadSideOffset,
        this.y - PLAYER_CONFIG.fire.spreadYOffset,
        -vx,
        vy,
        shot.radius,
        shot.damage,
        shot.color,
        shot.kind
      );
      game.addBullet(
        this.x + PLAYER_CONFIG.fire.spreadSideOffset,
        this.y - PLAYER_CONFIG.fire.spreadYOffset,
        vx,
        vy,
        shot.radius,
        shot.damage,
        shot.color,
        shot.kind
      );
    }
  }

  updateDrones(dt, game) {
    if (this.drones <= 0) return;

    for (const [index, slot] of this.droneSlots(game.state.time).entries()) {
      const delay = this.droneFireDelay(index);
      if (!Number.isFinite(this.droneFireTimers[index])) {
        this.droneFireTimers[index] = (delay / this.drones) * index;
      }

      this.droneFireTimers[index] -= dt;
      if (this.droneFireTimers[index] <= 0) {
        const target = game.nearestEnemy(slot.x, slot.y);
        if (target) {
          const dx = target.x - slot.x;
          const dy = target.y - slot.y;
          const len = Math.hypot(dx, dy) || 1;
          const speed = PLAYER_CONFIG.drone.directShotSpeed;
          game.addBullet(
            slot.x,
            slot.y - PLAYER_CONFIG.drone.shotYOffsetHoming,
            (dx / len) * speed,
            (dy / len) * speed,
            PLAYER_CONFIG.drone.homingRadius,
            this.droneDamage(),
            PLAYER_CONFIG.drone.color,
            "drone",
            {
              homing: true,
              homingSpeed: speed,
              turnRate: PLAYER_CONFIG.drone.homingTurnRate,
              life: PLAYER_CONFIG.drone.homingLife,
            }
          );
        } else {
          game.addBullet(
            slot.x,
            slot.y - PLAYER_CONFIG.drone.shotYOffsetStraight,
            0,
            -PLAYER_CONFIG.drone.directShotSpeed,
            PLAYER_CONFIG.drone.straightRadius,
            this.droneDamage(),
            PLAYER_CONFIG.drone.color,
            "drone",
            {
              homing: true,
              homingSpeed: PLAYER_CONFIG.drone.directShotSpeed,
              turnRate: PLAYER_CONFIG.drone.homingTurnRate,
              life: PLAYER_CONFIG.drone.homingLife,
            }
          );
        }
        this.droneFireTimers[index] += delay;
      }
    }
  }

  droneFireDelay(index) {
    return DroneSystem.fireDelay(this.droneLevel, index);
  }

  droneUpgradeCount(index) {
    return DroneSystem.upgradeCount(this.droneLevel, index);
  }

  droneDamage() {
    return DroneSystem.damage(this.droneLevel);
  }

  droneSlots(time) {
    const droneCount = this.drones;
    if (droneCount <= 0) {
      this.droneSlotsCache.length = 0;
      return this.droneSlotsCache;
    }

    const { orbitRadiusX, orbitRadiusY, orbitSpeed, initialAngle } = PLAYER_CONFIG.drone;
    const angleStep = (Math.PI * 2) / droneCount;
    const baseAngle = time * orbitSpeed + initialAngle;
    const cache = this.droneSlotsCache;

    while (cache.length < droneCount) {
      cache.push({ x: 0, y: 0, angle: 0 });
    }
    cache.length = droneCount;

    for (let index = 0; index < droneCount; index += 1) {
      const angle = baseAngle + index * angleStep;
      const slot = cache[index];
      slot.angle = angle;
      slot.x = this.x + Math.cos(angle) * orbitRadiusX;
      slot.y = this.y + Math.sin(angle) * orbitRadiusY;
    }

    return cache;
  }

  collect(item, game) {
    if (item.kind === "repair") {
      if (this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + BALANCE.repairAmount);
      else game.state.score += BALANCE.repairOverflowScore;
      game.burst(item.x, item.y, item.color, 12);
    } else if (item.kind === "armor") {
      this.armorLevel = Math.min(BALANCE.armorMaxLevel, this.armorLevel + 1);
      const nextMaxHealth = BALANCE.basePlayerHealth + this.armorLevel * BALANCE.armorHealthStep;
      const gainedHealth = nextMaxHealth - this.maxHealth;
      this.maxHealth = nextMaxHealth;
      this.health = Math.min(this.maxHealth, this.health + Math.max(BALANCE.armorPickupMinHeal, gainedHealth));
      game.burst(item.x, item.y, item.color, 16);
    } else if (item.kind === "shield") {
      this.upgradeShieldCapacity();
      game.burst(item.x, item.y, item.color, 16);
    } else if (item.kind === "shieldDefense") {
      this.shieldDefenseLevel = Math.min(BALANCE.shieldDefenseMaxLevel, this.shieldDefenseLevel + 1);
      game.burst(item.x, item.y, item.color, 18);
    } else if (isWeaponKind(item.kind)) {
      this.equipWeapon(item.kind);
      game.burst(item.x, item.y, item.color, WeaponCatalog.pickupBurst(item.kind));
    } else if (item.kind === "drone") {
      this.droneLevel = Math.min(DroneSystem.maxLevel, this.droneLevel + 1);
      this.drones = DroneSystem.count(this.droneLevel);
      game.burst(item.x, item.y, item.color, 18);
    } else if (item.kind === "bonus") {
      this.activateSpecialOverdrive();
      game.burst(item.x, item.y, item.color, 24);
    } else {
      game.burst(item.x, item.y, item.color, 18);
    }
  }

  activateSpecialOverdrive() {
    this.specialOverdriveTimer = SPECIAL_CONFIG.overdrive.duration;
    this.specialMeter = SPECIAL_CONFIG.meterMax;
  }

  equipWeapon(kind) {
    if (!isWeaponKind(kind)) return;

    const activeKind = this.activeWeaponKind();
    const maxLevel = WeaponCatalog.maxLevel(kind);
    const ownedLevel = Math.max(this.weaponHighestLevel(kind), this.weaponLevel(kind));
    let nextLevel = Math.max(1, ownedLevel);
    this.fireTimer = 0;

    if (ownedLevel >= maxLevel) {
      this.addWeaponCore(kind);
      nextLevel = maxLevel;
    } else if (activeKind === kind) {
      nextLevel = Math.min(maxLevel, ownedLevel + 1);
    }

    this.setWeaponHighestLevel(kind, nextLevel);
    this.clearWeaponLevels();
    this.setWeaponLevel(kind, nextLevel);
    this.updateWeaponFootprint();
  }

  clearWeaponLevels() {
    for (const kind of WEAPON_KINDS) {
      this.setWeaponLevel(kind, 0);
    }
  }

  setWeaponLevel(kind, level) {
    if (!isWeaponKind(kind)) return;
    this[`${kind}Level`] = WeaponCatalog.normalizeLevel(kind, level);
  }

  weaponLevel(kind) {
    if (!isWeaponKind(kind)) return 0;
    return this[`${kind}Level`] || 0;
  }

  createWeaponLevelStore() {
    const levels = {};
    for (const kind of WEAPON_KINDS) {
      levels[kind] = 0;
    }
    return levels;
  }

  setWeaponHighestLevel(kind, level) {
    if (!isWeaponKind(kind)) return;
    this.weaponHighestLevels[kind] = WeaponCatalog.normalizeLevel(kind, level);
  }

  weaponHighestLevel(kind) {
    if (!isWeaponKind(kind)) return 0;
    return WeaponCatalog.normalizeLevel(kind, this.weaponHighestLevels?.[kind] || 0);
  }

  createWeaponCoreStore() {
    const cores = {};
    for (const kind of WEAPON_KINDS) {
      cores[kind] = 0;
    }
    return cores;
  }

  addWeaponCore(kind) {
    if (!isWeaponKind(kind)) return;
    this.weaponCores[kind] = Math.min(WeaponCatalog.coreMaxLevel(kind), this.weaponCoreLevel(kind) + 1);
  }

  weaponCoreLevel(kind) {
    if (!isWeaponKind(kind)) return 0;
    return WeaponCatalog.normalizeCoreLevel(kind, this.weaponCores?.[kind] || 0);
  }

  hit(game, damage = BALANCE.enemyFallbackDamage) {
    if (this.invincible > 0 || game.state.mode !== "running") return;

    let remainingDamage = Math.max(0, damage);

    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remainingDamage);
      this.shield -= absorbed;
      remainingDamage -= absorbed;
      this.invincible = PLAYER_CONFIG.invincibility.shieldAbsorb;
      this.triggerShieldImpact(absorbed);
      game.burst(this.x, this.y, "#75dfff", 20);
      if (remainingDamage <= 0) return;
    }

    const finalDamage = this.resolveIncomingDamage(remainingDamage);
    if (finalDamage <= 0) {
      this.invincible = PLAYER_CONFIG.invincibility.shieldAbsorb;
      game.burst(this.x, this.y, "#d8e6f0", 12);
      return;
    }

    this.health -= finalDamage;
    this.invincible = PLAYER_CONFIG.invincibility.healthHit;
    game.burst(this.x, this.y, "#8fe7ff", 18);
    if (this.health <= 0) {
      this.health = 0;
      game.state.mode = "gameover";
    }
  }

  upgradeShieldCapacity() {
    this.maxShield = Math.min(BALANCE.shieldMax, this.maxShield + BALANCE.shieldPickupAmount);
    this.shield = this.maxShield;
  }

  continue() {
    this.x = PLAYFIELD.width * PLAYER_CONFIG.basePosition.xRatio;
    this.y = PLAYFIELD.height - PLAYER_CONFIG.basePosition.yFromBottom;
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.specialOverdriveTimer = 0;
    this.invincible = GAME_CONFIG.continue.playerInvincibility;
    this.fireTimer = 0;
    this.wasSpecialDown = false;
    this.updateWeaponFootprint();
  }

  triggerShieldImpact(absorbedDamage = 0) {
    this.shieldImpactTimer = BALANCE.shieldImpactDuration;
    this.shieldImpactAngle = (performance.now() * 0.009 + absorbedDamage * 0.017) % (Math.PI * 2);
  }

  shipDefense() {
    const level = Math.max(this.energyLevel, this.novaLevel);
    if (level > 0) {
      return Math.min(
        BALANCE.heavyShipDefenseMax,
        BALANCE.heavyShipBaseDefense + (level - 1) * BALANCE.heavyShipDefensePerLevel
      );
    }
    return 0;
  }

  shieldDefense() {
    return this.shieldDefenseLevel * BALANCE.shieldDefensePerLevel;
  }

  defenseProfile() {
    const kind = this.activeWeaponKind() || "default";
    return PLAYER_DEFENSE_CONFIG[kind] || PLAYER_DEFENSE_CONFIG.default;
  }

  defenseStats() {
    const profile = this.defenseProfile();
    return {
      outerFlat: Math.max(0, (profile.outerFlat || 0) + this.shipDefense()),
      percent: clampNumber(profile.percent || 0, 0, 0.85),
      innerFlat: Math.max(0, (profile.innerFlat || 0) + this.shieldDefense()),
    };
  }

  resolveIncomingDamage(rawDamage) {
    const defense = this.defenseStats();
    const afterOuter = Math.max(0, rawDamage - defense.outerFlat);
    const afterPercent = afterOuter * (1 - defense.percent);
    if (afterPercent <= 0) return 0;
    return Math.max(1, afterPercent - defense.innerFlat);
  }

  totalDefense() {
    const defense = this.defenseStats();
    return Math.min(BALANCE.totalDefenseMax, defense.outerFlat + defense.innerFlat);
  }

  draw(ctx, time) {
    PlayerRenderer.draw(this, ctx, time);
  }

  bankAmount() {
    return clampNumber(this.lean / PLAYER_CONFIG.movement.leanMax, -1, 1);
  }

  applyBankProjection(ctx) {
    const bank = this.bankAmount();
    const amount = Math.abs(bank);
    const xScale = 1 - amount * PLAYER_CONFIG.bank.xScalePerLean;
    const yScale = 1 + amount * PLAYER_CONFIG.bank.yScalePerLean;
    const xSkew = bank * PLAYER_CONFIG.bank.skewPerLean;
    ctx.transform(xScale, 0, xSkew, yScale, bank * PLAYER_CONFIG.bank.xOffsetPerLean, 0);
  }

  hasPlayerPartSheet() {
    return this.playerPartSheet.isReady();
  }

  drawPlayerShip(ctx, time) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 11;

    const kind = this.activeWeaponKind();
    const level = this.activeWeaponLevel();
    if (!this.drawFinalWeaponShip(ctx, kind, level)) {
      this.drawBaseShipLayer(ctx, time);
    }

    this.drawArmorOverlay(ctx);
    ctx.restore();
  }

  drawFinalWeaponShip(ctx, kind, level) {
    return this.finalShips.draw(ctx, kind, level, this.partLayout.rigSize);
  }

  drawBaseShipLayer(ctx, time) {
    if (!this.hasPlayerPartSheet()) return false;

    const slots = this.partLayout.shipSlots();
    this.partLayout.draw(ctx, slots.wings, { alpha: 0.98 });
    this.partLayout.draw(ctx, slots.engine, { alpha: 0.96 });
    this.partLayout.draw(ctx, slots.fuselage);
    this.partLayout.draw(ctx, slots.cockpit, {
      alpha: 0.9 + Math.sin(time * 5) * 0.04,
      shadowColor: "rgba(106, 239, 255, 0.5)",
      shadowBlur: 8,
    });
    return true;
  }

  drawArmorOverlay(ctx) {
    if (this.armorLevel <= 0 || !this.hasPlayerPartSheet()) return;

    const level = clampNumber(this.armorLevel, 1, BALANCE.armorMaxLevel);
    this.partLayout.draw(ctx, this.partLayout.armorSlot(), {
      alpha: 0.46 + level * 0.08,
      shadowColor: "rgba(216, 230, 240, 0.45)",
      shadowBlur: 7,
    });
  }

  hasThrusterSheet() {
    return this.thrusterSheet.isReady();
  }

  drawThrusterAnimation(ctx, time) {
    if (!this.hasThrusterSheet()) return;

    const row =
      this.thrust > PLAYER_CONFIG.thruster.highThreshold
        ? PLAYER_CONFIG.thruster.highRow
        : this.thrust < PLAYER_CONFIG.thruster.lowThreshold
          ? PLAYER_CONFIG.thruster.lowRow
          : PLAYER_CONFIG.thruster.normalRow;
    const frame = Math.floor(time * PLAYER_CONFIG.thruster.frameRate) % PLAYER_CONFIG.assets.thruster.columns;
    const thrustPower = clampNumber(this.thrust, PLAYER_CONFIG.movement.thrust.min, PLAYER_CONFIG.movement.thrust.max);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.thrusterSheet.draw(ctx, frame, row, 0, 0, this.partLayout.rigSize, this.partLayout.rigSize, {
      alpha: clampNumber(
        PLAYER_CONFIG.thruster.alphaBase + thrustPower * PLAYER_CONFIG.thruster.alphaScale,
        PLAYER_CONFIG.thruster.alphaMin,
        PLAYER_CONFIG.thruster.alphaMax
      ),
      shadowColor: PLAYER_CONFIG.thruster.shadowColor,
      shadowBlur: PLAYER_CONFIG.thruster.shadowBlur,
    });
    ctx.restore();
  }

  hasSpecialEffectSheet() {
    return this.specialEffectSheet.isReady();
  }

  activeWeaponKind() {
    for (const kind of WEAPON_KINDS) {
      if (this.weaponLevel(kind) > 0) return kind;
    }
    return null;
  }

  activeWeaponLevel() {
    const kind = this.activeWeaponKind();
    return kind ? this.weaponLevel(kind) : 0;
  }

  drawSpecialReadyEffect(ctx, time) {
    if (!this.hasSpecialEffectSheet()) return;

    const kind = this.activeWeaponKind();
    const readiness = SpecialSystem.readiness(this);
    if (!kind || readiness <= 0) return;

    const row = WeaponCatalog.rowMap()[kind];
    if (row === undefined) return;

    const frame =
      Math.floor(time * SPECIAL_CONFIG.readyEffect.frameRate + readiness * PLAYER_CONFIG.assets.specialEffect.columns) %
      PLAYER_CONFIG.assets.specialEffect.columns;
    this.specialEffectSheet.draw(ctx, frame, row, 0, 0, this.partLayout.rigSize, this.partLayout.rigSize, {
      alpha: SPECIAL_CONFIG.readyEffect.alphaMin + readiness * SPECIAL_CONFIG.readyEffect.alphaMax,
      shadowColor: this.weaponGlowColor(kind, SPECIAL_CONFIG.readyEffect.shadowAlpha),
      shadowBlur: SPECIAL_CONFIG.readyEffect.shadowBlur,
    });
  }

  weaponGlowColor(kind, alpha) {
    const colors = {
      rapid: `rgba(255, 224, 106, ${alpha})`,
      energy: `rgba(85, 240, 255, ${alpha})`,
      spread: `rgba(183, 255, 123, ${alpha})`,
      nova: `rgba(255, 143, 90, ${alpha})`,
    };
    return colors[kind] || `rgba(117, 223, 255, ${alpha})`;
  }

  drawShield(ctx, time) {
    if (this.maxShield <= 0) return;

    ctx.save();
    const shieldRatio = clampNumber(this.shield / this.maxShield, 0, 1);
    ctx.globalAlpha = 0.1 + shieldRatio * 0.28 + Math.sin(time * 9) * 0.035;
    ctx.strokeStyle = "#75dfff";
    ctx.lineWidth = 2 + shieldRatio * 4;
    ctx.beginPath();
    ctx.ellipse(0, 2, 52, 63, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#e9fbff";
    const pips = Math.ceil(this.maxShield / BALANCE.shieldPickupAmount);
    for (let i = 0; i < pips; i += 1) {
      const angle = time * 2.4 + i * ((Math.PI * 2) / pips);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 45, Math.sin(angle) * 55, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.04 + shieldRatio * 0.16;
    ctx.fillStyle = "#75dfff";
    ctx.beginPath();
    ctx.ellipse(0, 2, 52, 63, 0, 0, Math.PI * 2);
    ctx.fill();
    this.drawShieldImpact(ctx, time);
    ctx.restore();
  }

  drawShieldImpact(ctx, time) {
    if (this.shieldImpactTimer <= 0) return;

    const ratio = clampNumber(this.shieldImpactTimer / BALANCE.shieldImpactDuration, 0, 1);
    const impact = ratio * ratio;
    const angle = this.shieldImpactAngle;
    const impactX = Math.cos(angle) * 50;
    const impactY = 2 + Math.sin(angle) * 61;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#fff2a6";
    ctx.shadowBlur = 22 * impact;

    const gradient = ctx.createRadialGradient(impactX, impactY, 1, impactX, impactY, 54);
    gradient.addColorStop(0, `rgba(255, 248, 205, ${0.72 * impact})`);
    gradient.addColorStop(0.38, `rgba(255, 214, 92, ${0.36 * impact})`);
    gradient.addColorStop(1, "rgba(117, 223, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(impactX, impactY, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.4 + impact * 3.2;
    ctx.strokeStyle = `rgba(255, 240, 165, ${0.82 * impact})`;
    for (let i = -2; i <= 2; i += 1) {
      const arcRadius = 43 + i * 9 + (1 - ratio) * 20;
      const start = angle - 0.42 - i * 0.045;
      const end = angle + 0.42 + i * 0.045;
      ctx.beginPath();
      ctx.ellipse(0, 2, arcRadius, arcRadius * 1.22, 0, start, end);
      ctx.stroke();
    }

    ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i += 1) {
      const offset = (i - 3) * 0.17;
      const panelAngle = angle + offset;
      const x = Math.cos(panelAngle) * (45 + Math.abs(i - 3) * 2);
      const y = 2 + Math.sin(panelAngle) * (55 + Math.abs(i - 3) * 2);
      const size = (11 + (3 - Math.abs(i - 3)) * 2) * (0.72 + impact * 0.55);

      ctx.strokeStyle = `rgba(255, 246, 188, ${0.62 * impact})`;
      ctx.fillStyle = `rgba(255, 191, 83, ${0.13 * impact})`;
      this.drawShieldFacet(ctx, x, y, size, panelAngle + Math.PI / 6);
    }

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `rgba(117, 223, 255, ${0.46 * impact})`;
    for (let i = 0; i < 4; i += 1) {
      const rayAngle = angle + (i - 1.5) * 0.28;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rayAngle) * 32, 2 + Math.sin(rayAngle) * 39);
      ctx.lineTo(Math.cos(rayAngle) * (69 + (1 - ratio) * 18), 2 + Math.sin(rayAngle) * (81 + (1 - ratio) * 18));
      ctx.stroke();
    }

    ctx.restore();
  }

  drawShieldFacet(ctx, x, y, radius, rotation = 0) {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = rotation + i * (Math.PI / 3);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * 0.78;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawDrones(ctx, time) {
    if (!this.hasPlayerPartSheet()) return;

    for (const [index, slot] of this.droneSlots(time).entries()) {
      const upgrade = this.droneUpgradeCount(index);
      const level = clampNumber(1 + upgrade, 1, 3);
      const pulse =
        PLAYER_CONFIG.drone.visualPulseBase +
        Math.sin(time * PLAYER_CONFIG.drone.visualPulseSpeed + slot.angle) * PLAYER_CONFIG.drone.visualPulseAmplitude;

      ctx.save();
      ctx.translate(slot.x, slot.y);
      ctx.rotate(
        slot.angle +
          Math.PI / 2 +
          Math.sin(time * PLAYER_CONFIG.drone.visualRotationWobbleSpeed + slot.x) *
            PLAYER_CONFIG.drone.visualRotationWobbleAmount
      );

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(174, 252, 255, ${pulse})`;
      ctx.lineWidth =
        PLAYER_CONFIG.drone.visualRingWidthBase +
        level * PLAYER_CONFIG.drone.visualRingWidthLevelStep +
        upgrade * PLAYER_CONFIG.drone.visualRingWidthUpgradeStep;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        PLAYER_CONFIG.drone.visualRingRadiusXBase +
          level * PLAYER_CONFIG.drone.visualRingRadiusXLevelStep +
          upgrade * PLAYER_CONFIG.drone.visualRingRadiusXUpgradeStep,
        PLAYER_CONFIG.drone.visualRingRadiusYBase +
          level * PLAYER_CONFIG.drone.visualRingRadiusYLevelStep +
          upgrade * PLAYER_CONFIG.drone.visualRingRadiusYUpgradeStep,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      this.drawDronePart(
        ctx,
        level,
        0,
        0,
        PLAYER_CONFIG.drone.partWidthBase + level * PLAYER_CONFIG.drone.partWidthLevelStep + upgrade,
        PLAYER_CONFIG.drone.partHeightBase + level * PLAYER_CONFIG.drone.partHeightLevelStep + upgrade
      );
      ctx.restore();
    }
  }

  drawDronePart(ctx, level, x, y, width, height, options = {}) {
    const slot = this.partLayout.droneSlot(level, width, height);
    this.partLayout.draw(ctx, { ...slot, x, y }, options);
  }
}
