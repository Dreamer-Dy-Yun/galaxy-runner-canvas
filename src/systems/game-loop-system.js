// Galaxy Runner - game loop system
// Owns per-frame state timers and orchestration order for the running game state.

class GameLoopSystem {
  static update(game, dt) {
    if (game.state.mode !== "running") return;

    game.state.time += dt;
    game.state.distance += dt * GAME_CONFIG.scoring.distancePerSecond;
    game.state.danger = Math.min(GAME_CONFIG.danger.max, game.state.time / GAME_CONFIG.danger.secondsPerDanger);
    game.state.spawnInterval = Math.max(
      GAME_CONFIG.spawn.intervalMin,
      GAME_CONFIG.spawn.intervalBase - game.state.danger * GAME_CONFIG.spawn.intervalDangerStep
    );
    game.state.itemInterval = Math.max(
      GAME_CONFIG.items.intervalMin,
      GAME_CONFIG.items.intervalBase - game.state.danger * GAME_CONFIG.items.intervalDangerStep
    );
    game.state.spawnTimer += dt;
    game.state.itemTimer += dt;
    let bossActive = game.hasBossEnemy();

    if (!bossActive && game.state.time >= game.state.nextBoss) {
      game.spawnBoss();
      game.state.spawnTimer = 0;
      bossActive = true;
    } else if (!bossActive && game.state.time >= game.state.nextMidBoss) {
      game.spawnMidBoss();
      game.state.spawnTimer = 0;
      bossActive = true;
    }

    if (!bossActive && game.state.spawnTimer >= game.state.spawnInterval) {
      game.state.spawnTimer = 0;
      game.spawnEnemy();
    } else if (bossActive) {
      game.state.spawnTimer = 0;
    }

    if (game.state.itemTimer >= game.state.itemInterval && game.items.length < GAME_CONFIG.items.maxOnField) {
      game.state.itemTimer = 0;
      game.spawnItem();
    }

    game.player.update(dt, game);
    const collisionContext = game.buildProjectileCollisionContext();
    game.updateProjectiles(dt, collisionContext);
    game.updateItems(dt);
    game.updateEnemies(dt, collisionContext);
    game.updateExplosions(dt);
    game.updateParticles(dt);
  }
}
