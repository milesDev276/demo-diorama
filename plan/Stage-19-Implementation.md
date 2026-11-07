# Stage 19 — Object Colors and Sign Text (Implementation Plan)

Follows [Stage-18-Implementation.md](Stage-18-Implementation.md) (editor
layout).

> **User request (2026-11-07):** "hãy thiết kế stage 19 và thực hiện ở 1
> conversation khác": write Stage 19's plan now, implement it in another
> conversation. The topic was not named. This plan takes the candidate
> that Stage 18's plan named for the next UI stage, which is also the
> roadmap's "before launch" item (Product-Roadmap.md, parallel track):
> **per-object colors and editable sign text.**

**Goal:** two placed objects of the same kind no longer have to look the
same. A kei car can be white and the next one navy; a house can be sage
instead of cream; the corner shop's signboard can carry the name the user
types. The colors stay within a restrained, curated palette, so a street
still looks like one miniature. Untouched objects, old scenes and the
starters look exactly as they do today.

Branch: `stage19-object-colors`, cut from `main` at `812eca6` (Stage 18
merged in PR #21) on 2026-11-07. The plan file is untracked on it.

**Status (2026-11-07):** implemented and verified. The user approved the
plan with "hãy thực hiện tiếp stage 19" (its defaults); the work was
started in one conversation and finished in the next. Results are in §6.

---

## 0. Starting Point (verified 2026-11-07, `stage18-editor-layout` at `0804b6a`)

* **Colors are baked into the models.** Blender asset scripts give every
  face a palette color (`art/blender/lib/builder.py`, keys from
  `utils/palette.ts`). `finish.py` then darkens it with baked AO, a
  grime gradient and per-face jitter, and writes the result as vertex
  colors. In the app every GLB mesh uses one of a few **shared** slot
  materials (`objects/materials.ts`: `base`, `emissive`, `printed`,
  `foliage`, `glass`). So nothing per object can change a color today.
* **The parametric `building`** (`objects/building/`) merges module GLBs
  (`building_bay_*`, `building_corner_01`, …) and app-built faces into one
  geometry per slot (`BUILDING_SLOTS`). Its walls are `wallPlaster`
  (`facade.py` `WALL`).
* **Signs are cells of one runtime atlas** (`objects/textures/
  graphicsAtlas.ts`, `atlasLayout.json`). The texts are fixed in the
  painters: `shop_sign` "まるや商店", `konbini_sign` "コトリマート",
  `apartment_board`, `name_plate`, `kanban_sakaya`. Printed faces carry
  UVs into their cell. The `printed` material samples the atlas and glows
  after dark through a second canvas, the lit atlas.
* **Scene objects** have `params` only on `building`, `scatter` and runs.
  Optional fields are written only when present, so files without them
  round-trip unchanged (`sceneValidator.ts`). Duplicates and kits copy
  objects with a spread, so a new field travels with them.
* **Body colors in use:** kei car `carBody`, kei truck `vendingPanel`
  (its `BODY`), vending machine `vendingBody`, house `wallPlaster`,
  apartment `wallSiding`, the umbrella figure's canopy `clothWhite`. The
  scooter's body key is to be confirmed in its script.
* **Constraint from HANDOFF §3 (Stage 16):** the parked bicycle's GLB must
  stay byte-identical. So the bicycle is not paintable in this stage.

---

## 1. Decisions

### D1 — Two optional fields on a scene object

```ts
interface DioramaObject {
  // …
  /** "#rrggbb", one of the asset's swatches. Absent = the asset's default color. */
  color?: string;
  /** What the object's sign says. Absent = the asset's default text. */
  text?: string;
}
```

* Only on assets that declare a paint region or a sign (D2). Written
  only when set, and removed again when the user goes back to the default.
* **No file version bump:** a file without the fields is unchanged, and
  an older build ignores them. This is the same rule `parentId` and
  `params` follow.
* **Validator** (`normalizeObject`): `color` is kept only if it matches
  `/^#[0-9a-f]{6}$/` (lowercased) and the asset is paintable. `text` is
  kept only if the asset has a sign; it is trimmed, stripped of control
  characters, and cut to the sign's `maxLength`. Anything else is dropped,
  not an error. Kit files pass through the same function.
* Duplicates, kits, undo / redo, save, export and import carry the fields
  with no extra code beyond the validator (verify).

### D2 — The asset registry says what can be changed

```ts
interface AssetBase {
  // …
  /** One region of the model that takes a color the user picks. */
  paint?: { label: string; default: PaletteKey; swatches: PaletteKey[] };
  /** A signboard whose text the user can change. */
  sign?: { label: string; cell: SignCell; default: string; maxLength: number };
}
```

The registry is the source of truth (CLAUDE.md §14). The inspector reads
it and hardcodes no asset (CLAUDE.md §50).

### D3 — A `paint` material slot

* **Blender:** `MATERIAL_SLOTS` gains `"paint"`, **appended** so that
  every existing face index stays the same. A face in that slot is
  colored **white × its shade**. Weathering applies to it as to `base`
  (AO, grime, jitter), so its vertex color is just the shading. The
  builder takes the slot like any other (`material="paint"`); a helper
  key such as `"paintWhite"` (`#ffffff`) gives the white.
* **Blender previews** must still show the default color. The script sets
  the `paint` slot material's base color to vertex color × the asset's
  default, through a Multiply node; the material is per build, and only
  previews use it.
* **App:** `getPaintMaterial(hex)` returns a `base`-like material (the
  same weather patch, the same `customProgramCacheKey`, so the same shader
  program) whose `color` is `hex`, cached per color. `getSlotMaterial
  ("paint")` falls back to white, so an unknown use is visible but not
  broken.
* **Same look by default:** before, a vertex was palette × k. Now it is
  white × k, times a material color equal to the palette color, and both
  multiply in linear space. So a model with its default color renders as
  before. Verified by pixel comparison (§4).
* **`GltfAsset`** takes an optional `paint` color. The template cache is
  keyed by (scene, color), so every instance of one color shares one
  template and one material; `paint` meshes get `getPaintMaterial(color ??
  default)`.
* **`building`:** `BUILDING_SLOTS` gains `paint`. The modules' wall faces
  and the app-built faces drawn in `WALL` go into it, white. `Building`
  gives the slot `getPaintMaterial(color ?? default)`.

### D4 — Which assets get a color (v1)

| Asset | Painted part | Label | Default |
|---|---|---|---|
| `vendingMachine` | cabinet (`vendingBody`) | Body color | red |
| `keiCar` | body (`carBody`) | Body color | sage |
| `keiTruck` | cab and bed (`BODY`) | Body color | today's |
| `scooter` | body panels (key to confirm) | Body color | today's |
| `house` | walls (`wallPlaster`) | Wall color | cream |
| `apartment` | siding (`wallSiding`) | Wall color | today's |
| `building` | walls (`WALL`) | Wall color | cream |
| `umbrellaFigure` | canopy | Umbrella color | today's |

* Only faces of the named key **that belong to that part** move to
  `paint`. A trim that shares the key stays `base` if it should not follow
  the color. This is decided per script and noted in §6.
* Not in v1: the bicycle (byte-identical rule), figures' clothes (a later
  candidate: "outfit colors per placed figure"), roofs, trees (the season
  recolors them), ground and scatter, the konbini (brand colors).

