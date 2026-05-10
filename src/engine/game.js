// Galaxy Runner - game
// Split from the original single-file prototype so each system can evolve independently.

class Game {
  constructor(canvas, restartButton) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = window.devicePixelRatio || GAME_CONFIG.dprFallback;
    this.canvas.width = PLAYFIELD.width * this.dpr;
    this.canvas.height = PLAYFIELD.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.input = new InputController(this, restartButton);
    this.background = new SpaceBackground();
    this.startupPicker = DEV_TOOLS.finalShipStartupPicker ? new FinalShipStartupPicker() : null;
    this.infoPanelOpen = false;
    this.player = new Player();
    this.reset();
  }

  reset() {
    this.state = { ...GAME_CONFIG.initialState };

    this.player.reset(this.startupProfile());
    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.items = [];
    this.explosions = [];
    this.particles = [];
  }

  start() {
    if (this.state.mode === "gameover") {
      this.continueRun();
      return;
    }
    if (this.state.mode === "ready") {
      if (this.startupPicker) {
        this.player.applyStartupProfile(this.startupProfile());
      }
      this.state.mode = "running";
    }
  }

  continueRun() {
    this.state.continues += 1;
    this.state.mode = GAME_CONFIG.continue.mode;
    this.state.spawnTimer = Math.min(this.state.spawnTimer, -GAME_CONFIG.continue.spawnGraceSeconds);
    this.state.itemTimer = Math.min(this.state.itemTimer, -GAME_CONFIG.continue.itemGraceSeconds);
    this.clearDangerField();
    this.player.continue();
  }

  clearDangerField() {
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.particles = [];
  }

  startupProfile() {
    return this.startupPicker ? this.startupPicker.snapshot() : null;
  }

  togglePause() {
    if (this.state.mode === "running") {
      this.state.mode = "paused";
      this.infoPanelOpen = false;
    } else if (this.state.mode === "paused") {
      this.state.mode = "running";
      this.infoPanelOpen = false;
    }
  }

  handleCanvasClick(event) {
    if (this.state.mode !== "paused") return;

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * PLAYFIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * PLAYFIELD.height;
    if (Game.pointInRect(x, y, GAME_INFO_CONFIG.button)) {
      this.infoPanelOpen = !this.infoPanelOpen;
    }
  }

  addBullet(x, y, vx, vy, radius, damage, color, kind = "bolt", options = {}) {
    this.bullets.push(new Projectile({ x, y, vx, vy, radius, damage, color, kind, ...options }));
  }

  burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new BurstParticle(x, y, color));
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
      this.enemies.push(new Enemy(danger, this.pickEnemyRole(danger)));
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
    this.enemies.push(new Enemy(this.state.danger, "midboss"));
    this.state.nextMidBoss = this.state.time + GAME_CONFIG.bosses.midBossRepeatDelay;
    if (this.state.nextBoss - this.state.nextMidBoss < GAME_CONFIG.bosses.midBossBossGap) {
      this.state.nextMidBoss = this.state.nextBoss + GAME_CONFIG.bosses.midBossAfterBossDelay;
    }
  }

  spawnBoss() {
    this.enemies.push(new Enemy(this.state.danger, "boss", { stage: this.state.stage }));
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
      this.enemies.push(
        new Enemy(this.state.danger, role, {
          x: source.x + (index - centerOffset) * ENEMY_CONFIG.splitter.childXSpread,
          y: source.y + Math.abs(index - centerOffset) * ENEMY_CONFIG.splitter.childYSpread,
        })
      );
    }
    this.burst(source.x, source.y, source.color, ENEMY_CONFIG.splitter.childBurst);
  }

  hasBossEnemy() {
    return this.enemies.some((enemy) => enemy.isBoss);
  }

  spawnItem() {
    this.items.push(new CollectibleItem(CollectibleItem.pickKind(this.player)));
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
    this.updateProjectiles(dt);
    this.updateItems(dt);
    this.updateEnemies(dt);
    this.updateExplosions(dt);
    this.updateParticles(dt);
  }

  updateProjectiles(dt) {
    this.updatePlayerProjectiles(dt);
    this.updateEnemyProjectiles(dt);
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

    Game.compactKeptTail(this.bullets, firstKeptIndex);
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
      if (!Collision.circleCircle(enemy.x, enemy.y, enemy.blastHitRadius(), core.x, core.y, core.releaseRadius)) continue;
      this.damageEnemy(enemy, releaseDamage, core.color, core.releaseHitBurst);
    }
  }

  updateEnemyProjectiles(dt) {
    const collisionContext = this.enemyProjectileCollisionContext();
    const playerHitRadius = this.player.hitRadius ?? this.player.bodyRadius * GAME_CONFIG.projectiles.enemyHitPlayerRadiusScale;
    let firstKeptIndex = this.enemyBullets.length;

    for (let i = this.enemyBullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.enemyBullets[i];
      bullet.update(dt, this);
      let keepBullet = !bullet.expired;

      if (bullet.expired) {
        keepBullet = false;
      }

      if (keepBullet && this.energyAbsorbsEnemyBullet(bullet, collisionContext.energyAbsorbers)) {
        this.burst(bullet.x, bullet.y, "#55f0ff", 5);
        keepBullet = false;
      }

      const mine = keepBullet ? this.findNovaMineHit(bullet, collisionContext.novaMines) : null;
      if (mine) {
        this.detonateNovaMine(mine, collisionContext.novaMines);
        keepBullet = false;
      }

      const bulletHitRadius = bullet.hitRadius ?? bullet.radius;
      if (
        keepBullet &&
        Collision.circleCircle(bullet.x, bullet.y, bulletHitRadius, this.player.x, this.player.y, playerHitRadius)
      ) {
        this.player.hit(this, bullet.damage || BALANCE.enemyFallbackDamage);
        keepBullet = false;
      }

      if (keepBullet) {
        firstKeptIndex -= 1;
        this.enemyBullets[firstKeptIndex] = bullet;
      }
    }

    Game.compactKeptTail(this.enemyBullets, firstKeptIndex);
  }

  enemyProjectileCollisionContext() {
    const energyAbsorbers = [];
    const novaMines = [];

    for (const bullet of this.bullets) {
      if (bullet.kind === "energy" && (bullet.absorbLevel ?? 0) > 0) {
        energyAbsorbers.push(bullet);
      }
      if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) {
        novaMines.push(bullet);
      }
    }

    return { energyAbsorbers, novaMines };
  }

  energyAbsorbsEnemyBullet(enemyBullet, energyAbsorbers) {
    if (!enemyBullet.hostile || energyAbsorbers.length <= 0) return false;

    const enemyRadius = enemyBullet.hitRadius ?? enemyBullet.radius;
    for (const bullet of energyAbsorbers) {
      const absorbLevel = bullet.absorbLevel ?? 0;
      if (enemyBullet.level > absorbLevel) continue;
      const energyRadius = bullet.hitRadius ?? bullet.radius;
      if (Collision.circleCircle(bullet.x, bullet.y, energyRadius, enemyBullet.x, enemyBullet.y, enemyRadius)) {
        bullet.absorbedEnemyBullets += 1;
        return true;
      }
    }

    return false;
  }

  novaMines() {
    const mines = [];
    for (const bullet of this.bullets) {
      if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) mines.push(bullet);
    }
    return mines;
  }

  novaMineCount() {
    let count = 0;
    for (const bullet of this.bullets) {
      if (bullet.kind === SPECIAL_CONFIG.nova.mineKind) count += 1;
    }
    return count;
  }

  findNovaMineHit(projectile, mines = this.novaMines()) {
    const radius = projectile.hitRadius ?? projectile.radius;
    for (const mine of mines) {
      if (Collision.circleCircle(mine.x, mine.y, mine.hitRadius ?? mine.radius, projectile.x, projectile.y, radius)) {
        return mine;
      }
    }
    return null;
  }

  resolveNovaMineEnemyTrigger(enemy, mines) {
    const enemyTriggerRadius = enemy.blastHitRadius();
    let mine = null;
    for (const candidate of mines) {
      if (Collision.circleCircle(candidate.x, candidate.y, candidate.hitRadius ?? candidate.radius, enemy.x, enemy.y, enemyTriggerRadius)) {
        mine = candidate;
        break;
      }
    }
    if (!mine) return false;

    this.detonateNovaMine(mine, mines);
    return true;
  }

  detonateNovaMine(mine, mineCache = null) {
    const index = this.bullets.indexOf(mine);
    if (index >= 0) this.bullets.splice(index, 1);
    if (mineCache) Game.removeReference(mineCache, mine);
    this.spawnNovaExplosion(
      mine.x,
      mine.y,
      mine.blastRadius,
      Math.ceil(mine.damage * BALANCE.novaExplosionDamageRatio),
      mine.blastDuration
    );
  }

  updateItems(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      item.update(dt, this);
      if (item.expired) {
        this.items.splice(i, 1);
        continue;
      }
      const pickupRadius = this.player.pickupRadius ?? this.player.bodyRadius;
      if (Collision.circleCircle(item.x, item.y, item.radius, this.player.x, this.player.y, pickupRadius)) {
        this.player.collect(item, this);
        this.items.splice(i, 1);
      }
    }
  }

  updateEnemies(dt) {
    const novaMines = this.novaMines();
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.update(dt, this);

      if (enemy.escaped) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (novaMines.length > 0 && this.resolveNovaMineEnemyTrigger(enemy, novaMines)) {
        continue;
      }

      if (enemy.collidesWithPlayer(this.player)) {
        this.enemies.splice(i, 1);
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
        this.bullets.splice(j, 1);
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
      if (!Collision.circleCircle(enemy.x, enemy.y, enemy.blastHitRadius(), x, y, radius)) continue;

      this.damageEnemy(enemy, damage, "#ffb17d", 6);
    }
  }

  spawnNovaExplosion(x, y, radius, damage, duration = null) {
    this.explosions.push(new NovaExplosion({ x, y, radius, damage, duration: duration ?? BALANCE.novaExplosionDuration }));
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

    Game.compactKeptTail(this.explosions, firstKeptIndex);
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

    SpecialSystem.awardKill(this.player, enemy);
    this.state.kills += 1;
    this.state.score += Game.enemyScore(enemy, this.state.danger);
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
    this.enemies.splice(index, 1);
    return true;
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

    Game.compactKeptTail(this.particles, firstKeptIndex);
  }

  static compactKeptTail(array, firstKeptIndex) {
    if (firstKeptIndex <= 0) return;
    array.copyWithin(0, firstKeptIndex);
    array.length -= firstKeptIndex;
  }

  static removeReference(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) array.splice(index, 1);
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
    this.ctx.fillText(this.infoPanelOpen ? "닫기" : button.label, button.x + button.width / 2, button.y + button.height / 2);
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
    const drewShip = this.player.finalShips.draw(this.ctx, ship.kind, WeaponCatalog.maxLevel(ship.kind), cards.previewSize);
    if (!drewShip) {
      ItemIconRenderer.draw(this.ctx, ship.kind, 0, 0, ship.color, { size: cards.previewSize * 0.5 });
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
    this.ctx.fillText("아이템", grid.titleX, grid.titleY);

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

  frame(now) {
    const dt = Math.min((now - (this.lastFrame || now)) / 1000, GAME_CONFIG.maxFrameDelta);
    this.lastFrame = now;
    this.update(dt);
    this.draw(dt);
    requestAnimationFrame((time) => this.frame(time));
  }
}




