#!/usr/bin/env python3
"""Single source of truth for the muscle-map figure.

Each region is drawn for the LEFT half of a figure whose centre line is x=0
(absolute M/L/C/Z commands only) and mirrored by negating x. Emits:
  preview.html     static preview for screenshots
  Body.dc.html     design component (fills/handlers bound to props)
  bodyPaths.ts     the same geometry for the app
"""
import re, json, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- geometry
# Silhouette of one half (left). Head is drawn separately (not mirrored).
SILHOUETTE = (
  "M0,84 L-14,84 C-40,88 -64,96 -80,108 C-94,120 -98,140 -94,160 "
  "C-96,185 -98,210 -100,235 C-102,262 -103,290 -102,318 "
  "C-104,330 -102,345 -96,350 L-86,350 C-82,340 -82,330 -84,318 "
  "C-82,290 -80,262 -78,235 C-76,210 -74,185 -72,160 L-66,144 "
  "C-64,170 -56,200 -50,230 C-48,245 -50,262 -54,280 L-56,300 "
  "C-58,340 -52,380 -48,410 L-46,420 C-48,450 -44,480 -40,500 "
  "L-42,512 L-12,512 L-10,500 C-12,470 -14,440 -16,420 "
  "C-18,390 -12,350 -4,320 L0,315 Z"
)
# stroke-only detail lines (mirrored), drawn over the silhouette
DETAIL_FRONT = [
  "M-4,96 C-24,92 -48,96 -66,106",          # collarbone
  "M-90,240 C-92,265 -93,290 -92,316",       # forearm
  "M-27,424 C-28,450 -26,478 -24,500",       # shin
]
DETAIL_BACK = [
  "M0,84 L0,262",                            # spine
  "M-90,240 C-92,265 -93,290 -92,316",
  "M-30,426 C-31,450 -29,478 -27,500",
]
HEAD = "M-24,40 C-24,22 -12,10 0,10 C12,10 24,22 24,40 C24,58 12,70 0,70 C-12,70 -24,58 -24,40 Z"
NECK = "M-12,64 L12,64 L14,86 L-14,86 Z"

# muscle key -> list of left-half paths (each mirrored automatically)
FRONT = {
  "front_delt": ["M-56,102 C-68,100 -80,106 -86,118 C-84,128 -80,136 -74,140 C-66,136 -60,126 -56,112 Z"],
  "side_delt":  ["M-86,118 C-94,128 -96,144 -92,158 C-84,156 -78,148 -74,140 C-80,134 -84,126 -86,118 Z"],
  "chest":      ["M-3,104 C-22,100 -46,104 -60,112 C-67,124 -67,140 -60,152 C-44,163 -20,163 -3,155 Z"],
  "biceps":     ["M-77,158 C-86,168 -90,192 -87,216 C-85,224 -80,230 -75,232 C-69,222 -66,198 -68,174 C-70,166 -73,160 -77,158 Z"],
  "core": [
    "M-22,166 C-12,163 -5,163 -3,165 L-3,190 C-9,192 -16,192 -22,190 Z",
    "M-22,194 L-3,194 L-3,220 L-22,220 Z",
    "M-22,224 L-3,224 L-3,252 L-22,252 Z",
    "M-22,256 L-3,256 L-3,302 C-9,312 -16,302 -20,282 Z",
    "M-25,168 C-32,176 -37,196 -37,220 C-37,240 -33,254 -27,262 L-24,244 C-24,218 -24,192 -25,168 Z",
  ],
  "quads": [
    "M-32,310 C-40,332 -42,372 -34,406 C-30,414 -22,414 -18,406 C-14,372 -18,332 -24,310 Z",
    "M-53,304 C-58,340 -54,384 -46,412 C-43,415 -38,414 -36,406 C-41,372 -43,332 -40,308 Z",
    "M-20,378 C-22,396 -20,412 -14,420 C-9,418 -7,405 -9,390 C-11,382 -15,378 -20,378 Z",
  ],
}
BACK = {
  "upper_back": ["M0,84 L-14,84 C-40,88 -62,96 -78,108 C-60,114 -42,124 -28,140 C-16,158 -6,180 0,200 Z"],
  "rear_delt":  ["M-56,102 C-68,100 -80,106 -86,118 C-84,128 -80,136 -74,140 C-66,136 -60,126 -56,112 Z"],
  "side_delt":  ["M-86,118 C-94,128 -96,144 -92,158 C-84,156 -78,148 -74,140 C-80,134 -84,126 -86,118 Z"],
  "lats":       ["M-26,142 C-44,138 -60,142 -66,150 C-64,180 -58,212 -46,240 C-38,254 -24,262 -10,262 C-8,240 -10,214 -14,190 C-16,172 -20,156 -26,142 Z"],
  "triceps":    ["M-77,158 C-87,170 -90,196 -86,220 C-84,228 -79,232 -74,232 C-68,222 -66,198 -68,174 C-70,166 -73,160 -77,158 Z"],
  "glutes":     ["M-48,268 C-56,280 -56,300 -50,318 C-40,326 -20,326 -4,318 C-2,300 -6,280 -12,268 C-24,262 -36,262 -48,268 Z"],
  "hamstrings": [
    "M-46,328 C-52,350 -50,385 -42,412 C-36,416 -30,414 -28,406 C-32,380 -32,350 -30,330 Z",
    "M-26,330 C-30,355 -28,385 -22,412 C-16,416 -10,414 -8,406 C-10,380 -12,350 -12,330 Z",
  ],
  "calves": [
    "M-40,428 C-48,445 -46,475 -36,492 C-30,494 -26,490 -24,480 C-28,462 -30,444 -30,430 Z",
    "M-22,430 C-24,448 -24,470 -20,486 C-16,490 -12,486 -12,476 C-14,460 -14,444 -14,430 Z",
  ],
}

