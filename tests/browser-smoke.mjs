import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { observeBrowserFailures, startArtifactServer } from "./helpers/artifact-browser.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifactRoot = path.join(projectRoot, "dist");

async function readStatus(page) {
  return page.evaluate(() => globalThis.GalaxyRunnerStatus());
}

async function waitForStatus(page, expected) {
  await page.waitForFunction(
    (requirements) => {
      if (typeof globalThis.GalaxyRunnerStatus !== "function") return false;
      const status = globalThis.GalaxyRunnerStatus();
      if (requirements.mode && status.mode !== requirements.mode) return false;
      if (requirements.runtimeRunning === true && status.runtimeRunning !== true) return false;
      if (Number.isFinite(requirements.minDistance) && status.distance <= requirements.minDistance) return false;
      if (requirements.selectedRoute && status.selectedRoute !== requirements.selectedRoute) return false;
      if ("activeWeapon" in requirements && status.activeWeapon !== requirements.activeWeapon) return false;
      if (requirements.feedbackType && status.feedback?.type !== requirements.feedbackType) return false;
      if ("infoPanelOpen" in requirements && status.infoPanelOpen !== requirements.infoPanelOpen) return false;
      return true;
    },
    expected,
    { timeout: 10_000 }
  );
  return readStatus(page);
}

async function chooseEnergyRoute(page) {
  await page.waitForFunction(() => globalThis.GalaxyRunnerStatus?.().entities?.collectibles === 4);
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("ArrowUp");
  try {
    return await waitForStatus(page, {
      mode: "running",
      selectedRoute: "energy",
      activeWeapon: "energy",
    });
  } finally {
    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowUp");
  }
}

async function verifyScenario(browser, baseUrl, debugEnabled) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = observeBrowserFailures(page);
  const suffix = debugEnabled ? "?debug=1" : "";

  try {
    const response = await page.goto(`${baseUrl}/galaxy-runner.html${suffix}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response?.status(), 200, "game document should load successfully");

    const ready = await waitForStatus(page, { mode: "ready", runtimeRunning: true });
    assert.equal(ready.debugEnabled, debugEnabled);
    assert.equal(ready.runtimeRunning, true);
    assert.ok(ready.profilerSampleCount > 0, "profiler should collect frame samples");
    assert.equal(ready.selectedRoute, null);
    assert.equal(ready.activeWeapon, null);

    const accessibility = await page.evaluate(() => {
      const canvas = document.getElementById("game");
      const liveRegion = document.getElementById("game-status");
      const audioButton = document.getElementById("audio-toggle");
      return {
        language: document.documentElement.lang,
        canvasTabIndex: canvas?.tabIndex,
        canvasLabel: canvas?.getAttribute("aria-label"),
        canvasDescription: canvas?.getAttribute("aria-describedby"),
        canvasFallback: canvas?.textContent?.trim(),
        liveRole: liveRegion?.getAttribute("role"),
        liveMode: liveRegion?.getAttribute("aria-live"),
        audioPressed: audioButton?.getAttribute("aria-pressed"),
      };
    });
    assert.equal(accessibility.language, "ko");
    assert.equal(accessibility.canvasTabIndex, 0);
    assert.ok(accessibility.canvasLabel?.includes("슈팅 게임"));
    assert.equal(accessibility.canvasDescription, "game-controls");
    assert.ok(accessibility.canvasFallback?.includes("키보드"));
    assert.equal(accessibility.liveRole, "status");
    assert.equal(accessibility.liveMode, "polite");
    assert.equal(accessibility.audioPressed, "false");

    await page.keyboard.press("ArrowRight");
    await waitForStatus(page, { mode: "ready", activeWeapon: null });
    assert.equal((await readStatus(page)).selectedRoute, null);

    await page.keyboard.press("Space");
    await waitForStatus(page, { mode: "running", activeWeapon: null });
    await chooseEnergyRoute(page);
    const running = await waitForStatus(page, {
      mode: "running",
      minDistance: ready.distance + 2,
      activeWeapon: "energy",
    });

    await page.keyboard.down("KeyX");
    try {
      await waitForStatus(page, { mode: "running", feedbackType: "special.failed" });
    } finally {
      await page.keyboard.up("KeyX");
    }

    await page.keyboard.press("KeyP");
    const paused = await waitForStatus(page, { mode: "paused" });
    await page.keyboard.press("KeyI");
    await waitForStatus(page, { mode: "paused", infoPanelOpen: true });
    await page.keyboard.press("KeyI");
    await waitForStatus(page, { mode: "paused", infoPanelOpen: false });
    await page.waitForTimeout(350);
    const stillPaused = await readStatus(page);
    assert.equal(stillPaused.mode, "paused");
    assert.equal(stillPaused.distance, paused.distance, "distance must freeze while paused");

    await page.keyboard.press("KeyP");
    const resumed = await waitForStatus(page, {
      mode: "running",
      minDistance: paused.distance + 2,
    });
    assert.ok(resumed.distance > running.distance);

    const restarted = await page.evaluate(() => {
      document.getElementById("restart").click();
      return globalThis.GalaxyRunnerStatus();
    });
    assert.equal(restarted.mode, "ready");
    assert.equal(restarted.distance, 0, "restart should synchronously reset progress");
    assert.equal(restarted.selectedRoute, null);
    assert.equal(restarted.activeWeapon, null);
    assert.equal(restarted.runtimeRunning, true);
    assert.equal(restarted.debugEnabled, debugEnabled);
    assert.ok(restarted.profilerSampleCount >= ready.profilerSampleCount);

    await page.keyboard.press("Space");
    await chooseEnergyRoute(page);
    await waitForStatus(page, { mode: "running", minDistance: 2 });
    await page.keyboard.down("ArrowLeft");
    await page.waitForFunction(() => globalThis.GalaxyRunnerStatus().input.moveLeft === true);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForFunction(() => globalThis.GalaxyRunnerStatus().input.moveLeft === false);

    await page.keyboard.down("KeyX");
    try {
      await waitForStatus(page, { mode: "running", feedbackType: "special.failed" });
      await page.waitForFunction(() => globalThis.GalaxyRunnerStatus().feedback === null);
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await page.keyboard.down("KeyX");
      await waitForStatus(page, { mode: "running", feedbackType: "special.failed" });
    } finally {
      await page.keyboard.up("KeyX");
    }

    const audioButton = page.locator("#audio-toggle");
    await audioButton.click();
    assert.equal(await audioButton.getAttribute("aria-pressed"), "true");
    await audioButton.click();
    assert.equal(await audioButton.getAttribute("aria-pressed"), "false");
    assert.deepEqual(failures, [], `browser failures for debug=${debugEnabled}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await stat(path.join(artifactRoot, "galaxy-runner.html"));
  const server = await startArtifactServer(artifactRoot);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await verifyScenario(browser, server.baseUrl, false);
    await verifyScenario(browser, server.baseUrl, true);
    console.log("[browser-smoke] PASS: P1/P2 lifecycle, accessibility, recovery, and browser failures verified.");
  } finally {
    await browser?.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(`[browser-smoke] ${error.stack || error.message}`);
  process.exitCode = 1;
});
