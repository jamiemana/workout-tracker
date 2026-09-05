#!/usr/bin/env python3
"""Figure direction options: a more detailed anatomy (v2) rendered in several styles.

Emits options-preview.html (all styles side by side, for screenshots) and one
static artboard per style (FigureA.dc.html ...).
"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------- geometry v2
# Left half of a figure centred on x=0, absolute M/L/C/Z only; mirrored by build.
HEAD = "M-22,34 C-22,16 -12,4 0,4 C12,4 22,16 22,34 C22,52 12,64 0,64 C-12,64 -22,52 -22,34 Z"
NECK = "M-12,58 L12,58 L16,88 L-16,88 Z"
SILHOUETTE = (
  "M0,86 L-16,86 C-40,90 -64,96 -82,108 C-98,118 -102,142 -98,162 "
  "C-100,180 -102,198 -102,218 C-106,244 -108,278 -108,310 "
  "C-110,326 -108,342 -102,352 L-90,354 C-86,344 -86,332 -88,318 "
  "C-86,290 -84,262 -82,232 C-80,214 -78,196 -76,178 L-68,150 "
  "C-64,176 -56,206 -50,232 C-46,246 -48,262 -52,278 L-54,298 "
  "C-58,336 -52,378 -46,412 L-44,424 C-46,452 -42,480 -38,502 "
  "L-40,514 L-10,514 L-8,502 C-10,474 -12,446 -14,424 "
  "C-18,392 -12,352 -4,320 L0,314 Z"
)
# unmapped detail regions (rendered in the "untrained" tone) and striation lines
FRONT = {
  "upper_back": ["M-16,74 C-30,80 -46,88 -60,98 C-52,100 -44,102 -38,106 C-30,96 -22,90 -16,88 Z"],   # upper trap sliver, front
  "front_delt": ["M-52,104 C-64,96 -84,98 -92,110 C-96,124 -92,140 -84,150 C-74,144 -66,130 -60,116 C-58,110 -56,106 -52,104 Z"],
  "side_delt":  ["M-92,110 C-100,120 -102,140 -98,158 C-92,162 -86,158 -84,150 C-92,140 -96,124 -92,110 Z"],
  "chest": [
    "M-3,102 C-24,100 -46,104 -58,114 C-62,120 -62,128 -60,136 C-42,134 -22,134 -3,136 Z",
    "M-3,138 C-22,136 -42,138 -60,140 C-66,150 -62,164 -50,170 C-34,172 -14,166 -3,160 Z",
  ],
  "biceps": ["M-84,152 C-94,162 -100,190 -98,216 C-96,226 -92,232 -86,234 C-78,224 -74,196 -76,170 C-78,162 -80,156 -84,152 Z"],
  "core": [
    "M-22,164 C-12,161 -5,161 -3,163 L-3,186 C-9,188 -16,188 -22,186 Z",
    "M-22,190 L-3,190 L-3,212 L-22,212 Z",
    "M-22,216 L-3,216 L-3,240 L-22,240 Z",
    "M-22,244 L-3,244 L-3,296 C-9,306 -16,298 -20,276 Z",
    "M-26,172 C-34,182 -40,204 -40,226 C-40,242 -36,254 -30,262 L-26,250 C-27,226 -27,200 -26,172 Z",
  ],
  "quads": [
    "M-30,306 C-40,330 -42,372 -34,404 C-30,412 -22,412 -18,404 C-14,372 -16,330 -22,306 Z",
    "M-54,300 C-60,336 -56,384 -46,412 C-42,416 -38,414 -36,406 C-42,372 -44,332 -40,304 Z",
    "M-20,376 C-22,396 -20,412 -14,420 C-8,418 -6,404 -8,388 C-10,380 -14,376 -20,376 Z",
  ],
  "calves": ["M-22,432 C-24,452 -22,474 -16,488 C-12,488 -10,480 -10,472 C-12,456 -14,440 -16,432 Z"],
}
FRONT_DETAIL = [  # unmapped regions
  "M-56,172 L-46,176 L-48,184 L-56,182 Z", "M-54,187 L-44,191 L-46,199 L-54,197 Z", "M-52,202 L-42,206 L-44,214 L-52,212 Z",  # serratus
  "M-76,180 C-72,196 -72,214 -74,228 C-70,226 -68,212 -68,196 C-68,188 -72,182 -76,180 Z",     # brachialis
  "M-98,222 C-104,246 -108,276 -106,306 C-102,308 -98,306 -96,300 C-96,272 -94,246 -92,226 Z",   # brachioradialis
  "M-90,226 C-88,250 -88,280 -92,306 C-88,310 -84,308 -84,300 C-82,272 -84,246 -86,226 Z",      # forearm flexors
  "M-16,306 C-20,330 -22,350 -20,370 C-14,368 -8,350 -6,320 L-4,308 Z",                          # adductors
  "M-36,412 C-36,404 -20,404 -20,412 C-20,420 -36,420 -36,412 Z",                                 # kneecap
  "M-38,430 C-42,455 -40,480 -34,500 C-30,500 -28,494 -28,486 C-30,466 -32,446 -32,432 Z",       # tibialis
]
FRONT_LINES = [
  "M-6,70 C-10,76 -12,82 -14,88",                       # sternocleidomastoid
  "M-33,190 L-28,194", "M-34,208 L-28,212", "M-34,226 L-29,230",   # oblique serrations
  "M-72,108 C-78,122 -80,138 -78,148",                 # delt split
]
BACK = {
  "upper_back": [
    "M0,68 L-12,68 C-30,76 -50,86 -70,100 L-60,108 C-40,100 -20,94 0,92 Z",
    "M0,92 C-20,94 -40,100 -60,108 C-44,124 -30,140 -22,150 C-12,166 -4,182 0,196 Z",
    "M-26,150 C-40,142 -56,140 -66,148 L-64,160 C-50,160 -36,160 -26,164 Z",
  ],
  "rear_delt": ["M-52,104 C-64,96 -84,98 -92,110 C-96,124 -92,140 -84,150 C-74,144 -66,130 -60,116 C-58,110 -56,106 -52,104 Z"],
  "side_delt": ["M-92,110 C-100,120 -102,140 -98,158 C-92,162 -86,158 -84,150 C-92,140 -96,124 -92,110 Z"],
  "lats": ["M-26,162 C-46,156 -62,160 -68,168 C-68,196 -56,224 -34,250 C-28,256 -20,260 -14,262 C-14,244 -16,222 -19,200 C-21,184 -24,170 -26,162 Z"],
  "triceps": [
    "M-82,156 C-92,168 -98,196 -94,222 C-92,230 -86,234 -80,232 C-78,220 -78,196 -78,172 C-79,164 -80,158 -82,156 Z",
    "M-78,172 C-78,196 -78,220 -80,232 C-76,228 -72,214 -72,196 C-72,184 -74,176 -78,172 Z",
  ],
  "glutes": ["M-50,270 C-58,284 -58,304 -50,322 C-40,330 -20,330 -4,322 C-2,304 -6,284 -12,270 C-24,264 -38,264 -50,270 Z"],
  "hamstrings": [
    "M-48,332 C-54,356 -52,390 -42,414 C-36,418 -30,416 -28,408 C-32,382 -32,352 -32,334 Z",
    "M-28,334 C-31,358 -29,388 -22,414 C-16,418 -10,416 -8,408 C-10,382 -12,352 -12,334 Z",
  ],
  "calves": [
    "M-42,428 C-50,446 -48,478 -36,494 C-30,496 -26,490 -24,480 C-28,462 -30,444 -30,430 Z",
    "M-22,430 C-25,450 -25,472 -20,488 C-15,492 -11,488 -11,478 C-13,462 -13,444 -13,430 Z",
  ],
}
BACK_DETAIL = [
  "M-9,210 L-2,210 L-2,266 L-9,266 Z",                                                             # erectors
  "M-98,222 C-104,246 -108,276 -106,306 C-102,308 -98,306 -96,300 C-96,272 -94,246 -92,226 Z",
  "M-90,226 C-88,250 -88,280 -92,306 C-88,310 -84,308 -84,300 C-82,272 -84,246 -86,226 Z",
  "M-34,494 C-32,502 -22,504 -14,496 L-14,488 C-20,494 -28,496 -34,490 Z",                       # soleus
]
BACK_LINES = ["M0,68 L0,270", "M-30,272 C-30,290 -28,308 -24,324", "M-72,108 C-78,122 -80,138 -78,148", "M-40,176 C-46,200 -44,224 -36,246"]

def mirror(d):
    out, i = [], 0
    for tok in re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", d):
        if tok in "MLCZ": out.append(tok); i = 0
        else:
            v = float(tok); v = -v if i % 2 == 0 else v; out.append("%g" % v); i += 1
    s, buf = "", []
    for tok in out:
        if tok in "MLCZ":
            if buf: s += " ".join(",".join(buf[j:j+2]) for j in range(0, len(buf), 2)) + " "
            buf = []; s += tok
        else: buf.append(tok)
    if buf: s += " ".join(",".join(buf[j:j+2]) for j in range(0, len(buf), 2))
    return s.strip()
def both(d): return [d, mirror(d)]

SAMPLE = {"chest":"growth","front_delt":"focus","side_delt":"maintaining","rear_delt":"maintaining","triceps":"growth","biceps":"growth",
          "lats":"growth","upper_back":"focus","quads":"none","hamstrings":"none","glutes":"none","calves":"none","core":"focus"}
ZONE = {"maintaining":"#3B82F6","growth":"#ADFF02","focus":"#EAB308","over":"#FC7753"}

# ------------------------------------------------------------------ styles
STYLES = {
  # closest to the reference: every muscle outlined, untrained ones visible as dark shapes
  "A": dict(name="Outlined anatomy", body="#1a1a1a", none="#222222", line="#3d3d3d", lw=1.2,
            filled_stroke="rgba(0,0,0,0.35)", glow=False, striation="#3d3d3d"),
  # smooth, no outlines; trained muscles glow softly
  "B": dict(name="Soft solid", body="#171717", none="#242424", line="#171717", lw=0.8,
            filled_stroke="none", glow=True, striation="#2c2c2c"),
  # blueprint: everything as line work, trained muscles filled
  "C": dict(name="Line art", body="#111111", none="#111111", line="#4a4a4a", lw=1,
            filled_stroke="rgba(255,255,255,0.25)", glow=False, striation="#4a4a4a"),
  # flat vector: light muscle shapes split by gaps of the body tone, no outlines
  "D": dict(name="Flat separated", body="#1c1c1c", none="#3a3a3a", line="#1c1c1c", lw=2.5,
            filled_stroke="#1c1c1c", glow=False, striation="#1c1c1c"),
}

def figure(side, cx, st, zones):
    regions = FRONT if side == "front" else BACK
    detail = FRONT_DETAIL if side == "front" else BACK_DETAIL
    lines = FRONT_LINES if side == "front" else BACK_LINES
    p = [f'<g transform="translate({cx},0)">']
    p.append(f'<path d="{HEAD}" fill="{st["body"]}" stroke="{st["line"]}" stroke-width="{st["lw"]}"></path>')
    p.append(f'<path d="{NECK}" fill="{st["body"]}" stroke="{st["line"]}" stroke-width="{st["lw"]}"></path>')
    for d in both(SILHOUETTE):
        p.append(f'<path d="{d}" fill="{st["body"]}" stroke="{st["line"]}" stroke-width="{st["lw"]}"></path>')
    for d in detail:
        for dd in both(d):
            p.append(f'<path d="{dd}" fill="{st["none"]}" stroke="{st["line"]}" stroke-width="{st["lw"]}" stroke-linejoin="round"></path>')
    for d in lines:
        for dd in both(d):
            p.append(f'<path d="{dd}" fill="none" stroke="{st["striation"]}" stroke-width="{st["lw"]}"></path>')
    order = ["chest", "biceps", "triceps", "lats", "core", "quads", "hamstrings", "glutes", "calves", "upper_back", "front_delt", "rear_delt", "side_delt"]
    for m in sorted(regions, key=lambda k: order.index(k) if k in order else 99):
        paths = regions[m]
        z = zones.get(m, "none")
        filled = z != "none"
        fill = ZONE[z] if filled else st["none"]
        stroke = st["filled_stroke"] if filled else st["line"]
        extra = ' filter="url(#glow)"' if (filled and st["glow"]) else ""
        for d in paths:
            for dd in both(d):
                p.append(f'<path d="{dd}" data-muscle="{m}" fill="{fill}" stroke="{stroke}" stroke-width="{st["lw"]}" stroke-linejoin="round"{extra}></path>')
    p.append("</g>")
    return "\n".join(p)

def svg(st, zones, w="100%"):
    defs = '<defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
    return (f'<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" style="width:{w};height:auto;display:block">'
            + defs + figure("front", 100, st, zones) + figure("back", 300, st, zones) + "</svg>")

# ------------------------------------------------------------------ outputs
cards = ""
for key, st in STYLES.items():
    cards += f'<div class="opt"><h2>{key} · {st["name"]}</h2>{svg(st, SAMPLE)}</div>'
open(os.path.join(HERE, "options-preview.html"), "w").write(f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#0a0a0a;color:#888;font:13px -apple-system,sans-serif}} .row{{display:flex;gap:24px;padding:20px}}
.opt{{width:390px}} h2{{font-size:13px;font-weight:500;margin:0 0 8px;color:#888}}</style></head>
<body><div class="row">{cards}</div></body></html>""")

CAPTIONS = {
  "A": "Every muscle outlined, untrained ones stay visible as dark shapes. Closest to the reference; busiest when nothing is trained.",
  "B": "No outlines, trained muscles glow softly on a smooth silhouette. Calmest; untrained muscles nearly disappear.",
  "C": "Blueprint line work with trained muscles filled. Most distinctive; thin lines can vanish on a small screen.",
  "D": "Flat vector: light muscle shapes split by gaps, no outlines, like the stock reference. Reads instantly at thumbnail size; the least atmospheric.",
}
for key, st in STYLES.items():
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body {{ margin: 0; background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
    a {{ color: #adff02; }} a:hover {{ color: #adff02; }}
  </style>
</helmet>
<div style="width: 390px; background: #0a0a0a; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px;">
  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Option {key} · {st["name"]}</p>
  {svg(st, SAMPLE)}
  <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #888888;">{CAPTIONS[key]}</p>
</div>
</x-dc>
</body>
</html>
"""
    open(os.path.join(HERE, f"Figure{key}.dc.html"), "w").write(html)
print("wrote options-preview.html and Figure{A,B,C}.dc.html")
