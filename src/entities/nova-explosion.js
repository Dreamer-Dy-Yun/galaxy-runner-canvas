// Galaxy Runner - nova explosion field
// Makes nova blast radius visible and lets it deal repeated area damage briefly.

class NovaExplosion {
  constructor({
    x,
    y,
    radius,
    damage,
    duration = BALANCE.novaExplosionDuration,
    tickDelay = BALANCE.novaExplosionTickDelay,
    color = "#ff8f5a",
  }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.duration = duration;
    this.tickDelay = tickDelay;
    this.color = color;
    this.age = 0;
    this.nextDamageDelay = 0;
    this.tickFlash = 0;
  }

  update(dt, game) {
    this.age += dt;
    this.tickFlash = Math.max(0, this.tickFlash - dt * 5);
    this.nextDamageDelay -= dt;

    if (this.nextDamageDelay <= 0 && !this.expired) {
      this.damageEnemies(game);
      this.nextDamageDelay += this.tickDelay;
      this.tickFlash = 1;
    }
  }

  damageEnemies(game) {
    for (const enemy of [...game.enemies]) {
      if (!Collision.circleCircle(enemy.x, enemy.y, enemy.blastHitRadius(), this.x, this.y, this.radius)) continue;
      game.damageEnemy(enemy, this.damage, "#ffb17d", 7);
    }
  }

  get expired() {
    return this.age >= this.duration;
  }

  draw(ctx) {
    const ratio = clampNumber(this.age / this.duration, 0, 1);
    const alpha = 1 - ratio;
    const pulse = 0.82 + Math.sin((this.age / this.tickDelay) * Math.PI * 2) * 0.1;
    const coreRadius = this.radius * (0.2 + ratio * 0.72);
    const flashRadius = this.radius * (0.92 + this.tickFlash * 0.12);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    glow.addColorStop(0, `rgba(255, 248, 210, ${0.26 * alpha})`);
    glow.addColorStop(0.35, `rgba(255, 143, 90, ${0.2 * alpha})`);
    glow.addColorStop(1, "rgba(255, 72, 48, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 3 + this.tickFlash * 3;
    ctx.strokeStyle = `rgba(255, 221, 154, ${0.62 * alpha + this.tickFlash * 0.22})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, flashRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255, 113, 72, ${0.42 * alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, coreRadius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.3;
    ctx.strokeStyle = `rgba(255, 239, 190, ${0.2 * alpha})`;
    for (let i = 0; i < 10; i += 1) {
      const angle = this.age * 5 + i * ((Math.PI * 2) / 10);
      const inner = this.radius * 0.18;
      const outer = this.radius * (0.75 + this.tickFlash * 0.14);
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * inner, this.y + Math.sin(angle) * inner);
      ctx.lineTo(this.x + Math.cos(angle) * outer, this.y + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }
}
