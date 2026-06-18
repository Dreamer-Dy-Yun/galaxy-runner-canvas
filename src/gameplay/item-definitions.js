// Galaxy Runner - collectible item definitions
// Support items live here; weapon item metadata is sourced from WeaponCatalog.

const ITEM_ICON_BASE_PATH = "assets/items";
const ITEM_ICON_FALLBACK_KIND = "bonus";
const ITEM_ICON_FALLBACK = itemIconSrc(ITEM_ICON_FALLBACK_KIND);
const ITEM_CONTRACT_WARNINGS = new Set();

function itemIconSrc(kind) {
  return `${ITEM_ICON_BASE_PATH}/${kind}.svg`;
}

const EXTRA_ITEM_ICON_SOURCES = Object.freeze({
  weaponCore: itemIconSrc("weaponCore"),
});

function itemContractWarn(code, message) {
  if (ITEM_CONTRACT_WARNINGS.has(code)) return;
  ITEM_CONTRACT_WARNINGS.add(code);
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[Gameplay Contract] ${message}`);
  }
}

function itemKindString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function resolveWeaponKinds() {
  if (typeof WeaponCatalog === "undefined" || typeof WeaponCatalog.kinds !== "function") {
    itemContractWarn(
      "item-definitions.weapon-catalog-unavailable",
      "WeaponCatalog is not loaded yet. Weapon-derived item kinds and definitions are empty for this frame."
    );
    return Object.freeze([]);
  }

  const kinds = WeaponCatalog.kinds();
  if (!Array.isArray(kinds)) {
    itemContractWarn(
      "item-definitions.weapon-kinds-invalid",
      "WeaponCatalog.kinds() returned invalid value. Weapon category and item merge may be incomplete."
    );
    return Object.freeze([]);
  }

  return Object.freeze(
    kinds.filter((kind) => {
      if (typeof kind === "string" && kind.length > 0) return true;
      itemContractWarn("item-definitions.weapon-kind-invalid", "WeaponCatalog returned a non-string or empty weapon kind.");
      return false;
    })
  );
}

const ITEM_CATEGORY_KINDS = Object.freeze({
  support: Object.freeze(["repair", "drone", "bonus"]),
  defense: Object.freeze(["armor", "shield", "shieldDefense"]),
  weapon: resolveWeaponKinds(),
});

const WEAPON_ITEM_DEFINITIONS =
  typeof WeaponCatalog === "undefined" || typeof WeaponCatalog.itemDefinitions !== "function"
    ? Object.freeze({})
    : WeaponCatalog.itemDefinitions();

const SUPPORT_ITEM_DEFINITIONS = Object.freeze({
  repair: { color: "#ff6f8f", weight: 0.13, radius: 15, iconSrc: itemIconSrc("repair") },
  armor: { color: "#d8e6f0", weight: 0.1, radius: 17, iconSrc: itemIconSrc("armor") },
  shield: { color: "#75dfff", weight: 0.13, radius: 15, iconSrc: itemIconSrc("shield") },
  shieldDefense: { color: "#9af8ff", weight: 0.13, radius: 17, iconSrc: itemIconSrc("shieldDefense") },
  drone: { color: "#b4a2ff", weight: 0.13, radius: 17, iconSrc: itemIconSrc("drone") },
  bonus: { color: "#ff92c9", weight: 0.08, radius: 15, iconSrc: itemIconSrc("bonus") },
  weaponCore: { color: "#f6fbff", weight: 0, radius: 15, iconSrc: itemIconSrc("weaponCore"), spawnable: false },
});

const ITEM_DEFINITIONS = Object.freeze({
  ...SUPPORT_ITEM_DEFINITIONS,
  ...(WEAPON_ITEM_DEFINITIONS || {}),
});

function validateItemDefinition(kind, definition) {
  if (!definition || typeof definition !== "object") {
    itemContractWarn(`item-definitions.missing-definition:${kind}`, `Item definition missing for "${kind}".`);
    return;
  }

  if (typeof definition.color !== "string") {
    itemContractWarn(`item-definitions.color:${kind}`, `Item "${kind}" is missing a string color. Using fallback icon color.`);
  }
  if (!Number.isFinite(definition.weight)) {
    itemContractWarn(`item-definitions.weight:${kind}`, `Item "${kind}" is missing a valid weight.`);
  }
  if (!Number.isFinite(definition.radius)) {
    itemContractWarn(`item-definitions.radius:${kind}`, `Item "${kind}" is missing a valid radius.`);
  }
  if (!definition.iconSrc && !EXTRA_ITEM_ICON_SOURCES[kind]) {
    itemContractWarn(`item-definitions.icon:${kind}`, `Item "${kind}" has no icon source.`);
  }
}

for (const kind of Object.keys(SUPPORT_ITEM_DEFINITIONS)) {
  validateItemDefinition(kind, SUPPORT_ITEM_DEFINITIONS[kind]);
}

for (const kind of Object.keys(WEAPON_ITEM_DEFINITIONS || {})) {
  validateItemDefinition(kind, WEAPON_ITEM_DEFINITIONS[kind]);
}

for (const kind of ITEM_CATEGORY_KINDS.weapon) {
  if (!ITEM_DEFINITIONS[kind]) {
    itemContractWarn(`item-definitions.weapon-missing:${kind}`, `Weapon "${kind}" has no item metadata from catalog.`);
  }
}

function itemIconSource(kind) {
  const safeKind = itemKindString(kind);
  if (!safeKind) {
    itemContractWarn("item-definitions.icon-unknown", "itemIconSource called with an empty kind. Using fallback icon.");
    return ITEM_DEFINITIONS[ITEM_ICON_FALLBACK_KIND]?.iconSrc ?? ITEM_ICON_FALLBACK;
  }

  const definition = ITEM_DEFINITIONS[safeKind];
  if (definition?.iconSrc) return definition.iconSrc;
  if (EXTRA_ITEM_ICON_SOURCES[safeKind]) return EXTRA_ITEM_ICON_SOURCES[safeKind];

  itemContractWarn(`item-definitions.icon-unknown:${safeKind}`, `Item "${safeKind}" has no icon source in catalog/overrides.`);
  return ITEM_DEFINITIONS[ITEM_ICON_FALLBACK_KIND]?.iconSrc ?? ITEM_ICON_FALLBACK;
}

function itemCategory(kind) {
  const safeKind = itemKindString(kind);
  if (!safeKind) {
    itemContractWarn("item-definitions.category-unknown-empty", "itemCategory called with an empty kind.");
    return "support";
  }

  if (ITEM_CATEGORY_KINDS.weapon.includes(safeKind)) return "weapon";
  if (ITEM_CATEGORY_KINDS.defense.includes(safeKind)) return "defense";
  if (Object.prototype.hasOwnProperty.call(ITEM_DEFINITIONS, safeKind)) return "support";

  itemContractWarn(`item-definitions.category-unknown:${safeKind}`, `Unknown item kind "${safeKind}" mapped to "support".`);
  return "support";
}
