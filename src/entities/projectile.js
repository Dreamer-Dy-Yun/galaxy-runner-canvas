// Galaxy Runner - projectile
// Split from the original single-file prototype so each system can evolve independently.

class Projectile {
  constructor({
    x,
    y,
    vx,
    vy,
    radius,
    damage = PROJECTILE_CONFIG.defaults.damage,
    color,
    kind = PROJECTILE_CONFIG.defaults.kind,
    hostile = PROJECTILE_CONFIG.defaults.hostile,
    level = PROJECTILE_CONFIG.defaults.level,
    absorbLevel = PROJECTILE_CONFIG.defaults.absorbLevel,
    life = PROJECTILE_CONFIG.defaults.life,
    homing = PROJECTILE_CONFIG.defaults.homing,
    homingSpeed = null,
    turnRate = PROJECTILE_CONFIG.defaults.turnRate,
    pierce = PROJECTILE_CONFIG.defaults.pierce,
    blastRadius = PROJECTILE_CONFIG.defaults.blastRadius,
    blastDuration = null,
    beamWidth = PROJECTILE_CONFIG.defaults.beamWidth,
    beamLength = PROJECTILE_CONFIG.defaults.beamLength,
    hitInterval = null,
    followPlayer = PROJECTILE_CONFIG.defaults.followPlayer,
    energyCore = false,
    releaseRadius = 0,
    releaseDamageScale = 0,
    releaseBurst = 0,
    releaseHitBurst = 0,
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.damage = damage;
    this.color = color;
    this.kind = kind;
    this.hostile = hostile;
    this.level = level;
    this.absorbLevel = absorbLevel;
    this.life = life;
    this.homing = homing;
    this.homingSpeed = homingSpeed || Math.hypot(vx, vy) || PROJECTILE_CONFIG.defaults.minimumHomingSpeed;
    this.turnRate = turnRate;
    this.pierce = pierce;
    this.blastRadius = blastRadius;
    this.blastDuration = blastDuration;
    this.beamWidth = beamWidth;
    this.beamLength = beamLength;
    this.followPlayer = followPlayer;
    this.energyCore = energyCore;
    this.releaseRadius = releaseRadius;
    this.releaseDamageScale = releaseDamageScale;
    this.releaseBurst = releaseBurst;
    this.releaseHitBurst = releaseHitBurst;
    this.absorbedEnemyBullets = 0;
    this.hitCooldowns = new Map();
    this.hitInterval = hitInterval ?? Projectile.defaultHitInterval(kind);
    this.hitRadius = this.resolveHitRadius();
  }

  static atlas() {
    if (!Projectile.projectileAtlas) {
      Projectile.projectileAtlas = new SpriteAtlas(
        AssetLoader.image(PROJECTILE_CONFIG.atlas.src),
        PROJECTILE_CONFIG.atlas.columns,
        PROJECTILE_CONFIG.atlas.rows
      );
    }

    return Projectile.projectileAtlas;
  }

  static defaultHitInterval(kind) {
    return PROJECTILE_CONFIG.hitIntervals[kind] ?? PROJECTILE_CONFIG.hitIntervals.default;
  }

  resolveHitRadius() {
    if (this.hostile) return this.radius * PROJECTILE_CONFIG.hitRadius.hostile;
    if (this.kind === "rapidBeam") return this.radius;
    if (this.kind === SPECIAL_CONFIG.nova.mineKind) return this.radius;
    if (this.kind === "rapid") {
      return Math.max(PROJECTILE_CONFIG.hitRadius.rapidMinimum, this.radius * PROJECTILE_CONFIG.hitRadius.rapid);
    }
    if (this.kind === "energy") return this.radius * PROJECTILE_CONFIG.hitRadius.energy;
    if (this.kind === "nova") return this.radius * PROJECTILE_CONFIG.hitRadius.nova;
    if (this.kind === "drone") return this.radius * PROJECTILE_CONFIG.hitRadius.drone;
    return this.radius;
  }

  update(dt, game) {
    if (this.kind === "rapidBeam" && this.followPlayer && game?.player) {
      this.beamLength = game.player.y + PROJECTILE_CONFIG.rapidBeam.followLengthPadding;
      this.x = game.player.x;
      this.y = game.player.y - this.beamLength / 2;
    }

    if (this.homing && game) {
      this.homeTowardEnemy(dt, game);
    }
    this.updateHitCooldowns(dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  updateHitCooldowns(dt) {
    if (this.hitCooldowns.size <= 0) return;

    for (const [target, time] of this.hitCooldowns) {
      const nextTime = time - dt;
      if (nextTime <= 0) this.hitCooldowns.delete(target);
      else this.hitCooldowns.set(target, nextTime);
    }
  }

  canHit(target) {
    return !this.hitCooldowns.has(target);
  }

  markHit(target) {
    this.hitCooldowns.set(target, this.hitInterval);
  }

  homeTowardEnemy(dt, game) {
    const target = game.nearestEnemy(this.x, this.y);
    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const desiredVx = (dx / len) * this.homingSpeed;
    const desiredVy = (dy / len) * this.homingSpeed;
    const turn = clampNumber(this.turnRate * dt, 0, 1);

    this.vx += (desiredVx - this.vx) * turn;
    this.vy += (desiredVy - this.vy) * turn;

    const speed = Math.hypot(this.vx, this.vy) || 1;
    this.vx = (this.vx / speed) * this.homingSpeed;
    this.vy = (this.vy / speed) * this.homingSpeed;
  }

  get expired() {
    return (
      this.life <= 0 ||
      this.x < -PROJECTILE_CONFIG.expiry.padding ||
      this.x > PLAYFIELD.width + PROJECTILE_CONFIG.expiry.padding ||
      this.y < -PROJECTILE_CONFIG.expiry.padding ||
      this.y > PLAYFIELD.height + PROJECTILE_CONFIG.expiry.padding
    );
  }

  draw(ctx) {
    if (!this.energyCore && this.kind !== "rapidBeam" && this.kind !== SPECIAL_CONFIG.nova.mineKind && this.drawSprite(ctx)) return;

    if (this.hostile) {
      this.drawEnemyBullet(ctx);
    } else if (this.kind === SPECIAL_CONFIG.nova.mineKind) {
      this.drawNovaMine(ctx);
    } else if (this.energyCore) {
      this.drawEnergyCore(ctx);
    } else if (this.kind === "energy") {
      this.drawEnergyBall(ctx);
    } else if (this.kind === "drone") {
      this.drawHomingMissile(ctx);
    } else if (this.kind === "rapidBeam") {
      this.drawRapidBeam(ctx);
    } else if (this.kind === "rapid") {
      this.drawRapidShot(ctx);
    } else if (this.kind === "nova") {
      this.drawNovaShot(ctx);
    } else if (this.kind === "spread") {
      this.drawSpreadShot(ctx);
    } else {
      this.drawStreak(ctx);
    }
  }

  spriteInfo() {
    const hit = this.hitRadius ?? this.radius;

    if (this.hostile) {
      const size =
        hit *
        (this.level >= 3
          ? PROJECTILE_CONFIG.spriteScales.hostileLevel3
          : this.level >= 2
            ? PROJECTILE_CONFIG.spriteScales.hostileLevel2
            : PROJECTILE_CONFIG.spriteScales.hostileLevel1);
      const cell = this.level >= 2 ? PROJECTILE_CONFIG.spriteCells.hostileAdvanced : PROJECTILE_CONFIG.spriteCells.hostileBasic;
      return { ...cell, w: size, h: size, round: true };
    }

    const sprites = {
      bolt: {
        ...PROJECTILE_CONFIG.spriteCells.bolt,
        w: hit * PROJECTILE_CONFIG.spriteScales.bolt.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.bolt.height,
      },
      rapid: {
        ...PROJECTILE_CONFIG.spriteCells.rapid,
        w: hit * PROJECTILE_CONFIG.spriteScales.rapid.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.rapid.height,
      },
      energy: {
        ...PROJECTILE_CONFIG.spriteCells.energy,
        w: hit * PROJECTILE_CONFIG.spriteScales.energy.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.energy.height,
        round: true,
      },
      spread: {
        ...PROJECTILE_CONFIG.spriteCells.spread,
        w: hit * PROJECTILE_CONFIG.spriteScales.spread.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.spread.height,
      },
      nova: {
        ...PROJECTILE_CONFIG.spriteCells.nova,
        w: hit * PROJECTILE_CONFIG.spriteScales.nova.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.nova.height,
        round: true,
      },
      drone: {
        ...PROJECTILE_CONFIG.spriteCells.drone,
        w: hit * PROJECTILE_CONFIG.spriteScales.drone.width,
        h: hit * PROJECTILE_CONFIG.spriteScales.drone.height,
      },
    };

    return sprites[this.kind] || sprites.bolt;
  }

  drawSprite(ctx) {
    const atlas = Projectile.atlas();
    if (!atlas.isReady()) return false;

    const sprite = this.spriteInfo();
    const angle = sprite.round ? 0 : Math.atan2(this.vy, this.vx) + Math.PI / 2;
    atlas.draw(ctx, sprite.col, sprite.row, this.x, this.y, sprite.w, sprite.h, {
      rotation: angle,
      shadowColor: this.color,
      shadowBlur: this.hostile ? 8 : 10,
    });
    return true;
  }

  drawEnemyBullet(ctx) {
    ctx.shadowColor = "#ffca61";
    ctx.fillStyle = "#ffca61";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(this.x - this.vx * 0.035, this.y - this.vy * 0.035, this.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawEnergyBall(ctx) {
    ctx.shadowColor = this.color;
    const grd = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.4, 1, this.x, this.y, this.radius * 1.35);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.35, this.color);
    grd.addColorStop(1, "rgba(85, 240, 255, 0.05)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEnergyCore(ctx) {
    const visual = PROJECTILE_CONFIG.energyCoreVisual;
    const absorbedPulse = Math.min((this.absorbedEnemyBullets || 0) * visual.absorbedPulsePerBullet, visual.absorbedPulseMax);
    const pulse = 1 + Math.sin(performance.now() * visual.pulseSpeed) * visual.pulseAmount + absorbedPulse;
    const shellRadius = this.radius * visual.shellRadius * pulse;
    const haloRadius = this.radius * visual.haloRadius * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.radius * 1.15;

    const halo = ctx.createRadialGradient(this.x, this.y, this.radius * visual.innerRadius, this.x, this.y, haloRadius);
    halo.addColorStop(0, "rgba(255, 255, 255, 0.46)");
    halo.addColorStop(0.28, "rgba(154, 248, 255, 0.28)");
    halo.addColorStop(0.66, "rgba(72, 198, 255, 0.12)");
    halo.addColorStop(1, "rgba(72, 198, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.x, this.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    const shell = ctx.createRadialGradient(this.x - this.radius * 0.28, this.y - this.radius * 0.36, 1, this.x, this.y, shellRadius);
    shell.addColorStop(0, "#ffffff");
    shell.addColorStop(0.24, "rgba(225, 255, 255, 0.92)");
    shell.addColorStop(0.58, "rgba(98, 230, 255, 0.32)");
    shell.addColorStop(1, "rgba(54, 171, 255, 0.03)");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.arc(this.x, this.y, shellRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(224, 255, 255, 0.78)";
    ctx.lineWidth = visual.shieldArcLineWidth;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const start = performance.now() * visual.pulseSpeed * 0.35 + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.arc(this.x, this.y, shellRadius * 0.92, start, start + Math.PI * 0.28);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(performance.now() * visual.pulseSpeed * 0.24);
    ctx.strokeStyle = "rgba(154, 248, 255, 0.64)";
    ctx.lineWidth = visual.coreLineWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * visual.ringRadius, this.radius * visual.ringRadius * visual.ringSquash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * visual.ringRadius, this.radius * visual.ringRadius * visual.ringSquash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f7ffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * visual.innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
    ctx.lineWidth = visual.coreLineWidth;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const angle = performance.now() * visual.pulseSpeed + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(angle) * this.radius * visual.spokeInnerRadius,
        this.y + Math.sin(angle) * this.radius * visual.spokeInnerRadius
      );
      ctx.lineTo(
        this.x + Math.cos(angle) * this.radius * visual.spokeOuterRadius,
        this.y + Math.sin(angle) * this.radius * visual.spokeOuterRadius
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHomingMissile(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = this.color;

    ctx.fillStyle = "rgba(174, 252, 255, 0.28)";
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(0, 22);
    ctx.lineTo(4, 8);
    ctx.fill();

    ctx.fillStyle = "#eaffff";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 5);
    ctx.lineTo(2, 11);
    ctx.lineTo(-2, 11);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-7, 3);
    ctx.lineTo(-13, 10);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, 3);
    ctx.lineTo(13, 10);
    ctx.lineTo(4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRapidShot(ctx) {
    ctx.save();
    ctx.shadowColor = "#ffe600";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#ffe600";
    ctx.lineWidth = Math.max(4.2, this.radius * 1.6);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.058, this.y - this.vy * 0.058);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
    ctx.stroke();
    ctx.restore();
  }

  drawRapidBeam(ctx) {
    const width = this.beamWidth || this.radius * 2;
    const length = this.beamLength || PLAYFIELD.height;
    const top = this.y - length / 2;
    const bottom = this.y + length / 2;
    const pulse = 0.78 + Math.sin(performance.now() * 0.028) * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ffe06a";
    ctx.shadowBlur = 28;

    const grd = ctx.createLinearGradient(this.x - width / 2, 0, this.x + width / 2, 0);
    grd.addColorStop(0, "rgba(255, 224, 106, 0)");
    grd.addColorStop(0.22, `rgba(255, 224, 106, ${0.16 * pulse})`);
    grd.addColorStop(0.5, `rgba(255, 255, 245, ${0.68 * pulse})`);
    grd.addColorStop(0.78, `rgba(255, 224, 106, ${0.16 * pulse})`);
    grd.addColorStop(1, "rgba(255, 224, 106, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(this.x - width * 0.36, bottom);
    ctx.lineTo(this.x - width * 0.52, top);
    ctx.lineTo(this.x + width * 0.52, top);
    ctx.lineTo(this.x + width * 0.36, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 246, 174, ${0.78 * pulse})`;
    ctx.lineWidth = Math.max(3, width * 0.08);
    ctx.beginPath();
    ctx.moveTo(this.x, bottom);
    ctx.lineTo(this.x, top);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 224, 106, ${0.45 * pulse})`;
    ctx.lineWidth = Math.max(1.5, width * 0.025);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(this.x + side * width * 0.28, bottom);
      ctx.lineTo(this.x + side * width * 0.46, top);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNovaShot(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    const pulse = 0.78 + Math.sin(performance.now() * 0.015) * 0.12;
    const grd = ctx.createRadialGradient(this.x - this.radius * 0.25, this.y - this.radius * 0.35, 1, this.x, this.y, this.radius * 1.5);
    grd.addColorStop(0, "#fff8d0");
    grd.addColorStop(0.35, `rgba(255, 143, 90, ${pulse})`);
    grd.addColorStop(1, "rgba(255, 72, 48, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 238, 190, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius * 1.9, this.radius * 0.7, this.y * 0.015, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawNovaMine(ctx) {
    const visual = SPECIAL_CONFIG.nova.visual;
    const pulse = 1 + Math.sin(performance.now() * visual.pulseSpeed) * visual.pulseAmount;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.strokeStyle = `rgba(255, 177, 118, ${visual.blastPreviewAlpha})`;
    ctx.lineWidth = visual.blastPreviewLineWidth;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowColor = SPECIAL_CONFIG.nova.color;
    ctx.shadowBlur = this.radius * visual.glowRadius;

    const grd = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * visual.ringRadius * pulse);
    grd.addColorStop(0, "#fff7cf");
    grd.addColorStop(0.42, "rgba(255, 177, 118, 0.82)");
    grd.addColorStop(1, "rgba(255, 83, 52, 0.02)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * visual.ringRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 235, 190, 0.86)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = SPECIAL_CONFIG.nova.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * visual.coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 210, 0.48)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const angle = performance.now() * visual.pulseSpeed + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * this.radius * visual.coreRadius, this.y + Math.sin(angle) * this.radius * visual.coreRadius);
      ctx.lineTo(this.x + Math.cos(angle) * this.radius * visual.ringRadius, this.y + Math.sin(angle) * this.radius * visual.ringRadius);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSpreadShot(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(2, 3);
    ctx.lineTo(-2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawStreak(ctx) {
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.035, this.y - this.vy * 0.035);
    ctx.stroke();
  }
}




