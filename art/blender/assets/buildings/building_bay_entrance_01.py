"""Building module: house entrance bay (玄関) for the ground floor, 1.82 × 3.2 m.

A dark door with a frosted lite on a concrete step, a narrow frosted side
window, a flat canopy with a porch light, and the concrete foundation band
to either side so it lines up with the neighboring bays. No baked AO or
grime.
"""

from lib.facade import FOUNDATION, FRAME, GLASS, GROUND_FLOOR, HALF, WEATHER, belt_course, wall_piece  # noqa: F401

NAME = "building_bay_entrance_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

DOOR_X0, DOOR_X1 = -0.55, 0.35
SIDE_X0, SIDE_X1 = 0.5, 0.74
SIDE_Z0, SIDE_Z1 = 0.7, 2.2
STEP = 0.15
DOOR_TOP = 2.2


def build(b) -> None:
    wall_piece(b, -HALF, DOOR_X0, 0.0, FOUNDATION, "foundation")
    wall_piece(b, DOOR_X1, HALF, 0.0, FOUNDATION, "foundation")
    wall_piece(b, -HALF, DOOR_X0, FOUNDATION, GROUND_FLOOR)
    # Right of the door, around the side window
    wall_piece(b, DOOR_X1, SIDE_X0, FOUNDATION, GROUND_FLOOR)
    wall_piece(b, SIDE_X1, HALF, FOUNDATION, GROUND_FLOOR)
    wall_piece(b, SIDE_X0, SIDE_X1, FOUNDATION, SIDE_Z0)
    wall_piece(b, SIDE_X0, SIDE_X1, SIDE_Z1, GROUND_FLOOR)
    wall_piece(b, DOOR_X0, DOOR_X1, DOOR_TOP, GROUND_FLOOR)
    belt_course(b, GROUND_FLOOR)

    cx = (DOOR_X0 + DOOR_X1) / 2
    w = DOOR_X1 - DOOR_X0
    b.box((w + 0.5, 0.45, STEP), (cx, -0.225, STEP / 2), "foundation", shade=1.1)  # step
    b.box((w, 0.05, DOOR_TOP - STEP), (cx, 0.07, (DOOR_TOP + STEP) / 2), "doorDark", bevel=0.008, segments=1)
    b.box((0.16, 0.012, 1.3), (cx - 0.18, 0.04, 1.3), GLASS, shade=0.9, material="emissive")  # door lite
    b.box((0.03, 0.05, 0.3), (DOOR_X1 - 0.12, 0.03, 1.15), FRAME)  # handle

    # Frosted side window in an aluminium frame
    sx = (SIDE_X0 + SIDE_X1) / 2
    b.box((SIDE_X1 - SIDE_X0, 0.012, SIDE_Z1 - SIDE_Z0), (sx, 0.07, (SIDE_Z0 + SIDE_Z1) / 2), GLASS, shade=0.86, material="emissive")
    for x in (SIDE_X0 + 0.015, SIDE_X1 - 0.015):
        b.box((0.03, 0.06, SIDE_Z1 - SIDE_Z0), (x, 0.06, (SIDE_Z0 + SIDE_Z1) / 2), FRAME)
    for z in (SIDE_Z0 + 0.015, SIDE_Z1 - 0.015):
        b.box((SIDE_X1 - SIDE_X0, 0.06, 0.03), (sx, 0.06, z), FRAME)

    # Canopy and porch light
    b.box((w + 0.6, 0.6, 0.06), (cx, -0.3, DOOR_TOP + 0.13), "roofTile", bevel=0.01, segments=1)
    b.box((0.1, 0.06, 0.16), (DOOR_X0 - 0.2, -0.03, 1.85), "tankCream", material="emissive")
