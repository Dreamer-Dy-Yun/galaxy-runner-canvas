// Galaxy Runner - legacy asset loader entrypoint
// Keeps the classic src/core path while exposing the engine AssetLoader contract.

(() => {
  if (globalThis.AssetLoader) return;

  const IMAGE_STATES = Object.freeze({
    loading: "loading",
    loaded: "loaded",
    error: "error",
  });

  class AssetLoader {
    static images = new Map();
    static records = new Map();
    static states = IMAGE_STATES;

    static image(src, options = {}) {
      return AssetLoader.record(src, options).image;
    }

    static load(src, options = {}) {
      const record = AssetLoader.record(src, options);

      if (AssetLoader.ready(record.image)) {
        AssetLoader.markLoaded(record);
        return Promise.resolve(record.image);
      }
      if (record.state === IMAGE_STATES.error && record.error) {
        return Promise.reject(record.error);
      }
      if (record.promise) return record.promise;

      record.promise = new Promise((resolve, reject) => {
        const onLoad = () => {
          cleanup();
          AssetLoader.markLoaded(record);
          resolve(record.image);
        };
        const onError = () => {
          cleanup();
          const error = AssetLoader.markError(record);
          reject(error);
        };
        const cleanup = () => {
          record.image.removeEventListener("load", onLoad);
          record.image.removeEventListener("error", onError);
        };

        record.image.addEventListener("load", onLoad);
        record.image.addEventListener("error", onError);
      });

      return record.promise;
    }

    static preload(manifest = []) {
      const entries = AssetLoader.normalizeManifest(manifest);
      return Promise.all(
        entries.map((entry) =>
          AssetLoader.load(entry.src, entry.options).then(
            (image) => ({ ...entry, image, state: IMAGE_STATES.loaded }),
            (error) => ({ ...entry, error, state: IMAGE_STATES.error })
          )
        )
      );
    }

    static status(src) {
      const key = AssetLoader.requireSrc(src);
      const record = AssetLoader.records.get(key);
      if (!record) return { src: key, state: "missing", ready: false, error: null };
      if (AssetLoader.ready(record.image)) AssetLoader.markLoaded(record);

      return {
        src: key,
        state: record.state,
        ready: record.state === IMAGE_STATES.loaded,
        error: record.error,
      };
    }

    static ready(image) {
      return Boolean(image && image.complete && image.naturalWidth > 0);
    }

    static clear() {
      AssetLoader.images.clear();
      AssetLoader.records.clear();
    }

    static record(src, options = {}) {
      const key = AssetLoader.requireSrc(src);
      let record = AssetLoader.records.get(key);
      if (!record) {
        record = AssetLoader.createRecord(key, options);
        AssetLoader.records.set(key, record);
        AssetLoader.images.set(key, record.image);
      }
      return record;
    }

    static createRecord(src, options = {}) {
      if (typeof Image !== "function") {
        throw new Error("AssetLoader requires browser Image support");
      }

      const image = new Image();
      const record = {
        src,
        image,
        state: IMAGE_STATES.loading,
        error: null,
        promise: null,
      };

      AssetLoader.applyImageOptions(image, options);
      image.addEventListener("load", () => AssetLoader.markLoaded(record));
      image.addEventListener("error", () => AssetLoader.markError(record));
      image.src = src;
      return record;
    }

    static markLoaded(record) {
      record.state = IMAGE_STATES.loaded;
      record.error = null;
      record.promise = null;
      return record.image;
    }

    static markError(record) {
      const error = record.error || new Error(`[AssetLoader] Failed to load image: ${record.src}`);
      record.state = IMAGE_STATES.error;
      record.error = error;
      record.promise = null;
      return error;
    }

    static applyImageOptions(image, options = {}) {
      const { crossOrigin, referrerPolicy, decoding, fetchPriority } = options;
      if (crossOrigin !== undefined) image.crossOrigin = crossOrigin;
      if (referrerPolicy !== undefined) image.referrerPolicy = referrerPolicy;
      if (decoding !== undefined) image.decoding = decoding;
      if (fetchPriority !== undefined) image.fetchPriority = fetchPriority;
    }

    static normalizeManifest(manifest) {
      if (Array.isArray(manifest)) {
        return manifest.map((entry, index) => AssetLoader.normalizeEntry(entry, String(index)));
      }
      if (manifest && typeof manifest === "object") {
        return Object.entries(manifest).map(([name, entry]) => AssetLoader.normalizeEntry(entry, name));
      }
      throw new TypeError("AssetLoader.preload requires an array or object manifest");
    }

    static normalizeEntry(entry, fallbackName) {
      if (typeof entry === "string") {
        return { name: fallbackName, src: AssetLoader.requireSrc(entry), options: {} };
      }
      if (!entry || typeof entry !== "object") {
        throw new TypeError("AssetLoader manifest entries require a src");
      }

      const { name = fallbackName, src, options = {}, ...imageOptions } = entry;
      return {
        name,
        src: AssetLoader.requireSrc(src),
        options: { ...imageOptions, ...options },
      };
    }

    static requireSrc(src) {
      if (typeof src !== "string" || src.trim().length <= 0) {
        throw new TypeError("AssetLoader image src must be a non-empty string");
      }
      return src;
    }
  }

  globalThis.AssetLoader = AssetLoader;
})();
