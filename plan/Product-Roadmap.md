# Product Roadmap — From Editor to Public Application

Follows Stage 16 (everyday people). The editor, the asset library, the
environment and Photo mode (CLAUDE.md Phases 1–5) are in place. This
document sets the order of the work that turns the editor into a complete,
public application: CLAUDE.md Phase 6 (Cloud Platform) and Phase 7
(Community), plus what a public launch needs.

> **User decisions (2026-10-17).** Asked what comes after Stage 16, the
> user chose to develop the project into a complete application:
> * **Audience:** public, open to everyone.
> * **Order:** backend early: after the local My Dioramas stage, go
>   straight to accounts and cloud.
> * **Backend:** a complete backend of our own, in **Node.js** (not a
>   hosted backend such as Supabase or Firebase).
> * **Devices:** desktop only.
>
> This is the explicit request CLAUDE.md §4, §33 and §47 require before
> Phases 6–7 are built.
>
> **Physical model export (user decision, 2026-10-17, same day).** The
> user also wants a diorama to be exported as a file that can be 3D-printed
> into a real miniature model:
> * **No printer of their own:** prints are ordered from a print service
>   (e.g. JLC3DP, Craftcloud), so files follow those services' rules.
> * **One piece first, a kit of parts later.**
> * **Backend first, printing after:** the print stages come after the
>   platform stages (§3).

Each stage gets its own `Stage-N-Implementation.md` when it starts, in the
same format as Stages 1–16, and is approved before it is implemented.

---

## 0. Starting Point (verified 2026-10-17)

* **Web app:** Next.js 16 (App Router), React 19, R3F, Zustand, Tailwind 4.
  The editor lives at `/diorama` (`app/diorama/page.tsx`).
* **The home page `/` is a leftover** of the starter template (a Pomodoro
  timer, a to-do list, a music panel: `app/page.tsx`, `components/`,
  `data/backgrounds.ts`). It has nothing to do with dioramas.
* **One scene only:** the scene autosaves to localStorage under
  `diorama-scene` (`utils/sceneSerializer.ts`); user kits under
  `diorama-kits`. Import and export are JSON files. The file format is
  versioned (`SCENE_FILE_VERSION`) with upgrades on load.
* **Assets are app-authored:** GLBs and thumbnails in `public/` (7.2 MB).
  A scene stores object types, not asset URLs, so scene data is portable.
* **No tests, no CI, no deployment.** Verification has been manual plus
  the headless capture scripts in `scripts/`.
* **Dev machine:** Node 22.14, npm 10.9, Docker 29. No local PostgreSQL.

## 1. What "Complete" Means Here

A visitor can:

1. land on a home page that explains the product and shows dioramas,
2. build in the editor **without an account** (local, as today),
3. sign up and keep **many dioramas** in the cloud, on any desktop,
4. **publish** a diorama with a photo, as a public read-only page with
   its own link,
5. **explore** published dioramas, like them, comment on them, and
   **remix** one into their own collection (crediting the original),
6. have a profile, delete their account and data,
7. **download a diorama as a print file** (3MF or STL, at a chosen scale)
   and order it from a print service as a physical miniature,

and the service is operated safely: content can be reported and
moderated, abuse is rate-limited, data is backed up, errors are seen.

Out of scope for this roadmap: mobile or tablet editing (desktop only),
real-time multiplayer, a marketplace, user-uploaded 3D models, payments,
ordering prints from inside the app (the user takes the file to a print
service).

---

## 2. Architecture Decisions

### A1 — One repository, npm workspaces

```text
/            the Next.js web app (unchanged location)
/server      the Node.js API (its own package.json, own build)
/shared      scene types, the scene validator and upgrades, API types
```

* The web app stays at the root: moving it into `apps/web` would touch
  every path for no product value (CLAUDE.md Rule 3).
* `shared/` exists because the server must validate and upgrade scene
  files exactly as the client does. `diorama.types.ts`'s scene types,
  `sceneValidator.ts` and the upgrades in `sceneSerializer.ts` move there;
  the web app imports them from `shared/`. Nothing else moves.

### A2 — Server stack

