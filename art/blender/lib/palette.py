"""Reads the app's palette so Blender assets and app code share one color source."""

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PALETTE_TS = REPO_ROOT / "features" / "diorama" / "utils" / "palette.ts"

_ENTRY = re.compile(r'^\s*(\w+):\s*"#([0-9a-fA-F]{6})"', re.MULTILINE)

Rgb = tuple[float, float, float]


def load_palette() -> dict[str, Rgb]:
    """Returns `{key: (r, g, b)}` in sRGB 0–1, parsed from `palette.ts`."""
    text = PALETTE_TS.read_text(encoding="utf-8")
    palette = {
        key: tuple(int(hex_[i : i + 2], 16) / 255 for i in (0, 2, 4))
        for key, hex_ in _ENTRY.findall(text)
    }
    if not palette:
        raise RuntimeError(f"No colors found in {PALETTE_TS}")
    return palette


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
