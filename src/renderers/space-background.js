// Galaxy Runner - effects
// Split from the original single-file prototype so each system can evolve independently.

class SpaceBackground {
  constructor(count = BACKGROUND_CONFIG.starCount) {
    this.count = count;
    this.stars = [];
    this.reset();
  }

  reset() {
    this.stars = [];
    for (let i = 0; i < this.count; i += 1) {
      this.stars.push({
        x: Math.random() * PLAYFIELD.width,
        y: Math.random() * PLAYFIELD.height,
        radius: randomRange(BACKGROUND_CONFIG.starRadius.min, BACKGROUND_CONFIG.starRadius.max),
        speed: randomRange(BACKGROUND_CONFIG.starSpeed.min, BACKGROUND_CONFIG.starSpeed.max),
        alpha: randomRange(BACKGROUND_CONFIG.starAlpha.min, BACKGROUND_CONFIG.starAlpha.max),
      });
    }
  }

  draw(ctx, dt, time) {
    const grd = ctx.createLinearGradient(0, 0, 0, PLAYFIELD.height);
    grd.addColorStop(0, BACKGROUND_CONFIG.gradient.top);
    grd.addColorStop(BACKGROUND_CONFIG.gradient.middleStop, BACKGROUND_CONFIG.gradient.middle);
    grd.addColorStop(1, BACKGROUND_CONFIG.gradient.bottom);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, PLAYFIELD.width, PLAYFIELD.height);

    ctx.save();
    ctx.globalAlpha = BACKGROUND_CONFIG.nebula.alpha;
    for (let i = 0; i < BACKGROUND_CONFIG.nebula.count; i += 1) {
      const y =
        ((time * (BACKGROUND_CONFIG.nebula.speedBase + i * BACKGROUND_CONFIG.nebula.speedStep) +
          i * BACKGROUND_CONFIG.nebula.yOffsetStep) %
          (PLAYFIELD.height + BACKGROUND_CONFIG.nebula.heightPadding)) -
        BACKGROUND_CONFIG.nebula.startYOffset;
      ctx.strokeStyle = i % 2 ? BACKGROUND_CONFIG.nebula.colorA : BACKGROUND_CONFIG.nebula.colorB;
      ctx.lineWidth = BACKGROUND_CONFIG.nebula.lineWidth;
      ctx.beginPath();
      ctx.moveTo(120 + i * 170, y - 120);
      ctx.bezierCurveTo(80 + i * 170, y, 190 + i * 130, y + 70, 120 + i * 160, y + 190);
      ctx.stroke();
    }
    ctx.restore();

    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > PLAYFIELD.height + BACKGROUND_CONFIG.resetPadding) {
        star.y = -BACKGROUND_CONFIG.resetPadding;
        star.x = Math.random() * PLAYFIELD.width;
      }

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#f8fbff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
