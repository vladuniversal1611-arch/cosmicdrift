"""Bundle index.html + style.css + js/*.js into one self-contained HTML file.

Usage (from the build-island folder):  python3 tools/build_single.py ../build-island-single.html
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / 'build-island-single.html'
html = (root / 'index.html').read_text()
css = (root / 'style.css').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
html = re.sub(r'<script src="(js/[a-z_]+\.js)"></script>',
              lambda m: '<script>\n' + (root / m.group(1)).read_text().replace('</script>', '<\\/script>') + '\n</script>', html)
assert 'src="js/' not in html, 'unbundled script left'
out.write_text(html)
print(f'wrote {out} ({len(html) // 1024} KB)')
