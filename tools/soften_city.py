"""Push the city panorama back into the distance.

The skyline was drawn at full contrast and saturation, so the towers directly
behind the road competed with the platforms. This bakes atmospheric
perspective into the asset once — darker, flatter, less saturated, a touch
soft, with haze rising from the base where it meets the horizon — so the
game pays nothing per frame for it.
"""
import base64, io, re, sys
import numpy as np
from PIL import Image, ImageFilter

FOG = np.array([12, 20, 58], np.float64)

def soften(img):
    im = img.convert('RGB').filter(ImageFilter.GaussianBlur(1.1))
    a = np.asarray(im).astype(np.float64)
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    a = lum + (a - lum) * 0.70                     # 30% less saturated
    a = a.mean() + (a - a.mean()) * 0.84           # 16% lower contrast
    a = a * 0.86                                   # darker
    h = a.shape[0]
    t = np.linspace(0, 1, h)[:, None, None]
    haze = np.clip((t - 0.40) / 0.60, 0, 1) ** 1.4 * 0.45   # haze from the base
    a = a * (1 - haze) + FOG * haze
    return Image.fromarray(np.clip(a, 0, 255).astype('uint8'))

def main(path):
    s = open(path).read()
    m = re.search(r'cityPano:"([A-Za-z0-9+/=]+)"', s)
    src = Image.open(io.BytesIO(base64.b64decode(m.group(1))))
    out = soften(src)
    buf = io.BytesIO(); out.save(buf, 'WEBP', quality=80, method=6)
    s = s[:m.start(1)] + base64.b64encode(buf.getvalue()).decode() + s[m.end(1):]
    open(path, 'w').write(s)
    print('cityPano', src.size, '->', len(buf.getvalue()) // 1024, 'KB')

if __name__ == '__main__':
    main(sys.argv[1])
