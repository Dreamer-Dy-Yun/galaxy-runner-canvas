class BurstParticle {
  constructor(x, y, color) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(BURST_CONFIG.speed.min, BURST_CONFIG.speed.max);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.particleRadius = randomRange(BURST_CONFIG.radius.min, BURST_CONFIG.radius.max);
    this.life = randomRange(BURST_CONFIG.life.min, BURST_CONFIG.life.max);
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.globalAlpha = clampNumber(this.life * BURST_CONFIG.alphaMultiplier, 0, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.particleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
