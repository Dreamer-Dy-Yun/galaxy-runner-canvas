// Immutable rig snapshot validation and structural part diffing.

(() => {
  if (globalThis.PartAssemblyDiff) return;

  const NUMBER_FIELDS = Object.freeze(["x", "y", "rotation", "opacity"]);

  function requireObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`${label} must be an object`);
    }
    return value;
  }

  function requireId(value, label) {
    const id = typeof value === "string" ? value.trim() : "";
    if (!id) throw new TypeError(`${label} must be a non-empty string`);
    return id;
  }

  function finite(value, fallback, label) {
    const resolved = value ?? fallback;
    if (!Number.isFinite(resolved)) throw new TypeError(`${label} must be finite`);
    return resolved;
  }

  function freezeTransform(input = {}, label = "transform") {
    requireObject(input, label);
    const transform = {
      x: finite(input.x, 0, `${label}.x`),
      y: finite(input.y, 0, `${label}.y`),
      rotation: finite(input.rotation, 0, `${label}.rotation`),
      opacity: finite(input.opacity, 1, `${label}.opacity`),
    };
    if (transform.opacity < 0 || transform.opacity > 1) {
      throw new RangeError(`${label}.opacity must be between zero and one`);
    }
    return Object.freeze(transform);
  }

  function freezePivot(input = {}, label = "pivot") {
    requireObject(input, label);
    return Object.freeze({
      x: finite(input.x, 0, `${label}.x`),
      y: finite(input.y, 0, `${label}.y`),
    });
  }

  function freezeTags(input, label) {
    if (input === undefined) return Object.freeze([]);
    if (!Array.isArray(input) || input.some((tag) => typeof tag !== "string" || !tag.trim())) {
      throw new TypeError(`${label} must be an array of non-empty strings`);
    }
    return Object.freeze(input.map((tag) => tag.trim()));
  }

  function normalizePart(input, index) {
    requireObject(input, `Rig part ${index}`);
    const id = requireId(input.id, `Rig part ${index}.id`);
    return Object.freeze({
      id,
      assetKey: requireId(input.assetKey, `Rig part ${id}.assetKey`),
      group: input.group === undefined ? "default" : requireId(input.group, `Rig part ${id}.group`),
      zIndex: finite(input.zIndex, 0, `Rig part ${id}.zIndex`),
      pivot: freezePivot(input.pivot, `Rig part ${id}.pivot`),
      transform: freezeTransform(input.transform, `Rig part ${id}.transform`),
      tags: freezeTags(input.tags, `Rig part ${id}.tags`),
    });
  }

  function sameArray(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function sameRegistration(left, right) {
    return left.assetKey === right.assetKey
      && left.group === right.group
      && left.zIndex === right.zIndex
      && left.pivot.x === right.pivot.x
      && left.pivot.y === right.pivot.y
      && sameArray(left.tags, right.tags);
  }

  function freezeChange(kind, id, from, to) {
    return Object.freeze({ kind, id, from: from || null, to: to || null });
  }

  class PartAssemblyDiff {
    static snapshot(input) {
      requireObject(input, "RigSnapshot");
      if (!Array.isArray(input.parts)) throw new TypeError("RigSnapshot.parts must be an array");
      const id = requireId(input.id, "RigSnapshot.id");
      const seen = new Set();
      const parts = input.parts.map((part, index) => {
        const normalized = normalizePart(part, index);
        if (seen.has(normalized.id)) {
          throw new TypeError(`RigSnapshot ${id} contains duplicate part id: ${normalized.id}`);
        }
        seen.add(normalized.id);
        return normalized;
      });
      return Object.freeze({ id, parts: Object.freeze(parts) });
    }

    static create(fromInput, toInput) {
      const from = PartAssemblyDiff.snapshot(fromInput);
      const to = PartAssemblyDiff.snapshot(toInput);
      const fromById = new Map(from.parts.map((part) => [part.id, part]));
      const toById = new Map(to.parts.map((part) => [part.id, part]));
      const retained = [];
      const added = [];
      const removed = [];
      const replaced = [];

      for (const part of from.parts) {
        const target = toById.get(part.id);
        if (!target) removed.push(freezeChange("removed", part.id, part, null));
        else if (sameRegistration(part, target)) {
          retained.push(freezeChange("retained", part.id, part, target));
        } else replaced.push(freezeChange("replaced", part.id, part, target));
      }
      for (const part of to.parts) {
        if (!fromById.has(part.id)) added.push(freezeChange("added", part.id, null, part));
      }

      const all = Object.freeze([...retained, ...added, ...removed, ...replaced]);
      return Object.freeze({
        from,
        to,
        retained: Object.freeze(retained),
        added: Object.freeze(added),
        removed: Object.freeze(removed),
        replaced: Object.freeze(replaced),
        all,
        changed: added.length + removed.length + replaced.length > 0
          || retained.some((entry) => NUMBER_FIELDS.some(
            (field) => entry.from.transform[field] !== entry.to.transform[field]
          )),
      });
    }

    static transform(input, label) {
      return freezeTransform(input, label);
    }

    static framePart(part, transform, change, role) {
      return Object.freeze({
        renderId: `${part.id}:${role}`,
        id: part.id,
        assetKey: part.assetKey,
        group: part.group,
        zIndex: part.zIndex,
        pivot: part.pivot,
        tags: part.tags,
        transform,
        change,
        role,
      });
    }

    static fromFrame(frame, id) {
      if (!frame || !Array.isArray(frame.parts)) throw new TypeError("Animation frame requires parts");
      const selected = new Map();
      for (const part of frame.parts) {
        const previous = selected.get(part.id);
        if (!previous || part.transform.opacity > previous.transform.opacity) {
          selected.set(part.id, part);
        }
      }
      return PartAssemblyDiff.snapshot({
        id,
        parts: [...selected.values()].map((part) => ({ ...part, transform: part.transform })),
      });
    }
  }

  globalThis.PartAssemblyDiff = PartAssemblyDiff;
})();
