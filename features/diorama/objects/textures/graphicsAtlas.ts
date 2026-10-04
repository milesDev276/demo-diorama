import { CanvasTexture, SRGBColorSpace } from "three";
import layout from "./atlasLayout.json";
import { DIORAMA_COLORS } from "../../utils/palette";

/**
 * The graphics atlas: one runtime canvas holding every printed graphic
 * (ads, plates, later signs and road markings), sampled by the shared
 * `printed` material. Cell rectangles live in atlasLayout.json, which the
 * Blender build also reads to give printed faces their UVs — so a cell's
 * position is data, and only its painter lives here. A second canvas, the
 * lit atlas, holds the backlit cells alone: the `printed` material's
 * emissive map.
 *
 * Text is drawn with the OS Japanese fonts; nothing is downloaded.
 */

type CellName = keyof typeof layout.cells;
type CellPainter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const FONT_STACK = '"Yu Gothic", YuGothic, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans JP", sans-serif';

const font = (weight: number, px: number) => `${weight} ${px}px ${FONT_STACK}`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A fictional bottled green-tea ad for the vending machine's lower panel. */
function paintVendingAd(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#f3f1e4");
  sky.addColorStop(1, "#dfe8cf");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Tea-field hills behind the bottle
  ctx.fillStyle = "#b9cf9a";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.quadraticCurveTo(w * 0.3, h * 0.52, w * 0.62, h * 0.7);
  ctx.quadraticCurveTo(w * 0.85, h * 0.8, w, h * 0.66);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // PET bottle: cap, shoulder, body, label
  const bx = w * 0.2;
  const bw = w * 0.16;
  ctx.fillStyle = DIORAMA_COLORS.canGreen;
  roundRect(ctx, bx - bw * 0.22, h * 0.1, bw * 0.44, h * 0.08, 4);
  ctx.fill();
  ctx.fillStyle = "#cfe0b8";
  ctx.beginPath();
  ctx.moveTo(bx - bw * 0.25, h * 0.18);
  ctx.lineTo(bx + bw * 0.25, h * 0.18);
  ctx.lineTo(bx + bw * 0.5, h * 0.3);
  ctx.lineTo(bx + bw * 0.5, h * 0.9);
  ctx.lineTo(bx - bw * 0.5, h * 0.9);
  ctx.lineTo(bx - bw * 0.5, h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#4f7a3e";
  ctx.fillRect(bx - bw * 0.5, h * 0.42, bw, h * 0.3);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = font(700, h * 0.075);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("緑", bx, h * 0.51);
  ctx.fillText("茶", bx, h * 0.62);

  // Headline
  ctx.fillStyle = "#35552a";
  ctx.font = font(800, h * 0.26);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("緑茶", w * 0.4, h * 0.46);
  ctx.font = font(600, h * 0.07);
  ctx.fillText("すっきり、まろやか。", w * 0.41, h * 0.6);

  // "New" badge
  ctx.fillStyle = DIORAMA_COLORS.signRed;
  roundRect(ctx, w * 0.41, h * 0.08, w * 0.24, h * 0.13, h * 0.03);
  ctx.fill();
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(800, h * 0.085);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("新発売", w * 0.53, h * 0.145);

  // Bottom band: cold drink + price
  ctx.fillStyle = DIORAMA_COLORS.canBlue;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = font(800, h * 0.1);
  ctx.textAlign = "left";
  ctx.fillText("つめた〜い", w * 0.05, h * 0.9);
  ctx.textAlign = "right";
  ctx.fillText("¥150", w * 0.95, h * 0.9);
}

/** Kei-car plate: yellow with black text (region + class, hiragana, number). Fictional. */
function paintKeiPlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.plateYellow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#3b3526";
  ctx.lineWidth = h * 0.04;
  roundRect(ctx, h * 0.05, h * 0.05, w - h * 0.1, h * 0.9, h * 0.08);
  ctx.stroke();

  ctx.fillStyle = "#2b2b2b";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = font(700, h * 0.26);
  ctx.fillText("練馬 580", w / 2, h * 0.28);
  ctx.font = font(700, h * 0.24);
  ctx.fillText("あ", w * 0.12, h * 0.66);
  ctx.font = font(800, h * 0.5);
  ctx.fillText("12-34", w * 0.56, h * 0.66);
}

