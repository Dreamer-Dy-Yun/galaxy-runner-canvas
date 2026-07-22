// Galaxy Runner - player renderer
// Keeps player visual ordering separate from gameplay state.

class PlayerRenderer {
  static draw(player, ctx, time) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.visualScale, player.visualScale);
    player.applyBankProjection(ctx);

    if (player.invincible > 0 && Math.floor(player.invincible * PLAYER_CONFIG.visual.invincibleBlinkRate) % 2 === 0) {
      ctx.globalAlpha = PLAYER_CONFIG.visual.invincibleAlpha;
    }

    player.drawShield(ctx, time);
    player.drawSpecialReadyEffect(ctx, time);
    player.drawThrusterAnimation(ctx, time);
    player.drawPlayerShip(ctx, time);
    ctx.restore();
  }
}
