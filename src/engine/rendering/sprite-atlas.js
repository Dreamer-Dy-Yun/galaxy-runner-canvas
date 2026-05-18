// Galaxy Runner - engine sprite atlas
// Draws one cell from a uniform grid atlas without choosing game-specific frames.

(() => {
  if (globalThis.SpriteAtlas) return;

  class SpriteAtlas {
    constructor(image, columns, rows) {
      if (!image) throw new Error("SpriteAtlas requires an image");
      if (!Number.isFinite(columns) || columns <= 0 || !Number.isFinite(rows) || rows <= 0) {
        throw new Error("SpriteAtlas requires positive column and row counts");
      }

      this.image = image;
      this.columns = columns;
      this.rows = rows;
      this.cachedCellSize = null;
      this.cachedNaturalWidth = 0;
      this.cachedNaturalHeight = 0;
    }

    isReady() {
      const loader = globalThis.AssetLoader;
      if (loader && typeof loader.ready === "function") return loader.ready(this.image);
      return Boolean(this.image.complete && this.image.naturalWidth > 0);
    }

    cellSize() {
      if (
        this.cachedCellSize &&
        this.cachedNaturalWidth === this.image.naturalWidth &&
        this.cachedNaturalHeight === this.image.naturalHeight
      ) {
        return this.cachedCellSize;
      }

      this.cachedNaturalWidth = this.image.naturalWidth;
      this.cachedNaturalHeight = this.image.naturalHeight;
      this.cachedCellSize = {
        cellWidth: this.cachedNaturalWidth / this.columns,
        cellHeight: this.cachedNaturalHeight / this.rows,
      };
      return this.cachedCellSize;
    }

    frameRect(col, row) {
      const { cellWidth, cellHeight } = this.cellSize();
      return {
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      };
    }

    draw(ctx, col, row, x, y, width, height, options = {}) {
      if (!this.isReady()) return false;

      const {
        alpha = 1,
        rotation = 0,
        flipX = false,
        shadowColor = "rgba(0, 8, 18, 0.72)",
        shadowBlur = 5,
      } = options;
      const frame = this.frameRect(col, row);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      if (flipX) ctx.scale(-1, 1);
      ctx.globalAlpha *= alpha;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.drawImage(
        this.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -width / 2,
        -height / 2,
        width,
        height
      );
      ctx.restore();
      return true;
    }
  }

  globalThis.SpriteAtlas = SpriteAtlas;
})();
