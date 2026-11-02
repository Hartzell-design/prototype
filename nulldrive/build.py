import re, os, pathlib
# Slipstream sources live next to this script. Running it regenerates the
# static pages served from nulldrive/ (no build step is required to serve
# the committed output; re-run this after editing the source HTML).
ROOT = pathlib.Path(__file__).resolve().parent
S = str(ROOT)
O = str(ROOT)
css = open(f'{S}/shared.css').read(); js = open(f'{S}/shared.js').read()
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">'
LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 26 13 6h6L9 26z" fill="#00f0ff"/><path d="M13 26 23 6h6L19 26z" fill="#ff2e88"/><path d="M2 16h9" stroke="#00f0ff" stroke-width="2"/></svg>'
def nav(active, root='../'):
    L = [('library', 'Design Library'), ('game-ui', 'Game UI'), ('case-study', 'Case Study')]
    a = ''.join(f'<a class="{"on" if k==active else ""}" href="{root}{k}/index.html">{t}</a>' for k, t in L)
    return f'<nav class="sd-nav"><a class="brand" href="{root}index.html">{LOGO}<span>NULLDRIVE</span><small>SLIPSTREAM DS</small></a><div class="links">{a}</div><div class="credit">Prototype by <b>Hartzell Design</b></div></nav>'
def ic(p): return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'
PH = {'${L}': ic('<path d="m15 5-7 7 7 7"/>'), '${R}': ic('<path d="m9 5 7 7-7 7"/>'), '${P}': ic('<path d="M7 4v16l13-8z"/>'), '${ICON_PLAY}': ic('<path d="M7 4v16l13-8z"/>'), '${ICON_BOOST}': ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'), '${ICON_PIT}': ic('<path d="M3 17h18M5 17V9l3-4h8l3 4v8"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M8 9h8"/>'), '${LOGO}': LOGO, '${EYE}': ic('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), '${SEASON}': ic('<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>'), '${PHONE}': ic('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>')}
def ph(html):
    i = html.index('<body>'); j = html.index('<script>', i)
    body = html[i:j]
    for k, v in PH.items(): body = body.replace(k, v)
    return html[:i]+body+html[j:]
for page, root in [('library', '../'), ('game-ui', '../'), ('case-study', '../'), ('root', '')]:
    src = open(f'{S}/{page}.html').read()
    src = src.replace('<!--@FONTS-->', FONTS).replace('/*@CSS*/', css).replace('/*@JS*/', js)
    src = ph(src)
    src = re.sub(r'<!--@NAV:(\S+)-->', lambda m: nav(m.group(1), root), src)
    out = f'{O}/index.html' if page == 'root' else f'{O}/{page}/index.html'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(src); print(out, len(src))