| Concern | Choice (default) | Why |
|---|---|---|
| Runtime | Node.js 22 LTS, TypeScript | Already on the dev machine; same language as the client |
| HTTP framework | **Fastify** | Fast, built-in JSON schema validation, first-class TypeScript, lighter than NestJS |
| Database | **PostgreSQL 16** | Relational data (users, likes, comments) plus scenes as `jsonb` |
| Query layer | **Drizzle ORM** + drizzle-kit migrations | SQL-shaped, typed, small runtime |
| Validation | **Zod** in `shared/` | One schema for client and server; API request/response types derived from it |
| File storage | Storage interface: local disk in dev, **S3-compatible** in production | Thumbnails and published photos |
| Email | Interface: console in dev, an SMTP provider in production | Verification and password reset |
| Tests | **Vitest** (server, shared), later Playwright for end-to-end | |
| Local dev | **Docker Compose** for PostgreSQL | Docker is installed; no PostgreSQL install needed |

The API is a separate process (`server/`), not Next.js route handlers, as
the user asked for a complete backend of its own. The web app talks to it
over HTTP.

### A3 — Authentication of our own

* Email + password, hashed with **argon2id**. Email verification and
  password reset by one-time tokens (hashed in the database, short-lived).
* **Server-side sessions** in PostgreSQL, sent as an `httpOnly`,
  `Secure`, `SameSite=Lax` cookie. No tokens in localStorage.
* CSRF: `SameSite` cookies plus an `Origin` check on every state-changing
  request.
* Rate limits on sign-up, log-in, reset and every write.
* Google sign-in is added in the launch stage (open question 3).

### A4 — Local-first, cloud as sync

* The editor keeps working without an account or a network, as today.
* Signed in, each diorama syncs to the server, debounced as autosave is
  (CLAUDE.md §32). Each save carries the diorama's `revision`; the server
  rejects a stale revision, and the client asks which copy to keep
  (no silent overwrite, no merge of two scenes).
* On first sign-in, local dioramas can be moved into the account.

### A5 — Scene data on the server

* A diorama row stores the scene file (`version` + `scene`) as `jsonb`,
  its `schema_version`, a `revision`, and a thumbnail key.
* The server validates every upload with the shared validator, upgrades
  old versions, and rejects a file newer than it knows. Size limit per
  scene (default 2 MB).
* A **published diorama is an immutable snapshot** (scene + photo +
  title), separate from the working copy. Editing the working copy does
  not change what was published; publishing again creates a new snapshot.
  Remixing copies a snapshot into the remixer's collection and records
  `remixOf`.

### A6 — Client side of the API

* API calls live in `services/` modules; components use hooks
  (CLAUDE.md §40). **TanStack Query** is introduced for server state
  (CLAUDE.md §9, §39), not duplicated into Zustand.
* Scene state and editor state stay as they are; the cloud is a place a
  scene file is saved to, like localStorage.

### A7 — Initial data model

```text
users            id, email, email_verified_at, password_hash, handle,
                 display_name, created_at, deleted_at, role
sessions         id (hashed), user_id, created_at, expires_at, user_agent
auth_tokens      id (hashed), user_id, kind (verify|reset), expires_at
dioramas         id, owner_id, name, scene jsonb, schema_version,
                 revision, thumbnail_key, created_at, updated_at, deleted_at
publications     id, diorama_id, owner_id, slug, title, description,
                 scene jsonb, schema_version, photo_key, remix_of_id,
                 like_count, comment_count, status (visible|hidden),
                 published_at
likes            user_id, publication_id, created_at
comments         id, publication_id, author_id, body, created_at,
                 deleted_at, status
reports          id, reporter_id, target_kind, target_id, reason,
                 created_at, resolved_at, resolved_by
```

User kits stay local until a stage asks for them in the cloud.

---

## 3. Stages

| Stage | Name | Phase | Backend? |
|---|---|---|---|
| 17 | App shell and My Dioramas | 6 (local part) | No |
| 18 | Backend foundation | 6 | Yes |
| 19 | Accounts | 6 | Yes |
| 20 | Cloud save | 6 | Yes |
| 21 | Publish and share | 7 | Yes |
| 22 | Explore, likes, remix, profiles | 7 | Yes |
| 23 | Comments and moderation | 7 | Yes |
| 24 | Print export: one piece | Print | No |
| 25 | Print kit: parts and assembly | Print | No |
| 26 | Print color and decals | Print | No |
| 27 | Production and launch | — | Yes |

The print stages need no backend and could move earlier if the user asks;
they come after Stage 23 because the user chose backend first. They come
before launch so that the public product ships with print export, which is
what sets it apart.

### Stage 17 — App shell and My Dioramas (local)

**Status (2026-10-17):** implemented and verified, not committed; see
[Stage-17-Implementation.md](Stage-17-Implementation.md). IndexedDB was
chosen (open question 1 of that plan).

