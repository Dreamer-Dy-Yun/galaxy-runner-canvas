// Galaxy Runner - item icon renderer

class ItemIconRenderer {
  static draw(ctx, kind, x, y, color, options = {}) {
    const size = options.size ?? ITEM_ICON_CONFIG.defaultSize;
    if (this.drawImage(ctx, kind, x, y, size)) return;
    this.drawVector(ctx, kind, x, y, color, size);
  }

  static imageCache() {
    if (!this.cachedImages) this.cachedImages = new Map();
    return this.cachedImages;
  }

  static imageFor(kind) {
    const src = typeof itemIconSource === "function" ? itemIconSource(kind) : ITEM_DEFINITIONS[kind]?.iconSrc;
    if (!src || typeof AssetLoader === "undefined") return null;

    const cache = this.imageCache();
    if (!cache.has(src)) cache.set(src, AssetLoader.image(src));
    return cache.get(src);
  }

  static warmupAssets(kinds = null) {
    if (typeof ITEM_DEFINITIONS === "undefined") return;

    const itemKinds = kinds || Object.keys(ITEM_DEFINITIONS);
    for (const kind of itemKinds) {
      this.imageFor(kind);
    }

    if (typeof EXTRA_ITEM_ICON_SOURCES !== "undefined") {
      for (const kind of Object.keys(EXTRA_ITEM_ICON_SOURCES)) {
        this.imageFor(kind);
      }
    }
  }

  static drawImage(ctx, kind, x, y, size) {
    const image = this.imageFor(kind);
    if (!image) return false;
    if (!AssetLoader.ready(image)) return false;

    const drawSize = Math.max(1, size - ITEM_ICON_CONFIG.imagePadding * 2);
    ctx.drawImage(image, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
    return true;
  }

  static drawVector(ctx, kind, x, y, color, size) {
    const scale = size / ITEM_ICON_CONFIG.vectorBaseSize;
    if (kind === "repair") this.heart(ctx, x, y + scale, scale, color);
    else if (kind === "armor") this.armor(ctx, x, y, scale, color);
    else if (kind === "shield") this.shield(ctx, x, y, scale, color);
    else if (kind === "shieldDefense") this.shieldDefense(ctx, x, y, scale, color);
    else if (isWeaponKind(kind)) this.weapon(ctx, kind, x, y, scale, color);
    else if (kind === "drone") this.drone(ctx, x, y, scale, color);
    else if (kind === "weaponCore") this.weaponCore(ctx, x, y, scale, color);
    else if (kind === "bonus") this.overdrive(ctx, x, y, scale, color);
    else this.star(ctx, x, y, scale, color);
  }

  static weapon(ctx, kind, x, y, scale, color) {
    const iconName = WeaponCatalog.iconName(kind);
    if (typeof this[iconName] === "function") {
      this[iconName](ctx, x, y, scale, color);
      return;
    }
    this.star(ctx, x, y, scale, color);
  }

  static heart(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + 8 * scale);
    ctx.bezierCurveTo(x - 23 * scale, y - 7 * scale, x - 10 * scale, y - 23 * scale, x, y - 10 * scale);
    ctx.bezierCurveTo(x + 10 * scale, y - 23 * scale, x + 23 * scale, y - 7 * scale, x, y + 8 * scale);
    ctx.fill();
  }

  static shield(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 16 * scale);
    ctx.lineTo(x + 14 * scale, y - 9 * scale);
    ctx.lineTo(x + 11 * scale, y + 8 * scale);
    ctx.quadraticCurveTo(x, y + 19 * scale, x - 11 * scale, y + 8 * scale);
    ctx.lineTo(x - 14 * scale, y - 9 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
    ctx.beginPath();
    ctx.moveTo(x, y - 11 * scale);
    ctx.lineTo(x + 7 * scale, y - 7 * scale);
    ctx.lineTo(x + 4 * scale, y + 7 * scale);
    ctx.quadraticCurveTo(x, y + 12 * scale, x, y + 12 * scale);
    ctx.closePath();
    ctx.fill();
  }

  static armor(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 17 * scale);
    ctx.lineTo(x + 15 * scale, y - 6 * scale);
    ctx.lineTo(x + 11 * scale, y + 15 * scale);
    ctx.lineTo(x, y + 20 * scale);
    ctx.lineTo(x - 11 * scale, y + 15 * scale);
    ctx.lineTo(x - 15 * scale, y - 6 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(20, 30, 42, 0.62)";
    ctx.beginPath();
    ctx.moveTo(x, y - 9 * scale);
    ctx.lineTo(x + 7 * scale, y - 3 * scale);
    ctx.lineTo(x + 4 * scale, y + 10 * scale);
    ctx.lineTo(x, y + 13 * scale);
    ctx.lineTo(x - 4 * scale, y + 10 * scale);
    ctx.lineTo(x - 7 * scale, y - 3 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - 14 * scale);
    ctx.lineTo(x, y + 15 * scale);
    ctx.stroke();
  }

  static shieldDefense(ctx, x, y, scale, color) {
    this.shield(ctx, x, y, scale * 0.92, color);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 8 * scale, y);
    ctx.lineTo(x + 8 * scale, y);
    ctx.moveTo(x, y - 8 * scale);
    ctx.lineTo(x, y + 8 * scale);
    ctx.stroke();
  }

  static rapid(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 2 * scale, y - 18 * scale);
    ctx.lineTo(x - 8 * scale, y - 1 * scale);
    ctx.lineTo(x + 1 * scale, y - 1 * scale);
    ctx.lineTo(x - 4 * scale, y + 18 * scale);
    ctx.lineTo(x + 11 * scale, y - 5 * scale);
    ctx.lineTo(x + 2 * scale, y - 5 * scale);
    ctx.closePath();
    ctx.fill();
  }

  static energy(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 13 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 18 * scale, 7 * scale, -0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - 4 * scale, y - 5 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  static spread(ctx, x, y, scale, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = "round";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y + 12 * scale);
      ctx.lineTo(x + dir * 15 * scale, y - 11 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + dir * 15 * scale, y - 11 * scale);
      ctx.lineTo(x + dir * 7 * scale, y - 9 * scale);
      ctx.lineTo(x + dir * 13 * scale, y - 2 * scale);
      ctx.stroke();
    }
  }

  static drone(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 12 * scale, y - 6 * scale, 24 * scale, 12 * scale, 5 * scale);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y);
    ctx.lineTo(x - 10 * scale, y);
    ctx.moveTo(x + 10 * scale, y);
    ctx.lineTo(x + 20 * scale, y);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  static nova(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 245, 205, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18 * scale, -0.25, Math.PI * 1.25);
    ctx.stroke();

    ctx.fillStyle = "#fff5cc";
    for (let i = 0; i < 4; i += 1) {
      const angle = i * (Math.PI / 2) + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 15 * scale, y + Math.sin(angle) * 15 * scale, 2.4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  static overdrive(ctx, x, y, scale, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.6 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2 * scale;
    for (let i = 0; i < 3; i += 1) {
      const angle = i * ((Math.PI * 2) / 3) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 8 * scale, y + Math.sin(angle) * 8 * scale);
      ctx.lineTo(x + Math.cos(angle) * 19 * scale, y + Math.sin(angle) * 19 * scale);
      ctx.stroke();
    }

    ctx.restore();
  }

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
