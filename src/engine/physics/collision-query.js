// Galaxy Runner - collision query
// Provides reusable shape/entity overlap lookups without owning gameplay outcomes.

(() => {
  class CollisionQuery {
    static overlaps(a, b, { aRadius = null, bRadius = null } = {}) {
      if (!a || !b) return false;

      const ax = Number(a.x);
      const ay = Number(a.y);
      const bx = Number(b.x);
      const by = Number(b.y);
      if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) {
        return false;
      }

      return Collision.circleCircle(
        ax,
        ay,
        CollisionQuery.resolveRadius(a, aRadius),
        bx,
        by,
        CollisionQuery.resolveRadius(b, bRadius)
      );
    }

    static findFirstOverlap(collection, target, { entityRadius = null, targetRadius = null } = {}) {
      const items = CollisionQuery.itemsOf(collection);
      if (!items || !target) return { entity: null, index: -1 };

      for (let index = 0; index < items.length; index += 1) {
        const entity = items[index];
        if (CollisionQuery.overlaps(entity, target, { aRadius: entityRadius, bRadius: targetRadius })) {
          return { entity, index };
        }
      }

      return { entity: null, index: -1 };
    }

    static resolveRadius(entity, source = null, fallback = 0) {
      const value =
        typeof source === "function"
          ? source(entity)
          : Number.isFinite(source)
            ? source
            : entity?.hitRadius ?? entity?.radius ?? entity?.bodyRadius ?? fallback;
      const radius = Number(value);
      return Number.isFinite(radius) && radius >= 0 ? radius : fallback;
    }

    static itemsOf(collection) {
      if (Array.isArray(collection)) return collection;
      if (Array.isArray(collection?.items)) return collection.items;
      return null;
    }
  }

  globalThis.CollisionQuery = CollisionQuery;
})();
