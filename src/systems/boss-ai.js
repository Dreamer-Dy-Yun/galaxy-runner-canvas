// Galaxy Runner - stage boss AI
// Owns boss phase decisions, armor vulnerability, stage attack selection, and boss-specific visuals.

class BossAi {
  constructor(enemy, stage = 1) {
    this.enemy = enemy;
    this.profile = BossAi.profile(stage);
    this.phase = "closed";
    this.phaseTimer = ENEMY_CONFIG.stageBoss.phase.closed;
    this.armorOpenRatio = 0;
    this.focusShotTimer = 0;
    this.summonedThisFocus = false;
    this.aimX = null;
    this.aimY = null;
    this.patternIndex = 0;
    this.lastPattern = this.profile.attack;
  }

  static profile(stage) {
    const stages = ENEMY_CONFIG.stageBoss.stages;
    const normalized = ((Math.max(1, Math.round(stage || 1)) - 1) % stages.length) + 1;
    return stages.find((profile) => profile.stage === normalized) ?? stages[0];
  }

  static armorPanel(damaged = false) {
    return AssetLoader.image(damaged ? ENEMY_CONFIG.stageBoss.armorPanelDamagedSrc : ENEMY_CONFIG.stageBoss.armorPanelSrc);
  }

  static core(stage) {
    const src = ENEMY_CONFIG.stageBoss.coreSrcByStage[stage] ?? ENEMY_CONFIG.stageBoss.coreSrcByStage[1];
    return AssetLoader.image(src);
  }

  static patternGlyph(pattern) {
    const src = ENEMY_CONFIG.stageBoss.patternGlyphSrc[pattern];
    return src ? AssetLoader.image(src) : null;
  }

  applyStats() {
    this.enemy.color = this.profile.color;
    this.enemy.health = Math.round(this.enemy.health * this.profile.healthMultiplier);
    this.enemy.maxHealth = this.enemy.health;
    this.enemy.scoreValue = Math.ceil(this.enemy.scoreValue * this.profile.scoreMultiplier);
  }

  update(dt, game) {
    const phaseConfig = ENEMY_CONFIG.stageBoss.phase;
    this.phaseTimer -= dt;
    this.focusShotTimer -= dt;

    if (this.phase === "opening") {
      this.armorOpenRatio = 1 - clampNumber(this.phaseTimer / phaseConfig.opening, 0, 1);
    } else if (this.phase === "focus") {
      this.armorOpenRatio = 1;
      this.aimX = game.player.x;
      this.aimY = game.player.y;
      if (this.focusShotTimer <= 0) {
        this.firePattern(game);
        this.focusShotTimer = this.profile.fireDelay;
      }
    } else if (this.phase === "closing") {
      this.armorOpenRatio = clampNumber(this.phaseTimer / phaseConfig.closing, 0, 1);
    } else {
      this.armorOpenRatio = 0;
      this.aimX = null;
      this.aimY = null;
    }

    if (this.phaseTimer <= 0) this.advancePhase();
  }

  advancePhase() {
    const phaseConfig = ENEMY_CONFIG.stageBoss.phase;
    if (this.phase === "closed") {
      this.phase = "opening";
      this.phaseTimer = phaseConfig.opening;
    } else if (this.phase === "opening") {
      this.phase = "focus";
      this.phaseTimer = phaseConfig.focus;
      this.focusShotTimer = 0;
      this.summonedThisFocus = false;
    } else if (this.phase === "focus") {
      this.phase = "closing";
      this.phaseTimer = phaseConfig.closing;
      this.aimX = null;
      this.aimY = null;
    } else {
      this.phase = "closed";
      this.phaseTimer = phaseConfig.closed;
      this.armorOpenRatio = 0;
    }
  }

  firePattern(game) {
    this.patternIndex += 1;

    if (this.profile.attack === "lance") {
      if (this.patternIndex % 2 === 0) {
        this.lastPattern = "ring";
        this.enemy.fireBossRing(game);
      } else {
        this.lastPattern = "lance";
        this.enemy.fireSniperShot(game);
      }
      return;
    }

    if (this.profile.attack === "summon" && !this.summonedThisFocus) {
      this.summonedThisFocus = true;
      this.lastPattern = "summon";
      game.spawnEnemyChildren(this.enemy, ENEMY_CONFIG.splitter.childRole, ENEMY_CONFIG.splitter.childCount + 1);
      return;
    }

    if (this.profile.attack === "summon" && this.patternIndex % 3 === 0) {
      this.lastPattern = "curtain";
      this.enemy.fireBossCurtain(game);
      return;
    }

    if (this.patternIndex % 3 === 0) {
      this.lastPattern = "ring";
      this.enemy.fireBossRing(game);
    } else if (this.patternIndex % 2 === 0) {
      this.lastPattern = "curtain";
      this.enemy.fireBossCurtain(game);
    } else {
      this.lastPattern = "focus";
      this.enemy.fireBossPattern(game);
    }
  }

