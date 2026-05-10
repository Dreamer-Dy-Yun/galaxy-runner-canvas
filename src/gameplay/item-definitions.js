// Galaxy Runner - collectible item definitions
// Support items live here; weapon item metadata is sourced from WeaponCatalog.

const ITEM_ICON_BASE_PATH = "assets/items";

function itemIconSrc(kind) {
  return `${ITEM_ICON_BASE_PATH}/${kind}.svg`;
}

const EXTRA_ITEM_ICON_SOURCES = Object.freeze({
  weaponCore: itemIconSrc("weaponCore"),
});

const ITEM_CATEGORY_KINDS = Object.freeze({
  support: Object.freeze(["repair", "drone", "bonus"]),
  defense: Object.freeze(["armor", "shield", "shieldDefense"]),
  weapon: Object.freeze([...WEAPON_KINDS]),
});

const SUPPORT_ITEM_DEFINITIONS = Object.freeze({
  repair: { color: "#ff6f8f", weight: 0.13, radius: 15, iconSrc: itemIconSrc("repair") },
  armor: { color: "#d8e6f0", weight: 0.1, radius: 17, iconSrc: itemIconSrc("armor") },
  shield: { color: "#75dfff", weight: 0.13, radius: 15, iconSrc: itemIconSrc("shield") },
  shieldDefense: { color: "#9af8ff", weight: 0.13, radius: 17, iconSrc: itemIconSrc("shieldDefense") },
  drone: { color: "#b4a2ff", weight: 0.13, radius: 17, iconSrc: itemIconSrc("drone") },
  bonus: { color: "#ff92c9", weight: 0.08, radius: 15, iconSrc: itemIconSrc("bonus") },
});

const ITEM_DEFINITIONS = Object.freeze({
  ...SUPPORT_ITEM_DEFINITIONS,
  ...WeaponCatalog.itemDefinitions(),
});

function itemIconSource(kind) {
  return ITEM_DEFINITIONS[kind]?.iconSrc ?? EXTRA_ITEM_ICON_SOURCES[kind] ?? null;
}

function itemCategory(kind) {
  if (ITEM_CATEGORY_KINDS.weapon.includes(kind)) return "weapon";
  if (ITEM_CATEGORY_KINDS.defense.includes(kind)) return "defense";
  return "support";
}
