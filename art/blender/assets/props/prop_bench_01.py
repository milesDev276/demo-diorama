"""Plastic bench (ベンチ), 1.5 × 0.5 × 0.78 m.

The blue bench that stands in front of shops and at bus stops: a moulded
seat, a backrest that leans back slightly with a pale panel where an
advert goes, and two steel-tube leg frames. Front faces −Y. No baked AO or
grime.
"""

NAME = "prop_bench_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W = 1.5
SEAT_Z = 0.4
LEAN = -8  # degrees about X: the top of the backrest leans toward +Y


def build(b) -> None:
    b.box((W, 0.4, 0.05), (0, -0.03, SEAT_Z), "canBlue", bevel=0.015)
    b.box((W, 0.04, 0.3), (0, 0.2, 0.63), "canBlue", rotation=(LEAN, 0, 0), bevel=0.012)
    b.box((W - 0.2, 0.008, 0.17), (0, 0.178, 0.63), "vendingPanel", rotation=(LEAN, 0, 0))  # advert panel

    for side in (-1, 1):
        x = side * 0.6
        b.tube([(x, -0.2, 0.0), (x, -0.2, SEAT_Z - 0.02)], 0.016, "signPost", sides=6)
        b.tube([(x, 0.19, 0.0), (x, 0.19, SEAT_Z), (x, 0.225, 0.76)], 0.016, "signPost", sides=6)
        b.tube([(x, -0.2, SEAT_Z - 0.04), (x, 0.19, SEAT_Z - 0.04)], 0.014, "signPost", sides=6)
        b.tube([(x, -0.23, 0.014), (x, 0.24, 0.014)], 0.014, "signPost", shade=0.9, sides=6)  # foot bar
