// Galaxy Runner - projectile special renderer
// Owns vector visuals for special and non-atlas projectile families.

class ProjectileSpecialRenderer {
  static drawHomingMissile(ctx, projectile) {
    const angle = Math.atan2(projectile.vy, projectile.vx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = projectile.color;

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

    ctx.fillStyle = projectile.color;
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

  static drawRapidBeam(ctx, projectile) {
    const width = projectile.beamWidth || projectile.radius * 2;
    const length = projectile.beamLength || PLAYFIELD.height;
    const top = projectile.y - length / 2;
    const bottom = projectile.y + length / 2;
    const pulse = 0.78 + Math.sin(performance.now() * 0.028) * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ffe06a";
    ctx.shadowBlur = 28;

    const grd = ctx.createLinearGradient(projectile.x - width / 2, 0, projectile.x + width / 2, 0);
    grd.addColorStop(0, "rgba(255, 224, 106, 0)");
    grd.addColorStop(0.22, `rgba(255, 224, 106, ${0.16 * pulse})`);
    grd.addColorStop(0.5, `rgba(255, 255, 245, ${0.68 * pulse})`);
    grd.addColorStop(0.78, `rgba(255, 224, 106, ${0.16 * pulse})`);
    grd.addColorStop(1, "rgba(255, 224, 106, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(projectile.x - width * 0.36, bottom);
    ctx.lineTo(projectile.x - width * 0.52, top);
    ctx.lineTo(projectile.x + width * 0.52, top);
    ctx.lineTo(projectile.x + width * 0.36, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 246, 174, ${0.78 * pulse})`;
    ctx.lineWidth = Math.max(3, width * 0.08);
    ctx.beginPath();
    ctx.moveTo(projectile.x, bottom);
    ctx.lineTo(projectile.x, top);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 224, 106, ${0.45 * pulse})`;
    ctx.lineWidth = Math.max(1.5, width * 0.025);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(projectile.x + side * width * 0.28, bottom);
      ctx.lineTo(projectile.x + side * width * 0.46, top);
      ctx.stroke();
    }
    ctx.restore();
  }

  static drawNovaShot(ctx, projectile) {
    ctx.save();
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 18;
    const pulse = 0.78 + Math.sin(performance.now() * 0.015) * 0.12;
    const grd = ctx.createRadialGradient(
      projectile.x - projectile.radius * 0.25,
      projectile.y - projectile.radius * 0.35,
      1,
      projectile.x,
      projectile.y,
      projectile.radius * 1.5
    );
    grd.addColorStop(0, "#fff8d0");
    grd.addColorStop(0.35, `rgba(255, 143, 90, ${pulse})`);
    grd.addColorStop(1, "rgba(255, 72, 48, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 238, 190, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(projectile.x, projectile.y, projectile.radius * 1.9, projectile.radius * 0.7, projectile.y * 0.015, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  static drawNovaMine(ctx, projectile) {
    const visual = SPECIAL_CONFIG.nova.visual;
    const pulse = 1 + Math.sin(performance.now() * visual.pulseSpeed) * visual.pulseAmount;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.strokeStyle = `rgba(255, 177, 118, ${visual.blastPreviewAlpha})`;
    ctx.lineWidth = visual.blastPreviewLineWidth;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowColor = SPECIAL_CONFIG.nova.color;
    ctx.shadowBlur = projectile.radius * visual.glowRadius;

    const grd = ctx.createRadialGradient(projectile.x, projectile.y, 1, projectile.x, projectile.y, projectile.radius * visual.ringRadius * pulse);
    grd.addColorStop(0, "#fff7cf");
    grd.addColorStop(0.42, "rgba(255, 177, 118, 0.82)");
    grd.addColorStop(1, "rgba(255, 83, 52, 0.02)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * visual.ringRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 235, 190, 0.86)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = SPECIAL_CONFIG.nova.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius * visual.coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 210, 0.48)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < visual.spokeCount; i += 1) {
      const angle = performance.now() * visual.pulseSpeed + i * ((Math.PI * 2) / visual.spokeCount);
      ctx.beginPath();
      ctx.moveTo(
        projectile.x + Math.cos(angle) * projectile.radius * visual.coreRadius,
        projectile.y + Math.sin(angle) * projectile.radius * visual.coreRadius
      );
      ctx.lineTo(
        projectile.x + Math.cos(angle) * projectile.radius * visual.ringRadius,
        projectile.y + Math.sin(angle) * projectile.radius * visual.ringRadius
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  static drawSpreadShot(ctx, projectile) {
    const angle = Math.atan2(projectile.vy, projectile.vx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = projectile.color;
    ctx.fillStyle = projectile.color;
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
}