### D5 — Curated swatches, not a free color picker

Visual consistency comes first (CLAUDE.md §3, §5). Each paint region
offers **six to eight swatches**: new `paint*` keys in `palette.ts`
(Blender reads the file too; keep one `key: "#rrggbb",` per line).
Starting values, to be tuned by eye against the vending pilot (the
approved style benchmark), at Day and Golden Hour:

| Family | Swatches |
|---|---|
| Vehicles | sage `carBody`, white `#ecebe6`, silver `#b8bbbc`, navy `#3e485a`, brick red `#9e463d`, cream `#e6d9bd`, charcoal `#36373a` |
| Vending | red `vendingBody`, blue `#3f6b96`, white `#ebe9e2`, green `#4f7a3e`, mustard `#c9a645`, black `#2d2e30` |
| Walls | cream `wallPlaster`, grey-beige `wallSiding`, white `#f1eee6`, sand `#e1cda8`, sage `#c7d1bb`, blue-grey `#c2cad1`, brown `#9e8466` |
| Umbrella | white `clothWhite`, navy, red, yellow `#d8b646`, clear (light grey) |

Restrained, slightly dusty colors, never saturated (CLAUDE.md §5).

### D6 — Sign text

| Asset | Cell | Label | Default | Max |
|---|---|---|---|---|
| `shop` | `shop_sign` | Shop name | まるや商店 | 8 |
| `konbini` | `konbini_sign` | Store name | コトリマート | 8 |
| `apartment` | `apartment_board` | Building name | (today's) | 8 |
| `gatePost` | `name_plate` | Family name | (today's) | 4 |

* **Blender:** faces printed with an editable cell move to a new slot
  `sign`, appended after `paint`, with the same UVs into the atlas cell.
* **App, default text:** the `sign` slot uses the shared `printed`
  material, so an unchanged sign costs nothing.
* **App, custom text:** a material per (cell, text), like `printed` but
  with its own `CanvasTexture` of the cell's size. The painter draws the
  cell with that text. The texture's `offset` / `repeat` map the atlas UVs
  of the cell onto the small canvas (mind `flipY`). Lit cells also get the
  canvas as emissive map at the cell's `LIT_CELLS` level, so a custom shop
  name glows at night like the default one. The cache is refcounted:
  acquired on mount, disposed when the last user unmounts.
* **Painters take the text:** `paintShopSign(ctx, w, h, text)` and so on,
  with the default text in the registry's `sign.default`. Text is fitted
  with `fillText`'s `maxWidth`, as today. The name plate stacks its
  characters vertically. Japanese and Latin both work with the OS fonts
  (nothing is downloaded, HANDOFF).
* **Typing:** the field commits on Enter or blur, **never during IME
  composition** (`isComposing`). Each commit is one undo step. Empty goes
  back to the default (the field is removed). The text is not escaped
  into HTML anywhere: it is only drawn on a canvas and shown in an input.
* Not in v1: the kanban (`kanban_sakaya`, a vertical brand panel), the
  vending ad, road lettering, the bus stop's boards.

### D7 — Store and inspector

* **Store:** `setObjectColor(id, color | null)` and `setObjectText(id,
  text | null)`, each one history step (`commit`). `null` removes the
  field.
* **Inspector, Object tab, one object selected:** after Scale and before
  the asset's own panels (BuildingPanel, …):
  * **Color** (the asset's `paint.label`): a `radiogroup` of round
    swatches, the default first and marked "Default". Arrow keys move
    between them, each has an `aria-label` with its name, and the selected
    one has a visible ring. A swatch applies at once.
  * **Sign** (`sign.label`): a text input with the default as placeholder,
    `maxLength`, a character count, "Enter to apply", and a small "Reset"
    when custom.
* **Multi-selection:** no color or text controls in v1.
* **Locked objects:** colors and text stay editable. Lock means "cannot
  be moved, rotated or scaled" (`DioramaObject.locked` in
  `diorama.types.ts`); the transform fields stay disabled as today.
* The ghost while placing and the library thumbnails show the default.
* The Objects list shows no color (no change).

### D8 — Performance

* One material per distinct color, one template per (model, color), one
  texture per distinct (cell, text). Draw calls per object do not change.
* Measure with `measure-scene.mjs`: 100 kei cars in seven colors against
  100 in one color, editor and Preview at 1920 × 1080. The frame rate
  stays within noise; `renderer.info.programs` does not grow with the
  number of colors.

---

## 2. Files

| File | Change |
|---|---|
| `art/blender/lib/materials.py`, `builder.py` | `paint` and `sign` slots (appended); white paint key; preview Multiply node |
| `art/blender/lib/finish.py` | `paint` and `sign` faces are weathered like `base` and `printed` (the loop skips only `emissive`; confirm) |
| `art/blender/lib/facade.py` | Wall faces in `paint` |
| `art/blender/assets/…` | The eight assets of D4 and the four of D6; the building modules with wall faces |
| `public/models/**` | Rebuilt GLBs for those assets only |
| `features/diorama/utils/palette.ts` | `paint*` swatch keys |
| `features/diorama/types/diorama.types.ts` | `color`, `text` on `DioramaObject`; `AssetComponentProps.object` includes them |
| `features/diorama/assets/assetRegistry.ts` | `paint` and `sign` on the assets of D4 / D6 |
| `features/diorama/objects/materials.ts` | `getPaintMaterial`; `paint` and `sign` slots |
| `features/diorama/objects/textures/graphicsAtlas.ts` | Painters take text; per-text sign textures (refcounted) |
| `features/diorama/objects/GltfAsset.tsx` | Template per (scene, color); `sign` meshes |
| `features/diorama/objects/building/*` | `paint` slot |
| `features/diorama/components/DioramaObject.tsx` | Passes `color` / `text` |
| `features/diorama/utils/sceneValidator.ts` | D1 rules |
| `features/diorama/store/dioramaStore.ts` | `setObjectColor`, `setObjectText` |
| `features/diorama/components/SelectionPanel.tsx` + new `ObjectLookPanel.tsx` | The Color and Sign sections (keeps SelectionPanel under ~300 lines) |
| `plan/HANDOFF.md`, `plan/Product-Roadmap.md` | Status at the end of the stage; HANDOFF §1 still says Stage 18's PR was not opened: it is merged (PR #21, `812eca6`) |

---

## 3. Out of Scope

Figure outfit colors; roof colors and a second paint region per asset;
per-bay or per-floor building colors; the kanban, vending ad and bus-stop
texts; a free color picker (unless chosen in §5); colors for several
selected objects at once; user fonts; any change to the starters (they
keep their default colors and texts); thumbnails per color.

---

## 4. Verification

* `npm run lint`, `npx tsc --noEmit`, `npm run build`.
* **Blender:** rebuild every changed asset with `build.py`; each stays
  within its triangle budget and at most 3 draw calls (`paint` and `sign`
  add at most one draw call each to an asset that uses them; check the
  budgets in the scripts). **Every other GLB is byte-identical to `main`**
  (`cmp`), the parked bicycle included.
* **Same look by default:**
  * `capture-template.mjs` against the committed starter images: mean
    pixel difference at the noise level measured in Stage 18 (≤ 0.2), no
    pixels over 40;
  * `capture-thumbnails.mjs --only` the changed items: the same check
    against the committed thumbnails.
* **Colors:** for each asset of D4, place one, pick every swatch, and
  screenshot it at Day, Golden Hour and Night. Check by eye against the
  Visual Quality Gate (CLAUDE.md §49): same miniature world, no swatch
  that looks like a toy. Rain and snow still wet and whiten painted faces.
* **Signs:** custom Japanese and Latin texts on the four signs, at Day and
  Night (the shop and konbini signs glow); the longest allowed text fits;
  with the default text the rendered sign is pixel-identical to today's.
* **Behavior, real input, headless Chrome:**
  * swatch click → object recolored, one undo step, redo;
  * arrow keys across swatches; focus ring visible;
  * sign text typed with `Input.insertText` and with an IME-like
    composition (`Input.imeSetComposition`): no commit until the
    composition ends; Enter commits; empty resets;
  * duplicate, save as kit and place the kit, reload, export → import:
    color and text kept;
  * a locked object can still be recolored;
  * validator: a hand-edited file with `"color": "red"`, a color on a
    tree, a 40-character shop name → dropped, dropped, cut to 8; no crash.
* **Performance:** D8 numbers, before and after.
* **Stage 18's behavior script** still passes (24 checks).

---

## 5. Open Questions (settled by the defaults in bold, 2026-11-07)

1. **Swatches:** **curated swatches only (D5)**; or swatches plus a free
   color picker.
2. **Which assets:** **the eight of D4**; fewer (vehicles and the vending
   machine only); or more (figures' clothes too).
3. **The kanban:** **fixed (D6)**; or editable, vertical, up to 3
   characters.
4. **Locked objects:** **colors and text editable (D7)**; or disabled like
   the transform.
5. **Several selected objects:** **no color controls (D7)**; or a color
   for all selected objects that share a paintable type.

---

## 6. Results (2026-11-07)

### What was built

* **Scene data:** `DioramaObject.color` ("#rrggbb") and `text`, both
  optional and written only when they differ from the asset's default
  (files stay v2). `utils/objectLook.ts` holds the rules:
  `normalizeObjectColor` / `normalizeObjectText` (used by the validator
  and the store), `paintOf` (the color to draw, default included) and
  `customSignOf`. The validator keeps a well-formed hex on a paintable
  asset (lowercased), and a text on an asset with a sign (control
  characters stripped, trimmed, cut to `maxLength` code points); the
  default color and the default text are dropped like anything invalid.
* **Registry:** `paint: { label, swatches }` and `sign: { label, cell,
  maxLength }` on `AssetBase`. The swatch lists are in
  `assets/paintSwatches.ts`; the first swatch is the color the asset is
  modeled in (its Blender script's `PAINT`). Default sign texts are
  `SIGN_TEXTS` in `objects/textures/graphicsAtlas.ts`, beside their
  painters.
* **Blender:** a sixth slot, `paint`, appended to `MATERIAL_SLOTS`. Painted
  faces are modeled in `paintBase` (`#cccccc`) times their shade and
  weather like `base`. Scripts set `PAINT = "<palette key>"`; `build.py`
  hands it to the builder, whose `paint` slot material multiplies the
  vertex color by `PAINT / paintBase` (a Vector Math node), so the
  previews show the default color. `lib/facade.py` puts the wall plaster
  (`WALL`) in `paint` through `wall_color()`, which covers every building
  module.
* **What is painted:** kei car body, cabin, roof, pillars, bumpers and
  mirrors; kei truck cab, bed, drop sides and guard frame; scooter
  floorboard, leg shield, rear body, fender and handlebar cowl; vending
  machine cabinet, top cap, front door and pickup hood; house upper-floor
  plaster, belt course and gables (the lower siding band stays, so the
  house keeps two tones); apartment siding, floor band, gables and
  corridor fascia; building wall plaster, belt courses and corner posts,
  and the app-built walls under a shed roof.
* **App materials:** `getPaintMaterial(hex)` is a `base` material (same
  weather patch, same program) whose color is `hex / paintBase` in linear
  terms, cached per color. The `paint` slot without a color falls back to
  plain `base` (the gray shows).
* **Signs:** each sign asset prints exactly one atlas cell, so a custom
  text replaces its `printed` material rather than needing a new slot.
  `getSignMaterial(cell, text)` builds a `printed`-like material on a
  canvas of that cell alone (`createSignTexture`; offset / repeat map the
  atlas UVs onto it), glowing after dark at the cell's `LIT_CELLS` level
  and following `setSignGlow`. Materials are shared per (cell, text) and
  refcounted by the meshes showing them; the last one disposes the
  material and its texture. The painters take the text; `fitText`
  squeezes a long line to 80 % and then sets it smaller. A custom
  apartment name has no romanized line under it. The name plate stacks
  any number of characters.
* **GltfAsset:** templates per (scene, color), and per sign material for a
  custom sign, so every instance of one look shares one template.
  `Building` gives its `paint` slot the object's color.
* **Store:** `setObjectColor(id, hex | null)` and `setObjectText(id, text
  | null)`, one undo step each, allowed on locked objects; a value equal to
  the default removes the field.
* **Inspector (`ObjectLookPanel`, Object tab, one object):** the color as
  a radio group of round swatches (default first, marked, arrow keys move
  and apply, checked ring, `aria-label` per swatch), and the sign as a text
  field (default as placeholder, `maxLength`, count, applies on Enter or
  blur, never on an Enter that ends an IME composition, Reset when
  custom). Nothing for a multi-selection.

### Deviations from the plan

* **`paintBase` gray instead of white:** shades above 1 (the vending door
  is 1.05) would clip in white, so painted faces are modeled in `#cccccc`
  and the material color is divided by it.
* **No `sign` slot:** not needed, since every sign asset has a single
  print (checked in the scripts); the shop, konbini and gate-post GLBs are
  unchanged.
* **The umbrella figure is not paintable:** its canopy is clear vinyl in
  the `glass` slot (Stage 16), not `clothWhite` as §0 assumed. Painting it
  would need an opaque paint glass and would lose the ビニール傘, so it was
  left out.
* **Swatch values tuned by eye:** brick red `#8e4b43`; vending blue
  `#4a6b8c`, green `#5b7a4c`, mustard `#bd9f58`; wall sand `#ddcfb2`,
  brown `#93806c`. The kei truck offers white (default), silver, sage,
  navy, brick and charcoal; the scooter cream (`tankCream`, default) and
  the vehicle colors; walls offer cream and greige both ways round.
* **Registry shape:** `paint` has no `default` (the first swatch is it)
  and `sign` has no `default` (`SIGN_TEXTS`).
* **The validator keeps any well-formed hex,** not only the current
  swatches, so a file stays valid if a swatch list changes. The UI only
  offers swatches.
* **The sign field keeps focus after Enter and after Reset:** the first
  version remounted the field on every commit (its key held the text),
  which dropped keyboard focus; it now adjusts its draft when the stored
  text changes.
* **Thumbnails and starter images were not re-committed:** re-rendered,
  they differ from `main` only at the noise level (below).

### Verification

* `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.
* **Blender:** the 13 changed assets rebuilt within budget and at most four
  draw calls: vending machine 3,456 tris / 4, kei car 2,928 / 4, kei truck
  2,400 / 4, scooter 1,448 / 2, house 1,056 / 3, apartment 3,324 / 4,
  building modules 12–1,992 / 1–4. Every other GLB is byte-identical to
  `main` (the parked bicycle rebuilt and compared). **The build is not
  byte-deterministic for most assets, and was not on `main` either:** two
  builds of `main`'s kei car and shop differ from each other and from the
  committed GLBs (vertex order and per-face jitter), so the check is "same
  triangles and colors", not `cmp`, except for the bicycle.
* **Same look by default:**
  * In the GLB data, the shading factors of the painted faces (vertex
    color / `paintBase`) match `main`'s (vertex color / default color):
    same quantiles within 0.6 % for the kei car, kei truck, scooter,
    apartment and bay wall (8-bit color storage).
  * All 70 thumbnails and the 3 starter images re-rendered against
    `main`'s: paintable assets 0.17–0.68 mean difference, no pixel over 40
    except 21 at the apartment's shadow edge; untouched assets up to 0.27
    (crosswalk); the shop with its default sign 0.00; starters 0.43–0.54,
    one pixel over 40. The diff images show scattered noise, mostly on
    shadows, no change in the painted parts.
* **Colors:** every swatch of the seven assets at Day, Golden Hour and
  Night, the kei car and the house in rain and snow. Restrained colors
  that sit with the collection; rain darkens and snow whitens painted faces
  like the rest.
* **Signs:** close-ups of the shop (さくら商店, Café Mor, ABCDEFGH, 八百屋),
  konbini (ヨツバマート, HAPPY MA), apartment (メゾン桜, Sunny Co) and gate
  post (佐藤, 小田切, SATO) by day and night: the longest texts fit, the
  shop and konbini signs glow after dark like the defaults.
* **Behavior, headless Chrome, real input, 43 checks pass (twice):** swatch click
  (color stored, one undo step, undo removes the field, redo); arrow keys
  apply and move focus, the focus ring shows; back to the default removes
  the field; a locked car recolors; a tree shows neither section; sign text
  typed with `Input.insertText` does not commit until Enter; an Enter
  during an `Input.imeSetComposition` composition does not commit; Enter
  commits one step and keeps focus; the field stops at 8 characters; blur
  commits; empty resets; Reset removes the text and returns focus;
  duplicates keep both fields; no controls for a multi-selection; the
  store ignores a color on a tree; save as kit (through the UI) and place
  it: kept; save and reload: kept; custom signs use their own small
  textures; a hand-edited import drops `"color": "red"`, a color on a tree
  and the default text, lowercases `#3E485A`, and cuts a 40-character shop
  name (with a control character) to `ABCDEFGH`; an off-swatch color
  shows "Custom" with no swatch checked and one tab stop; the ghost of
  "Move to a surface" keeps the object's color; six emoji on the name plate
  stop at four characters ("4/4"); no page errors.
* **Performance** (`measure-scene.mjs`, 100 kei cars, 1920 × 1080, three
  runs each): one color and seven colors both 404 draw calls, 10 programs,
  9 textures, editor 180 fps (the headless cap); Preview 81–127 fps with
  one color and 89–134 with seven, within the known drift.
* Stage 18's behavior script was a one-off and is not in the repository,
  so it was not re-run; the Object and Scene tabs were checked in the
  screenshots above.

### Known limitations

* Not tried in the user's own browser.
* One paint region per asset; the umbrella, figures, bicycle, roofs, trees
  and the konbini have none.
* Library thumbnails and the placing ghost show the default color.
* The kanban, vending ad, bus-stop boards and road lettering keep fixed
  texts.
* Each distinct custom sign text adds one small texture and material;
  each distinct color one material (same program).
* Blender builds are not byte-reproducible (above).

### Review (2026-11-07)

A code review of the branch (`/code-review`, medium) found eight points,
all fixed: a color that is no swatch (possible from a file) showed the
default swatch as checked, now none is and the label says "Custom"; the
ghost of "Move to a surface" showed the default color and sign; sign
materials made by a render that never committed stayed cached, and are
now swept when a sign is released; the field's `maxLength` counted UTF-16
units while the counter and the store count characters, so the limit is
now applied in code (not during an IME composition); a multi-piece run
did not pass its color (no run type is paintable yet); the store's two
setters shared one helper; an empty wall geometry was merged into every
non-shed building; a comment pointed at the wrong swatch file. The pull
request itself was not opened: the GitHub CLI is not installed.
