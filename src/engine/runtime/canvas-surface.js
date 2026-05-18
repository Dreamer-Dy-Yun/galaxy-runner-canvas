// Galaxy Runner - canvas surface
// Owns canvas context creation and device-pixel-ratio sizing for renderable scenes.

(() => {
  class CanvasSurface {
    constructor(
      canvas,
      {
        width,
        height,
        dpr = null,
        dprFallback = 1,
        contextType = "2d",
        contextOptions = undefined,
      } = {}
    ) {
      if (!canvas || typeof canvas.getContext !== "function") {
        throw new Error("CanvasSurface requires a valid canvas element");
      }

      const context = canvas.getContext(contextType, contextOptions);
      if (!context) {
        throw new Error(`CanvasSurface failed to create a ${contextType} context`);
      }

      this.canvas = canvas;
      this.context = context;
      this.width = width;
      this.height = height;
      this.dprFallback = dprFallback;
      this.dpr = this.resolveDpr(dpr);
      this.resize(width, height, this.dpr);
    }

    resolveDpr(dpr = null) {
      if (Number.isFinite(dpr) && dpr > 0) return dpr;
      if (Number.isFinite(globalThis.devicePixelRatio) && globalThis.devicePixelRatio > 0) {
        return globalThis.devicePixelRatio;
      }
      return Number.isFinite(this.dprFallback) && this.dprFallback > 0 ? this.dprFallback : 1;
    }

    resize(width = this.width, height = this.height, dpr = this.resolveDpr()) {
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        throw new Error("CanvasSurface.resize requires positive width and height");
      }

      this.width = width;
      this.height = height;
      this.dpr = Number.isFinite(dpr) && dpr > 0 ? dpr : this.resolveDpr();
      this.canvas.width = Math.round(width * this.dpr);
      this.canvas.height = Math.round(height * this.dpr);
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      return this;
    }

    clear() {
      this.context.clearRect(0, 0, this.width, this.height);
    }
  }

  globalThis.CanvasSurface = CanvasSurface;
})();
