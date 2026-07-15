// Galaxy Runner - game HUD
// Split from the original single-file prototype so each system can evolve independently.

class GameHud {
  static draw(ctx, game) {
    ctx.fillStyle = HUD_CONFIG.background;
    ctx.fillRect(0, 0, PLAYFIELD.width, HUD_CONFIG.topBarHeight);

    ctx.fillStyle = HUD_CONFIG.textColor;
    ctx.font = HUD_CONFIG.mainFont;
    ctx.fillText(`HP ${Math.ceil(game.player.health)}/${game.player.maxHealth}`, HUD_CONFIG.hpX, HUD_CONFIG.hpTextY);
    ctx.fillText(`STG ${game.state.stage}`, HUD_CONFIG.stageX, HUD_CONFIG.scoreY);
    ctx.fillText(`K ${game.state.kills}`, HUD_CONFIG.killX, HUD_CONFIG.scoreY);
    ctx.fillText(`DIST ${Math.floor(game.state.distance)}m`, HUD_CONFIG.distanceX, HUD_CONFIG.scoreY);
    ctx.fillText(`PTS ${Math.floor(game.state.score)}`, HUD_CONFIG.scoreX, HUD_CONFIG.scoreY);
    if (RunRules.isAssisted(game.state)) ctx.fillText(`AID ${game.state.continues}`, HUD_CONFIG.continueX, HUD_CONFIG.continueY);
    GameHud.drawHealthBar(ctx, game.player, HUD_CONFIG.hpX, HUD_CONFIG.healthBarY, HUD_CONFIG.barWidth, HUD_CONFIG.healthBarHeight);
    GameHud.drawShieldBar(ctx, game.player, HUD_CONFIG.hpX, HUD_CONFIG.shieldBarY, HUD_CONFIG.barWidth, HUD_CONFIG.shieldBarHeight);
    GameHud.drawSpecialMeter(ctx, game.player, game);
    GameHud.drawStatusGrid(ctx, GameHud.activeTags(game.player));
  }

  static drawStatusGrid(ctx, tags) {
    ctx.font = HUD_CONFIG.tagFont;
    for (let index = 0; index < tags.length; index += 1) {
      if (index >= HUD_CONFIG.statusGrid.columns) break;

      const tag = tags[index];
      const x = HUD_CONFIG.statusGrid.x + index * HUD_CONFIG.statusGrid.cellWidth;
      ItemIconRenderer.draw(
        ctx,
        tag.icon,
        x + HUD_CONFIG.statusGrid.iconXOffset,
        HUD_CONFIG.statusGrid.y,
        tag.color,
        { size: HUD_CONFIG.statusGrid.iconSize }
      );
      ctx.fillStyle = tag.color;
      GameHud.drawTagValue(ctx, tag, x);
    }
  }

  static drawTagValue(ctx, tag, x) {
    const lines = Array.isArray(tag.lines) ? tag.lines : [String(tag.value)];
    const lineHeight = 11;
    const startY =
      HUD_CONFIG.statusGrid.y +
      HUD_CONFIG.statusGrid.valueYOffset -
      ((lines.length - 1) * lineHeight) / 2;
    for (let index = 0; index < lines.length; index += 1) {
      ctx.fillText(
        String(lines[index]),
        x + HUD_CONFIG.statusGrid.valueXOffset,
        startY + index * lineHeight
      );
    }
  }

  static drawSpecialMeter(ctx, player, game) {
    const kind = player.activeWeaponKind();
    const ratio = clampNumber((player.specialMeter || 0) / SPECIAL_CONFIG.meterMax, 0, 1);
    ItemIconRenderer.draw(ctx, "bonus", HUD_CONFIG.special.iconX, HUD_CONFIG.special.iconY, ITEM_DEFINITIONS.bonus.color, {
      size: HUD_CONFIG.special.iconSize,
    });

    ctx.font = HUD_CONFIG.mainFont;
    ctx.fillStyle = kind ? ITEM_DEFINITIONS.bonus.color : "rgba(239, 250, 255, 0.46)";
    ctx.fillText(GameHud.specialStatus(player, game), HUD_CONFIG.special.valueX, HUD_CONFIG.special.valueY);

    ctx.fillStyle = HUD_CONFIG.special.backColor;
    ctx.fillRect(HUD_CONFIG.special.barX, HUD_CONFIG.special.barY, HUD_CONFIG.special.barWidth, HUD_CONFIG.special.barHeight);
    ctx.fillStyle = HUD_CONFIG.special.fillColor;
    ctx.fillRect(HUD_CONFIG.special.barX, HUD_CONFIG.special.barY, HUD_CONFIG.special.barWidth * ratio, HUD_CONFIG.special.barHeight);
    ctx.strokeStyle = HUD_CONFIG.special.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(HUD_CONFIG.special.barX, HUD_CONFIG.special.barY, HUD_CONFIG.special.barWidth, HUD_CONFIG.special.barHeight);
  }

