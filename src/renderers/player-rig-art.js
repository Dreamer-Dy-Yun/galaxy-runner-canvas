// Resolves Player rig asset keys and preserves approved legacy-art fallback.

(() => {
  class PlayerRigArt {
    constructor() {
      this.assets = new Map();
      this.missingReports = new Set();
      this.renderer = new RigAnimationRenderer({
        resolveAsset: (assetKey) => this.resolveAsset(assetKey),
        onMissingAsset: (record) => this.reportMissing(record),
      });
      this.preloadCritical();
    }

    preloadCritical() {
      const keys = [
        ...PlayerRigCatalog.snapshot().parts.map((part) => part.assetKey),
        ...PlayerRigCatalog.routeKinds().flatMap((kind) => PlayerRigCatalog.requiredAssetKeys(kind, 1)),
      ];
      for (const key of keys) this.resolveAsset(key);
    }

    resolveAsset(assetKey) {
      if (this.assets.has(assetKey)) return this.assets.get(assetKey);
      const source = PlayerRigCatalog.assetPath(assetKey);
      if (!source) return null;
      const image = AssetLoader.image(source);
      this.assets.set(assetKey, image);
      return image;
    }

    unavailableAssetKeys(assetKeys) {
      return Object.freeze(assetKeys.filter((assetKey) => {
        const source = PlayerRigCatalog.assetPath(assetKey);
        if (!source) return true;
        this.resolveAsset(assetKey);
        return AssetLoader.status(source).state === "error";
      }));
    }

    draw(player, ctx, time, frame) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
      ctx.shadowBlur = 11;
      const stableMissing = !frame.active && frame.parts.some(
        (part) => !AssetLoader.ready(this.resolveAsset(part.assetKey))
      );
      const report = stableMissing
        ? Object.freeze({ drawn: 0, missing: Object.freeze([]), degraded: true })
        : this.renderer.draw(ctx, frame, { scale: player.partLayout.rigSize / 512 });
      if (report.drawn === 0) {
        this.drawLegacy(player, ctx, time);
      }
      this.drawArmor(player, ctx);
      ctx.restore();
      return report;
    }

    drawLegacy(player, ctx, time) {
      const kind = player.activeWeaponKind();
      const level = player.activeWeaponLevel();
      if (kind && player.finalShips.draw(ctx, kind, level, player.partLayout.rigSize)) return true;
      if (!player.playerPartSheet.isReady()) return false;
      const slots = player.partLayout.shipSlots();
      player.partLayout.draw(ctx, slots.wings, { alpha: 0.98 });
      player.partLayout.draw(ctx, slots.engine, { alpha: 0.96 });
      player.partLayout.draw(ctx, slots.fuselage);
      player.partLayout.draw(ctx, slots.cockpit, {
        alpha: 0.9 + Math.sin(time * 5) * 0.04,
        shadowColor: "rgba(106, 239, 255, 0.5)",
        shadowBlur: 8,
      });
      return true;
    }

    drawArmor(player, ctx) {
      if (player.armorLevel <= 0 || !player.playerPartSheet.isReady()) return;
      const level = clampNumber(player.armorLevel, 1, BALANCE.armorMaxLevel);
      player.partLayout.draw(ctx, player.partLayout.armorSlot(), {
        alpha: 0.46 + level * 0.08,
        shadowColor: "rgba(216, 230, 240, 0.45)",
        shadowBlur: 7,
      });
    }

    reportMissing(record) {
      const source = PlayerRigCatalog.assetPath(record.assetKey);
      if (source && AssetLoader.status(source).state !== "error") return;
      const key = `${record.assetKey}:${record.partId}`;
      if (this.missingReports.has(key)) return;
      this.missingReports.add(key);
      console.error("[PlayerRigArt] rig asset failed", record);
    }
  }

  globalThis.PlayerRigArt = PlayerRigArt;
})();
