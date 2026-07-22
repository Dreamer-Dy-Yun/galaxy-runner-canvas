// Galaxy Runner - game overlay
// Owns non-running overlay and pause-screen information rendering.

class GameOverlay {
  static draw(ctx, game) {
    if (game.state.mode === "running") return;

    ctx.save();
    ctx.fillStyle = "rgba(5, 7, 16, 0.68)";
    ctx.fillRect(0, 0, PLAYFIELD.width, PLAYFIELD.height);
    ctx.textAlign = "center";
    if (game.state.mode === "ready") GameOverlay.drawReady(ctx, game);
    else if (game.state.mode === "gameover") GameOverlay.drawGameOver(ctx, game);
    else GameOverlay.drawPaused(ctx, game);
    ctx.restore();
  }

  static drawReady(ctx, game) {
    ctx.fillStyle = "#f6fbff";
    ctx.font = "800 38px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillText("GALAXY RUNNER", PLAYFIELD.width / 2, 122);
    ctx.font = "600 18px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillStyle = "rgba(239, 250, 255, 0.82)";
    ctx.fillText("시작 함선을 선택하세요", PLAYFIELD.width / 2, 166);
    LoadoutSelector.draw(ctx, game);
    ctx.fillStyle = "#8fe7ff";
    ctx.fillText("←/A · D/→ 또는 1~4 선택 · Space 시작", PLAYFIELD.width / 2, 326);
  }

  static drawGameOver(ctx, game) {
    const assisted = RunRules.isAssisted(game.state);
    ctx.fillStyle = "#f6fbff";
    ctx.font = "800 38px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillText(assisted ? "임무 실패 · ASSISTED" : "임무 실패", PLAYFIELD.width / 2, PLAYFIELD.height / 2 - 64);
    ctx.font = "600 18px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillStyle = "rgba(239, 250, 255, 0.82)";
    ctx.fillText(
      `거리 ${Math.floor(game.state.distance)}m / 점수 ${Math.floor(game.state.score)} / Assist ${game.state.continues}`,
      PLAYFIELD.width / 2,
      PLAYFIELD.height / 2 - 22
    );
    ctx.fillStyle = "#ffcf8f";
    ctx.fillText("Space: 강화와 진행을 보존하는 Assist Continue", PLAYFIELD.width / 2, PLAYFIELD.height / 2 + 20);
    ctx.fillStyle = "#8fe7ff";
    ctx.fillText("R: 시작 함선 선택으로 돌아가기", PLAYFIELD.width / 2, PLAYFIELD.height / 2 + 58);
  }

  static drawPaused(ctx, game) {
    ctx.fillStyle = "#f6fbff";
    ctx.font = "800 38px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillText("일시정지", PLAYFIELD.width / 2, PLAYFIELD.height / 2 - 42);
    ctx.font = "600 18px Segoe UI, Noto Sans KR, sans-serif";
    ctx.fillStyle = "rgba(239, 250, 255, 0.82)";
    ctx.fillText("P / Esc: 계속하기", PLAYFIELD.width / 2, PLAYFIELD.height / 2 - 5);
    ctx.fillStyle = "#8fe7ff";
    ctx.fillText("I: 게임 정보", PLAYFIELD.width / 2, PLAYFIELD.height / 2 + 38);
    if (game.infoPanelOpen) GameOverlay.drawGameInfoPanel(ctx, game);
    GameOverlay.drawGameInfoButton(ctx, game.infoPanelOpen);
  }

  static drawGameInfoButton(ctx, infoPanelOpen) {
    const button = GAME_INFO_CONFIG.button;
    ctx.save();
    ctx.fillStyle = infoPanelOpen ? "rgba(154, 248, 255, 0.26)" : "rgba(154, 248, 255, 0.12)";
    ctx.strokeStyle = infoPanelOpen ? "rgba(154, 248, 255, 0.74)" : "rgba(154, 248, 255, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(button.x, button.y, button.width, button.height, button.radius);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    ctx.fillStyle = "#f6fbff";
    ctx.fillText(infoPanelOpen ? button.closeLabel : button.label, button.x + button.width / 2, button.y + button.height / 2);
    ctx.restore();
  }