MUSCLES = ["chest","front_delt","side_delt","rear_delt","triceps","biceps","lats","upper_back","quads","hamstrings","glutes","calves","core"]

NUM = re.compile(r"-?\d+(?:\.\d+)?")
def mirror(d):
    """Negate every x in absolute M/L/C path data."""
    out, i = [], 0
    for tok in re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", d):
        if tok in "MLCZ":
            out.append(tok); i = 0
        else:
            v = float(tok)
            if i % 2 == 0: v = -v
            out.append(("%g" % v)); i += 1
    # re-join: letters then comma-paired numbers
    s, buf = "", []
    for tok in out:
        if tok in "MLCZ":
            if buf: s += " ".join(",".join(buf[j:j+2]) for j in range(0,len(buf),2)) + " "
            buf = []; s += tok
        else:
            buf.append(tok)
    if buf: s += " ".join(",".join(buf[j:j+2]) for j in range(0,len(buf),2))
    return s.replace("M", "M").strip()

def both(d): return [d, mirror(d)]

def figure(side, cx, attr):
    """attr(muscle) -> extra attribute string for each muscle path."""
    regions = FRONT if side == "front" else BACK
    parts = [f'<g transform="translate({cx},0)">']
    parts.append(f'<path d="{HEAD}" fill="#161616"></path>')
    parts.append(f'<path d="{NECK}" fill="#161616"></path>')
    for d in both(SILHOUETTE):
        parts.append(f'<path d="{d}" fill="#161616"></path>')
    if side == "back":
        for d in both("M-9,204 L-2,204 L-2,262 L-9,262 Z"):
            parts.append(f'<path d="{d}" fill="#1e1e1e"></path>')
    for d in (DETAIL_FRONT if side == "front" else DETAIL_BACK):
        for dd in both(d):
            parts.append(f'<path d="{dd}" fill="none" stroke="#242424" stroke-width="1"></path>')
    for m, paths in regions.items():
        for d in paths:
            ds = both(d) if not (m == "upper_back") else [d, mirror(d)]
            for dd in ds:
                parts.append(f'<path d="{dd}" data-muscle="{m}" {attr(m)}></path>')
    parts.append("</g>")
    return "\n".join(parts)

def svg(attr, view="both", w=400, h=520):
    body = []
    if view in ("both","front"): body.append(figure("front", 100 if view=="both" else 100, attr))
    if view in ("both","back"):  body.append(figure("back", 300 if view=="both" else 100, attr))
    vb = "0 0 400 520" if view == "both" else "0 0 200 520"
    return f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">\n' + "\n".join(body) + "\n</svg>"

# ------------------------------------------------------------- preview.html
SAMPLE = {"chest":"#ADFF02","front_delt":"#EAB308","side_delt":"#3B82F6","rear_delt":"#3B82F6","triceps":"#ADFF02","biceps":"#ADFF02",
          "lats":"#ADFF02","upper_back":"#EAB308","quads":"#1e1e1e","hamstrings":"#1e1e1e","glutes":"#1e1e1e","calves":"#1e1e1e","core":"#EAB308"}
def preview_attr(m):
    return f'fill="{SAMPLE[m]}" stroke="#2a2a2a" stroke-width="1"'
preview = f"""<!doctype html><html><head><meta charset="utf-8"><style>body{{margin:0;background:#0a0a0a}} .wrap{{width:390px;padding:20px 0}}</style></head>
<body><div class="wrap">{svg(preview_attr)}</div></body></html>"""
open(os.path.join(HERE, "preview.html"), "w").write(preview)

# ------------------------------------------------------------ bodyPaths.ts
ts = {"silhouette": both(SILHOUETTE), "head": HEAD, "neck": NECK,
      "front": {m: [p for d in ps for p in both(d)] for m, ps in FRONT.items()},
      "back":  {m: [p for d in ps for p in both(d)] for m, ps in BACK.items()}}
