// Galaxy Runner - effect lifecycle system
// Owns burst particle creation and visual effect cleanup.

class EffectLifecycleSystem {
  static burst(game, x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      game.world.add(EntityGroups.particles, new BurstParticle(x, y, color));
    }
  }

  static updateExplosions(game, dt) {
    let firstKeptIndex = game.explosions.length;
    for (let i = game.explosions.length - 1; i >= 0; i -= 1) {
      const explosion = game.explosions[i];
      explosion.update(dt, game);
      if (!explosion.expired) {
        firstKeptIndex -= 1;
        game.explosions[firstKeptIndex] = explosion;
      }
    }

    EntityStore.compactKeptTail(game.explosions, firstKeptIndex);
  }

  static updateParticles(game, dt) {
    let firstKeptIndex = game.particles.length;
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const particle = game.particles[i];
      particle.update(dt);
      if (particle.life > 0) {
        firstKeptIndex -= 1;
        game.particles[firstKeptIndex] = particle;
      }
    }

    EntityStore.compactKeptTail(game.particles, firstKeptIndex);
  }
}