  isVulnerable() {
    return this.phase === "focus";
  }

  blockedHitResult() {
    return { damage: 0, blocked: true, color: this.profile.color, burst: 4 };
  }

  draw(ctx) {
    const enemy = this.enemy;
    const profile = this.profile;
    const armor = ENEMY_CONFIG.stageBoss.armor;
    const core = ENEMY_CONFIG.stageBoss.core;
    const damaged = enemy.health / enemy.maxHealth <= armor.damagedHealthRatio;

    ctx.save();
    ctx.shadowColor = profile.color;
    ctx.shadowBlur = 18;

    ctx.fillStyle = "rgba(8, 12, 24, 0.92)";
    ctx.strokeStyle = profile.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.height * 0.54);
    ctx.lineTo(enemy.width * 0.28, -enemy.height * 0.28);
    ctx.lineTo(enemy.width * 0.34, enemy.height * 0.28);
    ctx.lineTo(0, enemy.height * 0.5);
    ctx.lineTo(-enemy.width * 0.34, enemy.height * 0.28);
    ctx.lineTo(-enemy.width * 0.28, -enemy.height * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.drawCore(ctx, core);
    this.drawPatternGlyph(ctx);
    if (this.isVulnerable()) this.drawFocusWarning(ctx);
    this.drawArmorPanel(ctx, -1, damaged);
    this.drawArmorPanel(ctx, 1, damaged);
    enemy.drawHealthBar(ctx, enemy.height * 0.68, enemy.width * 0.74);
    ctx.restore();
  }

  drawCore(ctx, core) {
    const image = BossAi.core(this.profile.stage);
    const coreAlpha = 0.18 + this.armorOpenRatio * 0.82;

    ctx.save();
    ctx.globalAlpha = coreAlpha;
    if (AssetLoader.ready(image)) {
      ctx.drawImage(image, -core.width / 2, -core.height / 2, core.width, core.height);
    } else {
      ctx.fillStyle = this.profile.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, core.width * 0.32, core.height * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPatternGlyph(ctx) {
    if (this.phase !== "focus") return;

    const image = BossAi.patternGlyph(this.lastPattern);
    if (!image) return;

    const glyph = ENEMY_CONFIG.stageBoss.patternGlyph;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = glyph.alpha * this.armorOpenRatio;
    if (AssetLoader.ready(image)) {
      ctx.drawImage(
        image,
        -glyph.width / 2,
        -glyph.height / 2 + glyph.offsetY,
        glyph.width,
        glyph.height
      );
    } else {
      ctx.strokeStyle = this.profile.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, glyph.offsetY, glyph.width * 0.32, glyph.height * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArmorPanel(ctx, side, damaged) {
    const armor = ENEMY_CONFIG.stageBoss.armor;
    const image = BossAi.armorPanel(damaged);
    const offsetX = armor.closedOffsetX + (armor.openOffsetX - armor.closedOffsetX) * this.armorOpenRatio;

    ctx.save();
    ctx.translate(side * offsetX, armor.offsetY);
    if (side > 0) ctx.scale(-1, 1);
    if (AssetLoader.ready(image)) {
      ctx.drawImage(image, -armor.width / 2, -armor.height / 2, armor.width, armor.height);
    } else {
      ctx.fillStyle = damaged ? "rgba(255, 128, 96, 0.82)" : "rgba(216, 230, 240, 0.82)";
      ctx.beginPath();
      ctx.roundRect(-armor.width / 2, -armor.height / 2, armor.width, armor.height, 16);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFocusWarning(ctx) {
    if (!Number.isFinite(this.aimX) || !Number.isFinite(this.aimY)) return;

    const warning = ENEMY_CONFIG.stageBoss.focusWarning;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255, 244, 198, ${warning.alpha})`;
    ctx.lineWidth = warning.lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, this.enemy.height * 0.2);
    ctx.lineTo(this.aimX - this.enemy.x, this.aimY - this.enemy.y);
    ctx.stroke();
    ctx.restore();
  }
}
