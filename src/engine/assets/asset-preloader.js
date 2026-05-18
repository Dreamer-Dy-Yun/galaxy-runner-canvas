// Galaxy Runner - asset preloader
// Adds decode-aware preload helpers around the active AssetLoader implementation.

(() => {
  if (globalThis.AssetPreloader) return;

  const decodePromises = new WeakMap();

  function decode(image) {
    if (!image || typeof image !== "object") return Promise.resolve(image);
    if (decodePromises.has(image)) return decodePromises.get(image);

    const promise =
      typeof image.decode === "function"
        ? image.decode().catch(() => image).then(() => image)
        : Promise.resolve(image);
    decodePromises.set(image, promise);
    return promise;
  }

  function scheduleBatch(work, delayMs = 0) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(work, { timeout: Math.max(500, delayMs) });
      return;
    }
    setTimeout(() => work({ timeRemaining: () => 8, didTimeout: true }), delayMs);
  }

  function patch(loader) {
    if (!loader || loader.__decodePreloaderPatched || typeof loader.image !== "function") return loader;

    const originalImage = loader.image.bind(loader);
    loader.image = (src) => {
      const image = originalImage(src);
      decode(image);
      return image;
    };

    loader.decode = decode;
    loader.preloadImages = (sources, { batchSize = 4, delayMs = 0 } = {}) =>
      preloadImages(loader, sources, { batchSize, delayMs });
    loader.__decodePreloaderPatched = true;
    return loader;
  }

  function preloadImages(loader, sources, { batchSize = 4, delayMs = 0 } = {}) {
    const queue = Array.from(new Set((sources || []).filter((src) => typeof src === "string" && src.length > 0)));
    const decoded = [];

    return new Promise((resolve) => {
      const run = (deadline = null) => {
        let count = 0;
        while (
          queue.length > 0 &&
          count < batchSize &&
          (!deadline || deadline.didTimeout || deadline.timeRemaining() > 3)
        ) {
          const image = loader.image(queue.shift());
          decoded.push(decode(image));
          count += 1;
        }

        if (queue.length > 0) {
          scheduleBatch(run, delayMs);
          return;
        }

        Promise.allSettled(decoded).then(() => resolve());
      };

      scheduleBatch(run, delayMs);
    });
  }

  globalThis.AssetPreloader = {
    decode,
    patch,
    preloadImages: (sources, options) => preloadImages(globalThis.AssetLoader, sources, options),
  };

  patch(globalThis.AssetLoader);
})();
