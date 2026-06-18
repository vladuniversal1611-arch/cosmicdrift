#!/usr/bin/env python3
"""Generate Dragon Merge Blast app icons (no external deps).
Draws a glowing gradient background with a stylized dragon-egg gem.
"""
import zlib, struct, math, os

def png(path, size):
    W = H = size
    px = bytearray()
    cx, cy = W / 2, H / 2
    R = W * 0.5
    for y in range(H):
        px.append(0)  # filter byte per scanline
        for x in range(W):
            dx, dy = x - cx, y - cy
            d = math.sqrt(dx*dx + dy*dy)
            # rounded-square background gradient (purple -> deep violet)
            t = y / H
            r = int(40 + 60*t); g = int(18 + 20*t); b = int(70 + 60*(1-t))
            # radial glow
            glow = max(0, 1 - d / (R*1.1))
            r = min(255, int(r + glow*120))
            g = min(255, int(g + glow*50))
            b = min(255, int(b + glow*120))
            # central gem (diamond) gold->orange
            # diamond test in normalized coords
            nx = abs(dx) / (W*0.30)
            ny = abs(dy) / (H*0.34)
            inside = (nx + ny) < 1.0
            if inside:
                gy = (dy / (H*0.34) + 1) / 2  # 0 top .. 1 bottom
                r = int(255)
                g = int(220 - 120*gy)
                b = int(90 - 70*gy)
                # facet highlight
                if dx < 0 and dy < 0 and (nx + ny) < 0.55:
                    r, g, b = 255, 245, 200
            # spark
            sx, sy = W*0.66, H*0.32
            sd = math.sqrt((x-sx)**2 + (y-sy)**2)
            if sd < W*0.04:
                k = 1 - sd/(W*0.04)
                r = min(255, int(r + k*255)); g = min(255, int(g + k*255)); b = min(255, int(b + k*255))
            px.extend((r, g, b))
    raw = bytes(px)
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    with open(path, 'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))
    print('wrote', path, size)

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', 'www', 'assets')
os.makedirs(out, exist_ok=True)
png(os.path.join(out, 'icon-192.png'), 192)
png(os.path.join(out, 'icon-512.png'), 512)
png(os.path.join(here, 'icon-1024.png'), 1024)
