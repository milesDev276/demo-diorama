// Renders a thumbnail for every asset-browser item with headless Chrome:
// public/thumbnails/<key>.webp, plus features/diorama/assets/thumbnails.json
// listing the keys that have one (the library shows the icon for the rest).
// The dev server must be running. Thumbnails of items that no longer exist
// are deleted.
//
//   node scripts/capture-thumbnails.mjs [--url http://localhost:3000/diorama/thumbnails] [--only key1,key2]

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cdp, launchBrowser } from "./capture-presets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "thumbnails");
const MANIFEST = path.join(ROOT, "features", "diorama", "assets", "thumbnails.json");
const SIZE = 256;
const QUALITY = 88;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { url: "http://localhost:3000/diorama/thumbnails", only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url") args.url = argv[++i];
    else if (argv[i] === "--only") args.only = argv[++i].split(",");
    else throw new Error(`Unknown option ${argv[i]}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const { browser, profile, pageUrl } = await launchBrowser();
  const cdp = await Cdp.connect(pageUrl);
  try {
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    // The dev server's Next.js indicator would end up in every thumbnail.
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.appendChild(style);
      });`,
    });
    await cdp.send("Page.navigate", { url: args.url });

    const deadline = Date.now() + 120_000;
    while (!(await cdp.evaluate("Boolean(window.__thumbnails)").catch(() => false))) {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${args.url} (is the dev server running?)`);
      await sleep(500);
    }
    const items = await cdp.evaluate("window.__thumbnails.items");
    const wanted = args.only ? items.filter((item) => args.only.includes(item.key)) : items;

    for (const { key, file } of wanted) {
      const ready = cdp.evaluate(`window.__thumbnails.show(${JSON.stringify(key)}).then(() => true)`);
      const timeout = sleep(30_000).then(() => false);
      if (!(await Promise.race([ready, timeout]))) {
        console.log(`[thumbnails] ${key}: timed out, skipped`);
        continue;
      }
      await sleep(150); // one more frame for the shadow map
      const { data } = await cdp.send("Page.captureScreenshot", { format: "webp", quality: QUALITY });
      await writeFile(path.join(OUT_DIR, file), Buffer.from(data, "base64"));
      console.log(`[thumbnails] ${key} -> public/thumbnails/${file}`);
    }

    // The manifest lists every current item that has a file, so --only runs keep the others.
    const files = new Set(await readdir(OUT_DIR));
    const keys = items.filter((item) => files.has(item.file)).map((item) => item.key);
    await writeFile(MANIFEST, `${JSON.stringify(keys, null, 2)}\n`);
    const current = new Set(items.map((item) => item.file));
    for (const file of files) {
      if (!current.has(file)) {
        await rm(path.join(OUT_DIR, file));
        console.log(`[thumbnails] removed stale ${file}`);
      }
    }
    console.log(`[thumbnails] ${keys.length} of ${items.length} items have a thumbnail`);
    if (cdp.errors.length) console.log(`[thumbnails] page errors:\n  ${cdp.errors.join("\n  ")}`);
  } finally {
    cdp.close();
    browser.kill();
    await sleep(500);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[thumbnails] ${error.message}`);
  process.exit(1);
});
