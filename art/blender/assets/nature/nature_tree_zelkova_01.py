"""Zelkova (ケヤキ) in autumn, ≈ 7 m tall with a Ø 6 m crown.

The vase shape of a Japanese street zelkova: a short trunk that splits into
ascending limbs, fanning out to carry a wide, dome-topped crown of bumpy
foam clumps in oranges and rust. The crown is in the `foliage` slot: the
app recolors it by season and leaves the limbs bare in winter. No baked AO
or grime. Symmetric enough to have no real front.
"""

import math
import random

from lib.builder import smooth_path

NAME = "nature_tree_zelkova_01"
CATEGORY = "nature"
TRI_BUDGET = 15000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.06}

HEIGHT = 7.0
FORK = 1.9  # where the trunk splits
CROWN_RADIUS = 3.0

LIMBS = 7
CLUMPS = 30

LEAF_COLORS = [("zelkovaLeaf", 55), ("zelkovaLeafLight", 20), ("zelkovaLeafDeep", 25)]

GOLDEN = math.pi * (3 - math.sqrt(5))


def build(b) -> None:
    rng = random.Random(NAME)
    b.tube([(0, 0, 0), (0, 0, 0.3), (0.02, 0, 1.1), (0, 0.02, FORK + 0.2)], [0.3, 0.21, 0.18, 0.15], "bark", sides=8)
    _limbs(b, rng)
    _crown(b, rng)


def _limbs(b, rng: random.Random) -> None:
    """Limbs leave the fork steeply and lean out as they rise; each ends in two shoots."""
    for i in range(LIMBS):
        heading = i * (2 * math.pi / LIMBS) + rng.uniform(-0.25, 0.25)
        reach = rng.uniform(1.5, 2.1)
        top = rng.uniform(4.6, 5.4)
        dx, dy = math.cos(heading), math.sin(heading)
        path = smooth_path(
            [(dx * 0.05, dy * 0.05, FORK - 0.1), (dx * reach * 0.3, dy * reach * 0.3, FORK + 1.2), (dx * reach, dy * reach, top)],
            samples=3,
        )
        b.tube(path, [0.1, 0.09, 0.08, 0.065, 0.05, 0.04, 0.03], "bark", shade=0.95, sides=5)
        for turn in (-0.7, 0.6):
            a = heading + turn + rng.uniform(-0.2, 0.2)
            length = rng.uniform(0.45, 0.65)  # short enough to stay inside the crown
            tip = (dx * reach + math.cos(a) * length * 0.7, dy * reach + math.sin(a) * length * 0.7, top + length * 0.35)
            b.tube([(dx * reach, dy * reach, top), tip], [0.028, 0.01], "bark", shade=0.92, sides=4)


def _leaf_color(rng: random.Random) -> str:
    pick = rng.uniform(0, sum(w for _, w in LEAF_COLORS))
    for key, weight in LEAF_COLORS:
        pick -= weight
        if pick <= 0:
            return key
    return LEAF_COLORS[0][0]


def _crown(b, rng: random.Random) -> None:
    """Foam clumps over a dome that is widest high up: a ring of low outer
    clumps under a fuller top, overlapping into one lumpy mass."""
    for i in range(CLUMPS):
        t = (i + 0.5) / CLUMPS  # 0 = lowest ring, 1 = top
        z = 3.5 + t * (HEIGHT - 4.3)
        spread = math.sqrt(max(0.0, 1 - (max(t - 0.35, 0) / 0.65) ** 2))  # full width up to a third, then the dome closes
        size = 0.95 + 0.25 * spread + rng.uniform(-0.08, 0.08)
        reach = max(CROWN_RADIUS * spread - size * 0.8, 0.0) * rng.uniform(0.75, 1.0)
        a = i * GOLDEN * 3 + rng.uniform(-0.3, 0.3)
        b.blob(
            (math.cos(a) * reach, math.sin(a) * reach, z + rng.uniform(-0.2, 0.2)),
            (size, size, size * 0.8),
            _leaf_color(rng),
            shade=rng.uniform(0.94, 1.05),
            subdivisions=3,
            roughness=0.14,
            frequency=1.2,
            bumps=0.07,
            seed=f"{NAME}-{i}",
            material="foliage",
        )
