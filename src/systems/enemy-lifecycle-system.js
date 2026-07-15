// Galaxy Runner - enemy lifecycle system
// Owns enemy collision outcomes, player projectile hits, destruction rewards, and item drops.

class EnemyLifecycleSystem {
  static update(game, dt, collisionContext = null) {
    const novaMines = collisionContext?.novaMines || game.novaMines();
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      enemy.update(dt, game);

      if (enemy.escaped) {
        EntityStore.removeAtUnordered(game.enemies, i);
        if (enemy.isBoss) game.bossCount = Math.max(0, game.bossCount - 1);
        continue;
      }

      if (novaMines.length > 0 && game.resolveNovaMineEnemyTrigger(enemy, novaMines)) {
        continue;
      }

      if (enemy.collidesWithPlayer(game.player)) {
        EntityStore.removeAtUnordered(game.enemies, i);
        if (enemy.isBoss) game.bossCount = Math.max(0, game.bossCount - 1);
        game.player.hit(game, enemy.isBoss ? BALANCE.bossCollisionDamage : BALANCE.enemyCollisionDamage);
        continue;
      }

      EnemyLifecycleSystem.resolvePlayerProjectileHits(game, enemy);
    }
  }

  static resolvePlayerProjectileHits(game, enemy) {
    for (let j = game.bullets.length - 1; j >= 0; j -= 1) {
      const bullet = game.bullets[j];
      if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) continue;
      if (!bullet.canHit(enemy)) continue;
      if (!enemy.hitBy(bullet)) continue;

      bullet.markHit(enemy);
      const hitResult = enemy.receiveHit(bullet);
      game.burst(bullet.x, bullet.y, hitResult.color, hitResult.burst);

      if (bullet.blastRadius > 0) {
        if (bullet.kind === "nova") {
          game.spawnNovaExplosion(
            bullet.x,
            bullet.y,
            bullet.blastRadius,
            Math.ceil(bullet.damage * BALANCE.novaExplosionDamageRatio),
            bullet.blastDuration
          );
        } else {
          EnemyLifecycleSystem.damageEnemiesInRadius(
            game,
            bullet.x,
            bullet.y,
            bullet.blastRadius,
            Math.ceil(bullet.damage * 0.55),
            enemy
          );
        }
      }

      if (bullet.pierce > 0) {
        bullet.pierce -= 1;
      } else {
        EntityStore.removeAtUnordered(game.bullets, j);
      }

      if (enemy.health <= 0) {
        EnemyLifecycleSystem.destroyEnemy(game, enemy);
      }
      return;
    }
  }

  static damageEnemiesInRadius(game, x, y, radius, damage, sourceEnemy) {
    game.burst(x, y, "#ff8f5a", 14);
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      if (enemy === sourceEnemy) continue;
      if (!CollisionQuery.overlaps(enemy, { x, y, radius }, { aRadius: enemy.blastHitRadius(), bRadius: radius })) continue;

      EnemyLifecycleSystem.damageEnemy(game, enemy, damage, "#ffb17d", 6);
    }
  }

  static damageEnemy(game, enemy, damage, burstColor = "#ffb17d", burstCount = 6) {
    if (!game.enemies.includes(enemy)) return false;

    const hitResult = enemy.receiveDamage(damage, { color: burstColor, burst: burstCount });
    game.burst(enemy.x, enemy.y, hitResult.color, hitResult.burst);
    if (hitResult.damage > 0 && enemy.health <= 0) {
      return EnemyLifecycleSystem.destroyEnemy(game, enemy);
    }

    return false;
  }

  static destroyEnemy(game, enemy) {
    const index = game.enemies.indexOf(enemy);
    if (index < 0) return false;

    if (enemy.isBoss) game.bossCount = Math.max(0, game.bossCount - 1);
    SpecialSystem.awardKill(game.player, enemy);
    game.state.kills += 1;
    const score = EnemyLifecycleSystem.score(enemy, game.state.danger);
    game.state.score += score;
    game.feedback?.emit("enemy.destroyed", { role: enemy.role, score });
    EnemyLifecycleSystem.dropItemFromEnemy(game, enemy);
    if (enemy.role === "splitter") game.spawnEnemyChildren(enemy);
    if (enemy.role === "boss") game.advanceStage();
    game.burst(
      enemy.x,
      enemy.y,
      enemy.color,
      enemy.maxHealth > GAME_CONFIG.enemyDestruction.eliteHealthThreshold
        ? GAME_CONFIG.enemyDestruction.eliteBurstCount
        : GAME_CONFIG.enemyDestruction.normalBurstCount
    );
    EntityStore.removeAtUnordered(game.enemies, index);
    return true;
  }

  static dropItemFromEnemy(game, enemy) {
    if (game.items.length >= GAME_CONFIG.items.maxOnField) return false;

    const chance = EnemyLifecycleSystem.itemDropChance(enemy, game.state.danger);
    if (Math.random() > chance) return false;

    game.spawnItem({ x: enemy.x, y: enemy.y });
    return true;
  }

  static itemDropChance(enemy, danger = 0) {
    if (enemy.role === "boss") return GAME_CONFIG.items.bossDropChance;
    if (enemy.role === "midboss") return GAME_CONFIG.items.midBossDropChance;

    const eliteBonus = enemy.maxHealth > GAME_CONFIG.enemyDestruction.eliteHealthThreshold
      ? GAME_CONFIG.items.eliteDropBonus
      : 0;
    return clampNumber(
      GAME_CONFIG.items.dropChanceBase + danger * GAME_CONFIG.items.dropChanceDangerStep + eliteBonus,
      0,
      GAME_CONFIG.items.dropChanceMax
    );
  }

  static score(enemy, danger) {
    const roleScore = GAME_CONFIG.scoring.enemyRoleScore;
    const baseScore = enemy.scoreValue ?? roleScore[enemy.role] ?? roleScore.fallback;
    const dangerMultiplier = 1 + Math.floor(danger) * GAME_CONFIG.scoring.enemyDangerMultiplierPerLevel;
    return Math.ceil(baseScore * dangerMultiplier);
  }
}
