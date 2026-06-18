// Galaxy Runner - projectile energy renderer
// Owns the absorbed enemy-bullet energy core visual.

class ProjectileEnergyRenderer {
  static drawEnergyCore(ctx, projectile) {
    const visual = PROJECTILE_CONFIG.energyCoreVisual;
    const absorbedPulse = Math.min((projectile.absorbedEnemyBullets || 0) * visual.absorbedPulsePerBullet, visual.absorbedPulseMax);
    const pulse = 1 + Math.sin(performance.now() * visual.pulseSpeed) * visual.pulseAmount + absorbedPulse;
    const shellRadius = projectile.radius * visual.shellRadius * pulse;
    const haloRadius = projectile.radius * visual.haloRadius * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = projectile.radius * 1.15;

    const halo = ctx.createRadialGradient(projectile.x, projectile.y, projectile.radius * visual.innerRadius, projectile.x, projectile.y, haloRadius);
    halo.addColorStop(0, "rgba(255, 255, 255, 0.46)");
    halo.addColorStop(0.28, "rgba(154, 248, 255, 0.28)");
    halo.addColorStop(0.66, "rgba(72, 198, 255, 0.12)");
    halo.addColorStop(1, "rgba(72, 198, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    const shell = ctx.createRadialGradient(
      projectile.x - projectile.radius * 0.28,
      projectile.y - projectile.radius * 0.36,
      1,
      projectile.x,
      projectile.y,
      shellRadius
    );
    shell.addColorStop(0, "#ffffff");
    shell.addColorStop(0.24, "rgba(225, 255, 255, 0.92)");
    shell.addColorStop(0.58, "rgba(98, 230, 255, 0.32)");
    shell.addColorStop(1, "rgba(54, 171, 255, 0.03)");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, shellRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(224, 255, 255, 0.78)";
    ctx.lineWidth = visual.shieldArcLineWidth;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const start = performance.now() * visual.pulseSpeed * 0.35 + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, shellRadius * 0.92, start, start + Math.PI * 0.28);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(performance.now() * visual.pulseSpeed * 0.24);
    ctx.strokeStyle = "rgba(154, 248, 255, 0.64)";
    ctx.lineWidth = visual.coreLineWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, projectile.radius * visual.ringRadius, projectile.radius * visual.ringRadius * visual.ringSquash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, projectile.radius * visual.ringRadius, projectile.radius * visual.ringRadius * visual.ringSquash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f7ffff";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * visual.innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
    ctx.lineWidth = visual.coreLineWidth;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const angle = performance.now() * visual.pulseSpeed + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.moveTo(
        projectile.x + Math.cos(angle) * projectile.radius * visual.spokeInnerRadius,
        projectile.y + Math.sin(angle) * projectile.radius * visual.spokeInnerRadius
      );
      ctx.lineTo(
        projectile.x + Math.cos(angle) * projectile.radius * visual.spokeOuterRadius,
        projectile.y + Math.sin(angle) * projectile.radius * visual.spokeOuterRadius
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}
