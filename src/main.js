// Galaxy Runner - main
// Split from the original single-file prototype so each system can evolve independently.

(() => {
  const mainScriptUrl = document.currentScript?.src || "";
  const runtimeScripts = [
    { globalName: "AssetLoader", path: runtimePath("engine/assets/asset-loader.js") },
    { globalName: "AssetPreloader", path: runtimePath("engine/assets/asset-preloader.js") },
    { globalName: "RenderHelpers", path: runtimePath("engine/rendering/render-helpers.js") },
    { globalName: "SpriteAtlas", path: runtimePath("engine/rendering/sprite-atlas.js") },
    { globalName: "Scene", path: runtimePath("engine/scenes/scene.js") },
    { globalName: "SceneManager", path: runtimePath("engine/scenes/scene-manager.js") },
    { globalName: "ActionMap", path: runtimePath("engine/input/action-map.js") },
    { globalName: "InputState", path: runtimePath("engine/input/input-state.js") },
    { globalName: "FrameClock", path: runtimePath("engine/runtime/frame-clock.js") },
    { globalName: "CanvasSurface", path: runtimePath("engine/runtime/canvas-surface.js") },
    { globalName: "EntityStore", path: runtimePath("engine/world/entity-store.js") },
    { globalName: "EntityGroups", path: runtimePath("engine/world/entity-groups.js") },
    { globalName: "World", path: runtimePath("engine/world/world.js") },
    { globalName: "CollisionQuery", path: runtimePath("engine/physics/collision-query.js") },
    { globalName: "DebugOverlay", path: runtimePath("engine/debug/debug-overlay.js") },
    { globalName: "FrameProfiler", path: runtimePath("engine/debug/frame-profiler.js") },
    { globalName: "EngineRuntime", path: runtimePath("engine/runtime/engine-runtime.js") },
  ];

  function runtimePath(path) {
    if (mainScriptUrl) return new URL(path, mainScriptUrl).toString();
    return `src/${path}`;
  }

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = path;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`[Galaxy Runner] Failed to load ${path}`));
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    for (const script of runtimeScripts) {
      if (!globalThis[script.globalName]) {
        await loadScript(script.path);
      }
    }
  }

  async function boot() {
    await ensureRuntime();

    const canvas = document.getElementById("game");
    const restartButton = document.getElementById("restart");

    if (!canvas || !(canvas instanceof HTMLCanvasElement) || !restartButton) {
      console.error("[Galaxy Runner] Failed to initialize: missing #game canvas or #restart button.");
      return;
    }

    const surface = new CanvasSurface(canvas, {
      width: PLAYFIELD.width,
      height: PLAYFIELD.height,
      dprFallback: GAME_CONFIG.dprFallback,
    });
    warmupStartupAssets();

    const game = new Game(surface, restartButton);
    const sceneManager = new SceneManager();
    sceneManager.register("game", game);
    sceneManager.switchTo("game");
    const runtime = new EngineRuntime({
      scene: sceneManager,
      surface,
      clock: new FrameClock({ maxDeltaSeconds: GAME_CONFIG.maxFrameDelta }),
    });
    const frameProfiler = new FrameProfiler();
    const debugOverlay = new DebugOverlay({
      enabled: DebugOverlay.readEnabledFlag({ queryParam: "debug", storageKey: "galaxyRunner.debug" }),
      sceneManager,
      surface,
      getWorld: () => game.world,
      profiler: frameProfiler,
    });
    frameProfiler.attach({ runtime });
    debugOverlay.attach(runtime);
    globalThis.GalaxyRunnerDebug = debugOverlay;
    globalThis.GalaxyRunnerFrameProfiler = frameProfiler;
    globalThis.GalaxyRunnerStatus = () => createStatusSnapshot({
      game,
      runtime,
      debugOverlay,
      frameProfiler,
    });

    runtime.start();
  }

  function createStatusSnapshot({ game, runtime, debugOverlay, frameProfiler }) {
    const profilerSnapshot = frameProfiler.snapshot();
    return Object.freeze({
      mode: typeof game.state?.mode === "string" ? game.state.mode : null,
      distance: finiteOrNull(game.state?.distance),
      score: finiteOrNull(game.state?.score),
      hp: finiteOrNull(game.player?.health),
      runtimeRunning: runtime.running === true,
      debugEnabled: debugOverlay.enabled === true,
      profilerSampleCount: finiteOrNull(profilerSnapshot.sampleCount),
    });
  }

  function finiteOrNull(value) {
    return Number.isFinite(value) ? value : null;
  }

  function warmupStartupAssets() {
    if (typeof Projectile !== "undefined" && typeof Projectile.warmupAssets === "function") {
      Projectile.warmupAssets();
    }
    if (typeof Enemy !== "undefined" && typeof Enemy.warmupAssets === "function") {
      Enemy.warmupAssets();
    }
    if (typeof ItemIconRenderer !== "undefined" && typeof ItemIconRenderer.warmupAssets === "function") {
      ItemIconRenderer.warmupAssets();
    }
  }

  boot().catch((error) => {
    console.error("[Galaxy Runner] Failed to initialize runtime.", error);
  });
})();
