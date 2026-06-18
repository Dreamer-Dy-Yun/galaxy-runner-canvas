// Galaxy Runner - projectile renderer
// Dispatches projectile visuals to atlas sprites or focused vector renderers.

class ProjectileRenderer {
  static draw(ctx, projectile) {
    if (
      !projectile.energyCore &&
      projectile.kind !== "rapidBeam" &&
      projectile.kind !== "rapid" &&
      projectile.kind !== SPECIAL_CONFIG.nova.mineKind &&
      ProjectileRenderer.drawSprite(ctx, projectile)
    ) {
      return;
    }

    if (projectile.hostile) {
      ProjectileRenderer.drawEnemyBullet(ctx, projectile);
    } else if (projectile.kind === SPECIAL_CONFIG.nova.mineKind) {
      ProjectileSpecialRenderer.drawNovaMine(ctx, projectile);
    } else if (projectile.energyCore) {
      ProjectileEnergyRenderer.drawEnergyCore(ctx, projectile);
    } else if (projectile.kind === "energy") {
      ProjectileRenderer.drawEnergyBall(ctx, projectile);
    } else if (projectile.kind === "drone") {
      ProjectileSpecialRenderer.drawHomingMissile(ctx, projectile);
    } else if (projectile.kind === "rapidBeam") {
      ProjectileSpecialRenderer.drawRapidBeam(ctx, projectile);
    } else if (projectile.kind === "rapid") {
      ProjectileRenderer.drawRapidShot(ctx, projectile);
    } else if (projectile.kind === "nova") {
      ProjectileSpecialRenderer.drawNovaShot(ctx, projectile);
    } else if (projectile.kind === "spread") {
      ProjectileSpecialRenderer.drawSpreadShot(ctx, projectile);
    } else {
      ProjectileRenderer.drawStreak(ctx, projectile);
    }
  }

  static spriteInfo(projectile) {
    const hit = projectile.hitRadius ?? projectile.radius;

    if (projectile.hostile) {
      const size =
        hit *
        (projectile.level >= 3
          ? PROJECTILE_CONFIG.spriteScales.hostileLevel3
          : projectile.level >= 2
            ? PROJECTILE_CONFIG.spriteScales.hostileLevel2
            : PROJECTILE_CONFIG.spriteScales.hostileLevel1);
      const cell = projectile.level >= 2 ? PROJECTILE_CONFIG.spriteCells.hostileAdvanced : PROJECTILE_CONFIG.spriteCells.hostileBasic;
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

    return sprites[projectile.kind] || sprites.bolt;
  }

  static drawSprite(ctx, projectile) {
    const atlas = Projectile.atlas();
    if (!atlas.isReady()) return false;

    const sprite = ProjectileRenderer.spriteInfo(projectile);
    const angle = sprite.round ? 0 : Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
    atlas.draw(ctx, sprite.col, sprite.row, projectile.x, projectile.y, sprite.w, sprite.h, {
      rotation: angle,
      shadowColor: projectile.color,
      shadowBlur: projectile.hostile ? 8 : 10,
    });
    return true;
  }

  static drawEnemyBullet(ctx, projectile) {
    ctx.shadowColor = "#ffca61";
    ctx.fillStyle = "#ffca61";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(
      projectile.x - projectile.vx * 0.035,
      projectile.y - projectile.vy * 0.035,
      projectile.radius * 0.75,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  static drawEnergyBall(ctx, projectile) {
    ctx.shadowColor = projectile.color;
    const grd = ctx.createRadialGradient(
      projectile.x - projectile.radius * 0.3,
      projectile.y - projectile.radius * 0.4,
      1,
      projectile.x,
      projectile.y,
      projectile.radius * 1.35
    );
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.35, projectile.color);
    grd.addColorStop(1, "rgba(85, 240, 255, 0.05)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawRapidShot(ctx, projectile) {
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const tailScale = clampNumber(speed * 0.026, 18, 30) / speed;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ffe36b";
    ctx.shadowBlur = 10;
    ctx.lineCap = "round";

    ctx.strokeStyle = "rgba(255, 218, 74, 0.56)";
    ctx.lineWidth = Math.max(2.2, projectile.radius * 0.72);
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(projectile.x - projectile.vx * tailScale, projectile.y - projectile.vy * tailScale);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 245, 0.92)";
    ctx.lineWidth = Math.max(0.9, projectile.radius * 0.26);
    ctx.stroke();
    ctx.restore();
  }

  static drawStreak(ctx, projectile) {
    ctx.shadowColor = projectile.color;
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = projectile.radius * 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(projectile.x - projectile.vx * 0.035, projectile.y - projectile.vy * 0.035);
    ctx.stroke();
  }
}
