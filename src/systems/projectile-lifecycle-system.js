// Galaxy Runner - projectile lifecycle system
// Owns friendly and hostile projectile updates, absorb checks, nova mine detonation, and nova explosions.

class ProjectileLifecycleSystem {
  static addFriendlyProjectile(game, x, y, vx, vy, radius, damage, color, kind = "bolt", options = {}) {
    game.world.add(
      EntityGroups.friendlyProjectiles,
      new Projectile({ x, y, vx, vy, radius, damage, color, kind, ...options })
    );
  }

  static update(game, dt, collisionContext = null) {
    ProjectileLifecycleSystem.updatePlayerProjectiles(game, dt);
    ProjectileLifecycleSystem.updateEnemyProjectiles(game, dt, collisionContext);
  }

  static updatePlayerProjectiles(game, dt) {
    let firstKeptIndex = game.bullets.length;
    for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = game.bullets[i];
      bullet.update(dt, game);
      if (!bullet.expired) {
        firstKeptIndex -= 1;
        game.bullets[firstKeptIndex] = bullet;
      } else {
        ProjectileLifecycleSystem.resolveExpiredPlayerProjectile(game, bullet);
      }
    }

    EntityStore.compactKeptTail(game.bullets, firstKeptIndex);
  }

  static resolveExpiredPlayerProjectile(game, projectile) {
    if (projectile.energyCore) ProjectileLifecycleSystem.releaseEnergyCore(game, projectile);
  }

  static releaseEnergyCore(game, core) {
    const absorbedCount = core.absorbedEnemyBullets || 0;
    if (absorbedCount <= 0 || core.releaseDamageScale <= 0 || core.releaseRadius <= 0) return;

    const releaseDamage = Math.ceil(core.damage * core.releaseDamageScale * absorbedCount);
    game.burst(core.x, core.y, core.color, core.releaseBurst);

    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      if (!CollisionQuery.overlaps(enemy, core, { aRadius: enemy.blastHitRadius(), bRadius: core.releaseRadius })) continue;
      game.damageEnemy(enemy, releaseDamage, core.color, core.releaseHitBurst);
    }
  }

  static updateEnemyProjectiles(game, dt, collisionContext = null) {
    const context = collisionContext || ProjectileLifecycleSystem.buildCollisionContext(game);
    const playerHitRadius = game.player.hitRadius ?? game.player.bodyRadius * GAME_CONFIG.projectiles.enemyHitPlayerRadiusScale;
    const energyAbsorbers = context.energyAbsorbers;
    const novaMines = context.novaMines;
    let firstKeptIndex = game.enemyBullets.length;

    for (let i = game.enemyBullets.length - 1; i >= 0; i -= 1) {
      const bullet = game.enemyBullets[i];
      bullet.update(dt, game);
      let keepBullet = !bullet.expired;

      if (bullet.expired) {
        keepBullet = false;
      }

      if (keepBullet && ProjectileLifecycleSystem.energyAbsorbsEnemyBullet(bullet, energyAbsorbers)) {
        game.burst(bullet.x, bullet.y, "#55f0ff", 5);
        keepBullet = false;
      }

      const mineIndex = keepBullet ? ProjectileLifecycleSystem.findNovaMineHitIndex(game, bullet, novaMines) : -1;
      if (mineIndex >= 0) {
        ProjectileLifecycleSystem.detonateNovaMine(game, novaMines[mineIndex], novaMines, mineIndex);
        keepBullet = false;
      }

      const bulletHitRadius = bullet.hitRadius ?? bullet.radius;
      if (
        keepBullet &&
        CollisionQuery.overlaps(bullet, game.player, { aRadius: bulletHitRadius, bRadius: playerHitRadius })
      ) {
        game.player.hit(game, bullet.damage || BALANCE.enemyFallbackDamage);
        keepBullet = false;
      }

      if (keepBullet) {
        firstKeptIndex -= 1;
        game.enemyBullets[firstKeptIndex] = bullet;
      }
    }

    EntityStore.compactKeptTail(game.enemyBullets, firstKeptIndex);
  }

  static buildCollisionContext(game) {
    const context = game.projectileCollisionContext;
    const energyAbsorbers = context.energyAbsorbers;
    const novaMines = context.novaMines;

    energyAbsorbers.length = 0;
    novaMines.length = 0;
    for (const bullet of game.bullets) {
      if (bullet.kind === "energy" && (bullet.absorbLevel ?? 0) > 0) {
        energyAbsorbers.push(bullet);
      } else if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) {
        novaMines.push(bullet);
      }
    }

    return context;
  }

  static energyAbsorbsEnemyBullet(enemyBullet, energyAbsorbers) {
    if (!enemyBullet.hostile || energyAbsorbers.length <= 0) return false;

    const enemyRadius = enemyBullet.hitRadius ?? enemyBullet.radius;
    for (const bullet of energyAbsorbers) {
      const absorbLevel = bullet.absorbLevel ?? 0;
      if (enemyBullet.level > absorbLevel) continue;
      const energyRadius = bullet.hitRadius ?? bullet.radius;
      if (CollisionQuery.overlaps(bullet, enemyBullet, { aRadius: energyRadius, bRadius: enemyRadius })) {
        bullet.absorbedEnemyBullets += 1;
        return true;
      }
    }

    return false;
  }

  static novaMines(game) {
    return game.projectileCollisionContext.novaMines;
  }

  static novaMineCount(game) {
    return game.projectileCollisionContext.novaMines.length;
  }

  static findNovaMineHitIndex(game, projectile, mines = ProjectileLifecycleSystem.novaMines(game)) {
    if (!mines || mines.length <= 0) return -1;

    const radius = projectile.hitRadius ?? projectile.radius;
    return CollisionQuery.findFirstOverlap(mines, projectile, { targetRadius: radius }).index;
  }

  static resolveNovaMineEnemyTrigger(game, enemy, mines) {
    const enemyTriggerRadius = enemy.blastHitRadius();
    const { entity: mine } = CollisionQuery.findFirstOverlap(mines, enemy, { targetRadius: enemyTriggerRadius });
    if (!mine) return false;

    ProjectileLifecycleSystem.detonateNovaMine(game, mine, mines);
    return true;
  }

  static detonateNovaMine(game, mine, mineCache = null, mineCacheIndex = -1) {
    if (!mine) return;

    const index = game.bullets.indexOf(mine);
    if (index >= 0) EntityStore.removeAtUnordered(game.bullets, index);
    if (mineCache) {
      const cacheIndex = mineCacheIndex >= 0 ? mineCacheIndex : mineCache.indexOf(mine);
      if (cacheIndex >= 0) EntityStore.removeAtUnordered(mineCache, cacheIndex);
    }

    ProjectileLifecycleSystem.spawnNovaExplosion(
      game,
      mine.x,
      mine.y,
      mine.blastRadius,
      Math.ceil(mine.damage * BALANCE.novaExplosionDamageRatio),
      mine.blastDuration
    );
  }

  static spawnNovaExplosion(game, x, y, radius, damage, duration = null) {
    game.world.add(
      EntityGroups.effects,
      new NovaExplosion({ x, y, radius, damage, duration: duration ?? BALANCE.novaExplosionDuration })
    );
    game.burst(x, y, "#ff8f5a", 24);
  }
}
