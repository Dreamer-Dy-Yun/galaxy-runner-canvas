import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifactRoot = path.join(projectRoot, "dist");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

async function startArtifactServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname === "/" ? "index.html" : `.${pathname}`;
      let filePath = path.resolve(artifactRoot, relativePath);
      const artifactPrefix = `${artifactRoot}${path.sep}`;
      if (filePath !== artifactRoot && !filePath.startsWith(artifactPrefix)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-length": body.length,
        "content-type": contentTypes.get(path.extname(filePath)) || "application/octet-stream",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      const statusCode = error?.code === "ENOENT" ? 404 : 500;
      response.writeHead(statusCode).end(statusCode === 404 ? "Not Found" : "Server Error");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to bind artifact server");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.closeAllConnections?.();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

function observeBrowserFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console.error: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    failures.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || "unknown"})`);
  });
  page.on("response", (response) => {
    const resourceType = response.request().resourceType();
    if (response.status() >= 400) {
      failures.push(`${resourceType} ${response.status()}: ${response.url()}`);
    }
  });
  return failures;
}

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
      return true;
    },
    expected,
    { timeout: 10_000 }
  );
  return readStatus(page);
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

    await page.keyboard.press("Space");
    const running = await waitForStatus(page, {
      mode: "running",
      minDistance: ready.distance + 2,
    });

    await page.keyboard.press("KeyP");
    const paused = await waitForStatus(page, { mode: "paused" });
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
    assert.equal(restarted.mode, "running");
    assert.equal(restarted.distance, 0, "restart should synchronously reset progress");
    assert.equal(restarted.runtimeRunning, true);
    assert.equal(restarted.debugEnabled, debugEnabled);
    assert.ok(restarted.profilerSampleCount >= ready.profilerSampleCount);

    await waitForStatus(page, { mode: "running", minDistance: 2 });
    assert.deepEqual(failures, [], `browser failures for debug=${debugEnabled}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await stat(path.join(artifactRoot, "galaxy-runner.html"));
  const server = await startArtifactServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await verifyScenario(browser, server.baseUrl, false);
    await verifyScenario(browser, server.baseUrl, true);
    console.log("[browser-smoke] PASS: debug off/on lifecycle and browser failures verified.");
  } finally {
    await browser?.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(`[browser-smoke] ${error.stack || error.message}`);
  process.exitCode = 1;
});
