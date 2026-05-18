// Galaxy Runner - engine render helpers
// Small Canvas 2D utilities with no game-specific drawing policy.

(() => {
  if (globalThis.RenderHelpers) return;

  class RenderHelpers {
    static withState(ctx, draw) {
      if (!ctx || typeof ctx.save !== "function" || typeof ctx.restore !== "function") {
        throw new TypeError("RenderHelpers.withState requires a 2D canvas context");
      }

      ctx.save();
      try {
        return draw(ctx);
      } finally {
        ctx.restore();
      }
    }

    static fillPanel(ctx, rect, options = {}) {
      const {
        fillStyle = "rgba(4, 10, 24, 0.78)",
        strokeStyle = "rgba(125, 220, 255, 0.42)",
        lineWidth = 1,
        radius = 8,
      } = options;

      RenderHelpers.withState(ctx, () => {
        RenderHelpers.roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
        ctx.fillStyle = fillStyle;
        ctx.fill();
        if (strokeStyle && lineWidth > 0) {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      });
    }

    static strokeBounds(ctx, bounds, options = {}) {
      const { strokeStyle = "rgba(125, 220, 255, 0.72)", lineWidth = 1 } = options;

      RenderHelpers.withState(ctx, () => {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      });
    }

    static fillTextRows(ctx, rows, x, y, options = {}) {
      const {
        fillStyle = "rgba(226, 248, 255, 0.95)",
        font = "12px Consolas, monospace",
        lineHeight = 16,
        textAlign = "left",
        textBaseline = "top",
      } = options;

      RenderHelpers.withState(ctx, () => {
        ctx.fillStyle = fillStyle;
        ctx.font = font;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        for (let index = 0; index < rows.length; index += 1) {
          ctx.fillText(String(rows[index]), x, y + index * lineHeight);
        }
      });
    }

    static roundRectPath(ctx, x, y, width, height, radius = 0) {
      const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
      ctx.beginPath();

      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, safeRadius);
        return;
      }

      ctx.moveTo(x + safeRadius, y);
      ctx.lineTo(x + width - safeRadius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
      ctx.lineTo(x + width, y + height - safeRadius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
      ctx.lineTo(x + safeRadius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
      ctx.lineTo(x, y + safeRadius);
      ctx.quadraticCurveTo(x, y, x + safeRadius, y);
      ctx.closePath();
    }
  }

  globalThis.RenderHelpers = RenderHelpers;
})();