* Remove the template leftovers (`app/page.tsx`'s Pomodoro/to-do/music,
  the components and data only it uses).
* A real home page: what the product is, a "Start building" button, the
  starters as cards.
* **My Dioramas** (local): many scenes in local storage, each with a name,
  a thumbnail captured from the canvas, and its updated time. Create (empty
  or from a starter), open, rename, duplicate, delete.
* The editor at `/diorama/[id]`; the current single autosave is upgraded
  into the first entry, so nothing the user has is lost.
* Storage moves from localStorage to **IndexedDB** if thumbnails and many
  scenes do not fit localStorage's ~5 MB (decided in the stage doc).

### Stage 18 — Backend foundation

* npm workspaces; `shared/` with the scene types, validator and upgrades
  (A1); the web app imports them from there with no change in behavior.
* `server/`: Fastify app, config from environment (`.env`, never
  committed), structured logging, error handling, `/health`.
* Docker Compose for PostgreSQL; Drizzle schema and the first migration.
* Vitest for `shared/` and `server/` (the validator and upgrades get the
  tests they never had).
* **GitHub Actions CI:** lint, type-check, test, build for both packages.
* No user-facing change.

### Stage 19 — Accounts

* Sign up, verify email, log in, log out, forgot/reset password, change
  password, account page (A3).
* Web: sign-in and sign-up pages, the signed-in state in the header,
  `services/auth.ts` + hooks.
* Rate limiting; tests for every auth flow.

### Stage 20 — Cloud save

* Dioramas API: list, get, create, update (with `revision`), rename,
  duplicate, delete (soft), thumbnail upload.
* My Dioramas shows cloud dioramas when signed in; autosave syncs (A4);
  conflict prompt; move local dioramas into the account.
* Quotas (default: 100 dioramas, 2 MB per scene, 500 KB per thumbnail).

### Stage 21 — Publish and share

Stages 21–23 (Phase 7) are planned in detail in
[Phase-7-Community.md](Phase-7-Community.md).

* Publish from the editor or Photo mode: title, description, the photo
  (from the existing photo export). Creates a snapshot (A5).
* A public read-only viewer at `/d/[slug]`: orbit the diorama, see the
  photo, the author, the date. Works without an account.
* Open Graph image and metadata, so a shared link shows the photo.
* Unpublish; publications listed in My Dioramas.

### Stage 22 — Explore, likes, remix, profiles

* Explore: newest and most-liked, paginated, with photos.
* Like / unlike (signed in).
* **Remix:** "Remix this" copies the snapshot into the visitor's
  dioramas (sign-in required to save), with "Remixed from …" shown on
  both the remix's publication and the original.
* Profiles at `/u/[handle]`: display name, published dioramas.

### Stage 23 — Comments and moderation

* Comments on publications (plain text, length-limited, rate-limited);
  authors can delete their own; publication owners can delete comments on
  theirs.
* Report a publication, a comment or a profile.
* An admin area (role `admin`): the report queue, hide/restore a
  publication or comment, suspend a user.

### Print track — what was found (2026-10-17)

A Blender check of all 66 GLBs in `public/models` (open edges and shells
after merging duplicate vertices):

* **63 of 66 are made of closed shells.** Overlapping closed shells are
  accepted by slicers and print services (they union them), so most of the
  library is printable as it is.
* **3 have open edges:** `street_fence_01` (216), `people_umbrella_01`
  (8, the one-sided canopy), `nature_scatter_weeds_01` (6).
* A few have non-manifold edges where two shells touch along an edge
  (e.g. `prop_propane_tanks_01`, 40); a union or a tiny offset fixes them.
* **Not in the GLBs, so not checked yet:** what app code builds — the
  modular building, walls and fences by length, the ground and its
  levels, road markings, power lines, scatter layers.