  static drawGameInfoPanel(ctx, game) {
    const panel = GAME_INFO_CONFIG.panel;
    ctx.save();
    ctx.fillStyle = panel.background;
    ctx.strokeStyle = panel.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panel.x, panel.y, panel.width, panel.height, panel.radius);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = panel.titleColor;
    ctx.font = panel.titleFont;
    ctx.fillText(GAME_INFO.title, PLAYFIELD.width / 2, panel.titleY);

    for (let index = 0; index < GAME_INFO.ships.length; index += 1) {
      GameOverlay.drawShipInfoCard(ctx, game, GAME_INFO.ships[index], index);
    }

    GameOverlay.drawItemInfoGrid(ctx);

    ctx.textAlign = "center";
    ctx.font = panel.hintFont;
    ctx.fillStyle = panel.hintColor;
    ctx.fillText(GAME_INFO.hint, PLAYFIELD.width / 2, panel.y + panel.height - 24);
    ctx.restore();
  }

  static drawShipInfoCard(ctx, game, ship, index) {
    const cards = GAME_INFO_CONFIG.shipCards;
    const x = cards.x + index * (cards.width + cards.gap);
    const y = cards.y;

    ctx.save();
    ctx.fillStyle = cards.cardBackground;
    ctx.strokeStyle = ship.color;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.roundRect(x, y, cards.width, cards.height, 14);
    ctx.fill();
    ctx.globalAlpha = 0.44;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    ctx.fillStyle = ship.color;
    ctx.fillText(ship.name, x + cards.width / 2, y + cards.titleY);

    ctx.save();
    ctx.translate(x + cards.width / 2, y + cards.previewY);
    const previewScale = cards.previewScaleByKind[ship.kind] ?? 1;
    const drewShip = game.player.finalShips.draw(ctx, ship.kind, WeaponCatalog.maxLevel(ship.kind), cards.previewSize * previewScale);
    if (!drewShip) {
      ItemIconRenderer.draw(ctx, ship.kind, 0, 0, ship.color, { size: cards.previewSize * previewScale * 0.5 });
    }
    ctx.restore();

    for (let tagIndex = 0; tagIndex < ship.tags.length; tagIndex += 1) {
      const tagY = y + cards.tagStartY + tagIndex * cards.tagGap;
      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.roundRect(x + 18, tagY - cards.tagHeight + 3, cards.width - 36, cards.tagHeight, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = GAME_INFO_CONFIG.panel.bodyColor;
      ctx.font = GAME_INFO_CONFIG.panel.bodyFont;
      ctx.fillText(ship.tags[tagIndex], x + cards.width / 2, tagY);
    }
    ctx.restore();
  }

  static drawItemInfoGrid(ctx) {
    const grid = GAME_INFO_CONFIG.itemGrid;
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    ctx.fillStyle = GAME_INFO_CONFIG.panel.sectionColor;
    ctx.fillText(GAME_INFO.itemTitle, grid.titleX, grid.titleY);

    for (let index = 0; index < GAME_INFO.items.length; index += 1) {
      const item = GAME_INFO.items[index];
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const x = grid.x + column * (grid.width + grid.gapX);
      const y = grid.y + row * (grid.height + grid.gapY);

      ctx.fillStyle = grid.cardBackground;
      ctx.strokeStyle = grid.cardBorder;
      ctx.beginPath();
      ctx.roundRect(x, y, grid.width, grid.height, 12);
      ctx.fill();
      ctx.stroke();

      ItemIconRenderer.draw(ctx, item.kind, x + grid.iconX, y + grid.iconY, item.color, { size: grid.iconSize });

      ctx.textAlign = "left";
      ctx.font = GAME_INFO_CONFIG.panel.bodyFont;
      ctx.fillStyle = item.color;
      ctx.fillText(item.name, x + grid.textX, y + grid.nameY);
      ctx.fillStyle = GAME_INFO_CONFIG.panel.bodyColor;
      ctx.fillText(item.effect, x + grid.textX, y + grid.effectY);
    }

    ctx.restore();
  }

  static pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }
}
