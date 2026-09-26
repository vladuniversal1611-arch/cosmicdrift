"""Normalise every platform plate to one material.

The plates were generated one prompt at a time, so each came back with its own
palette — gold, magenta, ice, purple. That is what made them read as parts from
different games. This maps all of them onto a single dark-navy body with a cyan
illuminated rim, keeping each plate's own luminance structure (bevel, gloss,
emblem, cracks) so the shape information survives and only the material changes.
Type is then signalled by the emblem, not by the plate being a different colour.
"""
import base64, io, re, sys
import numpy as np
from PIL import Image

# Material ramp, dark to light: body -> bevel -> rim -> emblem highlight
RAMP = [
    (0.00, (0x05, 0x09, 0x20)),
    (0.28, (0x0C, 0x16, 0x3E)),
    (0.52, (0x14, 0x33, 0x66)),
    (0.72, (0x1C, 0x6E, 0xA8)),
    (0.88, (0x00, 0xC8, 0xEE)),
    (1.00, (0xEA, 0xFB, 0xFF)),
]

def ramp_lut():
    lut = np.zeros((256, 3), np.float64)
    pts = sorted(RAMP)
    for i in range(256):
        t = i / 255.0
        for k in range(len(pts) - 1):
            a, ca = pts[k]; bb, cb = pts[k + 1]
            if a <= t <= bb:
                u = 0 if bb == a else (t - a) / (bb - a)
                lut[i] = [ca[j] + (cb[j] - ca[j]) * u for j in range(3)]
                break
        else:
            lut[i] = pts[-1][1]
    return lut

def luminance(img):
    a = np.asarray(img.convert('RGBA')).astype(np.float64)
    rgb, alpha = a[..., :3], a[..., 3]
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    return rgb, alpha, lum

def clean_alpha(alpha):
    """Give every plate the SAME silhouette.

    The plates inherited a bumpy, ragged outline from the earlier
    checkerboard key, and each one's was bumpy differently. Morphology only
    preserves that; a shared rounded-rectangle mask replaces it, so all nine
    end up with one corner radius and one edge crispness — which is most of
    what "same bevel, same outline" actually means on screen.
    """
    from scipy import ndimage
    solid = ndimage.binary_fill_holes(alpha > 150)
    lab, n = ndimage.label(solid)
    if n > 1:                      # drop stray specks before measuring the box
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        solid = lab == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(solid)
    if not len(xs):
        return alpha
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = max(3, int((x1 - x0) * 0.022))          # bite off the fringe
    x0, x1, y0, y1 = x0 + pad, x1 - pad, y0 + pad, y1 - pad
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    r = min((x1 - x0), (y1 - y0)) * 0.44
    # Signed distance to a rounded rectangle
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    hx, hy = (x1 - x0) / 2.0 - r, (y1 - y0) / 2.0 - r
    dx = np.maximum(np.abs(xx - cx) - hx, 0.0)
    dy = np.maximum(np.abs(yy - cy) - hy, 0.0)
    d = np.sqrt(dx * dx + dy * dy) - r
    return np.clip(0.5 - d, 0, 1) * 255.0

def unify(img, lo, hi, target_mid):
    rgb, alpha, lum = luminance(img)
    # One mapping for every plate, so none of them comes out brighter than the
    # rest — per-image normalisation was what made them look like separate sets.
    core = alpha > 200
    if core.sum():                        # line each plate's body up on the ramp
        lum = lum + (target_mid - np.median(lum[core]))
    lum = np.clip((lum - lo) / max(hi - lo, 1e-6), 0, 1)
    lut = ramp_lut()
    out = lut[np.clip((lum * 255).astype(int), 0, 255)]
    # Keep a little of the original chroma so the plates are not flat
    out = np.clip(out + (rgb - lum[..., None] * 255) * 0.06, 0, 255)
    return Image.fromarray(np.dstack([out, clean_alpha(alpha)]).astype('uint8'), 'RGBA')

KEYS = ['pad_normal','pad_moving_h','pad_bounce','pad_breakable','pad_disappear',
        'pad_slippery','pad_boost_pad','pad_falling','pad_lucky']

def main(path):
    s = open(path).read()
    # First pass: one luminance range shared by every plate
    los, his = [], []
    for k in KEYS:
        m = re.search(k + r':"([A-Za-z0-9+/=]+)"', s)
        if not m: continue
        _, alpha, lum = luminance(Image.open(io.BytesIO(base64.b64decode(m.group(1)))))
        vis = lum[alpha > 140]
        if vis.size:
            los.append(np.percentile(vis, 2.0)); his.append(np.percentile(vis, 98.5))
    lo, hi = float(np.median(los)), float(np.median(his))
    mids = []
    for k in KEYS:
        m = re.search(k + r':"([A-Za-z0-9+/=]+)"', s)
        if not m: continue
        _, alpha, lum = luminance(Image.open(io.BytesIO(base64.b64decode(m.group(1)))))
        core = alpha > 200
        if core.sum(): mids.append(np.median(lum[core]))
    target_mid = float(np.median(mids))
    print(f'shared luminance range {lo:.0f}..{hi:.0f}, body midpoint {target_mid:.0f}')
    for k in KEYS:
        m = re.search(k + r':"([A-Za-z0-9+/=]+)"', s)
        if not m:
            print('skip', k); continue
        im = Image.open(io.BytesIO(base64.b64decode(m.group(1))))
        out = unify(im, lo, hi, target_mid)
        buf = io.BytesIO(); out.save(buf, 'WEBP', quality=84, method=6)
        s = s[:m.start(1)] + base64.b64encode(buf.getvalue()).decode() + s[m.end(1):]
        print(f'{k:14s} {len(buf.getvalue())//1024}KB')
    open(path, 'w').write(s)

if __name__ == '__main__':
    main(sys.argv[1])
