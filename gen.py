import math
from pathlib import Path

W, H = 1600, 1600
CX, CY = W / 2, H / 2 + 10

def head_radius(theta: float) -> float:
    ct = math.cos(theta)
    st = math.sin(theta)

    r = 420 * (1 - 0.18 * (ct ** 2))

    if st < -0.55:
        r *= 1.05

    if st > 0.72:
        r *= 0.82

    if 1.05 < theta < 2.10 or 4.18 < theta < 5.23:
        r *= 0.72

    return r

def line_points(scale: float, n=900):
    pts = []
    for i in range(n + 1):
        t = (i / n) * math.tau
        hr = head_radius(t) * scale

        dx = math.cos(t)
        dy = math.sin(t)

        warp_y = 1.18
        warp_x = 0.96

        pull = 1 - 0.28 * math.exp(-((dx / 0.55) ** 2)) * (0.65 + 0.35 * max(dy, -0.2))

        x = CX + dx * hr * warp_x * pull
        y = CY + dy * hr * warp_y

        if abs(dx) < 0.22 and dy > -0.05:
            y -= (0.22 - abs(dx)) * 180 * scale
            x *= 1.0

        pts.append((x, y))
    return pts

def path_from_points(points):
    d = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    for x, y in points[1:]:
        d.append(f"L {x:.2f} {y:.2f}")
    return " ".join(d)

svg_paths = []
num_lines = 20
start = 0.18
end = 1.0

for i in range(num_lines):
    s = start + (end - start) * (i / (num_lines - 1))
    pts = line_points(s)
    d = path_from_points(pts)
    # Increased opacity
    opacity = 0.92 if i > 3 else 0.82
    # Increased stroke-width
    svg_paths.append(
        f'<path d="{d}" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"/>'
    )

mind_text = f"""
<text x="{CX}" y="{CY - 35}" text-anchor="middle"
      font-family="Inter, Helvetica, Arial, sans-serif"
      font-size="72" font-weight="300" letter-spacing="16"
      fill="white" opacity="0.95">MIND</text>
"""

# Removed the black rect for transparent background
svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <g filter="url(#glow)">
    {''.join(svg_paths)}
  </g>

  {mind_text}
</svg>
"""

Path("apps/landingpage/public/mind_fingerprint_head.svg").write_text(svg, encoding="utf-8")
print("SVG gerado: apps/landingpage/public/mind_fingerprint_head.svg")
