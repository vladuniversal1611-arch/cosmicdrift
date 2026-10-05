#!/usr/bin/env python3
"""Embed the translations into frog-endless-runner.html.

keys.json  — the Ukrainian source strings, in order ({} marks a value hole)
<lang>.tsv — one line per string: index<TAB>translation

Checks every translation keeps the same number of {} holes as its key, then
writes `const I18N_K=[...];const I18N_T={...};` between the I18N markers.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, '..', '..', 'frog-endless-runner.html')
LANGS = ['en', 'es', 'pt', 'de', 'fr', 'it', 'pl', 'tr', 'id', 'nl', 'vi', 'zh', 'ja', 'ko', 'hi', 'th', 'ar']

keys = json.load(open(os.path.join(HERE, 'keys.json'), encoding='utf-8'))
data, bad = {}, 0
for lang in LANGS:
    path = os.path.join(HERE, lang + '.tsv')
    if not os.path.exists(path):
        print(f'{lang}: missing, skipped')
        continue
    arr = [''] * len(keys)
    for ln in open(path, encoding='utf-8').read().split('\n'):
        if not ln.strip():
            continue
        i, _, t = ln.partition('\t')
        i = int(i)
        holes_k = keys[i].count('{}')
        holes_t = len(re.findall(r'\{\d?\}', t))
        if holes_k != holes_t:
            print(f'{lang}#{i}: {holes_k} holes in key, {holes_t} in "{t}"')
            bad += 1
        # edge spaces belong to the source layout ('РІВЕНЬ '+n), so they come from the key
        k = keys[i]
        lead, trail = k[:len(k) - len(k.lstrip())], k[len(k.rstrip()):]
        arr[i] = lead + t.strip() + trail
    missing = [i for i, t in enumerate(arr) if not t]
    print(f'{lang}: {len(keys) - len(missing)}/{len(keys)}' + (f' missing {missing[:12]}' if missing else ''))
    data[lang] = arr

if bad:
    sys.exit('hole mismatches — fix them first')
blob = ('/*I18N-BEGIN*/const I18N_K=' + json.dumps(keys, ensure_ascii=False, separators=(',', ':')) +
        ';const I18N_T=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';/*I18N-END*/')
src = open(GAME, encoding='utf-8').read()
if '/*I18N-BEGIN*/' in src:
    src = re.sub(r'/\*I18N-BEGIN\*/.*?/\*I18N-END\*/', lambda m: blob, src, flags=re.S)
else:
    anchor = '(function(){const P=CanvasRenderingContext2D.prototype'
    i = src.index(anchor)
    src = src[:i] + blob + '\n' + src[i:]
open(GAME, 'w', encoding='utf-8').write(src)
print('embedded', len(blob), 'bytes')
