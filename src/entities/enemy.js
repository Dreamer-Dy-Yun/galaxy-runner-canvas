// Galaxy Runner - enemy
// Split from the original single-file prototype so each system can evolve independently.

class Enemy {
  constructor(danger, role = "grunt", options = {}) {
    this.role = role === "grunt" ? Enemy.pickRole(danger) : role;
    this.isBoss = this.role === "midboss" || this.role === "boss";
    this.stage = options.stage ?? 0;
    this.spawnOptions = options;
    this.wave = randomRange(0, Math.PI * 2);
    this.phase = randomRange(0, Math.PI * 2);
    this.setupStats(danger);
  }

  static atlas() {
    if (!Enemy.enemyAtlas) {
      Enemy.enemyAtlas = new SpriteAtlas(
        AssetLoader.image(ENEMY_CONFIG.atlas.src),
        ENEMY_CONFIG.atlas.columns,
        ENEMY_CONFIG.atlas.rows
      );
    }

    return Enemy.enemyAtlas;
  }

  static warmupAssets() {
    Enemy.atlas();
  }

  static pickRole(danger = 0) {
    const advancedChance = clampNumber(
      (danger - ENEMY_CONFIG.picker.advancedStartDanger) * ENEMY_CONFIG.picker.advancedChanceStep,
      0,
      ENEMY_CONFIG.picker.advancedChanceMax
    );
    if (Math.random() < advancedChance) {
      const roles = ENEMY_CONFIG.picker.advancedRoles;
      return roles[Math.floor(Math.random() * roles.length)];
    }

    const roll = Math.random();
    const scoutCut = Math.max(
      ENEMY_CONFIG.picker.scoutMinChance,
      ENEMY_CONFIG.picker.scoutBaseChance - danger * ENEMY_CONFIG.picker.scoutDangerStep
    );
    const fighterCut = scoutCut + ENEMY_CONFIG.picker.fighterChance;
    const strikerCut =
      fighterCut +
      clampNumber(
        ENEMY_CONFIG.picker.strikerBaseChance + danger * ENEMY_CONFIG.picker.strikerDangerStep,
        ENEMY_CONFIG.picker.strikerMinChance,
        ENEMY_CONFIG.picker.strikerMaxChance
      );
    if (roll < scoutCut) return "scout";
    if (roll < fighterCut) return "fighter";
    if (roll < strikerCut) return "striker";
    return "tank";
  }

  static bulletDamage(level, danger = 0) {
    const safeLevel = Math.max(1, Math.round(level || 1));
    const dangerTier = Math.floor(Math.max(0, danger) / 5);
    return (
      BALANCE.enemyBulletBaseDamage +
      (safeLevel - 1) * BALANCE.enemyBulletLevelDamage +
      dangerTier * BALANCE.enemyBulletDangerStep
    );
  }

  specialRewardLevel() {
    if (this.role === "boss") return ENEMY_CONFIG.bossPattern.bossBulletLevel;
    if (this.role === "midboss") return ENEMY_CONFIG.bossPattern.midBossBulletLevel;
    return Math.max(1, this.bulletLevel || 1);
  }

