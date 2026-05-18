// Galaxy Runner - weapon catalog
// Owns weapon identity, progression caps, item metadata, ship footprint, and asset naming.

const WEAPON_CATALOG_WARNINGS = new Set();

function weaponCatalogWarn(code, message) {
  if (WEAPON_CATALOG_WARNINGS.has(code)) return;
  WEAPON_CATALOG_WARNINGS.add(code);
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[Gameplay Contract] ${message}`);
  }
}

function normalizeWeaponString(value, fallback, context) {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "string") return "";
  if (value == null) {
    if (context) weaponCatalogWarn(context, `Expected a string, got ${String(value)}.`);
    return fallback;
  }
  weaponCatalogWarn(context, `Expected a string for "${context}", got ${typeof value}.`);
  return fallback;
}

function normalizeWeaponNumber(value, fallback, context) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  weaponCatalogWarn(context, `Invalid number for "${context}", used fallback ${fallback}.`);
  return fallback;
}

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
    assets = {},
  }) {
    const safeKind = normalizeWeaponString(kind, "unknown", `WeaponDefinition.kind:${String(kind)}`);
    const safeLabel = normalizeWeaponString(label, safeKind, `WeaponDefinition.label:${safeKind}`);
    this.kind = safeKind;
    this.label = safeLabel;
    this.row = normalizeWeaponNumber(row, 0, `WeaponDefinition.row:${safeKind}`);
    this.color = normalizeWeaponString(color, "#ffffff", `WeaponDefinition.color:${safeKind}`);
    this.weight = normalizeWeaponNumber(weight, 0, `WeaponDefinition.weight:${safeKind}`);
    this.itemRadius = normalizeWeaponNumber(itemRadius, 15, `WeaponDefinition.itemRadius:${safeKind}`);
    this.icon = normalizeWeaponString(icon, safeKind, `WeaponDefinition.icon:${safeKind}`);
    this.pickupBurst = normalizeWeaponNumber(pickupBurst, 14, `WeaponDefinition.pickupBurst:${safeKind}`);
    this.maxLevel = Math.max(1, normalizeWeaponNumber(maxLevel, 10, `WeaponDefinition.maxLevel:${safeKind}`));
    this.core = Object.freeze({
      maxLevel: Math.max(
        0,
        normalizeWeaponNumber(core.maxLevel, 10, `WeaponDefinition.core.maxLevel:${safeKind}`)
      ),
      damageBonusPerLevel: normalizeWeaponNumber(core.damageBonusPerLevel, 0.05, `WeaponDefinition.core.damageBonusPerLevel:${safeKind}`),
    });
    this.movement = Object.freeze({
      speedMultiplier: typeof movement.speedMultiplier === "function" || Number.isFinite(movement.speedMultiplier)
        ? movement.speedMultiplier
        : (() => 1),
    });
    this.projectile = Object.freeze({
      speed: normalizeWeaponNumber(projectile.speed, 0, `WeaponDefinition.projectile.speed:${safeKind}`),
      radius: normalizeWeaponNumber(projectile.radius, 0, `WeaponDefinition.projectile.radius:${safeKind}`),
      damageMultiplier: normalizeWeaponNumber(projectile.damageMultiplier, 1, `WeaponDefinition.projectile.damageMultiplier:${safeKind}`),
      blastRadius: normalizeWeaponNumber(projectile.blastRadius, 0, `WeaponDefinition.projectile.blastRadius:${safeKind}`),
      blastDuration: normalizeWeaponNumber(projectile.blastDuration, 0, `WeaponDefinition.projectile.blastDuration:${safeKind}`),
      absorbLevel: normalizeWeaponNumber(projectile.absorbLevel, 0, `WeaponDefinition.projectile.absorbLevel:${safeKind}`),
    });
    this.footprint = Object.freeze({
      visualScale: footprint.visualScale ?? 1,
      hitboxScale: footprint.hitboxScale ?? footprint.visualScale ?? 1,
      hitboxRelativeToVisual: footprint.hitboxRelativeToVisual ?? false,
    });
    this.assets = Object.freeze({
      finalFolder: normalizeWeaponString(assets.finalFolder, safeKind, `WeaponDefinition.assets.finalFolder:${safeKind}`),
      finalPrefix: normalizeWeaponString(assets.finalPrefix, safeKind, `WeaponDefinition.assets.finalPrefix:${safeKind}`),
      itemIconSrc: normalizeWeaponString(assets.itemIconSrc, `assets/items/${safeKind}.svg`, `WeaponDefinition.assets.itemIconSrc:${safeKind}`),
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
    const safeKind = normalizeWeaponString(kind, "", `WeaponCatalog.definition:${String(kind)}`);
    if (!safeKind) {
      weaponCatalogWarn("WeaponCatalog.definition:invalid-kind", "WeaponCatalog.definition called with an empty kind.");
      return null;
    }

    const definition = WeaponCatalog.DEFINITIONS[safeKind];
    if (!definition) {
      weaponCatalogWarn(`WeaponCatalog.definition.missing:${safeKind}`, `Unknown weapon kind "${safeKind}".`);
      return null;
    }

    return definition;
  }

  static has(kind) {
    return !!WeaponCatalog.definition(kind);
  }

  static kinds() {
    const kinds = Object.keys(WeaponCatalog.DEFINITIONS || {});
    return kinds.filter((kind) => typeof kind === "string" && kind.length > 0);
  }

  static defaultKind() {
    return WeaponCatalog.kinds()[0] ?? null;
  }

  static defaultMaxLevel() {
    const levels = WeaponCatalog.kinds().map((kind) => WeaponCatalog.maxLevel(kind)).filter((level) => Number.isFinite(level));
    if (levels.length <= 0) {
      weaponCatalogWarn("WeaponCatalog.defaultMaxLevel:empty", "No valid weapon definitions found; default max level fallback is 0.");
      return 0;
    }
    return Math.max(...levels);
  }

  static maxLevel(kind) {
    return WeaponCatalog.definition(kind)?.maxLevel ?? 0;
  }

  static normalizeLevel(kind, level) {
    return WeaponCatalog.definition(kind)?.normalizeLevel(level) ?? 0;
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

function validateWeaponCatalogDefinitions() {
  const kinds = WeaponCatalog.kinds();
  if (kinds.length <= 0) {
    weaponCatalogWarn("WeaponCatalog.validate:empty", "WeaponCatalog has no entries.");
    return;
  }

  for (const kind of kinds) {
    const definition = WeaponCatalog.definition(kind);
    if (!definition) {
      weaponCatalogWarn(`WeaponCatalog.validate:missing:${kind}`, `Missing definition for "${kind}".`);
      continue;
    }
    if (definition.maxLevel <= 0) {
      weaponCatalogWarn(`WeaponCatalog.validate:maxLevel:${kind}`, `maxLevel for "${kind}" is invalid (${definition.maxLevel}).`);
    }
    if (definition.core.maxLevel <= 0) {
      weaponCatalogWarn(`WeaponCatalog.validate:coreMax:${kind}`, `core.maxLevel for "${kind}" is invalid (${definition.core.maxLevel}).`);
    }
    if (!definition.itemRadius) {
      weaponCatalogWarn(`WeaponCatalog.validate:itemRadius:${kind}`, `Item metadata for "${kind}" has no radius.`);
    }
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
      hitboxScale: (level) => Math.min(1.28, 1 + Math.min(10, level) * 0.028),
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

if (WEAPON_KINDS.length <= 0) {
  weaponCatalogWarn("WeaponCatalog.weaponKinds:empty", "Weapon catalog defines zero weapon kinds.");
}

validateWeaponCatalogDefinitions();

function isWeaponKind(kind) {
  if (typeof kind !== "string" || !kind.trim()) {
    weaponCatalogWarn(`WeaponCatalog.isWeaponKind:invalid:${String(kind)}`, `isWeaponKind received non-string kind "${String(kind)}".`);
    return false;
  }
  return WeaponCatalog.has(kind);
}
