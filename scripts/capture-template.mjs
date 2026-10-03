// Renders the preview image of every built-in starter scene with headless
// Chrome: public/templates/<id>.webp, shown by the New-diorama dialog. The
// dev server must be running. Each scene is opened in Preview with a 16:9
// photo frame, so the image is what "Save photo" would give.
//
//   node scripts/capture-template.mjs [--url http://localhost:3000/diorama]

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cdp, launchBrowser } from "./capture-presets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "templates");
const VIEWPORT = { width: 1600, height: 1000 };
const WIDTH = 640;
const QUALITY = 86;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const urlFlag = process.argv.indexOf("--url");
  const url = new URL(urlFlag > 0 ? process.argv[urlFlag + 1] : "http://localhost:3000/diorama");
  url.searchParams.set("dev", "stats");
  await mkdir(OUT_DIR, { recursive: true });

  const { browser, profile, pageUrl } = await launchBrowser();
  const cdp = await Cdp.connect(pageUrl);
  try {
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Page.navigate", { url: url.href });

    const deadline = Date.now() + 120_000;
    while (!(await cdp.evaluate("Boolean(window.__dioramaThree && window.__dioramaStore)").catch(() => false))) {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${url.href} (is the dev server running?)`);
      await sleep(500);
    }
    await sleep(3000); // models, shadow maps

    // The dialog lists the starters; the store starts a scene from one by id.
    await cdp.clickButton("New");
    await sleep(600);
    const ids = await cdp.evaluate(`[...document.querySelectorAll('[role="dialog"] img')].map((img) => img.getAttribute("src").split("/").pop().replace(".webp", ""))`);
    await cdp.clickButton("Cancel");

    for (const id of ids) {
      await cdp.evaluate(`(() => {
        const store = window.__dioramaStore.getState();
        store.setPreviewMode(false);
        store.newSceneFromTemplate(${JSON.stringify(id)});
      })()`);
      await sleep(2500);
      // A plot that is not square is framed by its longer side; fill the frame as the 16 m corner does.
      await cdp.evaluate(`(() => {
        const surface = window.__dioramaStore.getState().environment.surface;
        const { camera } = window.__dioramaThree();
        const footprint = surface ? (surface.cols + surface.rows.length) * 0.5 : 32;
        const longest = surface ? Math.max(surface.cols, surface.rows.length) * 0.5 : 16;
        camera.zoom *= (32 / footprint) * (longest / 16);
        camera.updateProjectionMatrix();
      })()`);
      await sleep(300);
      // Preview first, the frame second: the camera switch must not see the canvas change shape.
      await cdp.evaluate(`window.__dioramaStore.getState().setPreviewMode(true)`);
      await sleep(2000);
      await cdp.evaluate(`window.__dioramaStore.getState().setPhoto({ aspect: "16:9", focus: null })`);
      await sleep(2000);

      const rect = await cdp.evaluate(`(() => {
        const r = document.querySelector("canvas").getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()`);
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "webp",
        quality: QUALITY,
        clip: { ...rect, scale: WIDTH / rect.width },
      });
      const file = path.join(OUT_DIR, `${id}.webp`);
      await writeFile(file, Buffer.from(data, "base64"));
      console.log(`[template] ${id} -> public/templates/${id}.webp`);
    }
    if (cdp.errors.length) console.log(`[template] page errors:\n  ${cdp.errors.join("\n  ")}`);
  } finally {
    cdp.close();
    browser.kill();
    await sleep(500);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[template] ${error.message}`);
  process.exit(1);
});
