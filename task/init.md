# Farmodoro — Homepage UI Prototype Brief

> **Goal for the agent:** Build ONE polished, static homepage that proves the UI/UX concept.
> No backend, no auth, no database, no real gameplay. Mock data only.
> Priority order: **(1) Beautiful, working UI → (2) Smooth animations → (3) Clean code structure.**

---

## 0. Read this before writing code

This repository uses a **modified Next.js** (see `AGENTS.md`). APIs and conventions may differ from
what you know. **Before writing any component, read the relevant guide in `node_modules/next/dist/docs/`**
(App Router, layouts, `"use client"` components, styling). Heed any deprecation notices.

---

## 1. Role

You are a **Senior Frontend Engineer + UI/UX Designer**.
You are building a *demo homepage* good enough to show investors — not a full product.

## 2. What Farmodoro is (for this prototype)

A cozy, focus-oriented virtual workspace that combines:

- **Pomodoro timer**
- **Todo list**
- **Ambient full-screen backgrounds**
- **Lofi music (YouTube embed)**

Tagline: **"Focus • Grow • Relax"**

The page should feel like a **calm virtual room you want to work in** — think *LifeAt.io*, *Virtual Cottage*,
*Lofi Girl*. **NOT** a dashboard, **NOT** an enterprise admin panel.

> ⚠️ **Out of scope (do NOT build):** farming gameplay, planting, crops, harvesting, plant-growth
> mechanics, coin economy, or any game logic. This is a UI shell only.

---

## 3. Tech stack (match the real project — do not swap)

| Concern    | Use                                                        |
|------------|------------------------------------------------------------|
| Framework  | **Next.js 16 (App Router)** — already installed            |
| UI         | **React 19 + TypeScript**                                   |
| Styling    | **Tailwind CSS v4** — already installed                    |
| Animation  | **Framer Motion** (`motion`) — *install if missing*        |
| Icons      | **lucide-react** — *install if missing*                    |
| Data       | Local mock data / React state only. **No backend.**        |

- Build the homepage as the root route (`app/page.tsx`) + a client component tree.
- Interactive pieces (timer, todo, music, background switching) must be **client components** (`"use client"`).
- If `framer-motion` or `lucide-react` aren't in `package.json`, install them before using.
  If installing isn't possible, fall back to CSS/Tailwind transitions + inline SVG icons — but still ship the UI.

---

## 4. Design language

Feel: **cozy · minimal · peaceful · premium**. Warm, low-saturation, lots of soft blur.

- **Glassmorphism** panels: translucent background, `backdrop-blur`, 1px light border, soft shadow.
- **Rounded corners** (16–24px), generous padding, comfortable whitespace.
- **Soft shadows**, no hard edges, no neon, no dark cyberpunk, no Material Design.
- Everything **floats above the background** on translucent cards.

### Color palette (use these as the base)

| Token         | Hex        | Use                              |
|---------------|------------|----------------------------------|
| Cream         | `#FDF6EC`  | text on dark bg, light accents   |
| Beige         | `#EAD9C2`  | card tints                       |
| Warm Brown    | `#8B6F52`  | headings, primary accent         |
| Soft Green    | `#A7C4A0`  | success / "focus" accent         |
| Pastel Orange | `#F0B27A`  | buttons, highlights              |
| Muted Blue    | `#9DB4C0`  | secondary accents                |

Glass surface reference: `bg-white/15` (or warm tint), `backdrop-blur-xl`, `border border-white/25`,
`shadow-[0_8px_32px_rgba(0,0,0,0.15)]`. Tune opacity so text stays readable over any background.

### Typography

- Modern, rounded, readable sans-serif (e.g. Inter / Poppins-style).
- **Timer:** very large (≈`text-7xl`+), tabular numbers.
- **Headings:** medium. **Descriptions:** small, muted.

---

## 5. Layout

Full-viewport (`h-screen`, `overflow-hidden`) with layers stacked front-to-back:

```
┌─────────────────────────────────────────────┐
│  Full-screen background (image + overlay)     │  ← layer 0
│                                               │
│  ┌───────── Floating navbar (top) ─────────┐  │  ← layer 1
│                                               │
│   ┌────────┐   ┌──────────┐   ┌──────────┐    │  ← layer 2
│   │ Todo   │   │ Pomodoro │   │  Music   │    │
│   │ (left) │   │ (center) │   │ (right)  │    │
│   └────────┘   └──────────┘   └──────────┘    │
│                                               │
│  ┌──── Background gallery (bottom) ────────┐  │  ← layer 3
└─────────────────────────────────────────────┘
```

- A subtle dark→transparent gradient overlay sits between the background and the cards for legibility.
- Center panels are horizontally arranged on desktop, and **stack vertically** on tablet/mobile.

---

## 6. Components (detailed specs)

### 6.1 Background (layer 0)
- Full-screen image covering the viewport (`object-cover`).
- Switches instantly when the user picks a thumbnail, with a **smooth cross-fade** (~500ms).
- Preload/lazy is fine; a colored gradient placeholder while loading is acceptable.
- Source images from Unsplash URLs (or bundle a few in `/public`). If images fail, fall back to a warm gradient.

