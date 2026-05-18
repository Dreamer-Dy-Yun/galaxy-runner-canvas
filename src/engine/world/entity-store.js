// Galaxy Runner - entity store
// Owns common mutable collection policies for engine-level entity groups.

(() => {
  class EntityStore {
    constructor(items = []) {
      this.items = Array.isArray(items) ? items : Array.from(items ?? []);
    }

    get length() {
      return this.items.length;
    }

    [Symbol.iterator]() {
      return this.items[Symbol.iterator]();
    }

    at(index) {
      return this.items[index];
    }

    add(entity) {
      this.items.push(entity);
      return entity;
    }

    clear() {
      this.items.length = 0;
    }

    compactKeptTail(firstKeptIndex) {
      return EntityStore.compactKeptTail(this.items, firstKeptIndex);
    }

    removeAtUnordered(index) {
      return EntityStore.removeAtUnordered(this.items, index);
    }

    remove(entity) {
      return EntityStore.removeReference(this.items, entity);
    }

    static compactKeptTail(array, firstKeptIndex) {
      EntityStore.assertArray(array, "compactKeptTail");

      const start = Math.trunc(firstKeptIndex);
      if (!Number.isFinite(start) || start <= 0) return array;
      if (start >= array.length) {
        array.length = 0;
        return array;
      }

      array.copyWithin(0, start);
      array.length -= start;
      return array;
    }

    static removeAtUnordered(array, index) {
      EntityStore.assertArray(array, "removeAtUnordered");

      const targetIndex = Math.trunc(index);
      if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= array.length) return false;

      const lastIndex = array.length - 1;
      if (targetIndex !== lastIndex) array[targetIndex] = array[lastIndex];
      array.length = lastIndex;
      return true;
    }

    static removeReference(array, item) {
      EntityStore.assertArray(array, "removeReference");

      const index = array.indexOf(item);
      if (index < 0) return false;
      return EntityStore.removeAtUnordered(array, index);
    }

    static assertArray(array, operation) {
      if (!Array.isArray(array)) {
        throw new TypeError(`EntityStore.${operation} requires an array`);
      }
    }
  }

  globalThis.EntityStore = EntityStore;
})();
