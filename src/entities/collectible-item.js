// Galaxy Runner - item
// Split from the original single-file prototype so each system can evolve independently.

class CollectibleItem {
  constructor(kind, options = {}) {
    this.category = itemCategory(kind);
    this.openingChoice = options.openingChoice === true;
    this.applyKind(kind);
    this.bouncePadding = ITEM_FIELD_CONFIG.bounds.padding + this.radius;
    this.x = randomRange(ITEM_FIELD_CONFIG.spawn.xPadding, PLAYFIELD.width - ITEM_FIELD_CONFIG.spawn.xPadding);
    this.y = randomRange(ITEM_FIELD_CONFIG.spawn.yMin, ITEM_FIELD_CONFIG.spawn.yMax);
    this.vy = randomRange(ITEM_FIELD_CONFIG.velocity.yMin, ITEM_FIELD_CONFIG.velocity.yMax);
    this.vx = randomRange(ITEM_FIELD_CONFIG.velocity.xMin, ITEM_FIELD_CONFIG.velocity.xMax);
    this.pulse = randomRange(0, Math.PI * 2);
    this.age = 0;
    this.morphTimer = this.openingChoice ? Infinity : this.nextMorphDelay();
  }

  applyKind(kind) {
    this.kind = kind;
    const definition = ITEM_DEFINITIONS[kind] || ITEM_DEFINITIONS.bonus;
    this.color = definition.color;
    this.radius = definition.radius ?? ITEM_DEFINITIONS.bonus.radius;
    this.bouncePadding = ITEM_FIELD_CONFIG.bounds.padding + this.radius;
  }

  static pickKind(player = null, category = null, excludeKind = null, routeKind = null) {
    let entries = CollectibleItem.availableDefinitions(player, category, excludeKind, routeKind);
    if (entries.length <= 0 && excludeKind) {
      entries = CollectibleItem.availableDefinitions(player, category, null, routeKind);
    }
    if (entries.length <= 0) return excludeKind || "repair";

    const total = entries.reduce((sum, [, item]) => sum + item.weight, 0);
    let pick = randomRange(0, total);
    for (const [kind, item] of entries) {
      pick -= item.weight;
      if (pick <= 0) return kind;
    }
    return "repair";
  }

  static availableDefinitions(player = null, category = null, excludeKind = null, routeKind = null) {
    return Object.entries(ITEM_DEFINITIONS).filter(([kind, item]) => {
      if (item.spawnable === false || item.weight <= 0) return false;
      if (category && itemCategory(kind) !== category) return false;
      if (kind === excludeKind) return false;
      if (itemCategory(kind) === "weapon" && routeKind && kind !== routeKind) return false;
      if (kind === "shield") return !player || player.maxShield < BALANCE.shieldMax;
      if (kind === "shieldDefense") {
        return !!player && player.maxShield >= BALANCE.shieldMax && player.shieldDefenseLevel < BALANCE.shieldDefenseMaxLevel;
      }
      return true;
    });
  }

  nextMorphDelay() {
    return randomRange(ITEM_FIELD_CONFIG.morph.intervalMin, ITEM_FIELD_CONFIG.morph.intervalMax);
  }

  update(dt, game = null) {
    this.age += dt;
    this.pulse += dt * ITEM_FIELD_CONFIG.pulseSpeed;
    if (this.openingChoice) return;
    this.updateMorph(dt, game);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.bounceWithinField();
  }

  updateMorph(dt, game = null) {
    this.morphTimer -= dt;
    if (this.morphTimer > 0) return;

    const routeKind = RunRules.routeKind(game?.state);
    const nextKind = CollectibleItem.pickKind(game?.player ?? null, this.category, this.kind, routeKind);
    this.applyKind(nextKind);
    this.morphTimer = this.nextMorphDelay();
  }

  bounceWithinField() {
    const minX = this.bouncePadding;
    const maxX = PLAYFIELD.width - this.bouncePadding;
    const minY = this.bouncePadding;
    const maxY = PLAYFIELD.height - this.bouncePadding;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx) * ITEM_FIELD_CONFIG.velocity.bounceRetain;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx) * ITEM_FIELD_CONFIG.velocity.bounceRetain;
    }

    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy) * ITEM_FIELD_CONFIG.velocity.bounceRetain;
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy) * ITEM_FIELD_CONFIG.velocity.bounceRetain;
    }
  }

  get expired() {
    return !this.openingChoice && this.age >= ITEM_FIELD_CONFIG.lifetime;
  }

  get remainingLife() {
    return Math.max(0, ITEM_FIELD_CONFIG.lifetime - this.age);
  }

  get blinkHidden() {
    if (this.openingChoice) return false;
    if (this.remainingLife > ITEM_FIELD_CONFIG.blink.startRemaining) return false;

    const progress = 1 - this.remainingLife / ITEM_FIELD_CONFIG.blink.startRemaining;
    const rate =
      ITEM_FIELD_CONFIG.blink.minRate +
      (ITEM_FIELD_CONFIG.blink.maxRate - ITEM_FIELD_CONFIG.blink.minRate) * clampNumber(progress, 0, 1);
    return Math.sin(this.age * rate) < ITEM_FIELD_CONFIG.blink.visibleThreshold;
  }

  draw(ctx) {
    if (this.blinkHidden) return;

    const visual = ITEM_FIELD_CONFIG.visual;
    const halo = this.radius + visual.haloPadding + Math.sin(this.pulse) * visual.haloPulse;
    ctx.save();
    ctx.globalAlpha = visual.haloAlpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, halo, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = visual.boxFill;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = visual.borderWidth;
    const boxSize = this.radius * visual.boxScale;
    const cornerRadius = Math.max(visual.cornerRadiusMin, this.radius * visual.cornerRadiusScale);
    ctx.beginPath();
    ctx.roundRect(this.x - boxSize / 2, this.y - boxSize / 2, boxSize, boxSize, cornerRadius);
    ctx.fill();
    ctx.stroke();

    ItemIconRenderer.draw(ctx, this.kind, this.x, this.y, this.color, {
      size: this.radius * ITEM_ICON_CONFIG.pickupRadiusScale,
    });
    ctx.restore();
  }
}
