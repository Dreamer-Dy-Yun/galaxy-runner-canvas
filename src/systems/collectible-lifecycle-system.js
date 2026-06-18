// Galaxy Runner - collectible lifecycle system
// Owns item spawning, updates, pickup collision, and expired item cleanup.

class CollectibleLifecycleSystem {
  static spawnItem(game, options = {}) {
    const item = new CollectibleItem(options.kind ?? CollectibleItem.pickKind(game.player));
    if (Number.isFinite(options.x)) {
      item.x = clampNumber(options.x, item.bouncePadding, PLAYFIELD.width - item.bouncePadding);
    }
    if (Number.isFinite(options.y)) {
      item.y = clampNumber(options.y, item.bouncePadding, PLAYFIELD.height - item.bouncePadding);
    }
    game.world.add(EntityGroups.collectibles, item);
    return item;
  }

  static update(game, dt) {
    let firstKeptIndex = game.items.length;
    const pickupRadius = game.player.pickupRadius ?? game.player.bodyRadius;

    for (let i = game.items.length - 1; i >= 0; i -= 1) {
      const item = game.items[i];
      item.update(dt, game);
      if (item.expired) continue;

      if (CollisionQuery.overlaps(item, game.player, { aRadius: item.radius, bRadius: pickupRadius })) {
        game.player.collect(item, game);
        continue;
      }

      firstKeptIndex -= 1;
      game.items[firstKeptIndex] = item;
    }

    EntityStore.compactKeptTail(game.items, firstKeptIndex);
  }
}
