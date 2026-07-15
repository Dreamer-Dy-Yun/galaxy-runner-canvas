import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);

async function collectFiles(root, current = root) {
  const files = [];
  const entries = await readdir(current, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function isLocalReference(reference) {
  return !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference);
}

function resolveLocalReference(htmlFile, reference, root) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!cleanReference || !isLocalReference(cleanReference)) return null;

  const candidate = path.resolve(path.dirname(htmlFile), decodeURIComponent(cleanReference));
  const relativePath = path.relative(root, candidate);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Local reference escapes the site root: ${reference}`);
  }
  return candidate;
}

async function verifyJavascriptSyntax(javascriptFiles) {
  for (const file of javascriptFiles) {
    try {
      await execFileAsync(process.execPath, ["--check", file], { windowsHide: true });
    } catch (error) {
      const details = error.stderr?.trim() || error.message;
      throw new Error(`JavaScript syntax check failed: ${file}\n${details}`);
    }
  }
}

async function verifyHtmlReferences(htmlFiles, root) {
  const references = [];
  const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    for (const match of html.matchAll(scriptPattern)) {
      const target = resolveLocalReference(htmlFile, match[1], root);
      if (!target) continue;

      let targetStat;
      try {
        targetStat = await stat(target);
      } catch {
        throw new Error(`${path.relative(root, htmlFile)} references missing script: ${match[1]}`);
      }
      if (!targetStat.isFile()) {
        throw new Error(`${path.relative(root, htmlFile)} script reference is not a file: ${match[1]}`);
      }
      references.push({ htmlFile, target });
    }
  }

  return references;
}

export async function verifyStaticSite({ root = projectRoot } = {}) {
  const siteRoot = path.resolve(root);
  const allFiles = await collectFiles(siteRoot);
  const javascriptFiles = allFiles.filter((file) => /\.(?:js|mjs)$/i.test(file));
  const htmlFiles = allFiles.filter((file) => /\.html$/i.test(file));

  await verifyJavascriptSyntax(javascriptFiles);
  const references = await verifyHtmlReferences(htmlFiles, siteRoot);

  return {
    root: siteRoot,
    javascriptFileCount: javascriptFiles.length,
    htmlFileCount: htmlFiles.length,
    localScriptReferenceCount: references.length,
  };
}

async function run() {
  const result = await verifyStaticSite();
  console.log(
    `[verify:static] ${result.javascriptFileCount} JavaScript files, ` +
      `${result.htmlFileCount} HTML files, ${result.localScriptReferenceCount} local script references verified.`
  );
}

const invokedUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedUrl === import.meta.url) {
  run().catch((error) => {
    console.error(`[verify:static] ${error.message}`);
    process.exitCode = 1;
  });
}
