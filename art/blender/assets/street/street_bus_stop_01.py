"""Bus stop sign (バス停), 2.4 m tall.

The portable kind that stands on a sidewalk: a round concrete foot, a steel
pole, a round head plate with the stop's name (atlas cell `bus_stop_head`),
a blue route strip under it and a timetable board at eye height (atlas cell
`bus_stop_board`). The faces point −Y. No baked AO or grime.
"""

import math

NAME = "street_bus_stop_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

HEAD_R = 0.24
HEAD_Z = 2.14
FACE_Y = -0.04


def build(b) -> None:
    b.cylinder(0.23, 0.16, (0, 0, 0), "poleConcrete", segments=14, radius_top=0.2)  # foot
    b.cylinder(0.06, 0.05, (0, 0, 0.16), "signPost", shade=0.85, segments=10)
    b.cylinder(0.024, 2.2, (0, 0, 0.16), "signPost", segments=8)

    # Head plate: a disc, printed on the side facing −Y
    disc = [(HEAD_R * math.cos(a), HEAD_Z + HEAD_R * math.sin(a)) for a in (2 * math.pi * i / 20 for i in range(20))]
    b.extrude(disc, 0.016, (0, FACE_Y, 0), "signPost", axis="y", print="bus_stop_head", print_dir="-y")
    b.box((0.44, 0.016, 0.1), (0, FACE_Y, HEAD_Z - HEAD_R - 0.07), "canBlue")  # route strip

    b.box((0.4, 0.03, 0.54), (0, FACE_Y, 1.32), "signPost", shade=0.9)  # board frame
    b.box((0.36, 0.006, 0.5), (0, FACE_Y - 0.017, 1.32), "signBoard", print="bus_stop_board")
