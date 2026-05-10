// Galaxy Runner - sprite atlas
// Draws one cell from a uniform grid atlas.

class SpriteAtlas {
  constructor(image, columns, rows) {
    this.image = image;
    this.columns = columns;
    this.rows = rows;
    this.cachedCellSize = null;
    this.cachedNaturalWidth = 0;
    this.cachedNaturalHeight = 0;
  }

  isReady() {
    return AssetLoader.ready(this.image);
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

  draw(ctx, col, row, x, y, width, height, options = {}) {
    if (!this.isReady()) return;

    const {
      alpha = 1,
      rotation = 0,
      flipX = false,
      shadowColor = "rgba(0, 8, 18, 0.72)",
      shadowBlur = 5,
    } = options;
    const { cellWidth, cellHeight } = this.cellSize();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);
    ctx.globalAlpha *= alpha;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.drawImage(
      this.image,
      col * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight,
      -width / 2,
      -height / 2,
      width,
      height
    );
    ctx.restore();
  }
}
