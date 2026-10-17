// Renders the preview image of every built-in starter scene with headless
// Chrome: public/templates/<id>.webp, shown by the New-diorama dialog. The
// dev server must be running. Each scene is opened in Preview with a 16:9
// photo frame, so the image is what "Save photo" would give. Each starter is
// opened as a new diorama (/diorama/new?starter=<id>) in a fresh profile.
//
//   node scripts/capture-template.mjs [--url http://localhost:3000/diorama] [--hero]
//
// --hero  renders only the hero starter, 1600 px wide, as the home page's
//         picture: public/home/hero.webp.

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cdp, launchBrowser } from "./capture-presets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HERO = process.argv.includes("--hero");
const OUT_DIR = path.join(ROOT, "public", HERO ? "home" : "templates");
// The hero is rendered in a larger window and scaled down, so it stays sharp at 1600 px.
const VIEWPORT = HERO ? { width: 2400, height: 1500 } : { width: 1600, height: 1000 };
const WIDTH = HERO ? 1600 : 640;
const QUALITY = HERO ? 88 : 86;
const HERO_STARTER = "autumn-corner";
/**
 * Height of the 16:9 photo frame in a window (DioramaCanvas's mat pads it
 * 24 px on the sides and top, 144 px below). The orthographic zoom is in
 * pixels, so a larger frame needs a proportionally larger zoom to frame the
 * scene the same way.
 */
const frameHeight = ({ width, height }) => Math.min(height - 168, ((width - 48) * 9) / 16);
const ZOOM_SCALE = frameHeight(VIEWPORT) / frameHeight({ width: 1600, height: 1000 });

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

    /** Waits until the editor has opened a diorama and the renderer is up. */
    const waitForEditor = async (what) => {
      const deadline = Date.now() + 120_000;
      const ready = "Boolean(window.__dioramaThree && window.__dioramaStore && window.__dioramaStore.getState().sceneId)";
      while (!(await cdp.evaluate(ready).catch(() => false))) {
        if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what} (is the dev server running?)`);
        await sleep(500);
      }
      await sleep(3000); // models, shadow maps
    };
    await waitForEditor(url.href);

    // The New dialog lists the starters.
    let ids = [HERO_STARTER];
    if (!HERO) {
      await cdp.clickButton("New");
      await sleep(600);
      ids = await cdp.evaluate(`[...document.querySelectorAll('[role="dialog"] img')].map((img) => img.getAttribute("src").split("/").pop().replace(".webp", ""))`);
      await cdp.clickButton("Cancel");
    }

    for (const id of ids) {
      const starterUrl = new URL("/diorama/new", url);
      starterUrl.searchParams.set("starter", id);
      starterUrl.searchParams.set("dev", "stats");
      // The old page's handles must not answer for the new one.
      await cdp.evaluate("delete window.__dioramaStore; delete window.__dioramaThree");
      await cdp.send("Page.navigate", { url: starterUrl.href });
      await waitForEditor(starterUrl.href);
      // A plot that is not square is framed by its longer side; fill the frame as the 16 m corner does.
      await cdp.evaluate(`(() => {
        const surface = window.__dioramaStore.getState().environment.surface;
        const { camera } = window.__dioramaThree();
        const footprint = surface ? (surface.cols + surface.rows.length) * 0.5 : 32;
        const longest = surface ? Math.max(surface.cols, surface.rows.length) * 0.5 : 16;
        camera.zoom *= (32 / footprint) * (longest / 16) * ${ZOOM_SCALE};
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
      const name = HERO ? "hero" : id;
      await writeFile(path.join(OUT_DIR, `${name}.webp`), Buffer.from(data, "base64"));
      console.log(`[template] ${id} -> public/${HERO ? "home" : "templates"}/${name}.webp`);
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
