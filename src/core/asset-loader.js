// Galaxy Runner - asset loader
// Tiny shared image cache for classic script loading under file:// Chromium.

class AssetLoader {
  static images = new Map();

  static image(src) {
    if (!AssetLoader.images.has(src)) {
      const image = new Image();
      image.src = src;
      AssetLoader.images.set(src, image);
    }

    return AssetLoader.images.get(src);
  }

  static ready(image) {
    return image.complete && image.naturalWidth > 0;
  }
}