open(os.path.join(HERE, "bodyPaths.json"), "w").write(json.dumps(ts))
print("wrote preview.html, bodyPaths.json")

# ------------------------------------------------------------- Body.dc.html
PATHS_JSON = json.dumps(ts, separators=(",", ":"))
body_dc = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    a { color: #adff02; } a:hover { color: #adff02; }
    .muscle { cursor: pointer; transition: opacity 160ms ease; }
  </style>
</helmet>
<div ref="{{ hostRef }}" onClick="{{ onSvgClick }}" style="width: 100%; display: block; line-height: 0;"></div>
</x-dc>
<script data-dc-script data-props='{"view":{"editor":"enum","default":"both","options":["both","front","back","front-torso","back-torso","front-legs","back-legs"]},"zones":{"editor":null,"default":{}},"selected":{"editor":null,"default":null},"dim":{"editor":null,"default":null},"onPick":{"editor":null,"default":null},"$preview":{"width":400,"height":520}}'>
const PATHS = __PATHS__;
const ZONE_COLORS = { maintaining: '#3B82F6', growth: '#ADFF02', focus: '#EAB308', over: '#FC7753' };
const SELECT = '#adff02';
// Full figure sits on the page background; crops sit on a card, so they get a lighter body.
const TONES = {
  full: { body: '#161616', none: '#1e1e1e', line: '#2a2a2a' },
  crop: { body: '#262626', none: '#333333', line: '#404040' },
};
const VIEWBOX = {
  both: '0 0 400 520', front: '0 0 200 520', back: '0 0 200 520',
  'front-torso': '20 70 160 200', 'back-torso': '20 70 160 200',
  'front-legs': '20 250 160 270', 'back-legs': '20 250 160 270',
};
function figure(side, cx, zones, selected, dim, tone) {
  const P = PATHS[side];
  let out = '<g transform="translate(' + cx + ',0)">';
  out += '<path d="' + PATHS.head + '" fill="' + tone.body + '"></path>';
  out += '<path d="' + PATHS.neck + '" fill="' + tone.body + '"></path>';
  for (const d of PATHS.silhouette) out += '<path d="' + d + '" fill="' + tone.body + '"></path>';
  if (side === 'back') for (const d of PATHS.erectors) out += '<path d="' + d + '" fill="' + tone.none + '"></path>';
  for (const d of PATHS.detail[side]) out += '<path d="' + d + '" fill="none" stroke="' + tone.line + '" stroke-width="1"></path>';
  const LINE = tone.line;
  for (const m in P) {
    const zone = (zones && zones[m]) || 'none';
    const fill = ZONE_COLORS[zone] || tone.none;
    const sel = selected === m;
    const dimmed = Array.isArray(dim) && dim.length > 0 && !dim.includes(m);
    const stroke = sel ? SELECT : LINE, sw = sel ? 2 : 1;
    for (const d of P[m]) {
      out += '<path class="muscle" data-muscle="' + m + '" d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round" style="opacity:' + (dimmed ? 0.25 : 1) + '"></path>';
    }
  }
  return out + '</g>';
}
function render(props) {
  const view = props.view || 'both';
  const zones = props.zones || {}, selected = props.selected || null, dim = props.dim || null;
  const tone = view.includes('-') ? TONES.crop : TONES.full;
  let inner = '';
  if (view === 'both') inner = figure('front', 100, zones, selected, dim, tone) + figure('back', 300, zones, selected, dim, tone);
  else if (view.startsWith('front')) inner = figure('front', 100, zones, selected, dim, tone);
  else inner = figure('back', 100, zones, selected, dim, tone);
  return '<svg viewBox="' + VIEWBOX[view] + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" role="img" aria-label="Muscle map">' + inner + '</svg>';
}
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.host = null;
    this.hostRef = (el) => { this.host = el; this.paint(); };
    this.onSvgClick = (e) => {
      const t = e && e.target && e.target.closest ? e.target.closest('[data-muscle]') : null;
      if (t && typeof this.props.onPick === 'function') this.props.onPick(t.getAttribute('data-muscle'));
    };
  }
  paint() { if (this.host) this.host.innerHTML = render(this.props); }
  componentDidMount() { this.paint(); }
  componentDidUpdate() { this.paint(); }
  renderVals() { return { hostRef: this.hostRef, onSvgClick: this.onSvgClick }; }
}
</script>
</body>
</html>
"""
ts["erectors"] = both("M-9,204 L-2,204 L-2,262 L-9,262 Z")
ts["detail"] = {"front": [p for d in DETAIL_FRONT for p in both(d)], "back": [p for d in DETAIL_BACK for p in both(d)]}
open(os.path.join(HERE, "bodyPaths.json"), "w").write(json.dumps(ts))
open(os.path.join(HERE, "Body.dc.html"), "w").write(body_dc.replace("__PATHS__", json.dumps(ts, separators=(",", ":"))))
print("wrote Body.dc.html")
