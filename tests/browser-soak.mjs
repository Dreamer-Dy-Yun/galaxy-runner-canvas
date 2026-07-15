import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { observeBrowserFailures, startArtifactServer } from "./helpers/artifact-browser.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifactRoot = path.join(projectRoot, "dist");
const requestedDuration = Number(process.env.GALAXY_RUNNER_SOAK_MS);
const soakDurationMs = Number.isFinite(requestedDuration)
  ? Math.max(5_000, Math.min(60_000, requestedDuration))
  : 12_000;

function assertFiniteStatus(status) {
  assert.equal(status.mode === "running" || status.mode === "gameover", true);
  for (const [name, value] of Object.entries({
    distance: status.distance,
    score: status.score,
    hp: status.hp,
    entityTotal: status.entities?.total,
    frameP95: status.frame?.p95Ms,
    frameMax: status.frame?.maxMs,
  })) {
    assert.equal(Number.isFinite(value), true, `${name} must stay finite`);
  }
}

async function waitForStatus(page, predicateSource) {
  await page.waitForFunction(predicateSource, undefined, { timeout: 10_000 });
  return page.evaluate(() => globalThis.GalaxyRunnerStatus());
}

async function continueIfNeeded(page, status) {
  if (status.mode !== "gameover") return status;
  await page.keyboard.up("Space");
  await page.keyboard.press("Space");
  await page.keyboard.down("Space");
  return waitForStatus(page, () => globalThis.GalaxyRunnerStatus?.().mode === "running");
}

async function main() {
  await stat(path.join(artifactRoot, "galaxy-runner.html"));
  const server = await startArtifactServer(artifactRoot);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
    await context.addInitScript(() => {
      let seed = 0x5eed1234;
      Math.random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
    });
    const page = await context.newPage();
    const failures = observeBrowserFailures(page);
    const response = await page.goto(`${server.baseUrl}/galaxy-runner.html?debug=1`, {
      waitUntil: "networkidle",
    });
    assert.equal(response?.status(), 200);
    await waitForStatus(page, () => globalThis.GalaxyRunnerStatus?.().mode === "ready");

    await page.keyboard.down("Space");
    await waitForStatus(page, () => globalThis.GalaxyRunnerStatus?.().mode === "running");

    const directions = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"];
    let activeDirection = null;
    let highWater = 0;
    let continues = 0;
    const startedAt = Date.now();
    let nextDirectionAt = startedAt;

    while (Date.now() - startedAt < soakDurationMs) {
      if (Date.now() >= nextDirectionAt) {
        if (activeDirection) await page.keyboard.up(activeDirection);
        activeDirection = directions[Math.floor((Date.now() - startedAt) / 1_200) % directions.length];
        await page.keyboard.down(activeDirection);
        nextDirectionAt += 1_200;
      }

      await page.waitForTimeout(250);
      let status = await page.evaluate(() => globalThis.GalaxyRunnerStatus());
      status = await continueIfNeeded(page, status);
      assertFiniteStatus(status);
      highWater = Math.max(highWater, status.entities.total);
      continues = Math.max(continues, status.continues || 0);
      assert.ok(status.entities.total < 1_000, `entity total exceeded safety bound: ${status.entities.total}`);
    }

    if (activeDirection) await page.keyboard.up(activeDirection);
    await page.keyboard.up("Space");
    await page.keyboard.down("ArrowLeft");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForFunction(() => globalThis.GalaxyRunnerStatus?.().input?.moveLeft === false);

    const finalStatus = await page.evaluate(() => globalThis.GalaxyRunnerStatus());
    assert.ok(finalStatus.profilerSampleCount > 0);
    assert.ok(finalStatus.frame.p95Ms < 1_000, "frame p95 must remain finite and below the hang threshold");
    assert.deepEqual(failures, []);
    console.log(
      `[browser-soak] PASS: ${soakDurationMs}ms, entity high-water ${highWater}, ` +
        `final ${finalStatus.entities.total}, assists ${continues}.`
    );
    await context.close();
  } finally {
    await browser?.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(`[browser-soak] ${error.stack || error.message}`);
  process.exitCode = 1;
});
