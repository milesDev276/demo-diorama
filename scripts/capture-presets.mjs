// Captures the /diorama editor at every camera preset, in edit mode and in
// Preview, using headless Chrome/Edge over the DevTools protocol. No
// dependencies (Node ≥ 22 for the global WebSocket). The dev server must be
// running. A fresh browser profile is used, so the scene of a first visit
// (the hero starter) is shown unless --seed-scene gives another.
//
//   node scripts/capture-presets.mjs <outDir> [--url <url>] [--seed-scene <file>] [--save-scene <file>]
//
// --seed-scene puts a scene file into localStorage before the app starts, as
//              if it were an earlier autosave (used to test migrations).
// --save-scene writes the scene exactly as the app saves it to localStorage.
//
// Cdp and launchBrowser are exported for one-off verification scripts.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PRESETS = ["Isometric", "Front", "Side", "Top"];
const VIEWPORT = { width: 1600, height: 1000 };
const DEBUG_PORT = 9333;
const STORAGE_KEY = "diorama-scene";
const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { outDir: null, url: "http://localhost:3000/diorama", seedScene: null, saveScene: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url") args.url = argv[++i];
    else if (argv[i] === "--seed-scene") args.seedScene = argv[++i];
    else if (argv[i] === "--save-scene") args.saveScene = argv[++i];
    else args.outDir = argv[i];
  }
  if (!args.outDir) {
    throw new Error("Usage: node scripts/capture-presets.mjs <outDir> [--url <url>] [--seed-scene <file>] [--save-scene <file>]");
  }
  return args;
}

async function waitUntil(check, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

/** Minimal DevTools-protocol client over one page target. */
export class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.errors = [];
    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === "Runtime.exceptionThrown") {
        this.errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
      } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        this.errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new Cdp(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }

  async clickButton(label, { exact = true } = {}) {
    const clicked = await this.evaluate(`(() => {
      const label = ${JSON.stringify(label)};
      const button = [...document.querySelectorAll("button")].find((b) => {
        const text = b.textContent.trim();
        return ${exact} ? text === label : text.includes(label);
      });
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error(`Button not found: ${label}`);
  }

  async screenshot(file) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    await writeFile(file, Buffer.from(data, "base64"));
    console.log(`[capture] ${file}`);
  }

  close() {
    this.socket.close();
  }
}

export async function launchBrowser() {
  const executable = BROWSERS.find((p) => existsSync(p));
  if (!executable) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
  const profile = await mkdtemp(path.join(tmpdir(), "diorama-capture-"));
  const browser = spawn(
    executable,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "--ignore-gpu-blocklist",
      "--enable-unsafe-swiftshader",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  const base = `http://127.0.0.1:${DEBUG_PORT}`;
  await waitUntil(async () => (await fetch(`${base}/json/version`)).ok, 20_000, "browser debug port");
  const targets = await (await fetch(`${base}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  return { browser, profile, pageUrl: page.webSocketDebuggerUrl };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(args.outDir, { recursive: true });
  await waitUntil(async () => (await fetch(args.url)).ok, 120_000, `dev server at ${args.url}`);

  const { browser, profile, pageUrl } = await launchBrowser();
  const cdp = await Cdp.connect(pageUrl);
  try {
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    if (args.seedScene) {
      const scene = await readFile(args.seedScene, "utf8");
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(scene)});`,
      });
      console.log(`[capture] seeded localStorage from ${args.seedScene}`);
    }
    await cdp.send("Page.navigate", { url: args.url });
    await waitUntil(() => cdp.evaluate(`Boolean(document.querySelector("canvas"))`), 120_000, "the 3D canvas");
    await sleep(3000); // first frames, shadow maps, fonts

    const renderer = await cdp.evaluate(`(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
    })()`);
    console.log(`[capture] WebGL renderer: ${renderer}`);

    for (const preset of PRESETS) {
      const name = preset.toLowerCase();
      await cdp.clickButton(preset);
      await sleep(1500); // preset transition + orbit damping
      await cdp.screenshot(path.join(args.outDir, `edit-${name}.png`));
      await cdp.clickButton("Preview");
      await sleep(1500);
      await cdp.screenshot(path.join(args.outDir, `preview-${name}.png`));
      await cdp.clickButton("Exit Preview", { exact: false });
      await sleep(800);
    }

    if (args.saveScene) {
      await cdp.evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }))`);
      await sleep(500);
      const saved = await cdp.evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEY)})`);
      if (!saved) throw new Error("The app did not write a scene to localStorage");
      await writeFile(args.saveScene, JSON.stringify(JSON.parse(saved), null, 2));
      console.log(`[capture] scene -> ${args.saveScene}`);
    }

    if (cdp.errors.length) {
      console.log(`[capture] ${cdp.errors.length} page error(s):`);
      for (const e of cdp.errors) console.log(`  - ${e}`);
    } else {
      console.log("[capture] no page errors");
    }
  } finally {
    cdp.close();
    browser.kill();
    await sleep(500);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[capture] ${error.message}`);
    process.exit(1);
  });
}
