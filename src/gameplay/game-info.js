// Galaxy Runner - in-game help content
// Pause-screen game information lives here so UI code does not hardcode design text.

const GAME_INFO_WARNING_KEYS = new Set();

function gameInfoWarn(code, message) {
  if (GAME_INFO_WARNING_KEYS.has(code)) return;
  GAME_INFO_WARNING_KEYS.add(code);
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[Gameplay Contract] ${message}`);
  }
}

function normalizeInfoKind(value, path) {
  if (typeof value !== "string" || value.trim().length <= 0) {
    gameInfoWarn(`game-info.kind:${path}`, `Invalid or missing kind at ${path}.`);
    return "";
  }
  return value.trim();
}

function normalizeInfoString(value, path) {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  gameInfoWarn(`game-info.string:${path}`, `Missing string value at ${path}.`);
  return "";
}

function normalizeTags(tags, path) {
  if (!Array.isArray(tags)) {
    gameInfoWarn(`game-info.tags:${path}`, `Tags at ${path} are not an array.`);
    return Object.freeze([]);
  }
  return Object.freeze(
    tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter((tag) => tag.length > 0)
  );
}

function normalizePreviewScaleByKind(raw) {
  const scales = {};
  for (const kind of WEAPON_KINDS) {
    scales[kind] = 1;
  }

  if (!raw || typeof raw !== "object") {
    gameInfoWarn("game-info.preview-scale", "Preview scale map is missing. Defaulting all weapon scales to 1.");
    return Object.freeze(scales);
  }

  Object.entries(raw).forEach(([kind, scale]) => {
    const safeKind = normalizeInfoKind(kind, `GAME_INFO_CONFIG.shipCards.previewScaleByKind[${kind}]`);
    if (!safeKind || !WEAPON_KINDS.includes(safeKind)) return;

    const parsed = Number(scale);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      gameInfoWarn(`game-info.preview-scale:${safeKind}`, `Invalid preview scale "${scale}" for weapon ${safeKind}.`);
      return;
    }

    scales[safeKind] = parsed;
  });

  return Object.freeze(scales);
}

const GAME_INFO_FALLBACK_ITEM_KIND = "bonus";
const GAME_INFO_FALLBACK_ITEM = ITEM_DEFINITIONS[GAME_INFO_FALLBACK_ITEM_KIND] || {
  color: "#ff92c9",
  name: "특수",
  effect: "지원 아이템",
};

function normalizeShipInfo(raw, index) {
  const path = `GAME_INFO.ships[${index}]`;
  const kind = normalizeInfoKind(raw?.kind, `${path}.kind`);
  const definition = isWeaponKind(kind) ? WeaponCatalog.definition(kind) : null;

  if (kind && !definition) {
    gameInfoWarn(`game-info.ship-missing:${kind}`, `Ship kind "${kind}" is not registered in weapon catalog.`);
  }

  const sourceName = normalizeInfoString(raw?.name, `${path}.name`);
  const expectedName = definition?.label ?? "";
  const name = sourceName || expectedName || kind;

  if (sourceName && expectedName && sourceName !== expectedName) {
    gameInfoWarn(`game-info.ship-name-mismatch:${kind}`, `Ship name for "${kind}" differs from catalog label "${expectedName}".`);
  }

  return Object.freeze({
    kind,
    name,
    color: normalizeInfoString(raw?.color, `${path}.color`) || definition?.color || GAME_INFO_FALLBACK_ITEM.color,
    tags: normalizeTags(raw?.tags, `${path}.tags`),
  });
}

function normalizeItemInfo(raw, index) {
  const path = `GAME_INFO.items[${index}]`;
  const kind = normalizeInfoKind(raw?.kind, `${path}.kind`);
  const definition = ITEM_DEFINITIONS[kind];

  if (!definition) {
    gameInfoWarn(`game-info.item-missing:${kind}`, `Item "${kind}" is missing from ITEM_DEFINITIONS. Using fallback item definition.`);
    return Object.freeze({
      kind: GAME_INFO_FALLBACK_ITEM_KIND,
      name: GAME_INFO_FALLBACK_ITEM.name || "특수",
      color: GAME_INFO_FALLBACK_ITEM.color || "#ff92c9",
      effect: GAME_INFO_FALLBACK_ITEM.effect || "지원 아이템",
    });
  }

  return Object.freeze({
    kind,
    name: normalizeInfoString(raw?.name, `${path}.name`) || definition.name || kind,
    color: normalizeInfoString(raw?.color, `${path}.color`) || definition.color || GAME_INFO_FALLBACK_ITEM.color,
    effect: normalizeInfoString(raw?.effect, `${path}.effect`),
  });
}

const GAME_INFO_SHIPS_RAW = Object.freeze([
  Object.freeze({
    kind: "rapid",
    name: "Rapid",
    color: "#ffe06a",
    tags: Object.freeze(["속도++", "히트박스 면적 49%", "추적 관통"]),
  }),
  Object.freeze({
    kind: "energy",
    name: "Energy",
    color: "#9af8ff",
    tags: Object.freeze(["중앙 강화", "대미지 증가", "보호막 코어"]),
  }),
  Object.freeze({
    kind: "spread",
    name: "Spread",
    color: "#b7ff7b",
    tags: Object.freeze(["광역", "다중 샷", "산탄 패턴"]),
  }),
  Object.freeze({
    kind: "nova",
    name: "Nova",
    color: "#ff8f5a",
    tags: Object.freeze(["중앙 강화", "폭발 성능", "방향 제어"]),
  }),
]);

const GAME_INFO_ITEMS_RAW = Object.freeze([
  Object.freeze({ kind: "repair", name: "수리", color: "#ff6f8f", effect: "HP 회복" }),
  Object.freeze({ kind: "armor", name: "장갑", color: "#d8e6f0", effect: "최대 HP+" }),
  Object.freeze({ kind: "shield", name: "실드", color: "#75dfff", effect: "실드 +10" }),
  Object.freeze({
    kind: "shieldDefense",
    name: "실드 방어",
    color: "#9af8ff",
    effect: `HP 피해 -${BALANCE.shieldDefensePerLevel}`,
  }),
  Object.freeze({ kind: "rapid", name: "무기", color: "#ffe06a", effect: "최고 LV 보상" }),
  Object.freeze({ kind: "weaponCore", name: "코어", color: "#f6fbff", effect: "10LV 피해 +5%" }),
  Object.freeze({ kind: "drone", name: "드론", color: "#b4a2ff", effect: "보조 공격" }),
  Object.freeze({ kind: "bonus", name: "오버드라이브", color: "#ff92c9", effect: "특수 100% 유지" }),
]);

const GAME_INFO_CONFIG = Object.freeze({
  button: Object.freeze({
    x: 774,
    y: 58,
    width: 86,
    height: 30,
    radius: 12,
    label: "게임 정보",
    closeLabel: "닫기",
  }),
  panel: Object.freeze({
    x: 60,
    y: 12,
    width: 840,
    height: 466,
    radius: 18,
    titleY: 70,
    titleFont: "800 26px Segoe UI, Noto Sans KR, sans-serif",
    sectionFont: "800 13px Segoe UI, Noto Sans KR, sans-serif",
    bodyFont: "700 11px Segoe UI, Noto Sans KR, sans-serif",
    hintFont: "600 12px Segoe UI, Noto Sans KR, sans-serif",
    titleColor: "#f6fbff",
    sectionColor: "#9af8ff",
    bodyColor: "rgba(239, 250, 255, 0.84)",
    hintColor: "rgba(239, 250, 255, 0.58)",
    background: "rgba(5, 9, 18, 0.92)",
    border: "rgba(154, 248, 255, 0.36)",
  }),
  shipCards: Object.freeze({
    x: 88,
    y: 96,
    width: 190,
    height: 188,
    gap: 12,
    previewY: 78,
    previewSize: 82,
    previewScaleByKind: Object.freeze(
      normalizePreviewScaleByKind(
        Object.freeze({
          rapid: 0.7,
          energy: 1,
          spread: 1.16,
          nova: 1.06,
        })
      )
    ),
    titleY: 24,
    tagStartY: 126,
    tagGap: 21,
    tagHeight: 17,
    cardBackground: "rgba(8, 17, 31, 0.74)",
    cardBorder: "rgba(154, 248, 255, 0.22)",
  }),
  itemGrid: Object.freeze({
    titleX: 88,
    titleY: 318,
    x: 88,
    y: 338,
    columns: 4,
    width: 190,
    height: 52,
    gapX: 12,
    gapY: 10,
    iconX: 26,
    iconY: 26,
    iconSize: 30,
    textX: 48,
    nameY: 20,
    effectY: 37,
    cardBackground: "rgba(8, 17, 31, 0.66)",
    cardBorder: "rgba(255, 255, 255, 0.11)",
  }),
});

const GAME_INFO = Object.freeze({
  title: "게임 정보",
  itemTitle: "아이템",
  hint: "Esc: 게임 재개 / I 또는 게임 정보 버튼: 닫기",
  ships: Object.freeze(GAME_INFO_SHIPS_RAW.map(normalizeShipInfo)),
  items: Object.freeze(GAME_INFO_ITEMS_RAW.map(normalizeItemInfo)),
});

function validateGameInfoContracts() {
  const shipKinds = new Set();
  for (const ship of GAME_INFO.ships) {
    if (!ship.kind) {
      gameInfoWarn("game-info.ship-empty-kind", "Ship entry has empty kind after normalization.");
    }
    if (shipKinds.has(ship.kind)) {
      gameInfoWarn(`game-info.ship-duplicate:${ship.kind}`, `Duplicate ship entry detected for kind "${ship.kind}".`);
    }
    shipKinds.add(ship.kind);

    if (ship.kind && !WeaponCatalog.has(ship.kind)) {
      gameInfoWarn(`game-info.ship-missing-catalog:${ship.kind}`, `Ship info references unknown weapon kind "${ship.kind}".`);
    }

    if (!ship.tags || ship.tags.length <= 0) {
      gameInfoWarn(`game-info.ship-empty-tags:${ship.kind}`, `Ship "${ship.kind}" has no tags.`);
    }
  }

  const itemKinds = new Set();
  for (const item of GAME_INFO.items) {
    if (!item.kind) {
      gameInfoWarn("game-info.item-empty-kind", "Item entry has empty kind after normalization.");
    }
    if (itemKinds.has(item.kind)) {
      gameInfoWarn(`game-info.item-duplicate:${item.kind}`, `Duplicate item entry detected for kind "${item.kind}".`);
    }
    itemKinds.add(item.kind);

    if (item.kind && !ITEM_DEFINITIONS[item.kind]) {
      gameInfoWarn(`game-info.item-missing-definition:${item.kind}`, `Item info references missing ITEM_DEFINITIONS entry "${item.kind}".`);
    }

    if (!item.effect || item.effect.length <= 0) {
      gameInfoWarn(`game-info.item-empty-effect:${item.kind}`, `Item "${item.kind}" has empty effect text.`);
    }
  }
}

validateGameInfoContracts();
