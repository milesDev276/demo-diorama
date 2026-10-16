"""City bicycle (ママチャリ), ≈ 1.8 × 1.0 × 0.6 m, parked on its center stand.

The geometry is lib/bicycle.py, which the cyclist shares. Heads +X, so the
chain side faces −Y (the viewer). No baked AO or grime (user decision, Stage 3).
"""

from lib.bicycle import build_bicycle

NAME = "prop_bicycle_01"
CATEGORY = "props"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}


def build(b) -> None:
    build_bicycle(b)
