import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export function createClassicScriptContext(globals = {}) {
  const sandbox = {
    console,
    performance: globalThis.performance,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    ...globals,
  };
  return vm.createContext(sandbox, { name: "galaxy-runner-classic-script" });
}

function resolveScriptPath(root, scriptPath) {
  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, scriptPath);
  const relativePath = path.relative(absoluteRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Classic script path escapes the configured root: ${scriptPath}`);
  }
  return absolutePath;
}

export async function loadClassicScripts(
  scriptPaths,
  { root = defaultRoot, globals = {}, context = null } = {}
) {
  if (!Array.isArray(scriptPaths) || scriptPaths.length === 0) {
    throw new TypeError("loadClassicScripts requires at least one script path");
  }

  const targetContext = context || createClassicScriptContext(globals);
  for (const scriptPath of scriptPaths) {
    const absolutePath = resolveScriptPath(root, scriptPath);
    const source = await readFile(absolutePath, "utf8");
    const script = new vm.Script(source, { filename: absolutePath });
    script.runInContext(targetContext);
  }

  return targetContext;
}