  setupStats(danger) {
    const stats = ENEMY_CONFIG.roles[this.role];
    this.bossAi = this.role === "boss" ? new BossAi(this, this.stage) : null;

    this.width = stats.width;
    this.height = stats.height;
    this.hitRx = stats.hitRx;
    this.hitRy = stats.hitRy;
    const healthScale = this.isBoss ? 1 : 1 + danger * ENEMY_CONFIG.health.nonBossDangerScale;
    this.health = Math.max(ENEMY_CONFIG.health.minimum, Math.round(stats.health(danger) * healthScale * BALANCE.statScale));
    this.maxHealth = this.health;
    this.armor = Math.max(0, Math.round(Number(stats.armor) || 0));
    this.velocityX = stats.velocityX(danger);
    this.velocityY = stats.velocityY(danger);
    this.color = stats.color;
    this.shooter = stats.shooter;
    this.bulletLevel = Math.min(
      ENEMY_CONFIG.bullet.maxLevel,
      (stats.bulletLevel || 1) + Math.floor(danger / ENEMY_CONFIG.bullet.levelDangerDivisor)
    );
    this.scoreValue = stats.score;
    this.fireCooldownScale = Math.max(
      ENEMY_CONFIG.setupFireCooldown.minScale,
      1 - danger * ENEMY_CONFIG.setupFireCooldown.dangerStep
    );
    if (this.bossAi) this.bossAi.applyStats();
    if (this.role === "sniper") {
      this.sniperCharging = false;
      this.sniperChargeTimer = 0;
      this.aimX = null;
      this.aimY = null;
    }
    if (this.role === "guardian") {
      this.guardianShield = Math.ceil(this.maxHealth * ENEMY_CONFIG.guardian.shieldHealthScale);
      this.guardianShieldMax = this.guardianShield;
      this.guardianShieldFlash = 0;
    }

    if (this.role === "raider") {
      const fromLeft = Math.random() < 0.5;
      this.x = fromLeft ? -this.width : PLAYFIELD.width + this.width;
      this.y = randomRange(ENEMY_CONFIG.spawn.raiderYMin, PLAYFIELD.height * ENEMY_CONFIG.spawn.raiderYMaxRatio);
      this.velocityX = (fromLeft ? 1 : -1) * Math.abs(this.velocityX);
    } else {
      this.x = this.isBoss
        ? PLAYFIELD.width * ENEMY_CONFIG.spawn.bossXRatio
        : randomRange(ENEMY_CONFIG.spawn.xPadding, PLAYFIELD.width - ENEMY_CONFIG.spawn.xPadding);
      this.y =
        this.role === "boss"
          ? ENEMY_CONFIG.spawn.bossY
          : this.role === "midboss"
            ? ENEMY_CONFIG.spawn.midBossY
            : ENEMY_CONFIG.spawn.gruntY;
    }

    this.stopY = this.role === "boss" ? ENEMY_CONFIG.spawn.bossStopY : ENEMY_CONFIG.spawn.midBossStopY;
    this.fireTimer = this.shooter
      ? randomRange(ENEMY_CONFIG.setupFireCooldown.initialMin, ENEMY_CONFIG.setupFireCooldown.initialMax) *
        this.fireCooldownScale
      : ENEMY_CONFIG.setupFireCooldown.nonShooterTimer;

    if (Number.isFinite(this.spawnOptions.x)) this.x = this.spawnOptions.x;
    if (Number.isFinite(this.spawnOptions.y)) this.y = this.spawnOptions.y;
  }

  update(dt, game) {
    this.wave += dt * ENEMY_CONFIG.movement.waveSpeed;
    this.phase += dt;

    if (this.isBoss) {
      if (this.y < this.stopY) {
        this.y += this.velocityY * dt;
      } else {
        this.y = this.stopY;
        this.x +=
          (this.velocityX +
            Math.sin(this.phase * ENEMY_CONFIG.movement.bossPhaseSwaySpeed) *
              ENEMY_CONFIG.movement.bossPhaseSwayAmount) *
          dt;
      }
    } else if (this.role === "raider") {
      this.x += this.velocityX * dt;
      this.y += (this.velocityY + Math.sin(this.wave) * ENEMY_CONFIG.movement.raiderSway) * dt;
    } else {
      const sway =
        this.role === "striker"
          ? ENEMY_CONFIG.movement.strikerSway
          : this.role === "scout"
            ? ENEMY_CONFIG.movement.scoutSway
            : ENEMY_CONFIG.movement.defaultSway;
      this.x += (this.velocityX + Math.sin(this.wave) * sway) * dt;
      this.y += this.velocityY * dt;
    }

    if (this.role !== "raider") {
      const sideLimit = this.isBoss
        ? this.width * ENEMY_CONFIG.movement.bossSideLimitRatio
        : ENEMY_CONFIG.movement.defaultSideLimit;
      if (this.x < sideLimit || this.x > PLAYFIELD.width - sideLimit) {
        this.velocityX *= -1;
        this.x = clampNumber(this.x, sideLimit, PLAYFIELD.width - sideLimit);
      }
    }

    if (this.bossAi) {
      this.bossAi.update(dt, game);
      return;
    }

    if (this.role === "guardian") this.guardianShieldFlash = Math.max(0, this.guardianShieldFlash - dt * 5);

    if (this.role === "sniper") {
      this.updateSniperAttack(dt, game);
      return;
    }

    this.fireTimer -= dt;
    if (
      this.shooter &&
      this.fireTimer <= 0 &&
      this.y > ENEMY_CONFIG.firingWindow.top &&
      this.y < PLAYFIELD.height - ENEMY_CONFIG.firingWindow.bottomPadding
    ) {
      if (this.isBoss) this.fireBossPattern(game);
      else this.fireAt(game.player, game.state.danger, game);
      this.fireTimer = this.nextFireDelay(game.state.danger);
    }
  }

