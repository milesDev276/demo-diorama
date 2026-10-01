import { CanvasTexture, SRGBColorSpace } from "three";
import layout from "./atlasLayout.json";
import { DIORAMA_COLORS } from "../../utils/palette";

/**
 * The graphics atlas: one runtime canvas holding every printed graphic
 * (ads, plates, later signs and road markings), sampled by the shared
 * `printed` material. Cell rectangles live in atlasLayout.json, which the
 * Blender build also reads to give printed faces their UVs — so a cell's
 * position is data, and only its painter lives here.
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

/** One painter per cell; the Record type fails the build if the layout gains a cell with no painter. */
const PAINTERS: Record<CellName, CellPainter> = {
  vending_ad: paintVendingAd,
  plate_kei: paintKeiPlate,
  road_tomare: paintTomare,
  kanban_sakaya: paintKanbanSakaya,
};

/** Cells that keep their alpha, for the `decal` material. Everything else is opaque print. */
const TRANSPARENT_CELLS: ReadonlySet<CellName> = new Set<CellName>(["road_tomare"]);

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

let texture: CanvasTexture | null = null;

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

  texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false; // glTF UVs have their origin at the top-left, like the canvas
  texture.anisotropy = 4;
  return texture;
}
