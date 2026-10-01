"""Street ginkgo (イチョウ) in autumn, ≈ 8 m tall with a Ø 5 m crown.

A straight, tapering trunk with ascending branches, carrying a conical-oval
crown of overlapping bumpy foam clumps — like a model-railway foam tree —
in close autumn yellows. Baked AO darkens the crevices between clumps.
Symmetric enough to have no real front.
"""

import math
import random

from lib.builder import smooth_path

NAME = "nature_tree_ginkgo_01"
CATEGORY = "nature"
TRI_BUDGET = 15000

WEATHER = {
    "ao_distance": 0.9,
    "ao_strength": 0.55,
    "grime_height": 0.4,
    "grime_strength": 0.25,
    "face_jitter": 0.06,
}

HEIGHT = 8.0
CROWN_BOTTOM = 2.6
CROWN_RADIUS = 2.45
WIDEST_AT = 0.33  # fraction of the crown height

CLUMPS = 30

# Close shades, so the crown reads as one foam mass rather than a patchwork.
LEAF_COLORS = [("ginkgoLeaf", 60), ("ginkgoLeafLight", 20), ("ginkgoLeafDeep", 15), ("ginkgoLeafGreen", 5)]


def crown_radius(z: float) -> float:
    """Radius of the crown envelope at height z: an oval bottom, a cone-like top."""
    t = (z - CROWN_BOTTOM) / (HEIGHT - CROWN_BOTTOM)
    if t <= 0 or t >= 1:
        return 0.0
    if t < WIDEST_AT:
        return CROWN_RADIUS * math.sqrt(1 - ((WIDEST_AT - t) / WIDEST_AT) ** 2)
    return CROWN_RADIUS * (1 - ((t - WIDEST_AT) / (1 - WIDEST_AT)) ** 1.6)


def build(b) -> None:
    rng = random.Random(NAME)
    _trunk(b)
    _branches(b, rng)
    _crown(b, rng)


def _trunk(b) -> None:
    points = [(0, 0, 0), (0, 0, 0.35), (0.03, 0, 1.6), (0, 0.03, 3.2), (-0.04, 0, 4.8), (0, -0.02, 6.2), (0.02, 0, 7.3)]
    radii = [0.27, 0.19, 0.16, 0.13, 0.1, 0.07, 0.035]
    b.tube(points, radii, "bark", sides=8)


def _branches(b, rng: random.Random) -> None:
    golden = math.pi * (3 - math.sqrt(5))
    count = 11
    for i in range(count):
        z = 2.5 + i * (3.8 / (count - 1))
        heading = i * golden + rng.uniform(-0.2, 0.2)
        pitch = math.radians(rng.uniform(38, 52))  # from vertical
        length = 1.7 - 0.9 * (i / (count - 1))
        dx, dy = math.cos(heading), math.sin(heading)
        start = (dx * 0.05, dy * 0.05, z)
        mid = (dx * length * 0.5 * math.sin(pitch), dy * length * 0.5 * math.sin(pitch), z + length * 0.5 * math.cos(pitch))
        end = (dx * length * math.sin(pitch) * 0.9, dy * length * math.sin(pitch) * 0.9, z + length * math.cos(pitch) * 1.1)
        b.tube(smooth_path([start, mid, end], samples=2), [0.07, 0.06, 0.05, 0.035, 0.02], "bark", shade=0.95, sides=5)


def _leaf_color(rng: random.Random) -> str:
    pick = rng.uniform(0, sum(w for _, w in LEAF_COLORS))
    for key, weight in LEAF_COLORS:
        pick -= weight
        if pick <= 0:
            return key
    return LEAF_COLORS[0][0]


def _crown(b, rng: random.Random) -> None:
    """Foam clumps on a golden spiral over the envelope, overlapping enough
    that the crown reads as one lumpy mass, plus a tuft on top."""
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(CLUMPS):
        t = (i + 0.5) / CLUMPS
        z = CROWN_BOTTOM + 0.45 + t * (HEIGHT - CROWN_BOTTOM - 1.2)
        r_env = crown_radius(z)
        size = 0.75 + 0.45 * min(r_env / CROWN_RADIUS, 1.0) + rng.uniform(-0.08, 0.08)
        reach = max(r_env - size * 0.75, 0.0)
        a = i * golden * 5 + rng.uniform(-0.3, 0.3)
        b.blob(
            (math.cos(a) * reach, math.sin(a) * reach, z + rng.uniform(-0.15, 0.15)),
            (size, size, size * 0.85),
            _leaf_color(rng),
            shade=rng.uniform(0.95, 1.04),
            subdivisions=3,
            roughness=0.14,
            frequency=1.2,
            bumps=0.07,
            seed=f"{NAME}-{i}",
        )
    b.blob((0.05, 0, HEIGHT - 0.6), (0.62, 0.62, 0.68), "ginkgoLeafLight", subdivisions=3,
           roughness=0.12, bumps=0.07, seed=f"{NAME}-top")