  static specialStatus(player, game) {
    const kind = player.activeWeaponKind();
    if (!kind) return "LOCK";
    if (
      kind === "nova" &&
      SpecialSystem.activeNovaMineCount(game) >= SPECIAL_CONFIG.nova.maxMines
    ) {
      return "MAX";
    }
    if (SpecialSystem.readiness(player) >= 1) return "READY";
    return `${SpecialSystem.percent(player)}%`;
  }

  static drawHealthBar(ctx, player, x, y, width, height) {
    const ratio = clampNumber(player.health / player.maxHealth, 0, 1);
    ctx.fillStyle = "rgba(10, 18, 30, 0.82)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle =
      ratio > HUD_CONFIG.healthColors.highThreshold
        ? HUD_CONFIG.healthColors.high
        : ratio > HUD_CONFIG.healthColors.mediumThreshold
          ? HUD_CONFIG.healthColors.medium
          : HUD_CONFIG.healthColors.low;
    ctx.fillRect(x, y, width * ratio, height);
    ctx.strokeStyle = player.armorLevel > 0 ? "#d8e6f0" : "rgba(233, 248, 255, 0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  static drawShieldBar(ctx, player, x, y, width, height) {
    if (player.maxShield <= 0) return;

    const ratio = clampNumber(player.shield / player.maxShield, 0, 1);
    ctx.fillStyle = "rgba(10, 18, 30, 0.82)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#75dfff";
    ctx.fillRect(x, y, width * ratio, height);
    ctx.strokeStyle = "rgba(117, 223, 255, 0.54)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  static activeTags(player) {
    const tags = [];
    const defense = player.defenseStats();

    if (player.maxShield > 0) {
      tags.push(GameHud.iconTag("shield", `${Math.ceil(player.shield)}/${player.maxShield}`, ITEM_DEFINITIONS.shield.color));
    }
    if (player.specialOverdriveTimer > 0) {
      tags.push(GameHud.iconTag("bonus", `${Math.ceil(player.specialOverdriveTimer)}s`, ITEM_DEFINITIONS.bonus.color));
    }
    if (player.shieldDefenseLevel > 0) {
      tags.push(
        GameHud.iconTag(
          "shieldDefense",
          `L${player.shieldDefenseLevel}`,
          ITEM_DEFINITIONS.shieldDefense.color
        )
      );
    }
    if (defense.flatTotal > 0 || defense.percent > 0) tags.push(GameHud.defenseTag(player, defense));
    for (const tag of GameHud.weaponLevelTags(player)) tags.push(tag);
    for (const tag of GameHud.weaponCoreTags(player)) tags.push(tag);
    if (player.droneLevel > 0) tags.push(GameHud.iconTag("drone", player.droneLevel, ITEM_DEFINITIONS.drone.color));
    return tags;
  }

  static weaponLevelTags(player) {
    const tags = [];
    for (const kind of WEAPON_KINDS) {
      const level = player.weaponLevel(kind);
      if (level <= 0) continue;

      const coreLevel = player.weaponCoreLevel(kind);
      const value = coreLevel > 0 ? `${level}+${coreLevel}` : level;
      tags.push(GameHud.iconTag(kind, value, ITEM_DEFINITIONS[kind].color));
    }
    return tags;
  }

  static weaponCoreTags(player) {
    return [];
  }

  static defenseTag(player, defense) {
    const flat = GameHud.formatNumber(defense.flatTotal);
    const reduction = Math.round(defense.percent * 100);
    const flatLine = player.armorLevel > 0 ? `A${player.armorLevel}/D${flat}` : `D${flat}`;
    return {
      ...GameHud.iconTag("armor", flatLine, ITEM_DEFINITIONS.armor.color),
      lines: Object.freeze([flatLine, `R${reduction}%`]),
    };
  }

  static iconTag(icon, value, color) {
    return { icon, value, color };
  }

  static formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
}



