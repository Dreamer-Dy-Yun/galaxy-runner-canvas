// Galaxy Runner - weapon definition contract
// Owns defensive normalization for weapon catalog entries.

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

function optionalWeaponString(value, fallback, context) {
  if (value == null) return fallback;
  return normalizeWeaponString(value, fallback, context);
}

function normalizeWeaponNumber(value, fallback, context) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  weaponCatalogWarn(context, `Invalid number for "${context}", used fallback ${fallback}.`);
  return fallback;
}

function optionalWeaponNumber(value, fallback, context) {
  if (value == null) return fallback;
  return normalizeWeaponNumber(value, fallback, context);
}

function normalizeWeaponNumberResolver(value, fallback, context) {
  if (typeof value === "function") return value;
  return normalizeWeaponNumber(value, fallback, context);
}

function optionalWeaponNumberResolver(value, fallback, context) {
  if (value == null) return fallback;
  return normalizeWeaponNumberResolver(value, fallback, context);
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
      maxLevel: Math.max(0, optionalWeaponNumber(core.maxLevel, 10, `WeaponDefinition.core.maxLevel:${safeKind}`)),
      damageBonusPerLevel: optionalWeaponNumber(core.damageBonusPerLevel, 0.05, `WeaponDefinition.core.damageBonusPerLevel:${safeKind}`),
    });
    this.movement = Object.freeze({
      speedMultiplier: typeof movement.speedMultiplier === "function" || Number.isFinite(movement.speedMultiplier)
        ? movement.speedMultiplier
        : (() => 1),
    });
    this.projectile = Object.freeze({
      speed: optionalWeaponNumberResolver(projectile.speed, 0, `WeaponDefinition.projectile.speed:${safeKind}`),
      radius: optionalWeaponNumberResolver(projectile.radius, 0, `WeaponDefinition.projectile.radius:${safeKind}`),
      damageMultiplier: optionalWeaponNumber(projectile.damageMultiplier, 1, `WeaponDefinition.projectile.damageMultiplier:${safeKind}`),
      blastRadius: optionalWeaponNumberResolver(projectile.blastRadius, 0, `WeaponDefinition.projectile.blastRadius:${safeKind}`),
      blastDuration: optionalWeaponNumberResolver(projectile.blastDuration, 0, `WeaponDefinition.projectile.blastDuration:${safeKind}`),
      absorbLevel: optionalWeaponNumberResolver(projectile.absorbLevel, 0, `WeaponDefinition.projectile.absorbLevel:${safeKind}`),
    });
    this.footprint = Object.freeze({
      visualScale: footprint.visualScale ?? 1,
      hitboxScale: footprint.hitboxScale ?? footprint.visualScale ?? 1,
      hitboxRelativeToVisual: footprint.hitboxRelativeToVisual ?? false,
    });
    this.assets = Object.freeze({
      finalFolder: optionalWeaponString(assets.finalFolder, safeKind, `WeaponDefinition.assets.finalFolder:${safeKind}`),
      finalPrefix: optionalWeaponString(assets.finalPrefix, safeKind, `WeaponDefinition.assets.finalPrefix:${safeKind}`),
      itemIconSrc: optionalWeaponString(assets.itemIconSrc, `assets/items/${safeKind}.svg`, `WeaponDefinition.assets.itemIconSrc:${safeKind}`),
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
