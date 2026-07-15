import assert from "node:assert/strict";
import test from "node:test";
import {
  CLASSIC_SCRIPT_MANIFEST,
  verifyClassicScriptContract,
  verifyClassicScriptReferences,
} from "../scripts/classic-script-contract.mjs";
import { loadClassicScripts } from "./helpers/load-classic-scripts.mjs";

const canonicalReferences = CLASSIC_SCRIPT_MANIFEST.map((item) => item.path);

function swap(references, leftPath, rightPath) {
  const result = [...references];
  const leftIndex = result.indexOf(leftPath);
  const rightIndex = result.indexOf(rightPath);
  [result[leftIndex], result[rightIndex]] = [result[rightIndex], result[leftIndex]];
  return result;
}

test("galaxy-runner HTML satisfies the declared classic script contract", async () => {
  const result = await verifyClassicScriptContract();
  assert.equal(result.scriptCount, canonicalReferences.length);
  assert.deepEqual([...result.references], canonicalReferences);
});

test("classic script contract rejects duplicate, missing, and unknown references", () => {
  assert.throws(
    () => verifyClassicScriptReferences([...canonicalReferences, canonicalReferences[0]]),
    /Duplicate classic script reference/
  );
  assert.throws(
    () => verifyClassicScriptReferences(canonicalReferences.slice(1)),
    /Missing classic script reference/
  );
  assert.throws(
    () => verifyClassicScriptReferences([...canonicalReferences, "src/unknown-provider.js"]),
    /Unknown classic script reference/
  );
});

test("classic script contract rejects consumer-first order and a non-final main", () => {
  assert.throws(
    () => verifyClassicScriptReferences(swap(
      canonicalReferences,
      "src/gameplay/weapon-catalog.js",
      "src/gameplay/weapon-definitions.js"
    )),
    /provider must precede consumer/
  );
  assert.throws(
    () => verifyClassicScriptReferences(swap(
      canonicalReferences,
      "src/main.js",
      "src/engine/game.js"
    )),
    /must be the final classic script reference/
  );
});

test("all declared providers load sequentially before main in an isolated classic context", async () => {
  const providerScripts = canonicalReferences.filter((scriptPath) => scriptPath !== "src/main.js");
  await assert.doesNotReject(() => loadClassicScripts(providerScripts, {
    globals: {
      Image: class Image {},
      window: { devicePixelRatio: 1 },
    },
  }));
});

test("a dynamic runtime script load failure is reported instead of hidden", async () => {
  const errors = [];
  const document = {
    currentScript: { src: "https://test.invalid/src/main.js" },
    createElement() { return {}; },
    head: {
      appendChild(script) {
        queueMicrotask(() => script.onerror());
      },
    },
  };

  await loadClassicScripts(["src/main.js"], {
    globals: {
      document,
      console: {
        error(...args) { errors.push(args); },
        log() {},
        warn() {},
      },
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "[Galaxy Runner] Failed to initialize runtime.");
  assert.match(errors[0][1]?.message || "", /Failed to load .*asset-loader\.js/);
});
