// Galaxy Runner - game scene renderer
// Owns frame draw order for world entities, HUD, and overlays.

class GameSceneRenderer {
  static draw(ctx, game, dt) {
    game.background.draw(ctx, dt, game.state.time);
    GameSceneRenderer.drawProjectiles(ctx, game);
    game.player.draw(ctx, game.state.time);
    game.player.drawDrones(ctx, game.state.time);
    for (const item of game.items) item.draw(ctx);
    for (const enemy of game.enemies) enemy.draw(ctx);
    for (const explosion of game.explosions) explosion.draw(ctx);
    for (const particle of game.particles) particle.draw(ctx);
    GameHud.draw(ctx, game);
    GameOverlay.draw(ctx, game);
  }

  static drawProjectiles(ctx, game) {
    ctx.save();
    ctx.shadowBlur = 12;
    for (const bullet of game.bullets) bullet.draw(ctx);
    for (const bullet of game.enemyBullets) bullet.draw(ctx);
    ctx.restore();
  }
}
