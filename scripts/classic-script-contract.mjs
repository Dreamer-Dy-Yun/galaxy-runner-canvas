import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function entry(scriptPath, providers = []) {
  return Object.freeze({
    path: scriptPath,
    providers: Object.freeze([...providers]),
  });
}

export const CLASSIC_SCRIPT_MANIFEST = Object.freeze([
  entry("src/core/constants.js"),
  entry("src/gameplay/weapon-definition.js"),
  entry("src/gameplay/weapon-catalog.js", ["src/gameplay/weapon-definition.js"]),
  entry("src/gameplay/weapon-definitions.js", [
    "src/gameplay/weapon-definition.js",
    "src/gameplay/weapon-catalog.js",
  ]),
  entry("src/gameplay/run-rules.js", ["src/gameplay/weapon-definitions.js"]),
  entry("src/gameplay/player-defense-rules.js", ["src/core/constants.js"]),
  entry("src/gameplay/item-definitions.js", ["src/gameplay/weapon-definitions.js"]),
  entry("src/gameplay/game-config.js", ["src/core/constants.js"]),
  entry("src/gameplay/game-info.js", ["src/gameplay/item-definitions.js"]),
  entry("src/gameplay/player-rig-catalog.js"),
  entry("src/gameplay/player-animation-profiles.js"),
  entry("src/systems/game-feedback-system.js"),
  entry("src/ui/game-feedback-messages.js"),
  entry("src/ui/game-feedback.js", ["src/ui/game-feedback-messages.js"]),
  entry("src/ui/game-accessibility.js", [
    "src/systems/game-feedback-system.js",
    "src/ui/game-feedback-messages.js",
  ]),
  entry("src/audio/game-audio.js", ["src/systems/game-feedback-system.js"]),
  entry("src/core/asset-loader.js"),
  entry("src/core/sprite-atlas.js", ["src/core/asset-loader.js"]),
  entry("src/core/collision.js"),
  entry("src/engine/animation/animation-timeline.js"),
  entry("src/engine/animation/pose-channel-state.js", [
    "src/engine/animation/animation-timeline.js",
  ]),
  entry("src/engine/animation/part-assembly-diff.js"),
  entry("src/engine/animation/transition-profile.js", [
    "src/engine/animation/animation-timeline.js",
    "src/engine/animation/part-assembly-diff.js",
  ]),
  entry("src/engine/animation/rig-animation-engine.js", [
    "src/engine/animation/animation-timeline.js",
    "src/engine/animation/pose-channel-state.js",
    "src/engine/animation/part-assembly-diff.js",
    "src/engine/animation/transition-profile.js",
  ]),
  entry("src/engine/rendering/rig-animation-renderer.js"),
  entry("src/systems/weapon-system.js", [
    "src/gameplay/weapon-definitions.js",
    "src/gameplay/game-config.js",
  ]),
  entry("src/systems/drone-system.js", ["src/gameplay/game-config.js"]),
  entry("src/systems/special-system.js", ["src/gameplay/game-config.js"]),
  entry("src/systems/player-defense-system.js", [
    "src/gameplay/player-defense-rules.js",
    "src/gameplay/game-config.js",
  ]),
  entry("src/systems/player-progression-system.js", [
    "src/gameplay/weapon-definitions.js",
    "src/systems/weapon-system.js",
    "src/systems/drone-system.js",
  ]),
  entry("src/systems/player-rig-animation-adapter.js", [
    "src/engine/animation/rig-animation-engine.js",
    "src/gameplay/player-rig-catalog.js",
    "src/gameplay/player-animation-profiles.js",
  ]),
  entry("src/systems/boss-ai.js", ["src/gameplay/game-config.js"]),
  entry("src/systems/game-session-system.js", [
    "src/gameplay/game-config.js",
    "src/gameplay/run-rules.js",
  ]),
  entry("src/systems/game-loop-system.js", ["src/systems/game-session-system.js"]),
  entry("src/systems/enemy-spawn-system.js", ["src/systems/boss-ai.js"]),
  entry("src/systems/projectile-lifecycle-system.js", ["src/core/collision.js"]),
  entry("src/systems/collectible-lifecycle-system.js", ["src/gameplay/item-definitions.js"]),
  entry("src/systems/effect-lifecycle-system.js"),
  entry("src/systems/enemy-lifecycle-system.js", ["src/core/collision.js"]),
  entry("src/renderers/player-part-layout.js", ["src/core/sprite-atlas.js"]),
  entry("src/renderers/final-ship-art.js", ["src/core/asset-loader.js"]),
  entry("src/renderers/player-rig-art.js", [
    "src/core/asset-loader.js",
    "src/engine/rendering/rig-animation-renderer.js",
    "src/gameplay/player-rig-catalog.js",
  ]),
  entry("src/renderers/player-renderer.js", [
    "src/gameplay/game-config.js",
    "src/renderers/player-rig-art.js",
  ]),
  entry("src/renderers/item-icon-aux-renderer.js"),
  entry("src/renderers/item-icon-renderer.js", ["src/renderers/item-icon-aux-renderer.js"]),
  entry("src/engine/input.js", ["src/gameplay/game-config.js"]),
  entry("src/renderers/space-background.js", ["src/gameplay/game-config.js"]),
  entry("src/entities/burst-particle.js", ["src/gameplay/game-config.js"]),
  entry("src/entities/projectile.js", ["src/core/asset-loader.js"]),
  entry("src/renderers/projectile-energy-renderer.js"),
  entry("src/renderers/projectile-special-renderer.js"),
  entry("src/renderers/projectile-renderer.js", [
    "src/renderers/projectile-energy-renderer.js",
    "src/renderers/projectile-special-renderer.js",
  ]),
  entry("src/entities/nova-explosion.js"),
  entry("src/entities/enemy.js", ["src/core/asset-loader.js"]),
  entry("src/entities/collectible-item.js", ["src/gameplay/item-definitions.js"]),
  entry("src/entities/player.js", [
    "src/systems/weapon-system.js",
    "src/systems/drone-system.js",
    "src/systems/special-system.js",
    "src/systems/player-defense-system.js",
    "src/systems/player-progression-system.js",
    "src/renderers/player-renderer.js",
    "src/renderers/player-part-layout.js",
    "src/renderers/final-ship-art.js",
    "src/renderers/player-rig-art.js",
    "src/systems/player-rig-animation-adapter.js",
  ]),
  entry("src/ui/game-hud.js", ["src/entities/player.js"]),
  entry("src/ui/game-overlay.js", ["src/gameplay/game-info.js"]),
  entry("src/renderers/game-scene-renderer.js", [
    "src/ui/game-hud.js",
    "src/ui/game-overlay.js",
    "src/renderers/space-background.js",
    "src/renderers/projectile-renderer.js",
  ]),
  entry("src/engine/game.js", [
    "src/engine/input.js",
    "src/systems/game-loop-system.js",
    "src/systems/enemy-spawn-system.js",
    "src/systems/projectile-lifecycle-system.js",
    "src/systems/collectible-lifecycle-system.js",
    "src/systems/effect-lifecycle-system.js",
    "src/systems/enemy-lifecycle-system.js",
    "src/entities/player.js",
    "src/renderers/game-scene-renderer.js",
    "src/systems/game-feedback-system.js",
    "src/ui/game-feedback.js",
  ]),
  entry("src/main.js", [
    "src/gameplay/run-rules.js",
    "src/ui/game-accessibility.js",
    "src/audio/game-audio.js",
    "src/engine/game.js",
  ]),
]);

