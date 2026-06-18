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
    return GameSessionSystem.handleAction(this, action);
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
    GameSessionSystem.start(this);
  }

  continueRun() {
    GameSessionSystem.continueRun(this);
  }

  clearDangerField() {
    GameSessionSystem.clearDangerField(this);
  }

  togglePause() {
    GameSessionSystem.togglePause(this);
  }

  handleCanvasClick(event) {
    GameSessionSystem.handleCanvasClick(this, event);
  }

  addBullet(x, y, vx, vy, radius, damage, color, kind = "bolt", options = {}) {
    ProjectileLifecycleSystem.addFriendlyProjectile(this, x, y, vx, vy, radius, damage, color, kind, options);
  }

  registerEnemy(enemy) {
    if (enemy?.isBoss) this.bossCount += 1;
    this.world.add(EntityGroups.actors, enemy);
  }

  burst(x, y, color, count = 10) {
    EffectLifecycleSystem.burst(this, x, y, color, count);
  }

  spawnEnemy() {
    return EnemySpawnSystem.spawnEnemy(this);
  }

  spawnMidBoss() {
    return EnemySpawnSystem.spawnMidBoss(this);
  }

  spawnBoss() {
    return EnemySpawnSystem.spawnBoss(this);
  }

  advanceStage() {
    return EnemySpawnSystem.advanceStage(this);
  }

  spawnEnemyChildren(source, role = ENEMY_CONFIG.splitter.childRole, count = ENEMY_CONFIG.splitter.childCount) {
    return EnemySpawnSystem.spawnEnemyChildren(this, source, role, count);
  }

  hasBossEnemy() {
    return EnemySpawnSystem.hasBossEnemy(this);
  }

  spawnItem(options = {}) {
    return CollectibleLifecycleSystem.spawnItem(this, options);
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
    GameLoopSystem.update(this, dt);
  }

  updateProjectiles(dt, collisionContext = null) {
    ProjectileLifecycleSystem.update(this, dt, collisionContext);
  }

  updatePlayerProjectiles(dt) {
    ProjectileLifecycleSystem.updatePlayerProjectiles(this, dt);
  }

  resolveExpiredPlayerProjectile(projectile) {
    ProjectileLifecycleSystem.resolveExpiredPlayerProjectile(this, projectile);
  }

  releaseEnergyCore(core) {
    ProjectileLifecycleSystem.releaseEnergyCore(this, core);
  }

  updateEnemyProjectiles(dt, collisionContext = null) {
    ProjectileLifecycleSystem.updateEnemyProjectiles(this, dt, collisionContext);
  }

  buildProjectileCollisionContext() {
    return ProjectileLifecycleSystem.buildCollisionContext(this);
  }

  energyAbsorbsEnemyBullet(enemyBullet, energyAbsorbers) {
    return ProjectileLifecycleSystem.energyAbsorbsEnemyBullet(enemyBullet, energyAbsorbers);
  }

  novaMines() {
    return ProjectileLifecycleSystem.novaMines(this);
  }

  novaMineCount() {
    return ProjectileLifecycleSystem.novaMineCount(this);
  }

  findNovaMineHitIndex(projectile, mines = this.novaMines()) {
    return ProjectileLifecycleSystem.findNovaMineHitIndex(this, projectile, mines);
  }

  resolveNovaMineEnemyTrigger(enemy, mines) {
    return ProjectileLifecycleSystem.resolveNovaMineEnemyTrigger(this, enemy, mines);
  }

  detonateNovaMine(mine, mineCache = null, mineCacheIndex = -1) {
    ProjectileLifecycleSystem.detonateNovaMine(this, mine, mineCache, mineCacheIndex);
  }

  updateItems(dt) {
    CollectibleLifecycleSystem.update(this, dt);
  }

  updateEnemies(dt, collisionContext = null) {
    EnemyLifecycleSystem.update(this, dt, collisionContext);
  }

  resolveEnemyBulletHits(enemy) {
    return EnemyLifecycleSystem.resolvePlayerProjectileHits(this, enemy);
  }

  damageEnemiesInRadius(x, y, radius, damage, sourceEnemy) {
    return EnemyLifecycleSystem.damageEnemiesInRadius(this, x, y, radius, damage, sourceEnemy);
  }

  spawnNovaExplosion(x, y, radius, damage, duration = null) {
    ProjectileLifecycleSystem.spawnNovaExplosion(this, x, y, radius, damage, duration);
  }

  updateExplosions(dt) {
    EffectLifecycleSystem.updateExplosions(this, dt);
  }

  damageEnemy(enemy, damage, burstColor = "#ffb17d", burstCount = 6) {
    return EnemyLifecycleSystem.damageEnemy(this, enemy, damage, burstColor, burstCount);
  }

  destroyEnemy(enemy) {
    return EnemyLifecycleSystem.destroyEnemy(this, enemy);
  }

  dropItemFromEnemy(enemy) {
    return EnemyLifecycleSystem.dropItemFromEnemy(this, enemy);
  }

  static enemyItemDropChance(enemy, danger = 0) {
    return EnemyLifecycleSystem.itemDropChance(enemy, danger);
  }

  updateParticles(dt) {
    EffectLifecycleSystem.updateParticles(this, dt);
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
    GameSceneRenderer.draw(this.ctx, this, dt);
  }

  drawProjectiles() {
    GameSceneRenderer.drawProjectiles(this.ctx, this);
  }

  static enemyScore(enemy, danger) {
    return EnemyLifecycleSystem.score(enemy, danger);
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
