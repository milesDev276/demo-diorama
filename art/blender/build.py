"""Headless asset build.

    blender --background --factory-startup --python art/blender/build.py -- <asset_name ...|all>

For each asset script in art/blender/assets/<category>/<name>.py this builds the
mesh, bakes weathering, exports public/models/<category>/<name>.glb and renders
review images into art/previews/. Asset scripts define NAME, CATEGORY,
TRI_BUDGET and build(builder).
"""

import importlib.util
import sys
import traceback
from pathlib import Path

import bpy

ART_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ART_DIR))

from lib.builder import MeshBuilder  # noqa: E402
from lib.finish import export_glb, triangle_count, weather  # noqa: E402
from lib.palette import REPO_ROOT, load_palette  # noqa: E402
from lib.preview import render_previews  # noqa: E402

# bpy changes between releases; assets are only guaranteed to build on this one.
REQUIRED_VERSION = (5, 2)

# Assets finished by hand in the Blender GUI: their .blend is the source, never rebuild.
HAND_FINISHED: set[str] = set()

MODELS_DIR = REPO_ROOT / "public" / "models"
PREVIEWS_DIR = REPO_ROOT / "art" / "previews"


def discover_assets() -> dict[str, Path]:
    return {p.stem: p for p in sorted((ART_DIR / "assets").rglob("*.py"))}


def load_module(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reset_scene() -> None:
    for collection in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(collection):
            collection.remove(block)


def build_asset(path: Path) -> bool:
    module = load_module(path)
    reset_scene()
    palette = load_palette()

    builder = MeshBuilder(module.NAME, palette)
    module.build(builder)
    obj = builder.to_object()
    weather(obj, seed=module.NAME)

    glb = MODELS_DIR / module.CATEGORY / f"{module.NAME}.glb"
    export_glb(obj, glb)
    tris = triangle_count(obj)
    previews = render_previews(obj, PREVIEWS_DIR, palette)

    within = tris <= module.TRI_BUDGET
    print(f"[build] {module.NAME}: {tris} tris / budget {module.TRI_BUDGET} {'OK' if within else 'OVER BUDGET'}")
    print(f"[build]   glb {glb.relative_to(REPO_ROOT)} ({glb.stat().st_size / 1024:.1f} KB)")
    for p in previews:
        print(f"[build]   preview {p.relative_to(REPO_ROOT)}")
    return within


def main(argv: list[str]) -> int:
    if bpy.app.version[:2] != REQUIRED_VERSION:
        print(f"[build] Blender {'.'.join(map(str, REQUIRED_VERSION))} required, got {bpy.app.version_string}")
        return 1

    assets = discover_assets()
    names = list(assets) if not argv or argv == ["all"] else argv
    unknown = [n for n in names if n not in assets]
    if unknown:
        print(f"[build] Unknown asset(s): {', '.join(unknown)}. Available: {', '.join(assets)}")
        return 1

    ok = True
    for name in names:
        if name in HAND_FINISHED:
            print(f"[build] {name}: hand-finished, skipped")
            continue
        try:
            ok = build_asset(assets[name]) and ok
        except Exception:
            traceback.print_exc()
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    sys.exit(main(args))
