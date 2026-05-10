// Galaxy Runner - weapon catalog
// Owns weapon identity, progression caps, item metadata, ship footprint, and asset naming.

class WeaponDefinition {
  constructor({
    kind,
    label,
    row,
    color,
    weight,
    itemRadius = 15,
    icon,
    pickupBurst,
    maxLevel = 10,
    core = {},
    movement = {},
    projectile = {},
    footprint = {},
    visual = {},
    assets = {},
  }) {
    this.kind = kind;
    this.label = label;
    this.row = row;
    this.color = color;
    this.weight = weight;
    this.itemRadius = itemRadius;
    this.icon = icon;
    this.pickupBurst = pickupBurst;
    this.maxLevel = maxLevel;
    this.core = Object.freeze({
      maxLevel: core.maxLevel ?? 10,
      damageBonusPerLevel: core.damageBonusPerLevel ?? 0.05,
    });
    this.movement = Object.freeze({
      speedMultiplier: movement.speedMultiplier ?? 1,
    });
    this.projectile = Object.freeze({
      speed: projectile.speed ?? 0,
      radius: projectile.radius ?? 0,
      damageMultiplier: projectile.damageMultiplier ?? 1,
      blastRadius: projectile.blastRadius ?? 0,
      blastDuration: projectile.blastDuration ?? 0,
      absorbLevel: projectile.absorbLevel ?? 0,
    });
    this.footprint = Object.freeze({
      visualScale: footprint.visualScale ?? 1,
      hitboxScale: footprint.hitboxScale ?? footprint.visualScale ?? 1,
      hitboxRelativeToVisual: footprint.hitboxRelativeToVisual ?? false,
    });
    this.visual = Object.freeze({
      layeredEvolution: visual.layeredEvolution ?? true,
      evolutionLayerColumns: Object.freeze(visual.evolutionLayerColumns ?? [7]),
      layerAlpha: visual.layerAlpha ?? 0.98,
    });
    this.assets = Object.freeze({
      finalFolder: assets.finalFolder ?? kind,
      finalPrefix: assets.finalPrefix ?? kind,
      itemIconSrc: assets.itemIconSrc ?? `assets/items/${kind}.svg`,
    });

    Object.freeze(this);
  }

  itemDefinition() {
    return {
      color: this.color,
      weight: this.weight,
      radius: this.itemRadius,
      iconSrc: this.assets.itemIconSrc,
    };
  }

  normalizeLevel(level) {
    const parsed = Number(level);
    if (!Number.isFinite(parsed)) return 0;
    return clampNumber(Math.round(parsed), 0, this.maxLevel);
  }

  normalizeStartupLevel(level) {
    const parsed = Number(level);
    if (!Number.isFinite(parsed)) return 1;
    return clampNumber(Math.round(parsed), 1, this.maxLevel);
  }

  normalizeCoreLevel(level) {
    const parsed = Number(level);
    if (!Number.isFinite(parsed)) return 0;
    return clampNumber(Math.round(parsed), 0, this.core.maxLevel);
  }

  coreDamageMultiplier(level) {
    return 1 + this.normalizeCoreLevel(level) * this.core.damageBonusPerLevel;
  }

  moveSpeedMultiplier(level) {
    return this.resolveValue(this.movement.speedMultiplier, level);
  }

  projectileSpeed(level, context = {}) {
    return this.resolveValue(this.projectile.speed, level, context);
  }

  projectileRadius(level, context = {}) {
    return this.resolveValue(this.projectile.radius, level, context);
  }

  projectileBlastRadius(level, context = {}) {
    return this.resolveValue(this.projectile.blastRadius, level, context);
  }

  projectileBlastDuration(level, context = {}) {
    return this.resolveValue(this.projectile.blastDuration, level, context);
  }

  projectileAbsorbLevel(level, context = {}) {
    return this.resolveValue(this.projectile.absorbLevel, level, context);
  }

  visualScale(level) {
    return this.resolveValue(this.footprint.visualScale, level);
  }

  hitboxScale(level) {
    const hitboxScale = this.resolveValue(this.footprint.hitboxScale, level);
    if (this.footprint.hitboxRelativeToVisual) {
      return this.visualScale(level) * hitboxScale;
    }
    return hitboxScale;
  }

  resolveValue(value, ...args) {
    if (typeof value === "function") return value(...args);
    return value;
  }
}

class WeaponCatalog {
  static definition(kind) {
    return WeaponCatalog.DEFINITIONS[kind] || null;
  }

  static has(kind) {
    return !!WeaponCatalog.definition(kind);
  }

  static kinds() {
    return Object.keys(WeaponCatalog.DEFINITIONS);
  }

  static defaultKind() {
    return WeaponCatalog.kinds()[0] ?? null;
  }

  static defaultMaxLevel() {
    return Math.max(...WeaponCatalog.kinds().map((kind) => WeaponCatalog.maxLevel(kind)));
  }

  static maxLevel(kind) {
    return WeaponCatalog.definition(kind)?.maxLevel ?? 0;
  }

  static normalizeLevel(kind, level) {
    return WeaponCatalog.definition(kind)?.normalizeLevel(level) ?? 0;
  }

  static normalizeStartupLevel(kind, level) {
    return WeaponCatalog.definition(kind)?.normalizeStartupLevel(level) ?? 1;
  }

  static coreMaxLevel(kind) {
    return WeaponCatalog.definition(kind)?.core.maxLevel ?? 0;
  }

