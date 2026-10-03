"""Wire-mesh fence (ネットフェンス), one piece 2.0 m long × 1.2 m tall.

The green mesh fence around parking lots and school yards: one post in the
middle of the piece, a top and a bottom rail, and a grid of wires. Rails and
wires end flush, so pieces placed end to end along X make one fence.
No baked AO or grime.
"""

NAME = "street_fence_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.0}

LENGTH = 2.0
HEIGHT = 1.2
BOTTOM = 0.08
PITCH = 0.125
WIRE_R = 0.007
RAIL_R = 0.016
POST_R = 0.028


def build(b) -> None:
    half = LENGTH / 2
    b.cylinder(POST_R, HEIGHT + 0.03, (0, 0, 0), "fenceGreen", shade=0.9, segments=8)
    b.box((0.14, 0.14, 0.06), (0, 0, 0.03), "foundation")  # concrete footing

    for z in (BOTTOM, HEIGHT):
        b.tube([(-half, 0, z), (half, 0, z)], RAIL_R, "fenceGreen", sides=6, caps=False)

    # Wire grid between the rails: verticals, then horizontals
    columns = round(LENGTH / PITCH)
    for i in range(columns):
        x = -half + (i + 0.5) * PITCH
        b.tube([(x, 0, BOTTOM), (x, 0, HEIGHT)], WIRE_R, "fenceGreen", shade=1.08, sides=4, caps=False, smooth=False)
    rows = round((HEIGHT - BOTTOM) / PITCH)
    for j in range(1, rows):
        z = BOTTOM + j * (HEIGHT - BOTTOM) / rows
        b.tube([(-half, 0, z), (half, 0, z)], WIRE_R, "fenceGreen", shade=1.08, sides=4, caps=False, smooth=False)
