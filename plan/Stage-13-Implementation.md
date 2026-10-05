# Stage 13 — Weather (Implementation Plan)

Follows [Stage-12-Implementation.md](Stage-12-Implementation.md). A scene can
be seen at five times of day and in four seasons, but always under a clear
sky. Weather is the last control of CLAUDE.md §25 that is missing, and a wet
evening street or a snowed-in corner is the kind of picture a miniature is
built for.

**Goal:** five kinds of weather — clear, cloudy, rain, fog, snow — as scene
data, each one a look (light, sky, haze, surfaces, falling particles), not a
simulation. No new assets, no change to the meaning of the scene format.

Branch: `stage13-weather`, cut from `main` (Stage 12 is merged, PR #15).

> The user asked for "the next stage" on 2026-10-05 and handed over every
> decision ("you have my full authority"). Weather was chosen from the
> candidates in HANDOFF §7; the open questions in §5 are settled with the
> defaults listed there.

---

## 1. Decisions

### D1 — `environment.weather` is scene data

`"clear" | "cloudy" | "rain" | "fog" | "snow"`. Additive: files stay v2, a
missing or unknown value loads as `"clear"`, which changes nothing. Like the
time of day and the season it is not on the undo stack.

### D2 — One record per weather, in `utils/weather.ts`

A `WeatherLook` holds only what the weather changes: how much of the sun
gets through, how much fill replaces it, how dark shadows are, how gray the
sky and the lights turn, where the haze starts and ends, how wet or snowed
on surfaces are, the least glow windows and signs have, and what falls.

`sceneLook(timeOfDay, weather)` applies a weather to a time of day and
returns an ordinary `TimeOfDayLook` (cached per pair). `useTimeOfDayLook()`
returns that, so the lights, the sky, the fog, the effect stack and the glow
lights follow the weather without knowing about it. `utils/timeOfDay.ts`
stays the only file with absolute lighting numbers; `weather.ts` holds
factors.

### D3 — Wet and snow are two uniforms of the shared materials

`base`, `foliage` and `ground` get one more shader patch
(`objects/materials.ts`), after the normal is known:

* **snow** blends faces that look up toward the palette's `snow` white;
* **wet** darkens the color a little and makes up-facing faces glossy. On the
  `ground` material the gloss is uneven — puddles — read from the grain
  texture that is already there.

Both are 0 in clear weather, where the patch leaves every pixel as it was.
They are pushed by `EnvironmentDriver` (`setWeatherSurface`), like the
emissive level. No geometry and no GLB changes; nothing accumulates.

Road lettering (the `decal` material) fades under snow.

### D4 — Rain and snow are one draw call each

`components/WeatherParticles.tsx`: rain is one `LineSegments`, snow one
`Points`, in a box over the base (the base's footprint, 14 m high). They
move in the vertex shader from one time uniform; React state is not touched
per frame. The number of pieces follows the base's area, with a cap. They
are unlit, take their color from the sky, are never hit by the pointer and
fall through roofs.

### D5 — Lights come on in bad weather

Rain, fog and snow give the emissive level and the sign glow a floor, so
windows and backlit signs are on in a dark afternoon. The eight glow lights
stay a matter of the time of day.

### D6 — Where it is chosen

A "Weather" row in the Scene panel (inspector, nothing selected) and, icons
only, in the photo bar beside the time of day.

### D7 — Starters keep their data

No starter scene is edited; both stay clear.

---

## 2. Files

* New: `utils/weather.ts`, `components/WeatherParticles.tsx`.
* Changed: `types/diorama.types.ts`, `utils/sceneDefaults.ts`,
  `utils/sceneValidator.ts`, `utils/timeOfDay.ts` (formers get a name, the
  sun a shadow strength, the look a haze), `utils/palette.ts` (`snow`),
  `utils/environmentOptions.ts`, `hooks/useSceneEnvironment.ts`,
  `objects/materials.ts`, `store/dioramaStore.ts`,
  `components/EnvironmentDriver.tsx`, `SceneLighting.tsx`, `SceneFog.tsx`,
  `DioramaCanvas.tsx`, `ScenePanel.tsx`, `PhotoBar.tsx`.
* Docs: this file, `HANDOFF.md`, `Hero-Diorama-Roadmap.md`.

## 3. Out of scope

* Wind, lightning, thunder, sound, clouds as objects, a visible sun or moon.
* Rain that stops at roofs, splashes, drips, running water, wet glass.
* Snow that piles up, footprints, icicles; snow as a ground kind.
* Weather changing over time, or tied to the season.
* Umbrellas and other weather props (a later asset stage).

## 4. Verification

1. `npm run lint`, `npm run build`.
2. Both starters in clear weather against `main`, editor and Preview: no
   difference.
3. Both starters in each weather, by day and at night, editor and Preview:
   looked at; no page errors.
4. A file without `weather`, with an unknown one and with each known one:
   load, save, round-trip.
5. Frame rate of a 100-object scene in rain and in snow against clear.
6. A photo export at 2× in snow: flakes keep their size.

## 5. Open questions, settled with these defaults

1. **Which stage?** Weather: the one missing environment control
   (CLAUDE.md §25, Phase 4), and it needs no new assets.
2. **Weather and season independent?** Yes. Snow in summer is the user's
   business.
3. **Snow on surfaces, or only falling?** On surfaces too (D3): falling
   flakes alone do not read in a still photo.
4. **Particles as lit geometry?** No: unlit lines and points (D4).
5. **On the undo stack?** No, like the rest of the environment.

---

## 6. Results (2026-10-05)

**Status:** implemented and verified on branch `stage13-weather`. Not
committed; the user commits and merges.

### The five looks

| Weather | Sun | Fill | Shadows | Haze (m past the target) | Surfaces | Falls | Lights at least |
|---|---|---|---|---|---|---|---|
| Clear | 1 | 1 | as the time of day | 11 – 83 | — | — | — |
| Cloudy | 0.4 | 1.45 | 0.55, twice as soft | 11 – 83 | — | — | — |
| Rain | 0.3 | 1.4 | 0.35 | 2 – 60 | wet 1 | 7 streaks / m² | windows 0.9, signs 0.35 |
| Fog | 0.3 | 1.5 | 0.3 | −12 – 20 | wet 0.25 | — | windows 0.7, signs 0.3 |
| Snow | 0.4 | 1.5 | 0.45 | 0 – 55 | snow 0.92 | 5 flakes / m² | windows 0.6, signs 0.25 |

### Deviations from the plan

* **A puddle is a color, not a reflection.** The first version only made
  wet ground glossy; nothing showed, because the environment map is four
  Lightformers and the editing camera's reflection points at none of them.
  Puddles now blend the ground toward a pale sky color (`puddle` in the
  palette) and are glossy on top of that, which catches the sun and the
  glow lights. Two palette colors were added: `snow`, `puddle`.
* **`TimeOfDayLook` grew two fields,** `shadow` and `haze`, so the numbers
  that were constants in `SceneLighting` and `SceneFog` are in
  `utils/timeOfDay.ts` and the weather can scale them.
* **Wet surfaces are 20 % darker,** not 30 %: the corner's asphalt is dark
  to begin with.
* **A cap of 6,000 pieces:** a 51 × 27 m plot gets thinner rain, not more of
  it.

### Verification

* `npm run lint` and `npm run build`: clean.
* **Clear weather against `main`,** both starters, editor and Preview, at
  day, golden hour and night (twelve pairs, 1600 × 1000, pixels differing by
  more than 2): every difference lies in the inspector (x 1305–1574, the
  new Weather row) or in the photo bar (y 912–999). The canvas is
  identical.
* **Both starters in the weathers,** editor and Preview, 17 captures (each
  weather by day; rain at golden hour and at night; snow in the evening and
  at night; fog in the morning and at golden hour; cloud at golden hour):
  no page errors, and nine of them looked at closely. Puddles and streaks
  read by day; at night the wet road catches the shop's light; snow covers
  the ground, roofs, the car and the crowns and leaves walls alone.
* **Scene files:** without `weather` and with an unknown one load as
  `clear`; each of the five loads and saves as itself; the files stay v2;
  rain and snow mount one particle object, the others none.
* **The inspector's Weather row,** clicked through all five: the scene
  follows, the chosen one is checked, nothing lands on the undo stack.
* **Frame rate,** 100 objects (kei car, kei truck, small shop, konbini) on a
  51 × 27 m plot, 1920 × 1080 headless: clear 180.1 / 177.7 fps (editor /
  Preview), rain 180.0 / 179.9, snow 180.0 / 176.6 — all at the 180 cap.
  Rain or snow adds one draw call (354 → 355) and one shader program
  (11 → 12).
* **A 2× export in snow** (1600 × 1000 on screen): the flake shader is given
  a view height of 2,000 for the export's frame and 1,000 before and after;
  the file is 3,200 × 2,000.

### Known limitations

* **Rain and snow fall through roofs and awnings,** and only over the base:
  from the side the falling box has edges.
* **Snow lies on every face that looks up,** also under a roof, on a car's
  seats and on the floor of a balcony. It has no thickness and does not pile
  up against walls.
* **Shop interiors, signs and glass get neither snow nor wet:** their
  materials are not patched.
* **Rain streaks are one pixel wide,** so in a 2× export they are half as
  thick against the scene. Flakes keep their size.
* **Puddles are where the noise puts them,** the same on every base; they
  cannot be painted, and they do not reflect the scene.
* **Road lettering fades under snow, painted lines are covered:** a snowed-in
  crosswalk is gone.
* **Weather is independent of the season** and does not change over time.
* **The glow lights still follow the time of day only:** on a rainy
  afternoon windows are lit but cast no light on the street.
* **Fog is the scene's distance haze drawn closer,** so it depends on the
  camera: orbiting changes what is clear.
* **Not checked in the user's own browser.**
