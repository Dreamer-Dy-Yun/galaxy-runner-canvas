// Galaxy Runner - final ship art loader
// Responsible only for resolving and drawing weapon-specific final ship sprites.

class FinalShipArt {
  static DEFAULT_BASE_PATH = "assets/player/final-forms";
  static DEFAULT_MAX_LEVEL = WeaponCatalog.defaultMaxLevel();
  static DEFAULT_EXTENSION = "PNG";
  static DEFAULT_PADDING = 2;

  constructor({
    basePath = FinalShipArt.DEFAULT_BASE_PATH,
    maxLevel = FinalShipArt.DEFAULT_MAX_LEVEL,
    extension = FinalShipArt.DEFAULT_EXTENSION,
    supportedWeapons = WEAPON_KINDS,
  } = {}) {
    this.basePath = basePath;
    this.maxLevel = maxLevel;
    this.extension = extension;
    this.weaponKinds = new Set(supportedWeapons);
    this.assets = this.buildAssetStore();
  }

  buildAssetStore() {
    const assets = new Map();

    for (const kind of this.weaponKinds) {
      assets.set(kind, this.buildSequence(kind, this.maxLevel));
    }

    return assets;
  }

  buildSequence(kind, maxLevel) {
    const sequence = [];
    const folder = WeaponCatalog.finalAssetFolder(kind);
    const prefix = WeaponCatalog.finalAssetPrefix(kind);

    for (let level = 1; level <= maxLevel; level += 1) {
      const normalizedLevel = String(level).padStart(FinalShipArt.DEFAULT_PADDING, "0");
      const src = `${this.basePath}/${folder}/${prefix}_${normalizedLevel}.${this.extension}`;
      sequence.push(AssetLoader.image(src));
    }

    return sequence;
  }

  draw(ctx, kind, level, size, x = 0, y = 0) {
    const image = this.get(kind, level);
    if (!this.isReady(image)) return false;

    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return true;
  }

  get(kind, level) {
    const sequence = this.assets.get(kind);
    if (!sequence) return null;

    const normalizedLevel = this.normalizeLevel(kind, level);
    return sequence[normalizedLevel - 1] || null;
  }

  normalizeLevel(kind, level) {
    const safeLevel = Math.max(1, Math.ceil(Number(level) || 1));
    return clampNumber(safeLevel, 1, WeaponCatalog.maxLevel(kind) || this.maxLevel);
  }

  isReady(image) {
    if (!image) return false;
    return AssetLoader.ready(image);
  }
}
