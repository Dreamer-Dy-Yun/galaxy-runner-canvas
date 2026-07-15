// Galaxy Runner - game session system
// Owns scene mode transitions, continue/reset side effects, pause toggling, and pause overlay clicks.

class GameSessionSystem {
  static handleAction(game, action) {
    const actionName = typeof action === "string" ? action : action?.name;
    if (!actionName || (action?.phase && action.phase !== "pressed")) return false;

    if (actionName === "pause") {
      game.togglePause();
      return true;
    }

    if (actionName === "start") {
      if (game.state?.mode !== "running") game.start();
      return true;
    }

    if (actionName === "restart") {
      game.reset();
      return true;
    }

    if (GameSessionSystem.selectStartingWeapon(game, actionName)) return true;

    if (actionName === "info") {
      if (action?.source === "canvas" && action.sourceEvent) game.handleCanvasClick(action.sourceEvent);
      else GameSessionSystem.toggleInfo(game);
      return true;
    }

    return false;
  }

  static start(game) {
    if (game.state.mode === "gameover") {
      game.continueRun();
      return;
    }
    if (game.state.mode === "ready") {
      const startingWeaponKind = RunRules.normalizeStartingWeapon(game.state.startingWeaponKind);
      if (!startingWeaponKind) return;
      game.state.startingWeaponKind = startingWeaponKind;
      game.player.equipWeapon(startingWeaponKind);
      game.state.mode = "running";
    }
  }

  static selectStartingWeapon(game, actionName) {
    if (game.state?.mode !== "ready") return false;
    const nextKind = RunRules.weaponForAction(actionName, game.state.startingWeaponKind);
    if (!nextKind) return false;
    game.state.startingWeaponKind = nextKind;
    return true;
  }

  static continueRun(game) {
    if (game.state.mode !== "gameover") return;
    game.state.continues += 1;
    game.state.mode = RUN_RULES.continue.mode;
    game.state.spawnTimer = Math.min(game.state.spawnTimer, -RUN_RULES.continue.spawnGraceSeconds);
    game.state.itemTimer = Math.min(game.state.itemTimer, -RUN_RULES.continue.itemGraceSeconds);
    game.clearDangerField();
    game.player.continue();
  }

  static clearDangerField(game) {
    game.world.clearGroup(EntityGroups.friendlyProjectiles);
    game.world.clearGroup(EntityGroups.hostileProjectiles);
    game.world.clearGroup(EntityGroups.actors);
    game.bossCount = 0;
    game.world.clearGroup(EntityGroups.effects);
    game.world.clearGroup(EntityGroups.particles);
  }

  static togglePause(game) {
    if (!game.state || game.state.mode === "ready") return;
    if (game.state.mode === "gameover") return;

    if (game.state.mode === "running") {
      game.state.mode = "paused";
      game.infoPanelOpen = false;
    } else if (game.state.mode === "paused") {
      game.state.mode = "running";
      game.infoPanelOpen = false;
    }
  }

  static handleCanvasClick(game, event) {
    if (!game.state || game.state.mode !== "paused") return;

    const rect = game.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * PLAYFIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * PLAYFIELD.height;
    if (GameOverlay.pointInRect(x, y, GAME_INFO_CONFIG.button)) {
      GameSessionSystem.toggleInfo(game);
    }
  }

  static toggleInfo(game) {
    if (game.state?.mode !== "paused") return false;
    game.infoPanelOpen = !game.infoPanelOpen;
    return true;
  }
}
