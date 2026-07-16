// Canvas consumer for frozen RigAnimationEngine frame snapshots.

(() => {
  if (globalThis.RigAnimationRenderer) return;

  function defaultReady(image) {
    if (!image) return false;
    if (globalThis.AssetLoader?.ready) return globalThis.AssetLoader.ready(image);
    if ("complete" in image) return image.complete && image.naturalWidth > 0;
    return Number.isFinite(image.width) && image.width > 0;
  }

  class RigAnimationRenderer {
    constructor({ resolveAsset, isAssetReady = defaultReady, onMissingAsset = null } = {}) {
      if (typeof resolveAsset !== "function") {
        throw new TypeError("RigAnimationRenderer requires resolveAsset(assetKey)");
      }
      if (typeof isAssetReady !== "function") {
        throw new TypeError("RigAnimationRenderer.isAssetReady must be a function");
      }
      if (onMissingAsset !== null && typeof onMissingAsset !== "function") {
        throw new TypeError("RigAnimationRenderer.onMissingAsset must be a function");
      }
      this.resolveAsset = resolveAsset;
      this.isAssetReady = isAssetReady;
      this.onMissingAsset = onMissingAsset;
    }

    draw(ctx, frame, options = {}) {
      if (!ctx || typeof ctx.drawImage !== "function") {
        throw new TypeError("RigAnimationRenderer.draw requires a Canvas 2D context");
      }
      if (!frame || !Object.isFrozen(frame) || !Array.isArray(frame.parts)) {
        throw new TypeError("RigAnimationRenderer.draw requires a frozen animation frame");
      }
      const originX = Number.isFinite(options.originX) ? options.originX : 0;
      const originY = Number.isFinite(options.originY) ? options.originY : 0;
      const scale = Number.isFinite(options.scale) && options.scale > 0 ? options.scale : 1;
      const missing = [];
      let drawn = 0;

      for (const part of frame.parts) {
        const image = this.resolveAsset(part.assetKey);
        if (!this.isAssetReady(image, part.assetKey)) {
          const record = Object.freeze({ assetKey: part.assetKey, partId: part.id });
          missing.push(record);
          this.reportMissing(record);
          continue;
        }
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        ctx.save();
        ctx.translate(originX + part.transform.x, originY + part.transform.y);
        ctx.rotate(part.transform.rotation);
        ctx.globalAlpha *= part.transform.opacity;
        ctx.drawImage(
          image,
          -part.pivot.x * scale,
          -part.pivot.y * scale,
          width * scale,
          height * scale
        );
        ctx.restore();
        drawn += 1;
      }

      return Object.freeze({
        drawn,
        missing: Object.freeze(missing),
        degraded: frame.degraded || missing.length > 0,
      });
    }

    reportMissing(record) {
      try {
        this.onMissingAsset?.(record);
      } catch (error) {
        globalThis.console?.error?.("[RigAnimationRenderer] onMissingAsset failed", error);
      }
    }
  }

  globalThis.RigAnimationRenderer = RigAnimationRenderer;
})();
