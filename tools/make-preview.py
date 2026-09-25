"""Turn dist/ into a relative-path copy (preview/) that works under any base URL, e.g. a Claude artifact preview.
The root index.html is stripped to body content because the artifact host wraps it in its own skeleton."""
import os, re, shutil, sys
src, out = 'dist', 'preview'
shutil.rmtree(out, ignore_errors=True); shutil.copytree(src, out)
for dp, _, fs in os.walk(out):
    for f in fs:
        p = os.path.join(dp, f)
        if f.endswith('.css'):
            s = open(p).read().replace('/assets/', './'); open(p, 'w').write(s)
        if not f.endswith('.html'):
            continue
        rel = os.path.relpath(out, dp); pre = '' if rel == '.' else rel + '/'
        s = open(p).read()
        s = s.replace('"/assets/', f'"{pre}assets/').replace('url(/assets/', f'url({pre}assets/').replace('"/favicon.svg"', f'"{pre}favicon.svg"')
        s = re.sub(r'href="/(#[^"]*)?"', lambda m: f'href="{pre}index.html{m.group(1) or ""}"', s)
        s = re.sub(r'href="/(experience|projects)/([\w-]+)/?"', lambda m: f'href="{pre}{m.group(1)}/{m.group(2)}/index.html"', s)
        if pre == '':
            s = re.sub(r'<!DOCTYPE html>|<html[^>]*>|</html>|<head>|</head>|<body>|</body>', '', s, flags=re.I)
        open(p, 'w').write(s)
print('preview ready')
