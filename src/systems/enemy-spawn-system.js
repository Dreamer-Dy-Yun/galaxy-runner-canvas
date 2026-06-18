// Galaxy Runner - enemy spawn system
// Owns timed enemy, boss, stage, and splitter child spawning rules.

class EnemySpawnSystem {
  static spawnEnemy(game) {
    const danger = game.state.danger;
    if (EnemySpawnSystem.trySpawnEnemyTrain(game, danger)) return;

    const extraOneChance = clampNumber(
      (danger - GAME_CONFIG.spawn.extraOneDangerStart) * GAME_CONFIG.spawn.extraOneChanceStep,
      0,
      GAME_CONFIG.spawn.extraOneChanceMax
    );
    const extraTwoChance = clampNumber(
      (danger - GAME_CONFIG.spawn.extraTwoDangerStart) * GAME_CONFIG.spawn.extraTwoChanceStep,
      0,
      GAME_CONFIG.spawn.extraTwoChanceMax
    );
    const count = 1 + (Math.random() < extraOneChance ? 1 : 0) + (Math.random() < extraTwoChance ? 1 : 0);

    for (let i = 0; i < count; i += 1) {
      game.registerEnemy(new Enemy(danger, EnemySpawnSystem.pickEnemyRole(game, danger)));
    }
  }

  static trySpawnEnemyTrain(game, danger) {
    if (game.state.time < GAME_CONFIG.spawn.trainStartTime) return false;

    const chance = clampNumber(
      GAME_CONFIG.spawn.trainChanceBase + danger * GAME_CONFIG.spawn.trainChanceDangerStep,
      0,
      GAME_CONFIG.spawn.trainChanceMax
    );
    if (Math.random() >= chance) return false;

    const count = Math.floor(randomRange(GAME_CONFIG.spawn.trainMinCount, GAME_CONFIG.spawn.trainMaxCount + 1));
    const role = Math.random() < 0.62 ? "scout" : "fighter";
    const x = randomRange(ENEMY_CONFIG.spawn.xPadding, PLAYFIELD.width - ENEMY_CONFIG.spawn.xPadding);
    const driftX = randomRange(-GAME_CONFIG.spawn.trainDriftX, GAME_CONFIG.spawn.trainDriftX);
    const velocityY = randomRange(GAME_CONFIG.spawn.trainSpeedYMin, GAME_CONFIG.spawn.trainSpeedYMax) +
      danger * GAME_CONFIG.spawn.trainDangerSpeedStep;
    const centerOffset = (count - 1) / 2;

    for (let index = 0; index < count; index += 1) {
      game.registerEnemy(
        new Enemy(danger, role, {
          x: x + Math.sin(index * 0.92) * GAME_CONFIG.spawn.trainSpacingX,
          y: -GAME_CONFIG.spawn.trainStartYOffset - index * GAME_CONFIG.spawn.trainSpacingY,
          velocityX: driftX + (index - centerOffset) * 2,
          velocityY,
          formation: "train",
          formationIndex: index,
          formationCount: count,
        })
      );
    }

    return true;
  }

  static pickEnemyRole(game, danger) {
    const lateralChance =
      game.state.time < GAME_CONFIG.spawn.lateralStartTime
        ? 0
        : clampNumber(
            GAME_CONFIG.spawn.lateralChanceBase + danger * GAME_CONFIG.spawn.lateralChanceDangerStep,
            GAME_CONFIG.spawn.lateralChanceBase,
            GAME_CONFIG.spawn.lateralChanceMax
          );
    return Math.random() < lateralChance ? "raider" : "grunt";
  }

  static spawnMidBoss(game) {
    game.registerEnemy(new Enemy(game.state.danger, "midboss"));
    game.state.nextMidBoss = game.state.time + GAME_CONFIG.bosses.midBossRepeatDelay;
    if (game.state.nextBoss - game.state.nextMidBoss < GAME_CONFIG.bosses.midBossBossGap) {
      game.state.nextMidBoss = game.state.nextBoss + GAME_CONFIG.bosses.midBossAfterBossDelay;
    }
  }

  static spawnBoss(game) {
    game.registerEnemy(new Enemy(game.state.danger, "boss", { stage: game.state.stage }));
    game.state.nextBoss = game.state.time + GAME_CONFIG.bosses.bossRepeatDelay;
    game.state.nextMidBoss = Math.max(
      game.state.nextMidBoss,
      game.state.time + GAME_CONFIG.bosses.nextMidBossAfterBossMinDelay
    );
  }

  static advanceStage(game) {
    const stageCount = ENEMY_CONFIG.stageBoss.stages.length;
    game.state.stage = (game.state.stage % stageCount) + 1;
  }

  static spawnEnemyChildren(game, source, role = ENEMY_CONFIG.splitter.childRole, count = ENEMY_CONFIG.splitter.childCount) {
    const centerOffset = (count - 1) / 2;
    for (let index = 0; index < count; index += 1) {
      game.registerEnemy(
        new Enemy(game.state.danger, role, {
          x: source.x + (index - centerOffset) * ENEMY_CONFIG.splitter.childXSpread,
          y: source.y + Math.abs(index - centerOffset) * ENEMY_CONFIG.splitter.childYSpread,
        })
      );
    }
    game.burst(source.x, source.y, source.color, ENEMY_CONFIG.splitter.childBurst);
  }

  static hasBossEnemy(game) {
    return game.bossCount > 0;
  }
}