### 6.2 Floating Navbar (layer 1) — glass bar pinned near the top
- **Left:** "Farmodoro" wordmark + subtitle `Focus • Grow • Relax` (+ a small leaf/timer icon).
- **Center:** nav links — `Home` · `Workspace` · `Statistics` · `Settings`
  (visual only; active state on `Home`, no routing required).
- **Right:** a **demo profile** — avatar + display name + optional focus streak badge.
  *(Keep it light — no coins/level economy.)*
- Hidden or collapsed into a menu on mobile.

### 6.3 Todo List (left panel)
- Title + a progress indicator (e.g. `2/4 done` and a thin progress bar).
- List of tasks, each with a checkbox, label, and a delete (×) button.
- **Add task:** input + button (or Enter to add).
- **Check:** toggles completed — strike-through + fade, animated.
- **Remove:** item animates out.
- State via `useState`/`useReducer`. Seed with mock data (§7).

### 6.4 Pomodoro Timer (center panel — the hero)
- Large **circular timer**, default `25:00`.
- **Tabs:** `Focus (25:00)` · `Short Break (05:00)` · `Long Break (15:00)` — switching resets the time.
- **Controls:** `Start` · `Pause` · `Reset`.
- **Animated progress ring** (SVG stroke-dashoffset) that depletes as time passes.
- When running, add a **subtle glowing ring / soft pulse** around the timer (ambient, not distracting).
- Real countdown with `setInterval` (clean up on unmount/pause). At `00:00`, stop gracefully.

### 6.5 Music Panel (right panel)
- **YouTube URL input** + `Load` button → embeds that video in an **iframe kept inside the card**
  (`rounded`, `overflow-hidden`, `aspect-video`).
- **Preset playlists** (buttons/list): `Lofi Hip Hop` · `Chill Beats` · `Piano Focus` · `Coffee Jazz` · `Nature Sounds`.
  Selecting one loads its embed. Highlight the active preset.
- Parse the YouTube ID from common URL forms; if invalid, show a gentle inline error.

### 6.6 Background Gallery (bottom, layer 3)
- **Horizontally scrollable** strip of background thumbnails, each with a small title.
- Selected item: **glowing border + slight scale-up**. Hover: gentle lift/scale.
- Clicking selects that background (drives §6.1).

### 6.7 Shared primitives
- `Card` (glass surface wrapper), `Button` (variants: primary / ghost). Reuse everywhere — no duplicated styles.

---

## 7. Mock data

```ts
// Todos
["Learn React", "Read Clean Code", "Finish UI Design", "Workout"]  // last one completed

// Backgrounds (id, title, thumbnail, full image) — NO farm
Forest · Beach · Coffee Shop · Japanese Garden · Snow Cabin · Rainy City · Library · Mountain Sunset

// Music presets
Lofi Hip Hop · Chill Beats · Piano Focus · Coffee Jazz · Nature Sounds   // each maps to a YouTube ID
```

Keep all mock data in `data/` (or `lib/`) as typed constants, not inline in components.

---

## 8. Animations (Framer Motion)

Animate, but keep it **calm** — no excessive motion:
- **Page load:** cards fade + slide up, gently staggered.
- **Cards on hover:** slight scale (~1.02) + softer shadow.
- **Background switch:** cross-fade.
- **Timer running:** subtle glowing ring / breathing pulse.
- **Todo check:** smooth strike-through + fade.
- **Gallery thumbnails:** hover lift, selected scale.

---

## 9. Responsive

Desktop-first, then degrade gracefully:
- **Desktop/Laptop:** three panels side-by-side.
- **Tablet:** panels wrap to 2 columns or stack; navbar condenses.
- **Mobile:** panels stack vertically, comfortable scroll; gallery stays horizontally scrollable.
No horizontal page overflow at any breakpoint.

---

## 10. Suggested file structure

```
app/
  page.tsx              // composes the homepage
  layout.tsx            // fonts, global styles
components/
  Background.tsx
  Navbar.tsx
  PomodoroTimer.tsx
  TodoList.tsx
  MusicPanel.tsx
  BackgroundGallery.tsx
  ui/Card.tsx
  ui/Button.tsx
hooks/
  useTimer.ts           // countdown logic
  useTodos.ts           // todo state
data/
  backgrounds.ts
  musicPresets.ts
  todos.ts
types/
  index.ts              // shared interfaces (Todo, Background, MusicPreset)
```

Rules: reusable components, TypeScript interfaces for all data, custom hooks for logic,
no giant God-components, no duplicated code.

---

## 11. Definition of Done (acceptance checklist)

- [ ] Homepage renders full-screen with a background image + glass panels floating on top.
- [ ] Background can be switched from the bottom gallery with a smooth fade.
- [ ] Todo list: add, remove, and check tasks — with progress and animation.
- [ ] Pomodoro: tabs switch presets; Start/Pause/Reset work; ring animates; real countdown.
- [ ] Music: preset selection and YouTube-URL load both embed inside the card.
- [ ] Navbar shows logo, subtitle, nav links, and demo profile.
- [ ] Warm/cozy palette, glassmorphism, rounded corners, soft shadows throughout.
- [ ] Layout is responsive (desktop → tablet → mobile) with no horizontal overflow.
- [ ] Runs with `npm run dev` and looks presentable enough to demo.

**Deliverable:** a complete, impressive homepage prototype. No backend, no auth, no API.
