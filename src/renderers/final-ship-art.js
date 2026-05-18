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
    this.assets = new Map();
    this.deferredPreloadList = this.buildDeferredPreloadList();
    this.deferredPreloadIndex = 0;
    this.preloadCritical();
    this.scheduleDeferredPreload();
  }

  buildDeferredPreloadList() {
    const list = [];
    for (const kind of this.weaponKinds) {
      for (let level = 1; level <= this.maxLevel; level += 1) {
        list.push({ kind, level });
      }
    }
    return list;
  }

  imageSource(kind, level) {
    const folder = WeaponCatalog.finalAssetFolder(kind);
    const prefix = WeaponCatalog.finalAssetPrefix(kind);
    const normalizedLevel = String(level).padStart(FinalShipArt.DEFAULT_PADDING, "0");
    return `${this.basePath}/${folder}/${prefix}_${normalizedLevel}.${this.extension}`;
  }

  imageForLevel(kind, level) {
    if (!this.weaponKinds.has(kind)) return null;

    let sequence = this.assets.get(kind);
    if (!sequence) {
      sequence = [];
      this.assets.set(kind, sequence);
    }

    const normalizedLevel = this.normalizeLevel(kind, level);
    const index = normalizedLevel - 1;
    if (!sequence[index]) {
      sequence[index] = AssetLoader.image(this.imageSource(kind, normalizedLevel));
    }
    return sequence[index];
  }

  preloadCritical(kind = WeaponCatalog.defaultKind(), level = 1) {
    if (!kind) return;
    this.imageForLevel(kind, level);
  }

  scheduleDeferredPreload() {
    if (this.deferredPreloadIndex >= this.deferredPreloadList.length) return;

    const loadBatch = (deadline = null) => {
      let loaded = 0;
      while (
        this.deferredPreloadIndex < this.deferredPreloadList.length &&
        loaded < 2 &&
        (!deadline || deadline.didTimeout || deadline.timeRemaining() > 4)
      ) {
        const entry = this.deferredPreloadList[this.deferredPreloadIndex];
        this.imageForLevel(entry.kind, entry.level);
        this.deferredPreloadIndex += 1;
        loaded += 1;
      }

      if (this.deferredPreloadIndex < this.deferredPreloadList.length) {
        this.scheduleDeferredPreload();
      }
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(loadBatch, { timeout: 1200 });
      return;
    }

    setTimeout(() => loadBatch(), 800);
  }

  draw(ctx, kind, level, size, x = 0, y = 0) {
    const image = this.get(kind, level);
    if (!this.isReady(image)) return false;

    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return true;
  }

  get(kind, level) {
    return this.imageForLevel(kind, level);
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
