#!/usr/bin/env python3
"""Build the muscle-map figure from the traced reference illustration.

reference-trace.svg holds four figures (front, back, and highlighted copies).
The first two are scaled into a 0..520 tall frame (front centred at x=120,
back at x=360 in a 480 x 520 box) and every path is assigned to a muscle key
or kept as unmapped detail. Emits Body.dc.html, Figure.dc.html and the app's
src/components/progress/bodyPaths.ts.
"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "reference-trace.svg")

svg = open(SRC).read()
paths = re.findall(r'<path[^>]*?fill="([^"]*)"[^>]*?d="([^"]*)"', svg)

# --------------------------------------------------------------- mapping
# path index -> muscle key (None = unmapped detail). Indices from the trace.
FRONT_BODY = 51
FRONT = {
    "upper_back": [86, 69],
    "front_delt": [61, 59],                 # delt caps; side_delt is the outer part of each (clip)
    "chest": [70, 71],
    "biceps": [73, 72],
    "core": [79, 81, 82, 83, 84, 85, 75, 76, 80, 66],
    "quads": [52, 53, 63, 74],
    "calves": [56, 54],
}
FRONT_DETAIL = [57, 88, 77, 78, 67, 87, 64, 65]   # hair, neck, forearms, tibialis
BACK_BODY = 120
BACK = {
    "upper_back": [137, 129, 141, 142],
    "rear_delt": [144, 145],
    "lats": [136, 127],
    "triceps": [130, 140],
    "glutes": [139, 138],
    "hamstrings": [123, 125],
    "calves": [146, 128],
}
BACK_DETAIL = [121, 132, 143]                      # hair, forearms
BACK_FEET = [151, 149]                             # white heel shapes, body tone
DELT_CAPS = {"front": "front_delt", "back": "rear_delt"}
SIDE_FRACTION = 0.42                               # outer share of each cap that counts as side delt

# ------------------------------------------------------------- transform
def bbox(d):
    nums = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)

fb = bbox(paths[FRONT_BODY][1]); bb = bbox(paths[BACK_BODY][1])
# Both figures share the same vertical extent in the trace (feet at ~947).
top, bottom = fb[1], 947.0
scale = 520.0 / (bottom - top)
def make_tf(body_bbox):
    cx = (body_bbox[0] + body_bbox[2]) / 2
    def tf(x, y): return (x - cx) * scale, (y - top) * scale
    return tf
TF = {"front": make_tf(fb), "back": make_tf(bb)}

def transform(d, tf):
    out = []
    for cmd, args in re.findall(r'([MLCZ])([^MLCZ]*)', d):
        nums = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', args)]
        pts = []
        for i in range(0, len(nums) - 1, 2):
            x, y = tf(nums[i], nums[i + 1]); pts.append(f"{x:.1f},{y:.1f}")
        out.append(cmd + (" " + " ".join(pts) if pts else ""))
    return " ".join(out)

def build(side, body_idx, regions, detail, feet=()):
    tf = TF[side]
    reg = {m: [transform(paths[i][1], tf) for i in idx] for m, idx in regions.items()}
    caps = reg[DELT_CAPS[side]]
    side_delt = []
    for d in caps:
        x0, y0, x1, y1 = bbox(d)
        w = x1 - x0
        outer_left = (x0 + x1) / 2 < 0
        rx = x0 if outer_left else x1 - w * SIDE_FRACTION
        side_delt.append({"d": d, "rect": [round(rx, 1), round(y0 - 2, 1), round(w * SIDE_FRACTION, 1), round(y1 - y0 + 4, 1)]})
    return {
        "silhouette": [transform(paths[body_idx][1], tf)] + [transform(paths[i][1], tf) for i in feet],
        "detail": [transform(paths[i][1], tf) for i in detail],
        "regions": reg,
        "sideDelt": side_delt,
    }

geom = {
    "viewbox": {"both": "0 0 480 520", "front": "0 0 240 520", "back": "0 0 240 520",
                "front-torso": "0 60 240 240", "back-torso": "0 60 240 240",
                "front-legs": "20 290 200 230", "back-legs": "20 290 200 230"},
    "gap": 2.5,
    "order": ["chest", "core", "lats", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "upper_back", "front_delt", "rear_delt"],
    "front": build("front", FRONT_BODY, FRONT, FRONT_DETAIL),
    "back": build("back", BACK_BODY, BACK, BACK_DETAIL, BACK_FEET),
}

# ------------------------------------------------------------ renderers
ZONE = {"maintaining": "#3B82F6", "growth": "#ADFF02", "focus": "#EAB308", "over": "#FC7753"}
BODY, NONE, SELECT = "#3a3a3a", "#232323", "#adff02"

def figure_svg(side, cx, zones, uid):
    g = geom[side]; gap = geom["gap"]
    p = [f'<g transform="translate({cx},0)">']
    for d in g["silhouette"]: p.append(f'<path d="{d}" fill="{BODY}"></path>')
    for d in g["detail"]: p.append(f'<path d="{d}" fill="{NONE}" stroke="{BODY}" stroke-width="{gap}" stroke-linejoin="round"></path>')
    for m in geom["order"]:
        if m not in g["regions"]: continue
        z = zones.get(m, "none"); fill = ZONE[z] if z != "none" else NONE
        for d in g["regions"][m]:
            p.append(f'<path d="{d}" data-muscle="{m}" fill="{fill}" stroke="{BODY}" stroke-width="{gap}" stroke-linejoin="round"></path>')
    z = zones.get("side_delt", "none"); fill = ZONE[z] if z != "none" else NONE
    for i, sd in enumerate(g["sideDelt"]):
        x, y, w, h = sd["rect"]; cid = f"sd-{uid}-{side}-{i}"
        p.append(f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}"></rect></clipPath>')
        p.append(f'<path d="{sd["d"]}" data-muscle="side_delt" clip-path="url(#{cid})" fill="{fill}" stroke="{BODY}" stroke-width="{gap}" stroke-linejoin="round"></path>')
    p.append("</g>")
    return "\n".join(p)

def svg(zones, view="both", uid="x"):
    if view == "both": inner = figure_svg("front", 120, zones, uid) + figure_svg("back", 360, zones, uid)
    elif view.startswith("front"): inner = figure_svg("front", 120, zones, uid)
    else: inner = figure_svg("back", 120, zones, uid)
    return f'<svg viewBox="{geom["viewbox"][view]}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">{inner}</svg>'

SAMPLE = {"chest": "growth", "front_delt": "focus", "side_delt": "maintaining", "rear_delt": "maintaining", "triceps": "growth",
          "biceps": "growth", "lats": "growth", "upper_back": "focus", "core": "focus"}

# preview for screenshots
crops = "".join(f'<div style="width:64px">{svg({m: "maintaining"}, v, "c" + m)}</div>'
                for m, v in [("chest", "front-torso"), ("side_delt", "front-torso"), ("lats", "back-torso"), ("quads", "front-legs"), ("calves", "back-legs")])
open(os.path.join(HERE, "preview-trace.html"), "w").write(f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#0a0a0a}} .w{{width:390px;padding:20px}} .crops{{display:flex;gap:16px;margin-top:12px;padding:12px;background:#141414;border-radius:12px}}</style></head>
<body><div class="w">{svg(SAMPLE)}<div class="crops">{crops}</div></div></body></html>""")

