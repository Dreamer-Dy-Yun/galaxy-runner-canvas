// Galaxy Runner - entity groups
// Names common world buckets without assigning game-specific behavior to them.

(() => {
  const EntityGroups = Object.freeze({
    actors: "actors",
    collectibles: "collectibles",
    effects: "effects",
    friendlyProjectiles: "friendlyProjectiles",
    hostileProjectiles: "hostileProjectiles",
    particles: "particles",
  });

  globalThis.EntityGroups = EntityGroups;
})();