  static normalizeCoreLevel(kind, level) {
    return WeaponCatalog.definition(kind)?.normalizeCoreLevel(level) ?? 0;
  }

  static coreDamageMultiplier(kind, level) {
    return WeaponCatalog.definition(kind)?.coreDamageMultiplier(level) ?? 1;
  }

  static moveSpeedMultiplier(kind, level) {
    return WeaponCatalog.definition(kind)?.moveSpeedMultiplier(level) ?? 1;
  }

  static projectileSpeed(kind, level = 0, context = {}) {
    return WeaponCatalog.definition(kind)?.projectileSpeed(level, context) ?? 0;
  }

  static projectileRadius(kind, level = 0, context = {}) {
    return WeaponCatalog.definition(kind)?.projectileRadius(level, context) ?? 0;
  }

  static projectileDamageMultiplier(kind) {
    return WeaponCatalog.definition(kind)?.projectile.damageMultiplier ?? 1;
  }

  static projectileBlastRadius(kind, level = 0, context = {}) {
    return WeaponCatalog.definition(kind)?.projectileBlastRadius(level, context) ?? 0;
  }

  static projectileBlastDuration(kind, level = 0, context = {}) {
    return WeaponCatalog.definition(kind)?.projectileBlastDuration(level, context) ?? 0;
  }

  static projectileAbsorbLevel(kind, level = 0, context = {}) {
    return WeaponCatalog.definition(kind)?.projectileAbsorbLevel(level, context) ?? 0;
  }

  static visualScale(kind, level) {
    return WeaponCatalog.definition(kind)?.visualScale(level) ?? 1;
  }

  static hitboxScale(kind, level) {
    return WeaponCatalog.definition(kind)?.hitboxScale(level) ?? 1;
  }

  static hasLayeredEvolution(kind) {
    return !!WeaponCatalog.definition(kind)?.visual.layeredEvolution;
  }

  static evolutionLayerColumns(kind) {
    return WeaponCatalog.definition(kind)?.visual.evolutionLayerColumns ?? [];
  }

  static layerAlpha(kind) {
    return WeaponCatalog.definition(kind)?.visual.layerAlpha ?? 1;
  }

  static itemDefinitions() {
    const definitions = {};
    for (const kind of WeaponCatalog.kinds()) {
      definitions[kind] = WeaponCatalog.definition(kind).itemDefinition();
    }
    return Object.freeze(definitions);
  }

  static rowMap() {
    const rows = {};
    for (const kind of WeaponCatalog.kinds()) {
      rows[kind] = WeaponCatalog.definition(kind).row;
    }
    return Object.freeze(rows);
  }

  static pickupBurst(kind) {
    return WeaponCatalog.definition(kind)?.pickupBurst ?? 14;
  }

  static iconName(kind) {
    return WeaponCatalog.definition(kind)?.icon ?? kind;
  }

  static finalAssetFolder(kind) {
    return WeaponCatalog.definition(kind)?.assets.finalFolder ?? kind;
  }

  static finalAssetPrefix(kind) {
    return WeaponCatalog.definition(kind)?.assets.finalPrefix ?? kind;
  }
}

WeaponCatalog.DEFINITIONS = Object.freeze({
  rapid: new WeaponDefinition({
    kind: "rapid",
    label: "Rapid",
    row: 0,
    color: "#ffe06a",
    weight: 0.16,
    icon: "rapid",
    pickupBurst: 14,
    projectile: {
      speed: -1000,
      damageMultiplier: 1.5,
    },
    movement: {
      speedMultiplier: (level) => 1.14 + Math.min(0.1, level * 0.01),
    },
    footprint: {
      visualScale: 0.7,
      hitboxScale: 0.7,
    },
  }),
  energy: new WeaponDefinition({
    kind: "energy",
    label: "Energy",
    row: 1,
    color: "#55f0ff",
    weight: 0.15,
    itemRadius: 17,
    icon: "energy",
    pickupBurst: 18,
    projectile: {
      radius: (level) => 7 * (1 + level * 0.1),
      absorbLevel: (level) => Math.min(3, 1 + Math.floor(level / 5)),
    },
    movement: {
      speedMultiplier: 0.894,
    },
    footprint: {
      visualScale: (level) => Math.min(1.16, 1 + Math.min(10, level) * 0.016),
    },
  }),
  spread: new WeaponDefinition({
    kind: "spread",
    label: "Spread",
    row: 2,
    color: "#b7ff7b",
    weight: 0.14,
    icon: "spread",
    pickupBurst: 16,
    projectile: {
      speed: 280,
      damageMultiplier: 2,
    },
    footprint: {
      visualScale: (level) => Math.min(1.28, 1 + Math.min(10, level) * 0.028),
    },
  }),
  nova: new WeaponDefinition({
    kind: "nova",
    label: "Nova",
    row: 3,
    color: "#ff8f5a",
    weight: 0.12,
    icon: "nova",
    pickupBurst: 18,
    projectile: {
      speed: -220,
      radius: (level) => 8 * (1 + (level - 1) * 0.1),
      blastRadius: (level) => 26 * (1 + (level - 1) * 0.2),
      blastDuration: (level) => BALANCE.novaExplosionDuration * (1 + (level - 1) * 0.1),
    },
    footprint: {
      visualScale: (level) => Math.min(1.1, 1 + Math.min(10, level) * 0.01),
    },
  }),
});

const WEAPON_KINDS = Object.freeze(WeaponCatalog.kinds());

function isWeaponKind(kind) {
  return WeaponCatalog.has(kind);
}