/** 止まれ road marking: paint only, on a transparent cell (rendered as a decal). 止 is at the top. */
function paintTomare(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.asphaltLine;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const row = h / 3;
  const size = row * 0.92;
  ctx.font = font(900, size);
  [..."止まれ"].forEach((glyph, i) => {
    ctx.save();
    ctx.translate(w / 2, row * (i + 0.5));
    ctx.scale((w * 0.94) / size, 1); // road lettering is stretched to fill the lane
    ctx.fillText(glyph, 0, size * 0.04);
    ctx.restore();
  });
}

/** Projecting vertical sign of a fictional liquor shop: 酒 in a red disc, the shop name below. */
function paintKanbanSakaya(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIORAMA_COLORS.signRed;
  ctx.fillRect(0, 0, w, h * 0.025);
  ctx.fillRect(0, h * 0.975, w, h * 0.025);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const disc = w * 0.42;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.14, disc, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(900, disc * 1.35);
  ctx.fillText("酒", w / 2, h * 0.145);

  ctx.fillStyle = "#3b322c";
  const size = w * 0.72;
  ctx.font = font(800, size);
  [..."山田酒店"].forEach((glyph, i) => ctx.fillText(glyph, w / 2, h * 0.34 + i * size * 1.22));
}

/** Front of a post box: the 〒 mark, a label under each slot and the collection-times plate. */
function paintPostFront(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.postRed;
  ctx.fillRect(0, 0, w, h);

  // Slot labels (the slots themselves are modeled above them)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const labels = ["手紙・はがき", "その他郵便物"];
  labels.forEach((label, i) => {
    const cx = w * (0.27 + i * 0.46);
    ctx.fillStyle = "#fff8ec";
    roundRect(ctx, cx - w * 0.2, h * 0.26, w * 0.4, h * 0.075, h * 0.012);
    ctx.fill();
    ctx.fillStyle = "#3b322c";
    ctx.font = font(700, h * 0.042);
    ctx.fillText(label, cx, h * 0.3, w * 0.37);
  });

  // 〒 mark
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(900, h * 0.3);
  ctx.fillText("〒", w / 2, h * 0.56);

  // Collection-times plate
  roundRect(ctx, w * 0.2, h * 0.76, w * 0.6, h * 0.16, h * 0.015);
  ctx.fill();
  ctx.fillStyle = "#3b322c";
  ctx.font = font(700, h * 0.04);
  ctx.fillText("取集時刻", w / 2, h * 0.795);
  ctx.font = font(600, h * 0.034);
  ctx.fillText("平日 9:30 / 15:00", w / 2, h * 0.845, w * 0.54);
  ctx.fillText("休日 10:00", w / 2, h * 0.89, w * 0.54);
}

/** Face of a stop sign: the cell is the bounding box of the inverted triangle (top edge up, tip down). */
function paintSignStop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // White everywhere: what shows of it is the border along the triangle's edges.
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIORAMA_COLORS.signRed;
  ctx.beginPath();
  ctx.moveTo(w * 0.075, h * 0.05);
  ctx.lineTo(w * 0.925, h * 0.05);
  ctx.lineTo(w / 2, h * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(900, h * 0.27);
  ctx.fillText("止まれ", w / 2, h * 0.33, w * 0.6);
}

/** Round head of a bus stop: the cell is the disc's bounding box. A fictional stop on a fictional line. */
function paintBusStopHead(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.mirrorOrange;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = DIORAMA_COLORS.canBlue;
  ctx.fillRect(w * 0.1, h * 0.56, w * 0.8, h * 0.035);
  ctx.font = font(900, h * 0.2);
  ctx.fillText("バス", w / 2, h * 0.3);
  ctx.fillStyle = "#3b322c";
  ctx.font = font(800, h * 0.15);
  ctx.fillText("緑町二丁目", w / 2, h * 0.47, w * 0.74);
  ctx.font = font(600, h * 0.085);
  ctx.fillText("のりば", w / 2, h * 0.69);
  ctx.fillText("市営バス", w / 2, h * 0.8, w * 0.5);
}

