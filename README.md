# Japanese Diorama Builder

A browser-based 3D creative tool for building miniature Japanese streets and
everyday-life scenes — houses, small shops, utility poles, vending machines,
bicycles and plants on a model base — and photographing them like a physical
miniature.

Working title. Desktop browsers only.

## Running it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

| Route | What |
|---|---|
| `/` | Home page |
| `/dioramas` | My Dioramas: every diorama kept in this browser |
| `/diorama/[id]` | The editor, for one diorama |
| `/diorama` | Opens the most recently edited diorama (or a new one from the hero starter) |
| `/diorama/new?starter=<id>` / `?base=<corner\|plot>` | Creates a diorama and opens it |

Dioramas are stored locally in IndexedDB; there is no backend yet. A diorama
can be exported as a `.diorama.json` file and imported again.

```bash
npm run lint    # ESLint
npm run build   # production build (also type-checks)
```

## Stack

Next.js (App Router), React, TypeScript, React Three Fiber + drei, Zustand,
Tailwind CSS. Fixed-shape models are scripted in Blender (`art/blender/`) and
exported as GLB into `public/models/`.

## Where things are

* `features/diorama/` — the editor: canvas, objects, store, scene format
* `features/dioramas/` — the local collection (My Dioramas) and its storage
* `features/home/` — the home page's interactive parts
* `scripts/` — headless capture and measurement scripts (need the dev server)
* `plan/` — the roadmap and one plan document per stage; start with
  `plan/HANDOFF.md`
* `CLAUDE.md` — product direction, art direction and engineering rules
