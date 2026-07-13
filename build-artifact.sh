#!/usr/bin/env bash
# Generate the Artifact-hostable version of the game from the single source file.
# The Artifact host wraps content in its own <!doctype><head><body>, so we strip
# the outer html/head/body wrapper and keep <title> + <style> + body content + <script>.
set -euo pipefail
python3 - <<'PY'
import re
src = open('farm-haven.html').read()
style = re.search(r'<style>.*?</style>', src, re.S).group(0)
body = re.search(r'<body[^>]*>(.*)</body>', src, re.S).group(1)
open('farm-haven-artifact.html','w').write('<title>Farm Haven: Новий Початок</title>\n'+style+'\n'+body)
print('built farm-haven-artifact.html')
PY
