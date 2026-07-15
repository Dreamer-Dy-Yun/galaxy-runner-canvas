// Galaxy Runner - transient Canvas feedback view
// Draws one current feedback toast and owns no gameplay state, DOM, or audio behavior.

(() => {
  const TYPE_COLORS = Object.freeze({
    "special.used": "#ff92c9",
    "special.failed": "#ffbe6f",
    "item.collected": "#9af8ff",
    "player.hit": "#ff8fa8",
    "enemy.destroyed": "#ffe06a",
    "boss.spawned": "#ff7f9b",
  });

  class GameFeedback {
    constructor(options = {}) {
      this.messages = options.messages || globalThis.GameFeedbackMessages || null;
      this.y = Number.isFinite(options.y) ? options.y : 94;
      this.font = options.font || "800 15px Segoe UI, Noto Sans KR, sans-serif";
      this.paddingX = Number.isFinite(options.paddingX) ? options.paddingX : 18;
      this.height = Number.isFinite(options.height) ? options.height : 34;
      this.fadeSeconds = Number.isFinite(options.fadeSeconds) ? options.fadeSeconds : 0.24;
    }

    draw(ctx, feedbackOrEvent, viewport = {}) {
      const event = this.resolveEvent(feedbackOrEvent);
      const message = this.messages?.text?.(event) || "";
      if (!ctx || !event || !message || typeof ctx.fillText !== "function") return false;

      const width = Number.isFinite(viewport.width)
        ? viewport.width
        : typeof PLAYFIELD !== "undefined"
          ? PLAYFIELD.width
          : 960;
      const remaining = Number.isFinite(event.remainingSeconds) ? event.remainingSeconds : event.durationSeconds;
      const alpha = Math.max(0, Math.min(1, remaining / this.fadeSeconds));
      const measuredWidth = typeof ctx.measureText === "function" ? ctx.measureText(message).width : message.length * 9;
      const boxWidth = Math.min(width - 32, Math.max(180, measuredWidth + this.paddingX * 2));
      const x = (width - boxWidth) / 2;
      const y = this.y;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(5, 9, 18, 0.88)";
      ctx.strokeStyle = TYPE_COLORS[event.type] || "#9af8ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, boxWidth, this.height, 12);
      else ctx.rect(x, y, boxWidth, this.height);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TYPE_COLORS[event.type] || "#f6fbff";
      ctx.font = this.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(message, width / 2, y + this.height / 2);
      ctx.restore();
      return true;
    }

    resolveEvent(feedbackOrEvent) {
      if (feedbackOrEvent && typeof feedbackOrEvent.current === "function") {
        return feedbackOrEvent.current();
      }
      return feedbackOrEvent || null;
    }
  }

  globalThis.GameFeedback = GameFeedback;
})();
