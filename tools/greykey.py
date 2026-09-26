"""Simpler rescue for the checkerboard sprites: the checker is achromatic and
bright, the artwork is saturated. Key on saturation instead of trying to solve
for the original alpha — the soft outer glow is lost, but the engine draws its
own glow anyway, so only the solid slab has to survive."""
import sys
import numpy as np
from PIL import Image

def key(path, out):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn)                       # 0 for any shade of grey
    val = mx
    # Opaque where colourful, or where dark (the near-black side face is also
    # achromatic but the checker never goes below ~200).
    alpha = np.clip(sat / 26.0, 0, 1)
    alpha = np.maximum(alpha, np.clip((215.0 - val) / 25.0, 0, 1))
    from scipy import ndimage
    solid = alpha > 0.45
    # Drop specks the key leaves in the empty margin
    lab, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool); keep[1:][sizes > sizes.max() * 0.02] = True
        solid = keep[lab]
    # White emblems and specular streaks are achromatic too, so the key punched
    # holes in the middle of the plate — close them back up.
    solid = ndimage.binary_closing(solid, np.ones((5, 5)))
    solid = ndimage.binary_fill_holes(solid)
    # Hard silhouette, then a 1.5px feather. The outer glow is discarded on
    # purpose: what survived the checker was grey mush, and drawPad adds a real
    # coloured glow of its own.
    # Erode past the grey rind the checker left in the glow band
    solid = ndimage.binary_erosion(solid, np.ones((9, 9)))
    alpha = ndimage.gaussian_filter(solid.astype(np.float64), 1.5)
    alpha = np.clip((alpha - 0.35) / 0.4, 0, 1)
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(out)

if __name__ == '__main__':
    key(sys.argv[1], sys.argv[2])