* three.js ships `STLExporter` and `OBJExporter`, and `fflate` (bundled
  with three's examples) can write the 3MF zip: **no new dependency.**

Sizes at **1:150** (Japanese N gauge, the scale of Japanese model railway
and diorama kits, which the model-railway look of the assets already
follows): the 16 × 16 m corner base is 107 × 107 mm, a 1.68 m person
11 mm, a 10 m utility pole 67 mm. At 1:87 (HO) the base is 184 mm. Both fit
a print service's standard build volume.

### Stage 24 — Print export: one piece

* **Export → Print file** in the editor: scale (**1:150**, 1:87, custom),
  format (**3MF**, STL), the material preset of the print service (sets
  the minimum wall and detail size: resin ≈ 0.5 mm, nylon SLS ≈ 0.8 mm,
  FDM ≈ 1.0 mm), the printed size in millimeters.
* The whole scene — base and every visible object — as one model in
  millimeters, Z up, the base's bottom at Z = 0.
* **Printability rules per asset** in the registry: printed as is,
  thickened to the minimum (power lines, railings, poles' thin parts),
  replaced by a solid (glass panes → a thin solid; the umbrella canopy →
  a closed shell), or left out (scatter leaves and pebbles, road paint,
  decals), each listed in the dialog.
* The three open GLBs are made closed; the app-code geometry (buildings,
  runs, ground) is checked and made closed.
* A thin-part report: objects whose details stay under the preset's
  minimum at the chosen scale.
* Verification: every exported file closed (the Blender check run on the
  export), opened in a slicer; the user orders one test print.
* If Stage 21 exists by then: "Download print file" on a publication page
  (owner's choice).

### Stage 25 — Print kit: parts and assembly

* Export as a kit: the base, and each building, pole, vehicle, figure and
  prop as its own part, laid out flat for printing.
* Sockets in the base and pegs on parts so pieces go back to where they
  were placed; part labels; an assembly sheet (a top view with numbers).
* Lets the user paint parts before assembling, as with a real kit.

### Stage 26 — Print color and decals

* 3MF with one color per part (from the palette), for print services and
  printers that print in full color or several materials.
* A **decal sheet** (a PDF at the print scale): shop signs, the vending
  machine front, road markings, name plates — printed on paper or decal
  film and applied by hand, as with real model kits.

### Stage 27 — Production and launch

* Hosting, domain, HTTPS; production PostgreSQL with daily backups;
  S3-compatible storage; an email provider.
* Error tracking and uptime monitoring; request logs without personal
  data.
* Terms of service, privacy policy, account and data deletion, data
  export (the scene files the user owns).
* Google sign-in (if chosen). WebGL-unavailable and small-screen notices
  (desktop only), loading states, an onboarding hint for first-time
  editors.
* Load test of the public pages and the save path; a security review.

### Parallel track — the editor and the library

The editor itself still has candidates (HANDOFF §7): per-object colors
and editable sign text, more figures and poses, editor limits, ground and
roads. They can be scheduled between platform stages when the user asks;
they do not depend on the backend, and **per-object customization should
come before launch**, since every published diorama benefits from it.

---

## 4. Rules That Carry Over

* Scene data stays the source of truth and stays portable (CLAUDE.md
  Rule 1, Rule 7). The server stores scene files; it never stores Three.js
  state.
* The hero, Back Street and Residential Lane starters stay visually
  unchanged by platform stages.
* No backend code in UI components; no `fetch()` in components
  (CLAUDE.md §40).
* Secrets only in environment variables; `.env*` stays git-ignored.
* Each stage: its own branch, plan doc approved first, the user commits
  and merges (HANDOFF §8).

## 5. Open Questions (defaults in bold)

1. **HTTP framework:** **Fastify**; Express; NestJS.
2. **Database access:** **Drizzle**; Prisma.
3. **Sign-in methods:** **email + password now, Google added at
   launch**; Google from Stage 19; email only.
4. **Local database:** **PostgreSQL in Docker Compose**; a local install.
5. **Repository:** **one repo with npm workspaces (A1)**; a separate repo
   for the server.
6. **Editor without an account:** **yes, local as today; an account only
   to save to the cloud, publish, like or comment**; or sign-in required.
7. **Comments at launch:** **yes, with reporting and moderation
   (Stage 23)**; or launch without comments.
8. **Hosting (decided in Stage 27):** **the web app on Vercel, the API and
   PostgreSQL on a managed Node host (Railway, Render or Fly.io),
   storage on an S3-compatible service (e.g. Cloudflare R2)**; or one VPS
   running everything in Docker.
9. **Product name and domain** for launch: the working title is
   "Japanese Diorama Builder"; the final name is the user's to choose
   before Stage 27.
10. **Default print scale:** **1:150 (N gauge)**; 1:87 (HO); 1:100.
11. **Default print material preset:** **resin** (fine detail suits 1:150);
    nylon SLS; FDM.
12. **Print stages before or after launch:** **before (Stages 24–26, launch
    is 27)**; or launch first and add printing after.
