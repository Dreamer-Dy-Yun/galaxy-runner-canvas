// Galaxy Runner - item icon auxiliary renderer
// Owns fallback and low-frequency item icon vector shapes.

class ItemIconAuxRenderer {
  static weaponCore(ctx, x, y, scale, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - 18 * scale);
    ctx.lineTo(x + 15 * scale, y);
    ctx.lineTo(x, y + 18 * scale);
    ctx.lineTo(x - 15 * scale, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(4, 9, 16, 0.42)";
    ctx.beginPath();
    ctx.moveTo(x, y - 10 * scale);
    ctx.lineTo(x + 8 * scale, y);
    ctx.lineTo(x, y + 10 * scale);
    ctx.lineTo(x - 8 * scale, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 224, 106, 0.86)";
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 5 * scale, y);
    ctx.lineTo(x + 5 * scale, y);
    ctx.moveTo(x, y - 5 * scale);
    ctx.lineTo(x, y + 5 * scale);
    ctx.stroke();
    ctx.restore();
  }

  static star(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = (i % 2 === 0 ? 16 : 7) * scale;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}
