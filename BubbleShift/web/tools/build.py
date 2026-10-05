#!/usr/bin/env python3
"""Bundle src/ into one self-contained, offline index.html.

  python3 tools/build.py            -> ../index.html
Inlines styles.css, the embedded Nunito font (base64 woff2) and every
src/js/NN_*.js module in order. No network, no external files at runtime.
"""
import base64, glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

fonts = []
for fname, rng in [('nunito-lat.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2190-21FF, U+2212, U+2215, U+FEFF, U+FFFD'),
                   ('nunito-cyr.woff2', 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116')]:
    b64 = base64.b64encode(open(os.path.join(ROOT, 'assets', fname), 'rb').read()).decode()
    fonts.append("@font-face{font-family:'Nunito';font-style:normal;font-weight:700 900;font-display:swap;"
                 f"src:url(data:font/woff2;base64,{b64}) format('woff2');unicode-range:{rng};}}")

js_parts = []
for p in sorted(glob.glob(os.path.join(SRC, 'js', '[0-9][0-9]_*.js'))):
    code = read(p)
    code = re.sub(r"^if \(typeof module !== 'undefined'\).*$", '', code, flags=re.M)  # node-only exports
    js_parts.append(f'/* ---- {os.path.basename(p)} ---- */\n' + code)

html = read(os.path.join(SRC, 'shell.html'))
html = html.replace('/*@FONTS@*/', '\n'.join(fonts))
html = html.replace('/*@CSS@*/', read(os.path.join(SRC, 'styles.css')))
html = html.replace('/*@JS@*/', '\n'.join(js_parts))
out = os.path.join(ROOT, 'index.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'built {out} ({len(html) // 1024} KB, {len(js_parts)} modules)')
