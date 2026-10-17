# Phase 7 — Community (Phase Plan)

Follows [Product-Roadmap.md](Product-Roadmap.md) §3, which places CLAUDE.md
Phase 7 (Community) in **Stages 21, 22 and 23**. This document turns those
three short stage outlines into one plan for the whole phase: the
decisions, the data, the API, the pages, the abuse rules and how each stage
is verified. When a stage starts, its own `Stage-N-Implementation.md` is
written from the matching section here and approved first, as for
Stages 1–16.

> **User request (2026-10-17):** "hãy lên plan thực hiện phase 7" — plan the
> implementation of Phase 7. Planning only; nothing is implemented.

---

## 0. Prerequisites — Phase 7 cannot start yet

Checked in the repository on 2026-10-17 (`main` at `848cd58`, Stage 16
merged as PR #19):

* **There is no backend.** `package.json` has no server, no database, no
  TanStack Query; there is no `server/` or `shared/`.
* **There are no accounts and no cloud dioramas.** The editor keeps one
  scene in localStorage (`diorama-scene`).

Every Phase 7 feature needs both: publishing stores a snapshot on the
server, likes and comments belong to a signed-in user, remix copies into
an account. So Phase 7 starts only after Phase 6 is merged:

| Stage | What Phase 7 takes from it |
|---|---|
| 17 — App shell and My Dioramas | The home page, `/diorama/[id]`, many dioramas with thumbnails |
| 18 — Backend foundation | `server/` (Fastify, PostgreSQL, Drizzle), `shared/` validator and upgrades, Vitest, CI |
| 19 — Accounts | Users, sessions, handles, rate limiting |
| 20 — Cloud save | The `dioramas` table and API, thumbnail upload, the storage interface |

The order stays **17 → 18 → 19 → 20 → 21 → 22 → 23**. Product-Roadmap.md
is still awaiting approval; approving this plan does not approve it, and
its open questions (Fastify, Drizzle, sign-in methods, …) are assumed at
their defaults here. If one of them changes, the matching part of this
plan changes with it.

---

## 1. What Phase 7 Delivers

At the end of Stage 23 a visitor can:

1. **publish** a diorama with a photo, title and description, as a
   read-only page with its own link (`/d/[slug]`) that anyone can open,
   orbit and share, with a link preview in chat apps;
2. **explore** published dioramas, newest or most liked;
3. **like** a diorama (signed in);
4. **remix** a diorama into their own collection, credited on both sides;
5. see a **creator profile** (`/u/[handle]`) with everything they published;
6. **comment** on a diorama (signed in), delete their own comments, and
   delete comments on their own dioramas;
7. **report** a diorama, a comment or a profile;

and an admin can work through reports and hide content or suspend a user.

Out of scope for Phase 7 (§9 lists all): notifications, follows and a
following feed, search and tags, avatars, threaded or edited comments,
direct messages.

---

## 2. Decisions

### D1 — A publication is an immutable snapshot

As Product-Roadmap A5: publishing copies the working diorama's scene file
into a `publications` row with the photo, title and description. Editing
the diorama afterwards changes nothing that was published. **Publishing
the same diorama again replaces its publication**: the new snapshot takes
over the same slug, keeps the likes and comments, and records
`updated_at`. (One public page per diorama is easier to share and moderate
than a growing list of near-identical snapshots.) The editor shows
"Published · update" on a diorama that has a publication.

### D2 — Slugs are random, titles are cosmetic

`/d/k3x9p2qf-corner-shop-in-rain`: an 8-character random id (base32,
unguessable, so unlisted links are not enumerable) plus the slugified
title (`slugify()` already exists in `sceneSerializer.ts`). Lookup uses
the id only; a wrong or old title part redirects to the current one.

### D3 — The photo is made in the browser, checked on the server

The publish dialog uses the Photo mode export path (`PhotoStudio.tsx`
already renders the frame to a canvas and a PNG blob) to produce three
images from one render:

| Image | Size | Use |
|---|---|---|
| `photo` | longest side 1600 px, JPEG ≈ q 0.88, ≤ 1.5 MB | The publication page |
| `card` | 640 × 480 crop, JPEG, ≤ 200 KB | Explore and profile cards |
| `og` | 1200 × 630 crop, JPEG, ≤ 400 KB | Open Graph link preview |

The server accepts only these three, checks the JPEG signature, the
dimensions and the byte size, and stores them through the storage
interface from Stage 20 under a fresh key. No image library is added to
the server (CLAUDE.md Rule 5); re-encoding on the server can be added if
abuse shows it is needed.

### D4 — The viewer reuses the editor's canvas in a read-only mode

`/d/[slug]` is a server component (fetches the publication, renders the
title, author, date, photo and `generateMetadata` for Open Graph) with a
client island that loads the snapshot into the same Zustand store and
renders `DioramaCanvas` with a new editor-state flag `isViewer`: no grid,
no placement, brush or selection layers, orbit and zoom only, post
effects as in Preview. The camera starts from the snapshot's saved view.

The store is shared with the editor, so the editor at `/diorama/[id]`
must always load its own diorama on mount (true from Stage 17), and
autosave is never mounted on the viewer. A test covers "open a
publication, then open the editor: the editor shows the user's diorama,
and nothing was saved over it".

### D5 — Published assets are never removed

A publication stores object `type`s, not models (CLAUDE.md §14). From
Stage 21 on, **an asset type that has been published is never deleted
from the registry**; a replaced asset keeps its type id and its old model
stays loadable, or a migration in `shared/` maps it. Otherwise published
dioramas silently lose objects. This rule is added to HANDOFF §3.

The server validates and upgrades every snapshot with the shared
validator at publish time, and the viewer upgrades it again on load, so
old publications keep opening after the scene format changes.

### D6 — Likes: one row per user, counters on the publication

`likes (user_id, publication_id)` with that pair as the primary key.
Like and unlike are idempotent `PUT` / `DELETE` and update
`publications.like_count` in the same transaction. The button updates at
once (TanStack Query optimistic update) and rolls back on error. Liking
your own diorama is allowed (it is harmless and common).

### D7 — Explore: two lists, simple pagination

* **Newest:** ordered by `published_at, id`, keyset pagination (a cursor),
  24 per page, "Load more".
* **Most liked:** **over the last 30 days**, ordered by `like_count, id`,
  offset pagination capped at 20 pages (counts move, so a cursor is not
  stable; a cap keeps offset queries cheap).

Hidden publications and those of suspended users never appear. Explore
is server-rendered for the first page (fast first paint, indexable), then
continues client-side.

### D8 — Remix copies a snapshot; credit lives outside the scene

"Remix this" on a publication page creates a new diorama from the
snapshot's scene, named "<title> (remix)", and opens it in the editor.

* **Signed in:** a cloud diorama with `remix_of_publication_id`.
* **Signed out:** a local diorama (Stage 17's My Dioramas) that keeps the
  same field; it travels with the diorama if it is later moved into an
  account. Remixing needs no account, as the editor needs none
  (Product-Roadmap open question 6).

The credit is a property of the diorama record, **not** of the scene
file, so the scene format does not change and exported JSON stays as it
is. When a remix is published, its publication gets `remix_of_id`; its
page shows "Remixed from *title* by @handle", and the original shows
"*n* remixes" with a list. If the original is later unpublished or
hidden, the credit reads "Remixed from a diorama that is no longer
public".

### D9 — Profiles without uploaded images

`/u/[handle]`: display name, handle, a bio (≤ 160 characters, plain
text), the join month, and the user's publications (newest first). The
avatar is generated from the handle (initials on a palette color), so
there is no image upload and nothing extra to moderate. Profile editing
(display name, bio) is on the account page from Stage 19.

### D10 — Comments: flat, plain text, no editing

* 1–1000 characters, trimmed; line breaks kept, nothing else rendered
  (React escapes the text; links shown as text, not clickable, which
  removes most of the reason to spam).
* Flat list, oldest first, paginated by 50.
* Delete (soft): the author, the publication's owner, an admin. A deleted
  comment shows "Comment deleted" only if it is needed to keep the list
  readable; otherwise it is dropped from the list.
* No editing and no replies in Phase 7.
* The publication owner can turn comments off for their publication.

### D11 — Reports and moderation

* **Report** a publication, a comment or a profile: a reason (spam,
  offensive, copied from someone else, other) and an optional note
  (≤ 500 characters). One open report per user per target.
* **Admin area** at `/admin` (role `admin`; the role is granted by a
  server CLI script, there is no UI to grant it): the report queue
  grouped by target, oldest first; actions **hide / restore** a
  publication or comment, **suspend / unsuspend** a user, **dismiss** a
  report.
* **Hidden** content is a 404 for everyone except its owner (who sees
  "Hidden by moderation") and admins.
* **Suspended** users cannot sign in to write (publish, like, comment,
  report); their publications and comments are hidden while suspended.
  Their local and cloud dioramas are untouched.
* Every action is written to `moderation_actions` (who, what, when, why).
* **No automatic hiding** in Phase 7: every hide is a human decision. A
  report count is shown in the queue to sort by.

### D12 — Rate limits and size limits

| Action | Limit (default) |
|---|---|
| Publish / update publication | 10 per hour per user |
| Like / unlike | 120 per hour per user |
| Comment | 1 per 15 s, 100 per day per user |
| Report | 20 per day per user |
| Publication page and Explore reads | 120 per minute per IP |
| Title / description | 1–80 / ≤ 500 characters |
| Snapshot | ≤ 2 MB (as cloud save) |

Rate limiting uses the same mechanism Stage 19 adds for sign-in.

### D13 — Client architecture

* API calls in `services/publications.ts`, `services/explore.ts`,
  `services/comments.ts`, `services/reports.ts`, `services/admin.ts`;
  hooks in `features/community/hooks/`; no `fetch()` in components
  (CLAUDE.md §40).
* Server state in TanStack Query (introduced in Stage 19/20), never copied
  into Zustand (CLAUDE.md §39). The only new Zustand state is the editor
  flag `isViewer` (D4).
* New UI under `features/community/` (publish dialog, publication page,
  cards, like button, remix button, comments, report dialog, profile,
  admin queue). The diorama feature only gains the viewer flag and the
  "Publish" entry in the toolbar and Photo bar.
* The same calm, warm UI as the editor (CLAUDE.md §28): cards are the
  photo first, title and author small underneath.

---

## 3. Data Model

Builds on Product-Roadmap A7. New or changed relative to it:

```text
publications     id, slug_id (unique), diorama_id (unique), owner_id,
                 title, description, scene jsonb, schema_version,
                 photo_key, card_key, og_key,
                 remix_of_id → publications.id (nullable, on delete set null),
                 like_count, comment_count, remix_count,
                 comments_enabled, status (visible|hidden),
                 published_at, updated_at, deleted_at
dioramas         + remix_of_publication_id (nullable)
users            + bio, suspended_at
likes            user_id, publication_id, created_at   PK (user_id, publication_id)
comments         id, publication_id, author_id, body, status (visible|hidden),
                 created_at, deleted_at
reports          id, reporter_id, target_kind (publication|comment|user),
                 target_id, reason, note, created_at,
                 resolved_at, resolved_by, resolution (actioned|dismissed)
                 unique (reporter_id, target_kind, target_id) where resolved_at is null
moderation_actions id, admin_id, action, target_kind, target_id, reason, created_at
```

Indexes: `publications (status, published_at desc, id)`,
`publications (status, like_count desc, id) where published_at > now() - 30 days`
(or a plain index if the partial one does not pay off),
`publications (owner_id, published_at desc)`,
`comments (publication_id, created_at)`, `reports (resolved_at, created_at)`.

Each stage adds only the tables it uses (Stage 21: `publications`, the
`users`/`dioramas` columns it needs; Stage 22: `likes`, remix columns,
`bio`; Stage 23: `comments`, `reports`, `moderation_actions`,
`suspended_at`), each as its own Drizzle migration.

---

## 4. API

All under the API from Stage 18, JSON, Zod schemas in `shared/`.
"Auth" = signed-in session required; "owner" = the resource's owner;
"admin" = role `admin`.

| Stage | Method & path | Who |
|---|---|---|
| 21 | `POST /dioramas/:id/publication` — publish or update (multipart: JSON + 3 images) | owner |
| 21 | `DELETE /dioramas/:id/publication` — unpublish | owner |
| 21 | `GET /publications/:slugId` — page data (snapshot, author, counts) | anyone |
| 21 | `GET /me/publications` — for My Dioramas | auth |
| 22 | `GET /explore?sort=newest\|liked&cursor=&page=` | anyone |
| 22 | `PUT` / `DELETE /publications/:slugId/like` | auth |
| 22 | `POST /publications/:slugId/remix` — create a cloud diorama | auth |
| 22 | `GET /publications/:slugId/remixes` | anyone |
| 22 | `GET /users/:handle`, `GET /users/:handle/publications` | anyone |
| 22 | `PATCH /me/profile` — display name, bio | auth |
| 23 | `GET /publications/:slugId/comments?cursor=` | anyone |
| 23 | `POST /publications/:slugId/comments` | auth |
| 23 | `DELETE /comments/:id` | author, publication owner, admin |
| 23 | `PATCH /dioramas/:id/publication` — `commentsEnabled` | owner |
| 23 | `POST /reports` | auth |
| 23 | `GET /admin/reports`, `POST /admin/reports/:id/dismiss` | admin |
| 23 | `POST /admin/{publications,comments,users}/:id/{hide,restore,suspend,unsuspend}` | admin |

Signed-out remix (D8) needs no endpoint: the client reads the snapshot
from `GET /publications/:slugId` and creates a local diorama.

---

## 5. Web Routes

| Route | Stage | Rendering |
|---|---|---|
| `/d/[slug]` | 21 | Server component + client canvas island; `generateMetadata` (title, description, `og` image) |
| `/explore` | 22 | Server-rendered first page, client "Load more" |
| `/u/[handle]` | 22 | Server-rendered; `generateMetadata` |
| `/admin` | 23 | Client, admin only (the server enforces it; the page only hides itself) |

Entry points: the editor toolbar and the Photo bar get **Publish**;
My Dioramas shows a "Published" badge and the link; the home page
(Stage 17) gains an "Explore" link and a strip of recent publications in
Stage 22.

---

## 6. Stages

### Stage 21 — Publish and share

* Publish dialog from the editor and the Photo bar: title (prefilled from
  the scene name), description, the frame preview, Publish / Update.
* Server: `publications` table, validate + upgrade the snapshot, store
  the three images, slug (D2), update-in-place (D1), unpublish.
* `/d/[slug]`: photo, title, author (handle; profile links arrive in 22),
  date, the read-only 3D view (D4), "Copy link", Open Graph metadata.
* My Dioramas: Published badge, open / copy link / unpublish.
* D5 written into HANDOFF §3.
* **Playwright** is introduced here for the first end-to-end flow
  (sign in → publish → open the link signed out).

**Verification:** Vitest for the publish service (validation, size and
type limits, ownership, re-publish keeps the slug, unpublish → 404);
Playwright for the flow above; the viewer checked in the browser for each
starter (hero, Back Street, Residential Lane) at every time of day and
weather, compared against the editor's Preview of the same scene; the
link preview checked with an Open Graph debugger against a tunnel; the
editor-after-viewer test from D4.

### Stage 22 — Explore, likes, remix, profiles

* `/explore` with Newest and Most liked (D7); cards (D13).
* Like button on the publication page and cards (D6).
* Remix (D8): signed in → cloud diorama; signed out → local diorama;
  credit on both pages; remix list on the original.
* `/u/[handle]` (D9); bio on the account page.
* Home page: recent publications strip, Explore link.

**Verification:** Vitest for like idempotency and counters under
concurrent requests, keyset pagination (no duplicates or gaps while new
items are published), remix copy and credit, hidden and suspended
filtering (prepared for 23); Playwright for like, remix signed in and
signed out, and the profile; Explore with 200 seeded publications checked
for load time and card image sizes.

### Stage 23 — Comments and moderation

* Comments on the publication page (D10), comments on/off for owners.
* Report dialog for publications, comments and profiles (D11).
* `/admin`: report queue, hide / restore, suspend / unsuspend, dismiss,
  the action log.
* Hidden and suspended rules applied everywhere a publication, comment or
  profile is read (pages, Explore, profiles, remix credit).
* The admin role script in `server/scripts/`.

**Verification:** Vitest for every permission rule (author / owner /
admin / stranger × delete; suspended user × every write; hidden content ×
every read path), rate limits, report de-duplication; Playwright for
comment → report → admin hides → the page is a 404 for others and shows
"Hidden by moderation" to its owner; a pass with comment bodies that try
HTML, scripts and very long lines.

---

## 7. Security and Privacy

* Every write checks ownership on the server; the UI hiding a button is
  never the check.
* Publications are public by design; **nothing is public until the user
  publishes**, and the publish dialog says so. Dioramas, drafts and local
  data stay private.
* User text is rendered as text only (no `dangerouslySetInnerHTML`, no
  Markdown); images are served with fixed `Content-Type: image/jpeg` from
  storage, never from user-supplied names.
* Random slugs (D2) so publications are not enumerable by counting.
* Uploaded snapshots go through the shared validator; unknown fields and
  object types are dropped, not stored.
* Rate limits (D12) on every write and on the public reads.
* Account deletion (full flow in Stage 27): from Stage 21 on, deleting an
  account must delete its publications, likes, comments and reports
  filed; remixes of its publications keep their content and show the
  "no longer public" credit. The data model's foreign keys are set up for
  this from the start.

## 8. Rules That Carry Over

* Scene data stays the source of truth and portable; the scene file
  format does not change in Phase 7 (credit and publication data live in
  server rows, D8).
* The starters stay visually unchanged; the viewer must match the
  editor's Preview.
* One branch per stage (`stage21-publish`, `stage22-explore`,
  `stage23-comments`), the plan approved first, the user commits and
  merges.

## 9. Out of Scope for Phase 7

Notifications (likes, comments, remixes), follows and a following feed,
search and tags, collections, embeds on other sites, avatar upload,
comment replies and editing, direct messages, automatic moderation or
profanity filtering, "download print file" on a publication (Stage 24
adds it), anything mobile.

## 10. Open Questions (defaults in bold)

1. **Re-publishing:** **replaces the publication in place, same link,
   likes and comments kept (D1)**; or each publish is a new publication.
2. **Remix without an account:** **yes, into a local diorama (D8)**; or
   sign-in required.
3. **Most liked window:** **last 30 days**; all time; last 7 days.
4. **Comments:** **flat, plain text, owner can turn them off (D10)**; or
   one level of replies.
5. **Automatic hiding after many reports:** **no, admins decide (D11)**;
   or hide pending review after *n* distinct reporters.
6. **Image processing:** **made in the browser, checked on the server
   (D3)**; or re-encoded on the server (adds an image library).
7. **End-to-end tests:** **Playwright from Stage 21**; or later (Stage 27).
8. **Unlisted publications** (a link that is not in Explore or the
   profile): **not in Phase 7**; or an option in the publish dialog in
   Stage 21.