export function readClassicScriptReferences(html) {
  const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  return Array.from(String(html).matchAll(scriptPattern), (match) => normalizeReference(match[1]));
}

export function verifyClassicScriptReferences(
  references,
  { manifest = CLASSIC_SCRIPT_MANIFEST } = {}
) {
  if (!Array.isArray(references)) {
    throw new TypeError("Classic script references must be an array");
  }

  const normalized = references.map(normalizeReference);
  const expectedPaths = manifest.map((item) => item.path);
  const expectedSet = new Set(expectedPaths);
  const counts = new Map();
  for (const scriptPath of normalized) {
    counts.set(scriptPath, (counts.get(scriptPath) || 0) + 1);
  }

  const duplicates = [...counts].filter(([, count]) => count > 1).map(([scriptPath]) => scriptPath);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate classic script reference: ${duplicates.join(", ")}`);
  }

  const missing = expectedPaths.filter((scriptPath) => !counts.has(scriptPath));
  if (missing.length > 0) {
    throw new Error(`Missing classic script reference: ${missing.join(", ")}`);
  }

  const unknown = normalized.filter((scriptPath) => !expectedSet.has(scriptPath));
  if (unknown.length > 0) {
    throw new Error(`Unknown classic script reference: ${unknown.join(", ")}`);
  }

  const positions = new Map(normalized.map((scriptPath, index) => [scriptPath, index]));
  const mainIndex = positions.get("src/main.js");
  if (mainIndex !== normalized.length - 1) {
    throw new Error("src/main.js must be the final classic script reference");
  }

  for (const item of manifest) {
    for (const provider of item.providers) {
      if (positions.get(provider) > positions.get(item.path)) {
        throw new Error(`Classic script provider must precede consumer: ${provider} -> ${item.path}`);
      }
    }
  }

  return Object.freeze({
    scriptCount: normalized.length,
    references: Object.freeze([...normalized]),
  });
}

export async function verifyClassicScriptContract({
  root = projectRoot,
  htmlFile = "galaxy-runner.html",
  manifest = CLASSIC_SCRIPT_MANIFEST,
} = {}) {
  const absoluteRoot = path.resolve(root);
  const absoluteHtmlFile = path.resolve(absoluteRoot, htmlFile);
  const relativePath = path.relative(absoluteRoot, absoluteHtmlFile);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Classic script contract file escapes the site root: ${htmlFile}`);
  }

  const html = await readFile(absoluteHtmlFile, "utf8");
  return verifyClassicScriptReferences(readClassicScriptReferences(html), { manifest });
}

function normalizeReference(reference) {
  const cleanReference = String(reference || "").split(/[?#]/, 1)[0].replaceAll("\\", "/");
  return cleanReference.replace(/^\.\//, "");
}
