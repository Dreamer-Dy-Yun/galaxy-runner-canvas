// Galaxy Runner - ready-screen loadout selector
// Renders the game-owned starting weapon decision without mutating it.

(() => {
  const LOADOUT_LAYOUT = Object.freeze({
    y: 210,
    cardWidth: 150,
    cardHeight: 72,
    gap: 14,
  });

  class LoadoutSelector {
    static draw(ctx, game) {
      const kinds = RunRules.weaponKinds();
      if (kinds.length <= 0) return;

      const totalWidth = kinds.length * LOADOUT_LAYOUT.cardWidth + (kinds.length - 1) * LOADOUT_LAYOUT.gap;
      const startX = (PLAYFIELD.width - totalWidth) / 2;
      const selected = RunRules.normalizeStartingWeapon(game.state?.startingWeaponKind);

      ctx.save();
      ctx.textAlign = "center";
      for (let index = 0; index < kinds.length; index += 1) {
        const kind = kinds[index];
        const definition = WeaponCatalog.definition(kind);
        const x = startX + index * (LOADOUT_LAYOUT.cardWidth + LOADOUT_LAYOUT.gap);
        const isSelected = kind === selected;

        ctx.fillStyle = isSelected ? "rgba(24, 49, 70, 0.94)" : "rgba(8, 17, 31, 0.76)";
        ctx.fillRect(x, LOADOUT_LAYOUT.y, LOADOUT_LAYOUT.cardWidth, LOADOUT_LAYOUT.cardHeight);
        ctx.strokeStyle = isSelected ? definition?.color || "#8fe7ff" : "rgba(154, 248, 255, 0.24)";
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(x, LOADOUT_LAYOUT.y, LOADOUT_LAYOUT.cardWidth, LOADOUT_LAYOUT.cardHeight);

        ctx.fillStyle = definition?.color || "#f6fbff";
        ctx.font = "800 17px Segoe UI, Noto Sans KR, sans-serif";
        ctx.fillText(`${index + 1}  ${definition?.label || kind}`, x + LOADOUT_LAYOUT.cardWidth / 2, LOADOUT_LAYOUT.y + 31);
        ctx.fillStyle = isSelected ? "#f6fbff" : "rgba(239, 250, 255, 0.56)";
        ctx.font = "700 11px Segoe UI, Noto Sans KR, sans-serif";
        ctx.fillText(isSelected ? "SELECTED" : "", x + LOADOUT_LAYOUT.cardWidth / 2, LOADOUT_LAYOUT.y + 54);
      }
      ctx.restore();
    }
  }

  globalThis.LoadoutSelector = LoadoutSelector;
})();
