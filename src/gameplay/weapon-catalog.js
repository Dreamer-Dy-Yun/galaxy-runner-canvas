// Galaxy Runner - weapon catalog
// Owns public accessors for weapon identity, progression caps, item metadata, and asset naming.

class WeaponCatalog {
  static definition(kind) {
    const safeKind = typeof kind === "string" ? kind.trim() : "";
    if (!safeKind) return null;

    const definition = WeaponCatalog.DEFINITIONS?.[safeKind];
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

WeaponCatalog.DEFINITIONS = Object.freeze({});

function isWeaponKind(kind) {
  if (typeof kind !== "string" || !kind.trim()) {
    weaponCatalogWarn(`WeaponCatalog.isWeaponKind:invalid:${String(kind)}`, `isWeaponKind received non-string kind "${String(kind)}".`);
    return false;
  }
  return WeaponCatalog.has(kind);
}
