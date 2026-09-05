#!/usr/bin/env python3
"""Figure v3: flat, simplified, muscular silhouette tiled with separated muscle shapes.

Left half of each figure drawn on a 0..520 canvas centred on x=0 (absolute
M/L/C/Z only) and mirrored. Every muscle path is stroked in the body tone so
the shapes read as separated by a uniform gap.
"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------ shared parts
HAIR = "M-24,28 C-24,10 -12,2 0,2 C12,2 24,10 24,28 C20,20 14,16 8,16 C2,16 -2,14 -6,20 C-12,16 -20,18 -24,28 Z"
FACE = "M-22,34 C-22,18 -12,12 0,12 C12,12 22,18 22,34 C22,50 12,66 0,66 C-12,66 -22,50 -22,34 Z"
HAIR_BACK = "M-24,34 C-26,14 -14,2 0,2 C14,2 26,14 24,34 C22,44 12,48 0,48 C-12,48 -22,44 -24,34 Z"
HEAD_BACK = "M-22,36 C-22,20 -12,12 0,12 C12,12 22,20 22,36 C22,50 12,66 0,66 C-12,66 -22,50 -22,36 Z"
NECK_L = "M-16,60 C-18,68 -18,78 -14,88 L-6,88 C-8,78 -8,68 -6,62 Z"           # sternocleidomastoid (mirrored)
NECK_BACK = "M-14,60 L14,60 L16,88 L-16,88 Z"

# One half of the outer silhouette, generous so it shows through as the gap tone.
SILHOUETTE = (
  "M0,84 L-18,82 C-40,84 -60,90 -74,96 "                 # trap slope
  "C-100,98 -116,116 -116,140 C-116,156 -112,168 -108,176 "  # delt cap
  "C-116,196 -120,214 -118,236 "                           # upper arm outer
  "C-122,262 -124,290 -120,318 "                           # forearm outer
  "C-122,336 -118,354 -108,364 L-92,364 C-86,352 -86,336 -88,318 "  # hand
  "C-86,296 -84,270 -82,244 C-80,224 -78,206 -76,186 L-70,158 "     # arm inner to armpit
  "C-64,184 -56,214 -50,240 C-48,254 -52,266 -60,276 "     # torso side to hip
  "L-66,296 C-72,336 -62,378 -50,412 L-46,432 "            # thigh outer to knee
  "C-50,456 -46,482 -40,502 C-46,508 -52,516 -46,520 L-8,520 L-8,502 "  # calf, foot
  "C-12,478 -14,452 -14,432 C-18,400 -12,352 -4,316 L0,308 Z"          # inner leg to crotch
)

# muscle key -> left-half paths. "detail" = unmapped shapes in the muscle tone.
FRONT = {
  "upper_back": ["M-20,84 C-34,86 -50,90 -66,96 C-58,102 -52,106 -46,108 C-38,100 -28,94 -20,90 Z"],   # trap sliver
  "front_delt": ["M-48,108 C-60,94 -82,90 -96,100 C-100,112 -100,130 -96,146 C-84,156 -68,154 -58,146 C-52,134 -50,120 -48,108 Z"],
  "side_delt":  ["M-98,100 C-108,106 -114,122 -114,140 C-114,154 -110,166 -104,172 C-100,168 -98,160 -98,150 C-102,132 -102,114 -98,100 Z"],
  "chest": [
    "M-4,104 C-24,102 -44,104 -56,112 C-66,124 -70,144 -64,162 C-54,176 -28,178 -4,168 Z",
  ],
  "biceps": ["M-72,164 C-90,160 -108,172 -110,196 C-110,216 -102,232 -90,236 C-82,230 -78,218 -78,204 C-78,190 -76,176 -72,164 Z"],
  "core": [
    "M-24,174 C-16,172 -8,172 -4,174 L-4,196 L-24,196 Z",
    "M-24,200 L-4,200 L-4,224 L-24,224 Z",
    "M-24,228 L-4,228 L-4,254 L-24,254 Z",
    "M-24,258 L-4,258 L-4,300 C-8,310 -18,306 -22,290 Z",
    "M-28,178 C-38,184 -46,196 -48,214 L-30,222 C-28,208 -28,192 -28,178 Z",
    "M-48,220 C-48,240 -44,256 -34,266 L-28,258 C-30,246 -30,234 -30,224 Z",
  ],
  "quads": [
    "M-62,298 C-68,330 -66,370 -54,408 C-50,412 -44,410 -42,404 C-46,372 -48,334 -44,300 Z",   # vastus lateralis
    "M-40,300 C-46,334 -46,374 -38,404 C-32,412 -22,412 -18,404 C-14,372 -16,334 -20,300 Z",   # rectus femoris
    "M-30,366 C-32,384 -28,404 -18,414 C-10,414 -6,404 -8,388 C-12,376 -20,368 -30,366 Z",     # vastus medialis
    "M-58,296 C-50,318 -36,342 -18,362 L-14,354 C-28,336 -40,316 -50,294 Z",                   # sartorius strip
  ],
  "calves": ["M-26,436 C-30,456 -28,478 -20,494 C-14,496 -10,490 -10,480 C-12,462 -14,446 -16,436 Z"],
}
FRONT_DETAIL = [
  "M-66,164 L-52,170 L-54,180 L-66,176 Z", "M-64,184 L-50,190 L-52,200 L-64,196 Z", "M-62,204 L-48,210 L-50,220 L-62,216 Z",  # serratus
  "M-94,240 C-104,252 -110,280 -108,306 C-104,312 -98,312 -94,306 C-96,282 -94,258 -88,242 Z",                            # brachioradialis
  "M-86,244 C-84,262 -84,286 -90,310 C-96,316 -104,316 -108,312 C-110,300 -108,286 -102,270 L-102,268 C-98,258 -92,250 -86,244 Z",  # flexors
  "M-108,320 C-114,332 -114,350 -106,360 L-94,360 C-88,350 -88,334 -92,322 Z", "M-112,322 C-116,328 -118,338 -114,346 L-110,346 C-108,338 -108,330 -110,322 Z",  # hand, thumb
  "M-20,304 C-14,320 -8,330 -2,334 L-2,308 Z",                                                                             # pelvis V
  "M-16,300 C-20,320 -20,344 -14,360 C-8,356 -4,344 -4,320 L-4,306 Z",                                                    # adductor
  "M-40,416 C-40,410 -22,410 -22,416 C-22,424 -40,424 -40,416 Z",                                                         # kneecap
  "M-44,436 C-50,458 -46,484 -38,500 C-34,500 -30,496 -30,488 C-32,468 -34,450 -32,436 Z",                                 # tibialis
  "M-42,504 C-50,510 -52,518 -44,520 L-10,520 L-10,504 Z",                                                                 # foot
]
BACK = {
  "upper_back": [
    "M0,80 L-18,82 C-40,84 -60,90 -74,96 C-58,110 -40,120 -22,124 C-10,124 -4,120 0,116 Z",     # upper trap
    "M0,120 C-10,124 -24,128 -38,132 C-34,150 -26,170 -14,186 C-8,194 -4,200 0,206 Z",         # middle trap
    "M-42,136 C-56,132 -68,140 -72,152 C-70,162 -64,170 -56,172 C-48,166 -42,152 -42,136 Z",   # infraspinatus
    "M-50,174 C-62,172 -74,176 -78,186 C-76,194 -70,198 -62,196 C-56,190 -52,182 -50,174 Z",   # teres
  ],
  "rear_delt":  ["M-48,108 C-60,94 -82,90 -96,100 C-100,112 -100,130 -96,146 C-84,156 -68,154 -58,146 C-52,134 -50,120 -48,108 Z"],
  "side_delt":  ["M-98,100 C-108,106 -114,122 -114,140 C-114,154 -110,166 -104,172 C-100,168 -98,160 -98,150 C-102,132 -102,114 -98,100 Z"],
  "lats": ["M-52,176 C-60,182 -66,192 -66,204 C-62,232 -50,256 -30,276 C-24,278 -18,278 -14,274 C-16,250 -18,226 -20,204 C-22,190 -32,178 -52,176 Z"],
  "triceps": [
    "M-74,166 C-92,164 -108,178 -110,200 C-110,214 -106,228 -98,236 C-92,228 -90,214 -90,200 C-88,186 -84,174 -74,166 Z",   # long head
    "M-90,200 C-90,214 -92,228 -98,236 C-90,238 -82,232 -80,220 C-80,210 -84,204 -90,200 Z",                                   # lateral head
  ],
  "glutes": ["M-60,282 C-66,296 -64,320 -54,338 C-42,346 -20,346 -4,338 C-2,318 -6,298 -14,284 C-28,278 -46,278 -60,282 Z"],
  "hamstrings": [
    "M-58,344 C-64,368 -60,398 -48,426 C-42,430 -36,428 -34,420 C-38,394 -40,368 -38,346 Z",   # biceps femoris
    "M-34,346 C-36,370 -34,398 -26,426 C-20,430 -12,428 -10,420 C-12,394 -14,368 -14,346 Z",   # semitendinosus
  ],
  "calves": [
    "M-44,438 C-52,456 -50,482 -38,498 C-32,500 -28,496 -26,488 C-30,470 -32,452 -30,438 Z",
    "M-26,438 C-28,456 -28,478 -22,494 C-16,498 -12,494 -12,484 C-14,466 -14,450 -14,438 Z",
  ],
}
BACK_DETAIL = [
  "M-14,208 C-16,228 -16,250 -14,272 L-4,272 L-4,208 Z",                                      # erector
  "M-20,278 C-12,284 -6,286 -2,286 L-2,272 L-18,272 Z",                                       # lower back
  "M-94,240 C-104,252 -110,280 -108,306 C-104,312 -98,312 -94,306 C-96,282 -94,258 -88,242 Z",
  "M-86,244 C-84,262 -84,286 -90,310 C-96,316 -104,316 -108,312 C-110,300 -108,286 -102,270 L-102,268 C-98,258 -92,250 -86,244 Z",
  "M-108,320 C-114,332 -114,350 -106,360 L-94,360 C-88,350 -88,334 -92,322 Z",
  "M-36,498 C-32,506 -20,506 -14,498 L-14,490 C-20,496 -30,496 -36,490 Z",                    # soleus
  "M-42,504 C-50,510 -52,518 -44,520 L-10,520 L-10,504 Z",
]

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

ORDER = ["chest","core","lats","biceps","triceps","quads","hamstrings","glutes","calves","upper_back","front_delt","rear_delt","side_delt"]
ZONE = {"maintaining":"#3B82F6","growth":"#ADFF02","focus":"#EAB308","over":"#FC7753"}
TONES = {
  "ref":      dict(body="#3a3a3a", none="#232323"),   # body lighter than muscle, like the reference
  "inverted": dict(body="#1c1c1c", none="#3a3a3a"),
}
GAP = 3

def figure(side, cx, tone, zones, selected=None):
    regions = FRONT if side == "front" else BACK
    detail = FRONT_DETAIL if side == "front" else BACK_DETAIL
    B, N = tone["body"], tone["none"]
    p = [f'<g transform="translate({cx},0)">']
    for d in both(SILHOUETTE): p.append(f'<path d="{d}" fill="{B}"></path>')
    head = [(HAIR, N), (FACE, N)] if side == "front" else [(HEAD_BACK, N), (HAIR_BACK, N)]
    p.append(f'<path d="{NECK_BACK}" fill="{B}"></path>')
    for d, f in head: p.append(f'<path d="{d}" fill="{f}" stroke="{B}" stroke-width="{GAP}" stroke-linejoin="round"></path>')
    if side == "front":
        for d in both(NECK_L): p.append(f'<path d="{d}" fill="{N}" stroke="{B}" stroke-width="{GAP}" stroke-linejoin="round"></path>')
    else:
        p.append(f'<path d="M-12,62 L12,62 L14,86 L-14,86 Z" fill="{N}" stroke="{B}" stroke-width="{GAP}" stroke-linejoin="round"></path>')
    for d in detail:
        for dd in both(d): p.append(f'<path d="{dd}" fill="{N}" stroke="{B}" stroke-width="{GAP}" stroke-linejoin="round"></path>')
    for m in sorted(regions, key=lambda k: ORDER.index(k)):
        z = zones.get(m, "none")
        fill = ZONE[z] if z != "none" else N
        sel = f' data-selected="1"' if selected == m else ""
        for d in regions[m]:
            for dd in both(d):
                p.append(f'<path d="{dd}" data-muscle="{m}"{sel} fill="{fill}" stroke="{B}" stroke-width="{GAP}" stroke-linejoin="round"></path>')
    p.append("</g>")
    return "\n".join(p)

VIEWBOX = {"both": "0 0 480 520", "front": "0 0 240 520", "back": "0 0 240 520",
           "front-torso": "0 70 240 230", "back-torso": "0 70 240 230",
           "front-legs": "40 280 160 250", "back-legs": "40 280 160 250"}

def svg(tone, zones, view="both", w="100%", selected=None):
    if view == "both": inner = figure("front", 120, tone, zones, selected) + figure("back", 360, tone, zones, selected)
    elif view.startswith("front"): inner = figure("front", 120, tone, zones, selected)
    else: inner = figure("back", 120, tone, zones, selected)
    return f'<svg viewBox="{VIEWBOX[view]}" xmlns="http://www.w3.org/2000/svg" style="width:{w};height:auto;display:block">{inner}</svg>'

SAMPLE = {"chest":"growth","front_delt":"focus","side_delt":"maintaining","rear_delt":"maintaining","triceps":"growth","biceps":"growth",
          "lats":"growth","upper_back":"focus","core":"focus"}

if __name__ == "__main__":
    cols = ""
    for key, tone in TONES.items():
        crops = "".join(f'<div style="width:64px">{svg(tone, {m: "maintaining"}, v)}</div>'
                        for m, v in [("chest","front-torso"),("lats","back-torso"),("quads","front-legs"),("hamstrings","back-legs")])
        cols += f'<div class="opt"><h2>{key}</h2>{svg(tone, SAMPLE)}<div class="crops">{crops}</div></div>'
    open(os.path.join(HERE, "preview3.html"), "w").write(f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#0a0a0a;color:#888;font:13px -apple-system,sans-serif}} .row{{display:flex;gap:24px;padding:20px}}
.opt{{width:390px}} h2{{font-size:13px;font-weight:500;margin:0 0 8px}} .crops{{display:flex;gap:16px;margin-top:12px;padding:12px;background:#141414;border-radius:12px}}</style></head>
<body><div class="row">{cols}</div></body></html>""")
    print("wrote preview3.html")


