// Galaxy Runner - game
// Split from the original single-file prototype so each system can evolve independently.

class Game {
  constructor(surfaceOrCanvas, restartButton) {
    this.surface = Game.createSurface(surfaceOrCanvas);
    this.canvas = this.surface.canvas;
    this.ctx = this.surface.context;
    this.dpr = this.surface.dpr;
    this.frameDeltaSeconds = 0;
    this.projectileCollisionContext = {
      energyAbsorbers: [],
      novaMines: [],
    };

    this.input = new InputController(this, restartButton);
    this.background = new SpaceBackground();
    this.infoPanelOpen = false;
    this.player = new Player();
    this.world = null;
    this.reset();
  }

  enter() {
    return this;
  }

  exit() {
    this.input?.destroy?.();
  }

  handleAction(action) {
    const actionName = typeof action === "string" ? action : action?.name;
    if (!actionName || (action?.phase && action.phase !== "pressed")) return false;

    if (actionName === "pause") {
      this.togglePause();
      return true;
    }

    if (actionName === "start") {
      if (this.state?.mode !== "running") this.start();
      return true;
    }

    if (actionName === "restart") {
      this.reset();
      this.start();
      return true;
    }

    if (actionName === "info") {
      if (action?.sourceEvent) this.handleCanvasClick(action.sourceEvent);
      return true;
    }

    return false;
  }

  reset() {
    this.state = { ...GAME_CONFIG.initialState };

    this.player.reset();
    this.bossCount = 0;
    this.resetEntityGroups();
    this.projectileCollisionContext.energyAbsorbers.length = 0;
    this.projectileCollisionContext.novaMines.length = 0;
  }

  resetEntityGroups() {
    this.world = new World({ groups: Object.values(EntityGroups) });
    this.bullets = this.world.items(EntityGroups.friendlyProjectiles);
    this.enemies = this.world.items(EntityGroups.actors);
    this.enemyBullets = this.world.items(EntityGroups.hostileProjectiles);
    this.items = this.world.items(EntityGroups.collectibles);
    this.explosions = this.world.items(EntityGroups.effects);
    this.particles = this.world.items(EntityGroups.particles);
  }

  start() {
    if (this.state.mode === "gameover") {
      this.continueRun();
      return;
    }
    if (this.state.mode === "ready") {
      this.state.mode = "running";
    }
  }

  continueRun() {
    if (this.state.mode !== "gameover") return;
    this.state.continues += 1;
    this.state.mode = GAME_CONFIG.continue.mode;
    this.state.spawnTimer = Math.min(this.state.spawnTimer, -GAME_CONFIG.continue.spawnGraceSeconds);
    this.state.itemTimer = Math.min(this.state.itemTimer, -GAME_CONFIG.continue.itemGraceSeconds);
    this.clearDangerField();
    this.player.continue();
  }

  clearDangerField() {
    this.world.clearGroup(EntityGroups.friendlyProjectiles);
    this.world.clearGroup(EntityGroups.hostileProjectiles);
    this.world.clearGroup(EntityGroups.actors);
    this.bossCount = 0;
    this.world.clearGroup(EntityGroups.effects);
    this.world.clearGroup(EntityGroups.particles);
  }
  togglePause() {
    if (!this.state || this.state.mode === "ready") return;
    if (this.state.mode === "gameover") return;

    if (this.state.mode === "running") {
      this.state.mode = "paused";
      this.infoPanelOpen = false;
    } else if (this.state.mode === "paused") {
      this.state.mode = "running";
      this.infoPanelOpen = false;
    }
  }

  handleCanvasClick(event) {
    if (!this.state || this.state.mode !== "paused") return;
    if (this.state.mode !== "paused") return;

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * PLAYFIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * PLAYFIELD.height;
    if (Game.pointInRect(x, y, GAME_INFO_CONFIG.button)) {
      this.infoPanelOpen = !this.infoPanelOpen;
    }
  }

  addBullet(x, y, vx, vy, radius, damage, color, kind = "bolt", options = {}) {
    this.world.add(
      EntityGroups.friendlyProjectiles,
      new Projectile({ x, y, vx, vy, radius, damage, color, kind, ...options })
    );
  }

  registerEnemy(enemy) {
    if (enemy?.isBoss) this.bossCount += 1;
    this.world.add(EntityGroups.actors, enemy);
  }

  burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      this.world.add(EntityGroups.particles, new BurstParticle(x, y, color));
    }
  }

  spawnEnemy() {
    const danger = this.state.danger;
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
      this.registerEnemy(new Enemy(danger, this.pickEnemyRole(danger)));
    }
  }

  pickEnemyRole(danger) {
    const lateralChance =
      this.state.time < GAME_CONFIG.spawn.lateralStartTime
        ? 0
        : clampNumber(
            GAME_CONFIG.spawn.lateralChanceBase + danger * GAME_CONFIG.spawn.lateralChanceDangerStep,
            GAME_CONFIG.spawn.lateralChanceBase,
            GAME_CONFIG.spawn.lateralChanceMax
          );
    return Math.random() < lateralChance ? "raider" : "grunt";
  }

  spawnMidBoss() {
    this.registerEnemy(new Enemy(this.state.danger, "midboss"));
    this.state.nextMidBoss = this.state.time + GAME_CONFIG.bosses.midBossRepeatDelay;
    if (this.state.nextBoss - this.state.nextMidBoss < GAME_CONFIG.bosses.midBossBossGap) {
      this.state.nextMidBoss = this.state.nextBoss + GAME_CONFIG.bosses.midBossAfterBossDelay;
    }
  }

  spawnBoss() {
    this.registerEnemy(new Enemy(this.state.danger, "boss", { stage: this.state.stage }));
    this.state.nextBoss = this.state.time + GAME_CONFIG.bosses.bossRepeatDelay;
    this.state.nextMidBoss = Math.max(
      this.state.nextMidBoss,
      this.state.time + GAME_CONFIG.bosses.nextMidBossAfterBossMinDelay
    );
  }

  advanceStage() {
    const stageCount = ENEMY_CONFIG.stageBoss.stages.length;
    this.state.stage = (this.state.stage % stageCount) + 1;
  }

  spawnEnemyChildren(source, role = ENEMY_CONFIG.splitter.childRole, count = ENEMY_CONFIG.splitter.childCount) {
    const centerOffset = (count - 1) / 2;
    for (let index = 0; index < count; index += 1) {
      this.registerEnemy(
        new Enemy(this.state.danger, role, {
          x: source.x + (index - centerOffset) * ENEMY_CONFIG.splitter.childXSpread,
          y: source.y + Math.abs(index - centerOffset) * ENEMY_CONFIG.splitter.childYSpread,
        })
      );
    }
    this.burst(source.x, source.y, source.color, ENEMY_CONFIG.splitter.childBurst);
  }

  hasBossEnemy() {
    return this.bossCount > 0;
  }

  spawnItem(options = {}) {
    const item = new CollectibleItem(options.kind ?? CollectibleItem.pickKind(this.player));
    if (Number.isFinite(options.x)) {
      item.x = clampNumber(options.x, item.bouncePadding, PLAYFIELD.width - item.bouncePadding);
    }
    if (Number.isFinite(options.y)) {
      item.y = clampNumber(options.y, item.bouncePadding, PLAYFIELD.height - item.bouncePadding);
    }
    this.world.add(EntityGroups.collectibles, item);
    return item;
  }

  nearestEnemy(x, y) {
    let nearest = null;
    let bestDistanceSq = Infinity;
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        nearest = enemy;
      }
    }
    return nearest;
  }

  update(dt) {
    if (this.state.mode !== "running") return;

    this.state.time += dt;
    this.state.distance += dt * GAME_CONFIG.scoring.distancePerSecond;
    this.state.danger = Math.min(GAME_CONFIG.danger.max, this.state.time / GAME_CONFIG.danger.secondsPerDanger);
    this.state.spawnInterval = Math.max(
      GAME_CONFIG.spawn.intervalMin,
      GAME_CONFIG.spawn.intervalBase - this.state.danger * GAME_CONFIG.spawn.intervalDangerStep
    );
    this.state.itemInterval = Math.max(
      GAME_CONFIG.items.intervalMin,
      GAME_CONFIG.items.intervalBase - this.state.danger * GAME_CONFIG.items.intervalDangerStep
    );
    this.state.spawnTimer += dt;
    this.state.itemTimer += dt;
    let bossActive = this.hasBossEnemy();

    if (!bossActive && this.state.time >= this.state.nextBoss) {
      this.spawnBoss();
      this.state.spawnTimer = 0;
      bossActive = true;
    } else if (!bossActive && this.state.time >= this.state.nextMidBoss) {
      this.spawnMidBoss();
      this.state.spawnTimer = 0;
      bossActive = true;
    }

    if (!bossActive && this.state.spawnTimer >= this.state.spawnInterval) {
      this.state.spawnTimer = 0;
      this.spawnEnemy();
    } else if (bossActive) {
      this.state.spawnTimer = 0;
    }

    if (this.state.itemTimer >= this.state.itemInterval && this.items.length < GAME_CONFIG.items.maxOnField) {
      this.state.itemTimer = 0;
      this.spawnItem();
    }

    this.player.update(dt, this);
    const collisionContext = this.buildProjectileCollisionContext();
    this.updateProjectiles(dt, collisionContext);
    this.updateItems(dt);
    this.updateEnemies(dt, collisionContext);
    this.updateExplosions(dt);
    this.updateParticles(dt);
  }

  updateProjectiles(dt, collisionContext = null) {
    this.updatePlayerProjectiles(dt);
    this.updateEnemyProjectiles(dt, collisionContext);
  }

  updatePlayerProjectiles(dt) {
    let firstKeptIndex = this.bullets.length;
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.update(dt, this);
      if (!bullet.expired) {
        firstKeptIndex -= 1;
        this.bullets[firstKeptIndex] = bullet;
      } else {
        this.resolveExpiredPlayerProjectile(bullet);
      }
    }

    EntityStore.compactKeptTail(this.bullets, firstKeptIndex);
  }

  resolveExpiredPlayerProjectile(projectile) {
    if (projectile.energyCore) this.releaseEnergyCore(projectile);
  }

  releaseEnergyCore(core) {
    const absorbedCount = core.absorbedEnemyBullets || 0;
    if (absorbedCount <= 0 || core.releaseDamageScale <= 0 || core.releaseRadius <= 0) return;

    const releaseDamage = Math.ceil(core.damage * core.releaseDamageScale * absorbedCount);
    this.burst(core.x, core.y, core.color, core.releaseBurst);

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (!CollisionQuery.overlaps(enemy, core, { aRadius: enemy.blastHitRadius(), bRadius: core.releaseRadius })) continue;
      this.damageEnemy(enemy, releaseDamage, core.color, core.releaseHitBurst);
    }
  }

  updateEnemyProjectiles(dt, collisionContext = null) {
    const context = collisionContext || this.buildProjectileCollisionContext();
    const playerHitRadius = this.player.hitRadius ?? this.player.bodyRadius * GAME_CONFIG.projectiles.enemyHitPlayerRadiusScale;
    const energyAbsorbers = context.energyAbsorbers;
    const novaMines = context.novaMines;
    let firstKeptIndex = this.enemyBullets.length;

    for (let i = this.enemyBullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.enemyBullets[i];
      bullet.update(dt, this);
      let keepBullet = !bullet.expired;

      if (bullet.expired) {
        keepBullet = false;
      }

      if (keepBullet && this.energyAbsorbsEnemyBullet(bullet, energyAbsorbers)) {
        this.burst(bullet.x, bullet.y, "#55f0ff", 5);
        keepBullet = false;
      }

      const mineIndex = keepBullet ? this.findNovaMineHitIndex(bullet, novaMines) : -1;
      if (mineIndex >= 0) {
        this.detonateNovaMine(novaMines[mineIndex], novaMines, mineIndex);
        keepBullet = false;
      }

      const bulletHitRadius = bullet.hitRadius ?? bullet.radius;
      if (
        keepBullet &&
        CollisionQuery.overlaps(bullet, this.player, { aRadius: bulletHitRadius, bRadius: playerHitRadius })
      ) {
        this.player.hit(this, bullet.damage || BALANCE.enemyFallbackDamage);
        keepBullet = false;
      }

      if (keepBullet) {
        firstKeptIndex -= 1;
        this.enemyBullets[firstKeptIndex] = bullet;
      }
    }

    EntityStore.compactKeptTail(this.enemyBullets, firstKeptIndex);
  }

  buildProjectileCollisionContext() {
    const context = this.projectileCollisionContext;
    const energyAbsorbers = context.energyAbsorbers;
    const novaMines = context.novaMines;

    energyAbsorbers.length = 0;
    novaMines.length = 0;
    for (const bullet of this.bullets) {
      if (bullet.kind === "energy" && (bullet.absorbLevel ?? 0) > 0) {
        energyAbsorbers.push(bullet);
      } else if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) {
        novaMines.push(bullet);
      }
    }

    return context;
  }

  energyAbsorbsEnemyBullet(enemyBullet, energyAbsorbers) {
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

  novaMines() {
    return this.projectileCollisionContext.novaMines;
  }

  novaMineCount() {
    return this.projectileCollisionContext.novaMines.length;
  }

  findNovaMineHitIndex(projectile, mines = this.novaMines()) {
    if (!mines || mines.length <= 0) return -1;

    const radius = projectile.hitRadius ?? projectile.radius;
    return CollisionQuery.findFirstOverlap(mines, projectile, { targetRadius: radius }).index;
  }

  resolveNovaMineEnemyTrigger(enemy, mines) {
    const enemyTriggerRadius = enemy.blastHitRadius();
    const { entity: mine } = CollisionQuery.findFirstOverlap(mines, enemy, { targetRadius: enemyTriggerRadius });
    if (!mine) return false;

    this.detonateNovaMine(mine, mines);
    return true;
  }

  detonateNovaMine(mine, mineCache = null, mineCacheIndex = -1) {
    if (!mine) return;

    const index = this.bullets.indexOf(mine);
    if (index >= 0) EntityStore.removeAtUnordered(this.bullets, index);
    if (mineCache) {
      const cacheIndex = mineCacheIndex >= 0 ? mineCacheIndex : mineCache.indexOf(mine);
      if (cacheIndex >= 0) EntityStore.removeAtUnordered(mineCache, cacheIndex);
    }

    this.spawnNovaExplosion(
      mine.x,
      mine.y,
      mine.blastRadius,
      Math.ceil(mine.damage * BALANCE.novaExplosionDamageRatio),
      mine.blastDuration
    );
  }

  updateItems(dt) {
    let firstKeptIndex = this.items.length;
    const pickupRadius = this.player.pickupRadius ?? this.player.bodyRadius;

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      item.update(dt, this);
      if (item.expired) continue;

      if (CollisionQuery.overlaps(item, this.player, { aRadius: item.radius, bRadius: pickupRadius })) {
        this.player.collect(item, this);
        continue;
      }

      firstKeptIndex -= 1;
      this.items[firstKeptIndex] = item;
    }

    EntityStore.compactKeptTail(this.items, firstKeptIndex);
  }

  updateEnemies(dt, collisionContext = null) {
    const novaMines = collisionContext?.novaMines || this.novaMines();
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.update(dt, this);

      if (enemy.escaped) {
        EntityStore.removeAtUnordered(this.enemies, i);
        if (enemy.isBoss) this.bossCount = Math.max(0, this.bossCount - 1);
        continue;
      }

      if (novaMines.length > 0 && this.resolveNovaMineEnemyTrigger(enemy, novaMines)) {
        continue;
      }

      if (enemy.collidesWithPlayer(this.player)) {
        EntityStore.removeAtUnordered(this.enemies, i);
        if (enemy.isBoss) this.bossCount = Math.max(0, this.bossCount - 1);
        this.player.hit(this, enemy.isBoss ? BALANCE.bossCollisionDamage : BALANCE.enemyCollisionDamage);
        continue;
      }

      this.resolveEnemyBulletHits(enemy, i);
    }
  }

  resolveEnemyBulletHits(enemy, enemyIndex) {
    for (let j = this.bullets.length - 1; j >= 0; j -= 1) {
      const bullet = this.bullets[j];
      if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) continue;
      if (!bullet.canHit(enemy)) continue;
      if (!enemy.hitBy(bullet)) continue;

      bullet.markHit(enemy);
      const hitResult = enemy.receiveHit(bullet);
      this.burst(bullet.x, bullet.y, hitResult.color, hitResult.burst);

      if (bullet.blastRadius > 0) {
        if (bullet.kind === "nova") {
          this.spawnNovaExplosion(
            bullet.x,
            bullet.y,
            bullet.blastRadius,
            Math.ceil(bullet.damage * BALANCE.novaExplosionDamageRatio),
            bullet.blastDuration
          );
        } else {
          this.damageEnemiesInRadius(bullet.x, bullet.y, bullet.blastRadius, Math.ceil(bullet.damage * 0.55), enemy);
        }
      }

      if (bullet.pierce > 0) {
        bullet.pierce -= 1;
      } else {
        EntityStore.removeAtUnordered(this.bullets, j);
      }

      if (enemy.health <= 0) {
        this.destroyEnemy(enemy);
      }
      return;
    }
  }

  damageEnemiesInRadius(x, y, radius, damage, sourceEnemy) {
    this.burst(x, y, "#ff8f5a", 14);
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (enemy === sourceEnemy) continue;
      if (!CollisionQuery.overlaps(enemy, { x, y, radius }, { aRadius: enemy.blastHitRadius(), bRadius: radius })) continue;

      this.damageEnemy(enemy, damage, "#ffb17d", 6);
    }
  }

  spawnNovaExplosion(x, y, radius, damage, duration = null) {
    this.world.add(
      EntityGroups.effects,
      new NovaExplosion({ x, y, radius, damage, duration: duration ?? BALANCE.novaExplosionDuration })
    );
    this.burst(x, y, "#ff8f5a", 24);
  }

  updateExplosions(dt) {
    let firstKeptIndex = this.explosions.length;
    for (let i = this.explosions.length - 1; i >= 0; i -= 1) {
      const explosion = this.explosions[i];
      explosion.update(dt, this);
      if (!explosion.expired) {
        firstKeptIndex -= 1;
        this.explosions[firstKeptIndex] = explosion;
      }
    }

    EntityStore.compactKeptTail(this.explosions, firstKeptIndex);
  }

  damageEnemy(enemy, damage, burstColor = "#ffb17d", burstCount = 6) {
    if (!this.enemies.includes(enemy)) return false;

    const hitResult = enemy.receiveDamage(damage, { color: burstColor, burst: burstCount });
    this.burst(enemy.x, enemy.y, hitResult.color, hitResult.burst);
    if (hitResult.damage > 0 && enemy.health <= 0) {
      return this.destroyEnemy(enemy);
    }

    return false;
  }

  destroyEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index < 0) return false;

    if (enemy.isBoss) this.bossCount = Math.max(0, this.bossCount - 1);
    SpecialSystem.awardKill(this.player, enemy);
    this.state.kills += 1;
    this.state.score += Game.enemyScore(enemy, this.state.danger);
    this.dropItemFromEnemy(enemy);
    if (enemy.role === "splitter") this.spawnEnemyChildren(enemy);
    if (enemy.role === "boss") this.advanceStage();
    this.burst(
      enemy.x,
      enemy.y,
      enemy.color,
      enemy.maxHealth > GAME_CONFIG.enemyDestruction.eliteHealthThreshold
        ? GAME_CONFIG.enemyDestruction.eliteBurstCount
        : GAME_CONFIG.enemyDestruction.normalBurstCount
    );
    EntityStore.removeAtUnordered(this.enemies, index);
    return true;
  }

  dropItemFromEnemy(enemy) {
    if (this.items.length >= GAME_CONFIG.items.maxOnField) return false;

    const chance = Game.enemyItemDropChance(enemy, this.state.danger);
    if (Math.random() > chance) return false;

    this.spawnItem({ x: enemy.x, y: enemy.y });
    return true;
  }

  static enemyItemDropChance(enemy, danger = 0) {
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

  updateParticles(dt) {
    let firstKeptIndex = this.particles.length;
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.update(dt);
      if (particle.life > 0) {
        firstKeptIndex -= 1;
        this.particles[firstKeptIndex] = particle;
      }
    }

    EntityStore.compactKeptTail(this.particles, firstKeptIndex);
  }

  static compactKeptTail(array, firstKeptIndex) {
    return EntityStore.compactKeptTail(array, firstKeptIndex);
  }

  static removeAtUnordered(array, index) {
    return EntityStore.removeAtUnordered(array, index);
  }

  static removeReference(array, item) {
    return EntityStore.removeReference(array, item);
  }

  static createSurface(surfaceOrCanvas) {
    if (surfaceOrCanvas?.canvas && surfaceOrCanvas?.context) {
      return surfaceOrCanvas;
    }

    if (!surfaceOrCanvas || typeof surfaceOrCanvas.getContext !== "function") {
      throw new Error("Game requires a valid canvas element or CanvasSurface");
    }

    if (typeof CanvasSurface === "function") {
      return new CanvasSurface(surfaceOrCanvas, {
        width: PLAYFIELD.width,
        height: PLAYFIELD.height,
        dprFallback: GAME_CONFIG.dprFallback,
      });
    }

    const context = surfaceOrCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || GAME_CONFIG.dprFallback;
    surfaceOrCanvas.width = PLAYFIELD.width * dpr;
    surfaceOrCanvas.height = PLAYFIELD.height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      canvas: surfaceOrCanvas,
      context,
      dpr,
      width: PLAYFIELD.width,
      height: PLAYFIELD.height,
    };
  }

  draw(dt) {
    this.background.draw(this.ctx, dt, this.state.time);
    this.drawProjectiles();
    this.player.draw(this.ctx, this.state.time);
    this.player.drawDrones(this.ctx, this.state.time);
    for (const item of this.items) item.draw(this.ctx);
    for (const enemy of this.enemies) enemy.draw(this.ctx);
    for (const explosion of this.explosions) explosion.draw(this.ctx);
    for (const particle of this.particles) particle.draw(this.ctx);
    GameHud.draw(this.ctx, this);
    this.drawOverlay();
  }

  drawProjectiles() {
    this.ctx.save();
    this.ctx.shadowBlur = 12;
    for (const bullet of this.bullets) bullet.draw(this.ctx);
    for (const bullet of this.enemyBullets) bullet.draw(this.ctx);
    this.ctx.restore();
  }

  drawOverlay() {
    if (this.state.mode === "running") return;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(5, 7, 16, 0.68)";
    this.ctx.fillRect(0, 0, PLAYFIELD.width, PLAYFIELD.height);
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#f6fbff";
    this.ctx.font = "800 38px Segoe UI, Noto Sans KR, sans-serif";
    const titleByMode = {
      ready: "GALAXY RUNNER",
      paused: "PAUSED",
      gameover: "MISSION FAILED",
    };
    this.ctx.fillText(titleByMode[this.state.mode] || "GALAXY RUNNER", PLAYFIELD.width / 2, PLAYFIELD.height / 2 - 42);
    this.ctx.font = "600 18px Segoe UI, Noto Sans KR, sans-serif";
    this.ctx.fillStyle = "rgba(239, 250, 255, 0.82)";
    const subtitleByMode = {
      ready: "Break upward",
      paused: "P / Esc to resume",
      gameover: `Distance ${Math.floor(this.state.distance)}m / Score ${Math.floor(this.state.score)} / Continue ${this.state.continues}`,
    };
    this.ctx.fillText(subtitleByMode[this.state.mode] || "", PLAYFIELD.width / 2, PLAYFIELD.height / 2 - 5);
    this.ctx.fillStyle = "#8fe7ff";
    const actionByMode = {
      ready: "Space",
      paused: "Paused",
      gameover: "Space Continue / R Restart",
    };
    this.ctx.fillText(actionByMode[this.state.mode] || "Space", PLAYFIELD.width / 2, PLAYFIELD.height / 2 + 38);
    if (this.state.mode === "paused") {
      if (this.infoPanelOpen) this.drawGameInfoPanel();
      this.drawGameInfoButton();
    }
    this.ctx.restore();
  }

  drawGameInfoButton() {
    const button = GAME_INFO_CONFIG.button;
    this.ctx.save();
    this.ctx.fillStyle = this.infoPanelOpen ? "rgba(154, 248, 255, 0.26)" : "rgba(154, 248, 255, 0.12)";
    this.ctx.strokeStyle = this.infoPanelOpen ? "rgba(154, 248, 255, 0.74)" : "rgba(154, 248, 255, 0.42)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(button.x, button.y, button.width, button.height, button.radius);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    this.ctx.fillStyle = "#f6fbff";
    this.ctx.fillText(this.infoPanelOpen ? button.closeLabel : button.label, button.x + button.width / 2, button.y + button.height / 2);
    this.ctx.restore();
  }

  drawGameInfoPanel() {
    const panel = GAME_INFO_CONFIG.panel;
    this.ctx.save();
    this.ctx.fillStyle = panel.background;
    this.ctx.strokeStyle = panel.border;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(panel.x, panel.y, panel.width, panel.height, panel.radius);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = panel.titleColor;
    this.ctx.font = panel.titleFont;
    this.ctx.fillText(GAME_INFO.title, PLAYFIELD.width / 2, panel.titleY);

    for (let index = 0; index < GAME_INFO.ships.length; index += 1) {
      this.drawShipInfoCard(GAME_INFO.ships[index], index);
    }

    this.drawItemInfoGrid();

    this.ctx.textAlign = "center";
    this.ctx.font = panel.hintFont;
    this.ctx.fillStyle = panel.hintColor;
    this.ctx.fillText(GAME_INFO.hint, PLAYFIELD.width / 2, panel.y + panel.height - 24);
    this.ctx.restore();
  }

  drawShipInfoCard(ship, index) {
    const cards = GAME_INFO_CONFIG.shipCards;
    const x = cards.x + index * (cards.width + cards.gap);
    const y = cards.y;

    this.ctx.save();
    this.ctx.fillStyle = cards.cardBackground;
    this.ctx.strokeStyle = ship.color;
    this.ctx.globalAlpha = 0.92;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, cards.width, cards.height, 14);
    this.ctx.fill();
    this.ctx.globalAlpha = 0.44;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;

    this.ctx.textAlign = "center";
    this.ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    this.ctx.fillStyle = ship.color;
    this.ctx.fillText(ship.name, x + cards.width / 2, y + cards.titleY);

    this.ctx.save();
    this.ctx.translate(x + cards.width / 2, y + cards.previewY);
    const previewScale = cards.previewScaleByKind[ship.kind] ?? 1;
    const drewShip = this.player.finalShips.draw(this.ctx, ship.kind, WeaponCatalog.maxLevel(ship.kind), cards.previewSize * previewScale);
    if (!drewShip) {
      ItemIconRenderer.draw(this.ctx, ship.kind, 0, 0, ship.color, { size: cards.previewSize * previewScale * 0.5 });
    }
    this.ctx.restore();

    for (let tagIndex = 0; tagIndex < ship.tags.length; tagIndex += 1) {
      const tagY = y + cards.tagStartY + tagIndex * cards.tagGap;
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      this.ctx.beginPath();
      this.ctx.roundRect(x + 18, tagY - cards.tagHeight + 3, cards.width - 36, cards.tagHeight, 8);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = GAME_INFO_CONFIG.panel.bodyColor;
      this.ctx.font = GAME_INFO_CONFIG.panel.bodyFont;
      this.ctx.fillText(ship.tags[tagIndex], x + cards.width / 2, tagY);
    }
    this.ctx.restore();
  }

  drawItemInfoGrid() {
    const grid = GAME_INFO_CONFIG.itemGrid;
    this.ctx.save();
    this.ctx.textAlign = "left";
    this.ctx.font = GAME_INFO_CONFIG.panel.sectionFont;
    this.ctx.fillStyle = GAME_INFO_CONFIG.panel.sectionColor;
    this.ctx.fillText(GAME_INFO.itemTitle, grid.titleX, grid.titleY);

    for (let index = 0; index < GAME_INFO.items.length; index += 1) {
      const item = GAME_INFO.items[index];
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const x = grid.x + column * (grid.width + grid.gapX);
      const y = grid.y + row * (grid.height + grid.gapY);

      this.ctx.fillStyle = grid.cardBackground;
      this.ctx.strokeStyle = grid.cardBorder;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, grid.width, grid.height, 12);
      this.ctx.fill();
      this.ctx.stroke();

      ItemIconRenderer.draw(this.ctx, item.kind, x + grid.iconX, y + grid.iconY, item.color, { size: grid.iconSize });

      this.ctx.textAlign = "left";
      this.ctx.font = GAME_INFO_CONFIG.panel.bodyFont;
      this.ctx.fillStyle = item.color;
      this.ctx.fillText(item.name, x + grid.textX, y + grid.nameY);
      this.ctx.fillStyle = GAME_INFO_CONFIG.panel.bodyColor;
      this.ctx.fillText(item.effect, x + grid.textX, y + grid.effectY);
    }

    this.ctx.restore();
  }

  static pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  static enemyScore(enemy, danger) {
    const roleScore = GAME_CONFIG.scoring.enemyRoleScore;
    const baseScore = enemy.scoreValue ?? roleScore[enemy.role] ?? roleScore.fallback;
    const dangerMultiplier = 1 + Math.floor(danger) * GAME_CONFIG.scoring.enemyDangerMultiplierPerLevel;
    return Math.ceil(baseScore * dangerMultiplier);
  }

  frame(frameState = {}) {
    if (!this.ctx || !this.state) {
      return;
    }

    const dt = clampNumber(
      Number.isFinite(frameState.deltaSeconds) ? frameState.deltaSeconds : 0,
      0,
      GAME_CONFIG.maxFrameDelta
    );
    this.frameDeltaSeconds = dt;
    try {
      if (dt > 0) {
        this.update(dt);
      }
      this.draw(dt);
    } finally {
      this.input?.endFrame?.();
    }
  }
}