/** Timetable board of a bus stop: a header and a grid of hours and minutes. */
function paintBusStopBoard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DIORAMA_COLORS.canBlue;
  ctx.fillRect(0, 0, w, h * 0.15);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(800, h * 0.09);
  ctx.fillText("時刻表", w / 2, h * 0.08);

  const rows = 9;
  const top = h * 0.2;
  const rowH = (h * 0.76) / rows;
  ctx.font = font(700, rowH * 0.62);
  for (let i = 0; i < rows; i++) {
    const y = top + i * rowH;
    if (i % 2 === 0) {
      ctx.fillStyle = "#e3e6e2";
      ctx.fillRect(w * 0.06, y, w * 0.88, rowH);
    }
    ctx.fillStyle = DIORAMA_COLORS.canBlue;
    ctx.textAlign = "center";
    ctx.fillText(String(6 + i * 2), w * 0.16, y + rowH * 0.55);
    ctx.fillStyle = "#3b322c";
    ctx.textAlign = "left";
    ctx.fillText(i % 3 === 0 ? "05 25 45" : i % 3 === 1 ? "10 40" : "15 35 55", w * 0.3, y + rowH * 0.55, w * 0.6);
  }
  ctx.fillStyle = "#3b322c";
  ctx.fillRect(w * 0.255, top, w * 0.008, h * 0.76);
}

/** Signboard of a fictional neighborhood shop: まるや商店, tobacco on the left, daily goods on the right. */
function paintShopSign(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = DIORAMA_COLORS.signBoard;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = DIORAMA_COLORS.signRed;
  roundRect(ctx, w * 0.035, h * 0.2, w * 0.17, h * 0.6, h * 0.08);
  ctx.fill();
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(800, h * 0.36);
  ctx.fillText("たばこ", w * 0.12, h * 0.52, w * 0.15);

  ctx.fillStyle = "#3b322c";
  ctx.font = font(900, h * 0.64);
  ctx.fillText("まるや商店", w * 0.52, h * 0.53, w * 0.52);

  ctx.fillStyle = DIORAMA_COLORS.canBlue;
  ctx.font = font(800, h * 0.27);
  ctx.fillText("日用品", w * 0.89, h * 0.33, w * 0.16);
  ctx.fillText("食料品", w * 0.89, h * 0.7, w * 0.16);
}