# ------------------------------------------------------------ emitters
def paths_json():
    return {
        "silhouette": both(SILHOUETTE),
        "hair": HAIR, "face": FACE, "hairBack": HAIR_BACK, "headBack": HEAD_BACK,
        "neckFront": both(NECK_L), "neckBack": "M-12,62 L12,62 L14,86 L-14,86 Z", "neckBase": NECK_BACK,
        "front": {m: [p for d in ps for p in both(d)] for m, ps in FRONT.items()},
        "back":  {m: [p for d in ps for p in both(d)] for m, ps in BACK.items()},
        "detail": {"front": [p for d in FRONT_DETAIL for p in both(d)], "back": [p for d in BACK_DETAIL for p in both(d)]},
        "order": ORDER, "viewbox": VIEWBOX, "gap": GAP,
    }

BODY_DC = """<!doctype html>
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
<script data-dc-script data-props='{"view":{"editor":"enum","default":"both","options":["both","front","back","front-torso","back-torso","front-legs","back-legs"]},"zones":{"editor":null,"default":{}},"selected":{"editor":null,"default":null},"dim":{"editor":null,"default":null},"onPick":{"editor":null,"default":null},"$preview":{"width":480,"height":520}}'>
const P = __PATHS__;
const ZONE_COLORS = { maintaining: '#3B82F6', growth: '#ADFF02', focus: '#EAB308', over: '#FC7753' };
const BODY = '#3a3a3a', NONE = '#232323', SELECT = '#adff02';
function shape(d, fill, extra) {
  return '<path d="' + d + '" fill="' + fill + '" stroke="' + BODY + '" stroke-width="' + P.gap + '" stroke-linejoin="round"' + (extra || '') + '></path>';
}
function figure(side, cx, zones, selected, dim) {
  let out = '<g transform="translate(' + cx + ',0)">';
  for (const d of P.silhouette) out += '<path d="' + d + '" fill="' + BODY + '"></path>';
  out += '<path d="' + P.neckBase + '" fill="' + BODY + '"></path>';
  if (side === 'front') { out += shape(P.hair, NONE) + shape(P.face, NONE); for (const d of P.neckFront) out += shape(d, NONE); }
  else { out += shape(P.headBack, NONE) + shape(P.hairBack, NONE) + shape(P.neckBack, NONE); }
  for (const d of P.detail[side]) out += shape(d, NONE);
  const R = P[side];
  const dimming = Array.isArray(dim) && dim.length > 0;
  for (const m of P.order) {
    if (!R[m]) continue;
    const zone = (zones && zones[m]) || 'none';
    const fill = zone !== 'none' ? ZONE_COLORS[zone] : NONE;
    const sel = selected === m;
    const dimmed = dimming && !dim.includes(m);
    const extra = ' class="muscle" data-muscle="' + m + '" style="opacity:' + (dimmed ? 0.25 : 1) + '"' + (sel ? ' stroke="' + SELECT + '"' : '');
    for (const d of R[m]) out += shape(d, fill, extra);
  }
  return out + '</g>';
}
function render(props) {
  const view = props.view || 'both', zones = props.zones || {}, selected = props.selected || null, dim = props.dim || null;
  let inner = '';
  if (view === 'both') inner = figure('front', 120, zones, selected, dim) + figure('back', 360, zones, selected, dim);
  else if (view.startsWith('front')) inner = figure('front', 120, zones, selected, dim);
  else inner = figure('back', 120, zones, selected, dim);
  return '<svg viewBox="' + P.viewbox[view] + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" role="img" aria-label="Muscle map">' + inner + '</svg>';
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

def emit():
    pj = paths_json()
    open(os.path.join(HERE, "bodyPaths3.json"), "w").write(json.dumps(pj))
    open(os.path.join(HERE, "Body.dc.html"), "w").write(BODY_DC.replace("__PATHS__", json.dumps(pj, separators=(",", ":"))))
    tone = TONES["ref"]
    crops = "".join(
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:64px"><div style="width:64px">{svg(tone, {m: "maintaining"}, v)}</div><span style="font-size:11px;color:#666666">{label}</span></div>'
        for m, v, label in [("chest","front-torso","Chest"),("lats","back-torso","Lats"),("quads","front-legs","Quads"),("calves","back-legs","Calves")])
    fig = f"""<!doctype html>
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
  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Figure · flat separated muscles</p>
  {svg(tone, SAMPLE)}
  <div style="display: flex; gap: 14px; padding: 12px; border-radius: 16px; background: #141414; border: 1px solid #1a1a1a;">{crops}</div>
  <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #888888;">Every muscle is its own flat shape, split by a uniform gap in the body tone. Body lighter than muscle, as in the reference. Below: the card thumbnails at their real size.</p>
</div>
</x-dc>
</body>
</html>
"""
    open(os.path.join(HERE, "Figure.dc.html"), "w").write(fig)
    print("wrote Body.dc.html, Figure.dc.html, bodyPaths3.json")

if __name__ == "__main__":
    emit()
