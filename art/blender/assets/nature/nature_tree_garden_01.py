"""Evergreen garden tree (庭木), ≈ 4.5 m tall with a Ø 3 m crown.

The small broadleaf tree of a house garden — a camellia or an osmanthus: a
short trunk, three limbs and a dense, rounded crown of foam clumps in dark
greens. Evergreen, so the crown is in the `base` slot and ignores the
season. No baked AO or grime. Symmetric enough to have no real front.
"""

import math
import random

from lib.builder import smooth_path

NAME = "nature_tree_garden_01"
CATEGORY = "nature"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.06}

HEIGHT = 4.5
FORK = 1.2
CROWN_RADIUS = 1.5
CLUMPS = 12

LEAF_COLORS = [("foliageDark", 55), ("hedgeLeaf", 30), ("foliageLight", 15)]

GOLDEN = math.pi * (3 - math.sqrt(5))


def build(b) -> None:
    rng = random.Random(NAME)
    b.tube([(0, 0, 0), (0, 0, 0.25), (0.02, 0.01, 0.8), (0, 0, FORK + 0.3)], [0.17, 0.12, 0.1, 0.08], "trunk", sides=7)
    for i in range(3):
        heading = i * (2 * math.pi / 3) + rng.uniform(-0.3, 0.3)
        dx, dy = math.cos(heading), math.sin(heading)
        path = smooth_path([(0, 0, FORK), (dx * 0.35, dy * 0.35, FORK + 0.7), (dx * 0.8, dy * 0.8, FORK + 1.5)], samples=2)
        b.tube(path, [0.06, 0.05, 0.045, 0.035, 0.025], "trunk", shade=0.95, sides=5)
    _crown(b, rng)


def _leaf_color(rng: random.Random) -> str:
    pick = rng.uniform(0, sum(w for _, w in LEAF_COLORS))
    for key, weight in LEAF_COLORS:
        pick -= weight
        if pick <= 0:
            return key
    return LEAF_COLORS[0][0]


def _crown(b, rng: random.Random) -> None:
    """Foam clumps over an egg-shaped crown: widest a third of the way up, closing to a rounded top."""
    bottom = 2.0
    for i in range(CLUMPS):
        t = (i + 0.5) / CLUMPS  # 0 = lowest ring, 1 = top
        z = bottom + 0.45 + t * (HEIGHT - bottom - 1.1)
        spread = math.sqrt(max(0.0, 1 - ((t - 0.3) / 0.75) ** 2))
        size = 0.62 + 0.18 * spread + rng.uniform(-0.05, 0.05)
        reach = max(CROWN_RADIUS * spread - size * 0.75, 0.0) * rng.uniform(0.8, 1.0)
        a = i * GOLDEN + rng.uniform(-0.3, 0.3)
        b.blob(
            (math.cos(a) * reach, math.sin(a) * reach, z),
            (size, size, size * 0.85),
            _leaf_color(rng),
            shade=rng.uniform(0.94, 1.05),
            subdivisions=3,
            roughness=0.14,
            frequency=1.3,
            bumps=0.07,
            seed=f"{NAME}-{i}",
        )
