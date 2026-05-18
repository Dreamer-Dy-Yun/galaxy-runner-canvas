// Galaxy Runner - world
// Owns entity group stores while leaving game rules in the scene/game layer.

(() => {
  class World {
    constructor({ groups = [] } = {}) {
      this.groups = new Map();
      for (const groupName of groups) {
        this.ensureGroup(groupName);
      }
    }

    ensureGroup(groupName) {
      const name = World.requireGroupName(groupName);
      if (!this.groups.has(name)) {
        this.groups.set(name, new EntityStore());
      }
      return this.groups.get(name);
    }

    setGroup(groupName, items = []) {
      const name = World.requireGroupName(groupName);
      const store = items instanceof EntityStore ? items : new EntityStore(items);
      this.groups.set(name, store);
      return store;
    }

    getGroup(groupName) {
      return this.groups.get(World.requireGroupName(groupName)) ?? null;
    }

    items(groupName) {
      return this.ensureGroup(groupName).items;
    }

    add(groupName, entity) {
      return this.ensureGroup(groupName).add(entity);
    }

    clearGroup(groupName) {
      const store = this.getGroup(groupName);
      if (store) store.clear();
    }

    clear() {
      for (const store of this.groups.values()) {
        store.clear();
      }
    }

    removeAtUnordered(groupName, index) {
      return this.ensureGroup(groupName).removeAtUnordered(index);
    }

    remove(groupName, entity) {
      return this.ensureGroup(groupName).remove(entity);
    }

    static requireGroupName(groupName) {
      if (typeof groupName !== "string" || groupName.trim().length <= 0) {
        throw new TypeError("World group name must be a non-empty string");
      }
      return groupName;
    }
  }

  globalThis.World = World;
})();
