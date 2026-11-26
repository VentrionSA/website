"""
Builds lib/geo/network-map.ts: the country outlines for the network's world map.

Reads lib/geo/countries.json (Natural Earth via world-atlas, equirectangular, 2048 x 1024),
reprojects every country to the Equal Earth projection (an equal-area world map with
gently curved sides), leaves out Antarctica, simplifies, and writes compact SVG paths
(whole map units, relative moves). The map's markers, arcs and graticule use the same
projection at runtime: see components/sections/network/NetworkMap.tsx.

    python3 scripts/build-network-map.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "lib", "geo", "countries.json")
OUT = os.path.join(ROOT, "lib", "geo", "network-map.ts")

# Equal Earth (Šavrič, Patterson & Jenny, 2018)
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
M = math.sqrt(3) / 2


def equal_earth(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(M * math.sin(phi))
    t2 = th * th
    t6 = t2 * t2 * t2
    x = (2 * math.sqrt(3) * lam * math.cos(th)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y


X_MAX = equal_earth(180, 0)[0]  # half the width of the world at the equator
WIDTH = 2000.0  # map units across the whole world
SCALE = WIDTH / (2 * X_MAX)
LAT_MAX, LAT_MIN = 84.0, -57.0  # the Arctic islands to Cape Horn; Antarctica is left out
Y_TOP = equal_earth(0, LAT_MAX)[1]
HEIGHT = SCALE * (Y_TOP - equal_earth(0, LAT_MIN)[1])

TOL = 1.0  # simplification tolerance, map units (about two-thirds of a pixel at desktop size)
MIN_AREA = 6.0  # leave out islands smaller than this, map units squared (never a network country's)


def project(lon, lat):
    x, y = equal_earth(lon, lat)
    return SCALE * (x + X_MAX), SCALE * (Y_TOP - y)


def parse_rings(d, w, h):
    rings, ring = [], []
    for token in d.replace("Z", " Z ").replace("M", " M ").replace("L", " L ").split():
        if token in ("M", "L"):
            continue
        if token == "Z":
            if ring:
                rings.append(ring)
            ring = []
            continue
        x, y = (float(v) for v in token.split(","))
        ring.append((x / w * 360.0 - 180.0, 90.0 - y / h * 180.0))
    if ring:
        rings.append(ring)
    return rings


def clip(ring, y0, y1):
    """Clip a ring to the band between two horizontal lines (Sutherland-Hodgman)."""
    def edge(points, inside, cut):
        out = []
        for i, p in enumerate(points):
            q = points[i - 1]
            if inside(p):
                if not inside(q):
                    out.append(cut(q, p))
                out.append(p)
            elif inside(q):
                out.append(cut(q, p))
        return out

    def at_y(yc):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / (b[1] - a[1]), yc)

    pts = edge(ring, lambda p: p[1] >= y0, at_y(y0))
    return edge(pts, lambda p: p[1] <= y1, at_y(y1)) if pts else pts


def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))) / 2


def simplify(points, tol):
    """Douglas-Peucker on an open polyline."""
    if len(points) < 3:
        return points
    (ax, ay), (bx, by) = points[0], points[-1]
    dx, dy = bx - ax, by - ay
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        dist = abs(dy * px - dx * py + bx * ay - by * ax) / norm
        if dist > best:
            best, idx = dist, i
    if best > tol:
        return simplify(points[: idx + 1], tol)[:-1] + simplify(points[idx:], tol)
    return [points[0], points[-1]]


def encode(points):
    """One ring as a compact path: absolute start, then relative moves in whole units."""
    pts = []
    for x, y in points:
        p = (int(round(x)), int(round(y)))
        if not pts or p != pts[-1]:
            pts.append(p)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    if len(pts) < 3:
        return ""
    out = "M%d %d" % pts[0]
    numbers = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        numbers += [x1 - x0, y1 - y0]
    body = ""
    for n in numbers:
        s = str(n)
        body += s if (not body or s.startswith("-")) else " " + s
    return out + "l" + body + "z"


def to_path(rings):
    parts = []
    for ring in rings:
        mid = len(ring) // 2
        tol = TOL if area(ring) > 300 else TOL / 3  # keep small islands (Bahrain) recognisable
        pts = simplify(ring[: mid + 1], tol)[:-1] + simplify(ring[mid:] + ring[:1], tol)[:-1]
        parts.append(encode(pts))
    return "".join(p for p in parts if p)


def main():
    data = json.load(open(SRC))
    w, h = data["w"], data["h"]
    land, network = [], {}
    for country in data["countries"]:
        rings = []
        for ring in parse_rings(country["d"], w, h):
            if max(lat for _, lat in ring) < -60:  # Antarctica
                continue
            projected = clip([project(lon, lat) for lon, lat in ring], -4.0, HEIGHT + 4.0)
            if len(projected) >= 3 and (country["id"] or area(projected) >= MIN_AREA):
                rings.append(projected)
        if not rings:
            continue
        path = to_path(rings)
        if not path:
            continue
        if country["id"]:
            network[country["id"]] = path
        else:
            land.append(path)

    land_path = "".join(land)
    lines = [
        "// Generated by scripts/build-network-map.py from lib/geo/countries.json. Do not edit by hand.",
        "// The world in the Equal Earth projection, Antarctica left out; whole map units.",
        "",
        "export const MAP_PROJECTION = { scale: %.6f, xMax: %.6f, yTop: %.6f, latMin: %s, latMax: %s } as const;"
        % (SCALE, X_MAX, Y_TOP, LAT_MIN, LAT_MAX),
        "export const MAP_SIZE = { width: %d, height: %d } as const;" % (round(WIDTH), round(HEIGHT)),
        "",
        "/** Every country not in the network, as one path. */",
        "export const LAND_PATH =\n  %s;" % json.dumps(land_path),
        "",
        "/** The network's countries, by market id (see MARKETS in lib/content.ts). */",
        "export const NETWORK_PATHS: Record<string, string> = {",
    ]
    for key in sorted(network):
        lines.append("  %s: %s," % (json.dumps(key), json.dumps(network[key])))
    lines.append("};")
    lines.append("")
    open(OUT, "w").write("\n".join(lines))
    print("land %d chars, network %d chars (%s), size %d x %d" % (
        len(land_path), sum(len(v) for v in network.values()), ", ".join(sorted(network)), round(WIDTH), round(HEIGHT)))


if __name__ == "__main__":
    main()