  updateSniperAttack(dt, game) {
    if (!this.shooter || this.y <= ENEMY_CONFIG.firingWindow.top || this.y >= PLAYFIELD.height - ENEMY_CONFIG.firingWindow.bottomPadding) {
      return;
    }

    if (this.sniperCharging) {
      this.sniperChargeTimer -= dt;
      this.aimX = game.player.x;
      this.aimY = game.player.y;
      if (this.sniperChargeTimer <= 0) {
        this.fireSniperShot(game);
        this.sniperCharging = false;
        this.aimX = null;
        this.aimY = null;
        this.fireTimer = this.nextFireDelay(game.state.danger);
      }
      return;
    }

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.sniperCharging = true;
      this.sniperChargeTimer = ENEMY_CONFIG.sniper.chargeTime;
      this.aimX = game.player.x;
      this.aimY = game.player.y;
    }
  }

  fireSniperShot(game) {
    const targetX = this.aimX ?? game.player.x;
    const targetY = this.aimY ?? game.player.y;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.hypot(dx, dy) || 1;
    game.enemyBullets.push(new Projectile({
      x: this.x,
      y: this.y + this.height * ENEMY_CONFIG.bullet.spawnYOffsetRatio,
      vx: (dx / len) * ENEMY_CONFIG.sniper.shotSpeed,
      vy: (dy / len) * ENEMY_CONFIG.sniper.shotSpeed,
      radius: ENEMY_CONFIG.sniper.shotRadius,
      damage: Enemy.bulletDamage(ENEMY_CONFIG.sniper.shotLevel, game.state.danger),
      color: ENEMY_CONFIG.sniper.shotColor,
      hostile: true,
      level: ENEMY_CONFIG.sniper.shotLevel,
      life: ENEMY_CONFIG.sniper.shotLife,
    }));
  }

  nextFireDelay(danger) {
    const scale = Math.max(ENEMY_CONFIG.fireDelay.minScale, 1 - danger * ENEMY_CONFIG.fireDelay.dangerStep);
    const delay = ENEMY_CONFIG.fireDelay[this.role] || ENEMY_CONFIG.fireDelay.default;
    return randomRange(delay.min, delay.max) * scale;
  }

  visualWidth() {
    const padding = this.isBoss
      ? ENEMY_CONFIG.visual.bossWidthPadding
      : this.role === "tank"
        ? ENEMY_CONFIG.visual.tankWidthPadding
        : ENEMY_CONFIG.visual.defaultPadding;
    return this.hitRx * padding;
  }

  visualHeight() {
    const padding = this.isBoss
      ? ENEMY_CONFIG.visual.bossHeightPadding
      : this.role === "raider"
        ? ENEMY_CONFIG.visual.raiderHeightPadding
        : ENEMY_CONFIG.visual.defaultPadding;
    return this.hitRy * padding;
  }

  healthBarOffsetY() {
    return (
      this.hitRy +
      Math.max(ENEMY_CONFIG.visual.healthBarMinOffset, this.visualHeight() * ENEMY_CONFIG.visual.healthBarOffsetRatio)
    );
  }

  healthBarWidth() {
    return Math.max(
      this.hitRx * ENEMY_CONFIG.visual.healthBarWidthHitboxRatio,
      this.visualWidth() * ENEMY_CONFIG.visual.healthBarWidthVisualRatio
    );
  }

  fireAt(player, danger, game) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = Math.min(
      ENEMY_CONFIG.bullet.speedMax,
      ENEMY_CONFIG.bullet.speedBase + danger * ENEMY_CONFIG.bullet.speedDangerStep
    );
    game.enemyBullets.push(new Projectile({
      x: this.x,
      y: this.y + this.height * ENEMY_CONFIG.bullet.spawnYOffsetRatio,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      radius: ENEMY_CONFIG.bullet.radius,
      damage: Enemy.bulletDamage(this.bulletLevel, danger),
      color: ENEMY_CONFIG.bullet.color,
      hostile: true,
      level: this.bulletLevel,
      life: ENEMY_CONFIG.bullet.life,
    }));
  }

  fireBossPattern(game) {
    this.fireAt(game.player, game.state.danger, game);
    const spread = this.role === "boss" ? ENEMY_CONFIG.bossPattern.bossSpreadAngles : ENEMY_CONFIG.bossPattern.midBossSpreadAngles;
    const speed = this.role === "boss" ? ENEMY_CONFIG.bossPattern.bossSpeed : ENEMY_CONFIG.bossPattern.midBossSpeed;
    const bulletLevel = this.role === "boss" ? ENEMY_CONFIG.bossPattern.bossBulletLevel : ENEMY_CONFIG.bossPattern.midBossBulletLevel;
    for (const angle of spread) {
      const rad = ((ENEMY_CONFIG.bossPattern.forwardDegrees + angle) * Math.PI) / 180;
      game.enemyBullets.push(new Projectile({
        x: this.x,
        y: this.y + this.height * ENEMY_CONFIG.bossPattern.spawnYOffsetRatio,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: this.role === "boss" ? ENEMY_CONFIG.bossPattern.bossRadius : ENEMY_CONFIG.bossPattern.midBossRadius,
        damage: Enemy.bulletDamage(bulletLevel, game.state.danger),
        color: this.role === "boss" ? ENEMY_CONFIG.bossPattern.bossColor : ENEMY_CONFIG.bossPattern.midBossColor,
        hostile: true,
        level: bulletLevel,
        life: ENEMY_CONFIG.bossPattern.life,
      }));
    }
  }

  get escaped() {
    if (this.role === "raider") {
      return (
        this.x < -this.width * ENEMY_CONFIG.escape.raiderWidthMultiplier ||
        this.x > PLAYFIELD.width + this.width * ENEMY_CONFIG.escape.raiderWidthMultiplier ||
        this.y > PLAYFIELD.height + ENEMY_CONFIG.escape.padding
      );
    }

    return !this.isBoss && this.y > PLAYFIELD.height + ENEMY_CONFIG.escape.padding;
  }

  hitBy(projectile) {
    if (projectile.kind === "rapidBeam") {
      const halfWidth = (projectile.beamWidth || projectile.radius * 2) / 2;
      const length = projectile.beamLength || PLAYFIELD.height;
      const top = projectile.y - length / 2;
      const bottom = projectile.y + length / 2;
      return (
        Math.abs(this.x - projectile.x) <= this.hitRx + halfWidth &&
        this.y + this.hitRy >= top &&
        this.y - this.hitRy <= bottom
      );
    }

    const radius = projectile.hitRadius ?? projectile.radius;
    const dx = projectile.x - this.x;
    const dy = projectile.y - this.y;
    const broadRadius = Math.max(this.hitRx, this.hitRy) + radius;
    if (dx * dx + dy * dy > broadRadius * broadRadius) return false;

    return Collision.circleEllipse(projectile.x, projectile.y, radius, this.x, this.y, this.hitRx, this.hitRy);
  }

  receiveHit(projectile) {
    return this.receiveDamage(projectile.damage, {
      color: projectile.color,
      burst: projectile.kind === "energy" || projectile.kind === "nova" ? 9 : 5,
    });
  }

  receiveDamage(amount, options = {}) {
    if (this.bossAi && !this.bossAi.isVulnerable()) return this.bossAi.blockedHitResult();

    let remainingDamage = amount;
    if (this.guardianShield > 0) {
      const absorbed = Math.min(this.guardianShield, remainingDamage);
      this.guardianShield -= absorbed;
      remainingDamage -= absorbed;
      this.guardianShieldFlash = 1;
      if (remainingDamage <= 0) {
        return { damage: 0, blocked: true, color: ENEMY_CONFIG.guardian.shieldColor, burst: ENEMY_CONFIG.guardian.shieldHitBurst };
      }
    }

    const effectiveDamage = Math.max(1, remainingDamage - (this.armor || 0));
    this.health -= effectiveDamage;
    return { damage: effectiveDamage, blocked: false, color: options.color ?? this.color, burst: options.burst ?? 5 };
  }

  isStageBossVulnerable() {
    return this.bossAi?.isVulnerable() ?? false;
  }

  collidesWithPlayer(player) {
    const radius = player.hitRadius ?? player.bodyRadius;
    return Collision.circleEllipse(player.x, player.y, radius, this.x, this.y, this.hitRx, this.hitRy);
  }

  blastHitRadius() {
    return Math.max(this.hitRx, this.hitRy);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.bossAi) {
      this.bossAi.draw(ctx);
      ctx.restore();
      return;
    }

    if (this.drawSprite(ctx)) {
      this.drawRoleOverlay(ctx);
      ctx.restore();
      return;
    }

    if (this.isBoss) {
      this.drawBoss(ctx);
      ctx.restore();
      return;
    }

    if (this.role === "scout") this.drawScout(ctx);
    else if (this.role === "striker") this.drawStriker(ctx);
    else if (this.role === "tank") this.drawTank(ctx);
    else if (this.role === "guardian") this.drawTank(ctx);
    else if (this.role === "sniper") this.drawStriker(ctx);
    else if (this.role === "splitter") this.drawFighter(ctx);
    else this.drawFighter(ctx);

    this.drawRoleOverlay(ctx);
    ctx.restore();
  }

  drawRoleOverlay(ctx) {
    if (this.role === "sniper" && this.sniperCharging) this.drawSniperWarning(ctx);
    if (this.role === "guardian" && this.guardianShield > 0) this.drawGuardianShield(ctx);
  }

  drawSniperWarning(ctx) {
    if (!Number.isFinite(this.aimX) || !Number.isFinite(this.aimY)) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = ENEMY_CONFIG.sniper.warningColor;
    ctx.lineWidth = ENEMY_CONFIG.sniper.warningLineWidth + (1 - this.sniperChargeTimer / ENEMY_CONFIG.sniper.chargeTime) * 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.36);
    ctx.lineTo(this.aimX - this.x, this.aimY - this.y);
    ctx.stroke();
    ctx.restore();
  }

  drawGuardianShield(ctx) {
    const ratio = clampNumber(this.guardianShield / this.guardianShieldMax, 0, 1);
    const flash = this.guardianShieldFlash || 0;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = ENEMY_CONFIG.guardian.shieldColor;
    ctx.lineWidth = 2 + flash * 3;
    ctx.globalAlpha = 0.28 + ratio * 0.36 + flash * 0.24;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.hitRx * ENEMY_CONFIG.guardian.shieldRadiusScale, this.hitRy * ENEMY_CONFIG.guardian.shieldRadiusScale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawSprite(ctx) {
    const atlas = Enemy.atlas();
    if (!atlas.isReady()) return false;

    const [col, row] = ENEMY_CONFIG.spriteCells[this.role] || ENEMY_CONFIG.spriteCells.fighter;
    atlas.draw(ctx, col, row, 0, 0, this.visualWidth(), this.visualHeight(), {
      shadowColor: "rgba(255, 96, 120, 0.45)",
      shadowBlur: this.isBoss ? 14 : 8,
    });
    this.drawHealthBar(ctx, this.healthBarOffsetY(), this.healthBarWidth());
    return true;
  }

  drawFighter(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.55);
    ctx.lineTo(-this.width * 0.5, -this.height * 0.12);
    ctx.quadraticCurveTo(0, -this.height * 0.55, this.width * 0.5, -this.height * 0.12);
    ctx.closePath();
    ctx.fill();
    this.drawEnemyCanopy(ctx);
  }

  drawScout(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.height * 0.55);
    ctx.lineTo(this.width * 0.42, 0);
    ctx.lineTo(0, this.height * 0.56);
    ctx.lineTo(-this.width * 0.42, 0);
    ctx.closePath();
    ctx.fill();
    this.drawEnemyCanopy(ctx);
  }

  drawStriker(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.height * 0.5);
    ctx.lineTo(this.width * 0.56, this.height * 0.24);
    ctx.lineTo(this.width * 0.15, this.height * 0.12);
    ctx.lineTo(this.width * 0.18, this.height * 0.55);
    ctx.lineTo(0, this.height * 0.34);
    ctx.lineTo(-this.width * 0.18, this.height * 0.55);
    ctx.lineTo(-this.width * 0.15, this.height * 0.12);
    ctx.lineTo(-this.width * 0.56, this.height * 0.24);
    ctx.closePath();
    ctx.fill();
    this.drawEnemyCanopy(ctx);
  }

  drawTank(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.width * 0.44, -this.height * 0.36, this.width * 0.88, this.height * 0.72, 9);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(-this.width * 0.33, this.height * 0.12, this.width * 0.66, 5);
    this.drawEnemyCanopy(ctx);
  }

  drawEnemyCanopy(ctx) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.56)";
    ctx.beginPath();
    ctx.ellipse(0, -this.height * 0.12, this.width * 0.2, this.height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    this.drawHealthBar(ctx, this.healthBarOffsetY(), this.healthBarWidth());
  }

  drawBoss(ctx) {
    const scale = this.role === "boss" ? 1 : 0.78;
    ctx.scale(scale, scale);
    const spriteWidth = this.width / scale;
    const spriteHeight = this.height / scale;
    const w = spriteWidth;
    const h = spriteHeight;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.48);
    ctx.lineTo(w * 0.5, -h * 0.08);
    ctx.lineTo(w * 0.38, h * 0.35);
    ctx.lineTo(w * 0.12, h * 0.5);
    ctx.lineTo(0, h * 0.3);
    ctx.lineTo(-w * 0.12, h * 0.5);
    ctx.lineTo(-w * 0.38, h * 0.35);
    ctx.lineTo(-w * 0.5, -h * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.2, w * 0.18, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    for (const x of [-0.28, 0.28]) {
      ctx.beginPath();
      ctx.roundRect(w * x - 16, h * 0.05, 32, 16, 6);
      ctx.fill();
    }
    this.drawHealthBar(ctx, h * 0.62, w * 0.7);
  }


  drawHealthBar(ctx, y, width = this.width * 0.64) {
    if (this.maxHealth <= 1) return;
    ctx.fillStyle = "rgba(11, 16, 28, 0.58)";
    ctx.fillRect(-width / 2, y, width, 5);
    ctx.fillStyle = this.isBoss ? "#ffe2a3" : "#e9ffe0";
    ctx.fillRect(-width / 2, y, width * (this.health / this.maxHealth), 5);
  }
}
