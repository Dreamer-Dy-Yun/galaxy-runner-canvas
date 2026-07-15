import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyStaticSite } from "./verify-static-site.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifactRoot = path.join(projectRoot, "dist");
const artifactEntries = [
  "index.html",
  "galaxy-runner.html",
  "galaxy-runner.css",
  ".nojekyll",
  "src",
  "assets",
];

async function copyArtifactEntries() {
  await rm(artifactRoot, { recursive: true, force: true });
  await mkdir(artifactRoot, { recursive: true });

  for (const entry of artifactEntries) {
    await cp(path.join(projectRoot, entry), path.join(artifactRoot, entry), {
      recursive: true,
      force: true,
    });
  }
}

async function artifactStats(current = artifactRoot) {
  let fileCount = 0;
  let totalBytes = 0;

  for (const entry of await readdir(current, { withFileTypes: true })) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      const child = await artifactStats(entryPath);
      fileCount += child.fileCount;
      totalBytes += child.totalBytes;
    } else if (entry.isFile()) {
      fileCount += 1;
      totalBytes += (await stat(entryPath)).size;
    }
  }

  return { fileCount, totalBytes };
}

async function build() {
  const sourceVerification = await verifyStaticSite({ root: projectRoot });
  await copyArtifactEntries();
  const artifactVerification = await verifyStaticSite({ root: artifactRoot });
  const stats = await artifactStats();

  console.log(
    `[build] dist assembled: ${stats.fileCount} files, ${stats.totalBytes} bytes. ` +
      `Source ${sourceVerification.javascriptFileCount} JS / artifact ` +
      `${artifactVerification.javascriptFileCount} JS; ` +
      `${artifactVerification.localScriptReferenceCount} local script references verified.`
  );
}

build().catch((error) => {
  console.error(`[build] ${error.message}`);
  process.exitCode = 1;
});