/** Name plate of a fictional convenience store: a mark, コトリマート and a 24-hour badge. */
function paintKonbiniSign(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#4f7a3e";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // The mark: a pale disc with an open green ring
  ctx.fillStyle = DIORAMA_COLORS.lampWhite;
  ctx.beginPath();
  ctx.arc(w * 0.09, h / 2, h * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4f7a3e";
  ctx.lineWidth = h * 0.09;
  ctx.beginPath();
  ctx.arc(w * 0.09, h / 2, h * 0.19, Math.PI * 0.15, Math.PI * 1.75);
  ctx.stroke();

  ctx.fillStyle = "#fff8ec";
  ctx.font = font(900, h * 0.62);
  ctx.fillText("コトリマート", w * 0.5, h * 0.54, w * 0.6);

  ctx.fillStyle = DIORAMA_COLORS.canBlue;
  roundRect(ctx, w * 0.84, h * 0.2, w * 0.13, h * 0.6, h * 0.1);
  ctx.fill();
  ctx.fillStyle = "#fff8ec";
  ctx.font = font(800, h * 0.36);
  ctx.fillText("24h", w * 0.905, h * 0.53, w * 0.11);
}

/** One painter per cell; the Record type fails the build if the layout gains a cell with no painter. */
const PAINTERS: Record<CellName, CellPainter> = {
  vending_ad: paintVendingAd,
  plate_kei: paintKeiPlate,
  road_tomare: paintTomare,
  kanban_sakaya: paintKanbanSakaya,
  post_front: paintPostFront,
  sign_stop: paintSignStop,
  bus_stop_head: paintBusStopHead,
  bus_stop_board: paintBusStopBoard,
  shop_sign: paintShopSign,
  konbini_sign: paintKonbiniSign,
};

/** Cells that keep their alpha, for the `decal` material. Everything else is opaque print. */
const TRANSPARENT_CELLS: ReadonlySet<CellName> = new Set<CellName>(["road_tomare"]);

/** Backlit cells and how strongly they glow after dark: 1 is a light box,
 *  less a sign with a lamp on it. Everything else stays as dark as its surroundings. */
const LIT_CELLS: Partial<Record<CellName, number>> = {
  vending_ad: 1,
  kanban_sakaya: 1,
  konbini_sign: 1,
  shop_sign: 0.7,
  bus_stop_head: 0.6,
  bus_stop_board: 0.6,
};

/** Paints one cell and repeats its outer pixels into the gutter, so mipmaps never mix neighboring cells. */
function paintCell(atlas: CanvasRenderingContext2D, name: CellName) {
  const [x, y, w, h] = layout.cells[name];
  const g = layout.gutter;
  const cell = document.createElement("canvas");
  cell.width = w;
  cell.height = h;
  PAINTERS[name](cell.getContext("2d")!, w, h);

  if (TRANSPARENT_CELLS.has(name)) {
    // Nothing to extend: the cell and its gutter are cleared, so its edges blend to nothing.
    atlas.clearRect(x - g, y - g, w + 2 * g, h + 2 * g);
    atlas.drawImage(cell, x, y);
    return;
  }

  atlas.drawImage(cell, x, y);
  atlas.drawImage(cell, 0, 0, w, 1, x, y - g, w, g); // top
  atlas.drawImage(cell, 0, h - 1, w, 1, x, y + h, w, g); // bottom
  atlas.drawImage(atlas.canvas, x, y - g, 1, h + 2 * g, x - g, y - g, g, h + 2 * g); // left, incl. corners
  atlas.drawImage(atlas.canvas, x + w - 1, y - g, 1, h + 2 * g, x + w, y - g, g, h + 2 * g); // right
}

/** A canvas as an atlas texture: sRGB, addressed like the canvas itself. */
function atlasTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const atlas = new CanvasTexture(canvas);
  atlas.colorSpace = SRGBColorSpace;
  atlas.flipY = false; // glTF UVs have their origin at the top-left, like the canvas
  atlas.anisotropy = 4;
  return atlas;
}

let texture: CanvasTexture | null = null;
let litTexture: CanvasTexture | null = null;

/** The atlas texture, painted on first use (client only — it needs a DOM canvas). */
export function getGraphicsAtlas(): CanvasTexture {
  if (texture) return texture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = layout.size;
  const ctx = canvas.getContext("2d")!;
  // Unused space is a neutral paper tone, not transparent black, so the
  // smallest mip levels (distant views) don't darken prints at cell edges.
  ctx.fillStyle = "#d9d4c7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const name of Object.keys(layout.cells) as CellName[]) paintCell(ctx, name);

  texture = atlasTexture(canvas);
  return texture;
}

/** The lit atlas: the backlit cells (LIT_CELLS) at their strength, with their gutters, on black. */
export function getLitAtlas(): CanvasTexture {
  if (litTexture) return litTexture;
  const source = getGraphicsAtlas().image as HTMLCanvasElement;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = layout.size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const g = layout.gutter;
  for (const [name, strength] of Object.entries(LIT_CELLS) as Array<[CellName, number]>) {
    const [x, y, w, h] = layout.cells[name];
    ctx.globalAlpha = strength;
    ctx.drawImage(source, x - g, y - g, w + 2 * g, h + 2 * g, x - g, y - g, w + 2 * g, h + 2 * g);
  }
  ctx.globalAlpha = 1;
  litTexture = atlasTexture(canvas);
  return litTexture;
}
