// Galaxy Runner - projectile
// Owns projectile state, movement, hit cooldowns, and collision radius contract.

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

  static warmupAssets() {
    Projectile.atlas();
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
    ProjectileRenderer.draw(ctx, this);
  }
}
