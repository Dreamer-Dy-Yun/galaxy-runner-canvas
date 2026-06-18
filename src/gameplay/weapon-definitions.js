// Galaxy Runner - weapon definitions
// Owns concrete weapon catalog data and catalog validation.

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
      radius: (level) => 8 + Math.max(0, level - 1) * 1.25,
      absorbLevel: (level) => Math.min(4, 1 + Math.floor(Math.max(0, level) / 3)),
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
      radius: (level) => 8 + Math.max(0, level - 1) * 1.25,
      blastRadius: (level) => 28 + Math.max(0, level - 1) * 7,
      blastDuration: (level) => BALANCE.novaExplosionDuration * (1 + Math.max(0, level - 1) * 0.16),
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
