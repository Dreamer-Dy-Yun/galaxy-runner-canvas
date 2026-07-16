// Galaxy Runner - collectible lifecycle system
// Owns item spawning, updates, pickup collision, and expired item cleanup.

class CollectibleLifecycleSystem {
  static spawnItem(game, options = {}) {
    if (!options.openingChoice && RunRules.isOpening(game.state)) return null;
    const routeKind = RunRules.routeKind(game.state);
    const kind = options.kind ?? CollectibleItem.pickKind(game.player, null, null, routeKind);
    const item = new CollectibleItem(kind, { openingChoice: options.openingChoice === true });
    if (Number.isFinite(options.x)) {
      item.x = clampNumber(options.x, item.bouncePadding, PLAYFIELD.width - item.bouncePadding);
    }
    if (Number.isFinite(options.y)) {
      item.y = clampNumber(options.y, item.bouncePadding, PLAYFIELD.height - item.bouncePadding);
    }
    game.world.add(EntityGroups.collectibles, item);
    return item;
  }

  static spawnRouteChoices(game) {
    if (game.state?.runPhase !== RUN_RULES.opening.phases.routeChoice) return [];
    if (game.state.routeChoicesSpawned) return game.items.filter((item) => item.openingChoice);

    const items = RUN_RULES.opening.choices.map((choice) => CollectibleLifecycleSystem.spawnItem(game, {
      kind: choice.kind,
      openingChoice: true,
      x: PLAYFIELD.width * choice.xRatio,
      y: PLAYFIELD.height * choice.yRatio,
    }));
    game.state.routeChoicesSpawned = true;
    return items.filter(Boolean);
  }

  static update(game, dt) {
    let firstKeptIndex = game.items.length;
    const pickupRadius = game.player.pickupRadius ?? game.player.bodyRadius;

    for (let i = game.items.length - 1; i >= 0; i -= 1) {
      const item = game.items[i];
      item.update(dt, game);
      if (item.expired) continue;

      if (CollisionQuery.overlaps(item, game.player, { aRadius: item.radius, bRadius: pickupRadius })) {
        const result = game.player.collect(item, game);
        if (!result && item.openingChoice) {
          firstKeptIndex -= 1;
          game.items[firstKeptIndex] = item;
          continue;
        }
        if (result) game.feedback?.emit("item.collected", result);
        if (result && item.openingChoice) {
          CollectibleLifecycleSystem.completeRouteChoice(game, item.kind, result);
          return;
        }
        if (result?.rigChange) {
          CollectibleLifecycleSystem.notifyRigAdapter(game, result, "upgrade");
        }
        continue;
      }

      firstKeptIndex -= 1;
      game.items[firstKeptIndex] = item;
    }

    EntityStore.compactKeptTail(game.items, firstKeptIndex);
  }

  static completeRouteChoice(game, kind, progressionResult) {
    if (!RunRules.lockRoute(game.state, kind)) return false;
    game.world.clearGroup(EntityGroups.collectibles);
    CollectibleLifecycleSystem.notifyRigAdapter(game, progressionResult, "route-choice");
    return true;
  }

  static notifyRigAdapter(game, progressionResult, reason) {
    const adapter = game.playerRigAnimationAdapter ?? game.player?.rigAnimationAdapter;
    if (typeof adapter?.handleProgressionResult !== "function") return false;

    const context = Object.freeze({ reason, runPhase: game.state?.runPhase });
    try {
      adapter.handleProgressionResult(progressionResult, context);
      return true;
    } catch (error) {
      console.error("[Player Progression] Rig adapter rejected a visual transition.", error);
      return false;
    }
  }
}