# Body.dc.html (design component)
BODY_DC = open(os.path.join(HERE, "Body.template.html")).read()
open(os.path.join(HERE, "Body.dc.html"), "w").write(BODY_DC.replace("__GEOM__", json.dumps(geom, separators=(",", ":"))))

# Figure.dc.html (static artboard)
labels = [("chest", "front-torso", "Chest"), ("side_delt", "front-torso", "Side delts"), ("lats", "back-torso", "Lats"), ("quads", "front-legs", "Quads"), ("calves", "back-legs", "Calves")]
crops_dc = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:60px"><div style="width:60px">{svg({m: "maintaining"}, v, "f" + m)}</div><span style="font-size:11px;color:#666666">{l}</span></div>' for m, v, l in labels)
open(os.path.join(HERE, "Figure.dc.html"), "w").write(f"""<!doctype html>
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
<div style="width: 390px; background: #0a0a0a; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px;">
  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Figure · from the reference illustration</p>
  {svg(SAMPLE, "both", "fig")}
  <div style="display: flex; gap: 10px; padding: 12px; border-radius: 16px; background: #141414; border: 1px solid #1a1a1a;">{crops_dc}</div>
  <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #888888;">Muscle shapes taken from the traced illustration, scaled into the app's frame and coloured by weekly zone. Side delts are the outer part of each delt cap. Below: the card thumbnails at their real size.</p>
</div>
</x-dc>
</body>
</html>
""")

# app geometry module
app_ts = os.path.normpath(os.path.join(HERE, "..", "..", "src", "components", "progress", "bodyPaths.ts"))
open(app_ts, "w").write("// Generated by design/muscle-map/trace_import.py from reference-trace.svg. Do not edit.\n"
                        "export const BODY_GEOM = " + json.dumps(geom, indent=1) + " as const\n")
print("wrote preview-trace.html, Body.dc.html, Figure.dc.html,", os.path.relpath(app_ts, HERE))
