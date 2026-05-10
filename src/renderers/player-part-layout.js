// Galaxy Runner - player part layout
// Consumes pre-registered 512x512 player rig cells. Runtime does not assemble cropped parts.

class PlayerPartLayout {
  constructor(partAtlas, evolutionAtlas = null) {
    this.partAtlas = partAtlas;
    this.evolutionAtlas = evolutionAtlas;
    this.rigSize = PLAYER_LAYOUT_CONFIG.defaultRigSize;
  }

  isReady() {
    return this.partAtlas.isReady();
  }

  definitions() {
    return PLAYER_LAYOUT_CONFIG.partDefinitions;
  }

  weaponRows() {
    return WeaponCatalog.rowMap();
  }

  shipSlots() {
    return {
      wings: this.registeredSlot("wings"),
      engine: this.registeredSlot("engine"),
      fuselage: this.registeredSlot("fuselage"),
      cockpit: this.registeredSlot("cockpit"),
    };
  }

  hasWeaponEvolutionLayers() {
    return this.evolutionAtlas && this.evolutionAtlas.isReady();
  }

  drawEvolutionLayer(ctx, kind, column, options = {}) {
    if (!this.hasWeaponEvolutionLayers()) return false;

    const row = this.weaponRows()[kind];
    if (row === undefined) return false;

    this.evolutionAtlas.draw(ctx, column, row, 0, 0, this.rigSize, this.rigSize, options);
    return true;
  }

  armorSlot() {
    return this.registeredSlot("armor");
  }

  droneSlot(level, width, height) {
    const scale =
      PLAYER_LAYOUT_CONFIG.droneScaleBase +
      clampNumber(level, PLAYER_LAYOUT_CONFIG.droneScaleLevelMin, PLAYER_LAYOUT_CONFIG.droneScaleLevelMax) *
        PLAYER_LAYOUT_CONFIG.droneScaleLevelStep;
    return this.slot("drone", 0, 0, width * scale, height * scale);
  }

  registeredSlot(name) {
    return this.slot(name, 0, 0, this.rigSize, this.rigSize);
  }

  draw(ctx, slot, options = {}) {
    const definition = this.definitions()[slot.name];
    if (!definition || !this.isReady()) return;

    this.partAtlas.draw(ctx, definition.col, definition.row, slot.x, slot.y, slot.width, slot.height, options);
  }

  slot(name, x, y, width, height) {
    return { name, x, y, width, height };
  }
}
