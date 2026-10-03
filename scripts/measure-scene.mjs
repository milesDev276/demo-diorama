// Measures a scene in the /diorama editor with headless Chrome: frame rate
// in the editor and in Preview, plus renderer.info (draw calls, triangles)
// for one editor frame. The dev server must be running. The page is opened
// with ?dev=stats, which exposes the R3F state as window.__dioramaThree().
//
//   node scripts/measure-scene.mjs --types keiCar,bicycle --count 100 [options]
//   node scripts/measure-scene.mjs --seed-scene <file> [options]
//
// --types/--count  build a grid scene cycling through the types (--count 0 = empty scene)
// --seed-scene     use an existing scene file instead
// --seconds        length of each fps sample (default 5)
// --url            editor URL (default http://localhost:3000/diorama)
// --save-seed      also write the generated scene file (to reuse with capture-presets.mjs)
//
// renderer.info covers the main pass only: three r184 resets it after
// rendering shadow maps, so shadow-pass draws are not included.

import { readFile, rm, writeFile } from "node:fs/promises";
import { Cdp, launchBrowser } from "./capture-presets.mjs";

const VIEWPORT = { width: 1920, height: 1080 };
const STORAGE_KEY = "diorama-scene";
/** Area of the grid (meters). A seed without an environment loads as the converted street strip, a 51 × 27 m plot. */
const GRID_AREA = { width: 46, depth: 22 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { types: null, count: 100, seedScene: null, seconds: 5, url: "http://localhost:3000/diorama", saveSeed: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[++i];
    if (flag === "--types") args.types = value.split(",").filter(Boolean);
    else if (flag === "--count") args.count = Number(value);
    else if (flag === "--seed-scene") args.seedScene = value;
    else if (flag === "--seconds") args.seconds = Number(value);
    else if (flag === "--url") args.url = value;
    else if (flag === "--save-seed") args.saveSeed = value;
    else throw new Error(`Unknown option ${flag}`);
  }
  if (!args.types && !args.seedScene && args.count !== 0) {
    throw new Error("Usage: node scripts/measure-scene.mjs (--types a,b --count N | --seed-scene <file>) [--seconds S]");
  }
  return args;
}

/** A v2 scene file with `count` objects on a grid, cycling through `types`. */
function gridScene(types, count) {
  const cols = Math.max(1, Math.ceil(Math.sqrt((count * GRID_AREA.width) / GRID_AREA.depth)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const step = Math.min(GRID_AREA.width / cols, GRID_AREA.depth / rows);
  const objects = Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: `measure-${i}`,
      type: types[i % types.length],
      position: [(col - (cols - 1) / 2) * step, 0, (row - (rows - 1) / 2) * step],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
    };
  });
  return { version: 2, savedAt: Date.now(), scene: { id: "scene-measure", name: "Measure", objects } };
}

const FPS_PROBE = (ms) => `new Promise((resolve) => {
  let frames = 0;
  const start = performance.now();
  const tick = () => {
    frames++;
    const elapsed = performance.now() - start;
    if (elapsed < ${ms}) requestAnimationFrame(tick);
    else resolve(Math.round((frames * 10000) / elapsed) / 10);
  };
  requestAnimationFrame(tick);
})`;

const INFO_PROBE = `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const info = window.__dioramaThree().gl.info;
  resolve({
    calls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
    programs: info.programs?.length ?? null,
  });
})))`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sceneText = args.seedScene
    ? await readFile(args.seedScene, "utf8")
    : JSON.stringify(gridScene(args.types ?? [], args.count));
  if (args.saveSeed) await writeFile(args.saveSeed, JSON.stringify(JSON.parse(sceneText), null, 2));
  const objectCount = JSON.parse(sceneText).scene?.objects?.length ?? 0;

  const { browser, profile, pageUrl } = await launchBrowser();
  const cdp = await Cdp.connect(pageUrl);
  try {
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(sceneText)});`,
    });
    const url = new URL(args.url);
    url.searchParams.set("dev", "stats");
    await cdp.send("Page.navigate", { url: url.href });

    const deadline = Date.now() + 120_000;
    while (!(await cdp.evaluate("Boolean(window.__dioramaThree)").catch(() => false))) {
      if (Date.now() > deadline) throw new Error("Timed out waiting for the renderer (is the dev server running?)");
      await sleep(500);
    }
    await sleep(5000); // models, shadow maps, shader compiles

    const gpu = await cdp.evaluate(`(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const ext = gl?.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
    })()`);
    const editorInfo = await cdp.evaluate(INFO_PROBE);
    const editorFps = await cdp.evaluate(FPS_PROBE(args.seconds * 1000));

    await cdp.clickButton("Preview");
    await sleep(3000);
    const previewFps = await cdp.evaluate(FPS_PROBE(args.seconds * 1000));
    await cdp.clickButton("Exit Preview", { exact: false });

    const result = {
      gpu,
      viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
      objects: objectCount,
      editor: { fps: editorFps, ...editorInfo },
      preview: { fps: previewFps },
      pageErrors: cdp.errors,
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    cdp.close();
    browser.kill();
    await sleep(500);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[measure] ${error.message}`);
  process.exit(1);
});
