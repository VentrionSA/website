"use client";

import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { MARKETS } from "@/lib/content";
import countryData from "@/lib/geo/countries.json";
import { latLonToVector3 } from "./geo";

type Tier = "high" | "low";
/**
 * Pointer state shared between the DOM handlers and the render loop (no React state,
 * so dragging never re-renders anything). `pressed` is set on pointer-down; it becomes
 * a drag only once the pointer has travelled a few pixels, so a plain click still
 * selects a market. The render loop reads `x` every frame and places the globe
 * exactly under the finger.
 */
type DragState = {
  pressed: boolean;
  dragging: boolean;
  /** Pointer x where the drag began, and its latest position (CSS px). */
  startX: number;
  x: number;
  /** Set when a drag begins: the rig records the globe's angle at that instant. */
  fresh: boolean;
  /** Set on pointer-down: stop any glide or turn at once, like catching a spinning globe. */
  caught: boolean;
  /** Recent pointer samples, for the release velocity. */
  samples: { t: number; x: number }[];
  /** Set on release: the angular velocity (rad/s) the globe glides on with. */
  release: number | null;
  /** Trackpad swipes: angle to add on the next frame (the trackpad supplies its own momentum). */
  nudge: number;
  /** Radians per pixel of pointer travel, from the globe's size on screen (see dragSpeed). */
  speed: number;
};

type GlobeProps = {
  /** The market drawn in burgundy (selected, or hovered on the globe or in the list). */
  focusIndex: number;
  /** The market the globe turns to face (selected, or hovered in the list). Hovering a marker on the globe never turns it. */
  orientIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  /** Called when the visitor starts dragging, so the automatic tour can pause. */
  onInteract?: () => void;
  tier: Tier;
  /** Reduced motion: no pulsing highlight or breathing markers. */
  calm?: boolean;
};

type CountryData = { w: number; h: number; countries: { id: string | null; d: string }[] };

const DEG = Math.PI / 180;

/* Cartographic palette: ivory sea, sage land (a tint of the #184335 mark), green-ink borders,
   the network in a deeper Ventrion green. Burgundy is the pop: only the focused market. */
const OCEAN = "#f4f0e6";
const LAND = "#c9d1c5";
const BORDER = "rgba(24,67,53,0.38)";
const NETWORK_FILL = "#5b796c";
const NETWORK_BORDER = "rgba(16,48,38,0.55)";
const LIMB = "#c3c5b9";
const BURGUNDY = "#b52336";
const GREEN = "#184335";
const PIN = "#f4f0e6";
/** ID mask encoding: market i is stored as (i + 1) * ID_STEP. */
const ID_STEP = 24;
/** The network's corner of the world (degrees): the only part of the map the ID mask covers. */
const ID_REGION = { west: 25, east: 150, south: -15, north: 60 };

/* ── Map textures ──────────────────────────────────────────────────────── */

/**
 * Draws an equirectangular map from the Natural Earth country outlines
 * (lib/geo/countries.json): land, network fills and fine borders, plus a mask
 * recording which network market each texel belongs to, so the shader can
 * highlight the focused market without redrawing. The mask covers only the
 * network's part of the world, at the map's own resolution, and every texel is
 * wholly one market or none (no blended edges that could read as another id).
 */
function useMapTextures(tier: Tier) {
  const gl = useThree((s) => s.gl);
  const textures = useMemo(() => {
    const data = countryData as CountryData;
    const W = tier === "high" ? 4096 : 2048;
    const H = W / 2;
    const scale = W / data.w;
    const paths = data.countries.map((c) => ({
      index: c.id ? MARKETS.findIndex((m) => m.id === c.id) : -1,
      path: new Path2D(c.d),
    }));

    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = W;
    mapCanvas.height = H;
    const ctx = mapCanvas.getContext("2d")!;
    ctx.fillStyle = OCEAN;
    ctx.fillRect(0, 0, W, H);
    ctx.scale(scale, scale);
    ctx.lineJoin = "round";
    for (const { index, path } of paths) {
      ctx.fillStyle = LAND;
      ctx.fill(path);
      if (index >= 0) {
        ctx.fillStyle = NETWORK_FILL;
        ctx.fill(path);
      }
    }
    // widths in map units: one unit is a texel of the sharpest texture
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = BORDER;
    for (const { path } of paths) ctx.stroke(path);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = NETWORK_BORDER;
    for (const { index, path } of paths) if (index >= 0) ctx.stroke(path);

    // The ID mask: each market drawn on its own, and a texel counted as the market's
    // only where the market covers at least half of it.
    const x0 = Math.floor(((ID_REGION.west + 180) / 360) * W);
    const x1 = Math.ceil(((ID_REGION.east + 180) / 360) * W);
    const y0 = Math.floor(((90 - ID_REGION.north) / 180) * H);
    const y1 = Math.ceil(((90 - ID_REGION.south) / 180) * H);
    const iw = x1 - x0;
    const ih = y1 - y0;
    const idData = new Uint8Array(iw * ih);
    const scratch = document.createElement("canvas");
    scratch.width = iw;
    scratch.height = ih;
    const sctx = scratch.getContext("2d", { willReadFrequently: true })!;
    for (const { index, path } of paths) {
      if (index < 0) continue;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, iw, ih);
      sctx.setTransform(scale, 0, 0, scale, -x0, -y0);
      sctx.fill(path);
      const alpha = sctx.getImageData(0, 0, iw, ih).data;
      for (let i = 0, a = 3; i < idData.length; i++, a += 4) if (alpha[a] >= 128) idData[i] = (index + 1) * ID_STEP;
    }

    const map = new THREE.CanvasTexture(mapCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    const ids = new THREE.DataTexture(idData, iw, ih, THREE.RedFormat, THREE.UnsignedByteType);
    ids.colorSpace = THREE.NoColorSpace;
    ids.minFilter = THREE.NearestFilter;
    ids.magFilter = THREE.NearestFilter;
    ids.generateMipmaps = false;
    ids.unpackAlignment = 1;
    ids.needsUpdate = true;
    // where the mask sits on the map, in texture coordinates (v runs up from the south pole)
    const idRect = new THREE.Vector4(x0 / W, 1 - y0 / H, iw / W, ih / H);
    // Upload now, while the globe is still off-screen, rather than on its first visible frame.
    gl.initTexture(map);
    gl.initTexture(ids);
    return { map, ids, idRect };
  }, [gl, tier]);

  useEffect(
    () => () => {
      textures.map.dispose();
      textures.ids.dispose();
    },
    [textures],
  );

  return textures;
}

/* ── Globe body: the map on porcelain, with soft light ─────────────────── */

const bodyVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const bodyFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uIds;
  uniform vec4 uIdRect;
  uniform float uFocus;
  uniform float uPulse;
  uniform vec3 uBurgundy;
  uniform vec3 uLimb;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 albedo = texture2D(uMap, vUv).rgb;
    // the focused market deepens to full burgundy
    vec2 idUv = vec2((vUv.x - uIdRect.x) / uIdRect.z, (uIdRect.y - vUv.y) / uIdRect.w);
    float inside = step(0.0, idUv.x) * step(idUv.x, 1.0) * step(0.0, idUv.y) * step(idUv.y, 1.0);
    float id = floor(texture2D(uIds, idUv).r * 255.0 / ${ID_STEP.toFixed(1)} + 0.5) - 1.0;
    float focus = inside * (1.0 - step(0.5, abs(id - uFocus)));
    albedo = mix(albedo, uBurgundy, focus * uPulse);
    // wrapped light: the soft, even fall-off of matte porcelain
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 l = normalize(vec3(-0.55, 0.62, 0.58));
    float wrap = dot(n, l) * 0.5 + 0.5;
    vec3 col = albedo * mix(0.8, 1.03, smoothstep(0.1, 0.95, wrap));
    float facing = max(dot(n, v), 0.0);
    col = mix(col, uLimb, pow(1.0 - facing, 3.0) * 0.5);
    col += pow(max(dot(n, normalize(l + v)), 0.0), 90.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function GlobeBody({ focusIndex, tier, calm }: { focusIndex: number; tier: Tier; calm: boolean }) {
  const { map, ids, idRect } = useMapTextures(tier);

  const { body, graticule } = useMemo(() => {
    const body = new THREE.ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: bodyFragment,
      uniforms: {
        uMap: { value: null },
        uIds: { value: null },
        uIdRect: { value: new THREE.Vector4() },
        uFocus: { value: 0 },
        uPulse: { value: 0.85 },
        uBurgundy: { value: new THREE.Color(BURGUNDY) },
        uLimb: { value: new THREE.Color(LIMB) },
      },
    });
    // hairline graticule every 30°
    const verts: number[] = [];
    const v = new THREE.Vector3();
    const w = new THREE.Vector3();
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 2) {
        latLonToVector3(lat, lon, 1.001, v);
        latLonToVector3(lat, lon + 2, 1.001, w);
        verts.push(v.x, v.y, v.z, w.x, w.y, w.z);
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 2) {
        latLonToVector3(lat, lon, 1.001, v);
        latLonToVector3(lat + 2, lon, 1.001, w);
        verts.push(v.x, v.y, v.z, w.x, w.y, w.z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.12, depthWrite: false });
    return { body, graticule: new THREE.LineSegments(geo, lineMat) };
  }, []);

  useEffect(() => {
    body.uniforms.uMap.value = map;
    body.uniforms.uIds.value = ids;
    body.uniforms.uIdRect.value = idRect;
  }, [body, map, ids, idRect]);

  useEffect(() => {
    body.uniforms.uFocus.value = focusIndex;
  }, [body, focusIndex]);

  useFrame(({ clock }) => {
    body.uniforms.uPulse.value = calm ? 0.85 : 0.85 + 0.15 * Math.sin(clock.getElapsedTime() * 2.2);
  });

  useEffect(
    () => () => {
      body.dispose();
      graticule.geometry.dispose();
      (graticule.material as THREE.Material).dispose();
    },
    [body, graticule],
  );

  return (
    <>
      <mesh material={body}>
        <sphereGeometry args={[1, 128, 96]} />
      </mesh>
      <primitive object={graticule} />
    </>
  );
}

/* ── Market markers ────────────────────────────────────────────────────── */

// Shared, fixed geometries: a marker's size changes by scale, never by rebuilding geometry.
const PIN_GEOMETRY = new THREE.CircleGeometry(1, 32);
const RIM_GEOMETRY = new THREE.RingGeometry(1, 1.3, 40);
const PULSE_GEOMETRY = new THREE.RingGeometry(0.02, 0.023, 48);
const HIT_GEOMETRY = new THREE.SphereGeometry(0.055, 12, 12);
const PIN_SIZE = { rest: 0.0105, focused: 0.0145 };

const Marker = memo(function Marker({
  index,
  focused,
  calm,
  drag,
  onHover,
  onSelect,
}: {
  index: number;
  focused: boolean;
  calm: boolean;
  drag: MutableRefObject<DragState>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const market = MARKETS[index];
  const group = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Mesh>(null);
  const rim = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const size = useRef(focused ? PIN_SIZE.focused : PIN_SIZE.rest);
  const position = useMemo(() => latLonToVector3(market.lat, market.lon, 1.006), [market]);
  // flat on the surface, facing outwards: the discs and rings are drawn facing +z
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()),
    [position],
  );
  const world = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    size.current = THREE.MathUtils.damp(size.current, focused ? PIN_SIZE.focused : PIN_SIZE.rest, 10, Math.min(delta, 0.1));
    pin.current?.scale.setScalar(size.current);
    rim.current?.scale.setScalar(size.current);
    if (pulse.current) {
      const phase = calm ? 0.35 : (clock.getElapsedTime() * 0.55 + index * 0.21) % 1;
      pulse.current.scale.setScalar(1 + phase * (focused ? 2.4 : 1.6));
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (focused ? 0.9 : 0.45);
    }
  });

  const isFacing = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    event.object.getWorldPosition(world);
    return world.z > 0.15;
  };

  return (
    <group ref={group} position={position} quaternion={quaternion}>
      <mesh ref={pin} geometry={PIN_GEOMETRY} renderOrder={3}>
        <meshBasicMaterial color={PIN} toneMapped={false} depthWrite={false} transparent />
      </mesh>
      <mesh ref={rim} geometry={RIM_GEOMETRY} renderOrder={3}>
        <meshBasicMaterial color={focused ? BURGUNDY : GREEN} toneMapped={false} depthWrite={false} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={pulse} geometry={PULSE_GEOMETRY} renderOrder={3}>
        <meshBasicMaterial color={focused ? BURGUNDY : GREEN} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Generous invisible hit area */}
      <mesh
        geometry={HIT_GEOMETRY}
        onPointerOver={(e) => {
          // While the globe is being dragged, markers passing under the pointer are ignored.
          if (drag.current.dragging || !isFacing(e)) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(index);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          if (!drag.current.dragging) onHover(null);
        }}
        onClick={(e) => {
          if (drag.current.dragging || !isFacing(e)) return;
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
});

/* ── Rotation rig ──────────────────────────────────────────────────────── */

function targetFor(index: number) {
  const m = MARKETS[index];
  const v = latLonToVector3(m.lat, m.lon, 1);
  return { y: -Math.atan2(v.x, v.z), x: m.lat * DEG * 0.78 + 0.06 };
}

/** How much of its canvas the globe fills, edge to edge. */
const FILL = 0.94;
const CAMERA_DISTANCE = 4.6;
/** The field of view that frames the sphere at FILL of the canvas height. */
const FOV = (2 * Math.atan(Math.tan(Math.asin(1 / CAMERA_DISTANCE)) / FILL) * 180) / Math.PI;
/**
 * Radians per pixel: dragging across the globe from edge to edge turns it about half a
 * turn, as it would turn a real globe under the hand, whatever its size on screen.
 */
const dragSpeed = (el: HTMLElement) => 3 / Math.max(el.clientHeight * FILL, 1);
const TURN_STIFFNESS = 3.6; // critically damped spring for turning to a market: eases in and out
const GLIDE_FRICTION = 2.2; // how quickly a flick slows to a stop
const MAX_GLIDE = 9; // rad/s
const STEP = 1 / 240; // integration sub-step, so motion is identical at 60 Hz or 120 Hz

type Axis = { value: number; vel: number; target: number };

/**
 * Turns the globe. Three kinds of motion, never mixed:
 * - drag: the angle is set directly from the pointer every frame (1:1, no smoothing, no lag);
 * - glide: after a flick, the release speed decays smoothly to rest;
 * - turn: a critically damped spring to the chosen market, starting from the current
 *   speed, so it eases in and out with no jolt or overshoot.
 * After a drag the globe stays where it was left until a market is chosen again.
 */
function Rig({ orientIndex, drag, children }: { orientIndex: number; drag: MutableRefObject<DragState>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const start = useMemo(() => targetFor(orientIndex), []); // eslint-disable-line react-hooks/exhaustive-deps
  const yaw = useRef<Axis & { mode: "rest" | "turn" | "glide" | "drag"; grabbedAt: number }>({
    value: start.y,
    vel: 0,
    target: start.y,
    mode: "rest",
    grabbedAt: start.y,
  });
  const tilt = useRef<Axis>({ value: start.x, vel: 0, target: start.x });

  useEffect(() => {
    const next = targetFor(orientIndex);
    const y = yaw.current;
    const twoPi = Math.PI * 2;
    // the equivalent angle closest to where the globe is now
    y.target = next.y + Math.round((y.value - next.y) / twoPi) * twoPi;
    tilt.current.target = next.x;
    if (y.mode !== "drag") y.mode = "turn";
  }, [orientIndex]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const s = drag.current;
    const y = yaw.current;
    const t = tilt.current;

    if (s.caught) {
      s.caught = false;
      if (y.mode === "glide" || y.mode === "turn") {
        y.mode = "rest";
        y.vel = 0;
      }
    }
    if (s.nudge !== 0 && !s.dragging) {
      y.value += s.nudge;
      s.nudge = 0;
      y.vel = 0;
      y.mode = "rest";
    }
    if (s.dragging) {
      if (s.fresh) {
        s.fresh = false;
        y.grabbedAt = y.value;
      }
      y.mode = "drag";
      y.vel = 0;
      y.value = y.grabbedAt + (s.x - s.startX) * s.speed;
    } else if (y.mode === "drag") {
      const v = s.release ?? 0;
      s.release = null;
      y.vel = v;
      y.mode = Math.abs(v) > 0.05 ? "glide" : "rest";
    }

    const k = TURN_STIFFNESS * TURN_STIFFNESS;
    const c = 2 * TURN_STIFFNESS;
    let remaining = Math.min(delta, 0.1);
    while (remaining > 1e-6) {
      const h = Math.min(remaining, STEP);
      remaining -= h;
      if (y.mode === "glide") {
        y.value += y.vel * h;
        y.vel *= Math.exp(-GLIDE_FRICTION * h);
        if (Math.abs(y.vel) < 0.01) {
          y.vel = 0;
          y.mode = "rest";
        }
      } else if (y.mode === "turn") {
        y.vel += (k * (y.target - y.value) - c * y.vel) * h;
        y.value += y.vel * h;
        if (Math.abs(y.target - y.value) < 1e-5 && Math.abs(y.vel) < 1e-4) {
          y.value = y.target;
          y.vel = 0;
          y.mode = "rest";
        }
      }
      t.vel += (k * (t.target - t.value) - c * t.vel) * h;
      t.value += t.vel * h;
    }

    g.rotation.y = y.value;
    g.rotation.x = t.value;
  });

  return (
    <group ref={group} rotation={[start.x, start.y, 0]}>
      {children}
    </group>
  );
}

/**
 * Release velocity (rad/s) from the pointer's final ~100 ms of movement, using at least
 * two samples so it also works where the browser delivers moves sparsely. Zero when the
 * pointer had come to rest before it was lifted.
 */
function releaseVelocity(samples: { t: number; x: number }[], now: number, speed: number) {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (now - last.t > 100) return 0;
  let i = samples.length - 2;
  while (i > 0 && last.t - samples[i - 1].t <= 100) i--;
  const first = samples[i];
  const dt = last.t - first.t;
  if (dt < 4) return 0;
  const v = ((last.x - first.x) / dt) * 1000 * speed;
  return Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, v));
}

export default function GlobeCanvas({ focusIndex, orientIndex, onHover, onSelect, onInteract, tier, calm = false }: GlobeProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({
    pressed: false,
    dragging: false,
    startX: 0,
    x: 0,
    fresh: false,
    caught: false,
    samples: [],
    release: null,
    nudge: 0,
    speed: 0.006,
  });
  const [active, setActive] = useState(false);

  // Resolution: as sharp as the screen allows, stepped down automatically if the device
  // cannot hold its full frame rate, so rotation never drops frames.
  const cap = tier === "high" ? 1.75 : 1.4;
  const [dpr, setDpr] = useState(() => Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, cap));
  // On high-density screens the pixels already smooth the edges; skip multisampling there.
  const gl = useMemo(
    () => ({
      antialias: typeof window === "undefined" || (window.devicePixelRatio || 1) < 1.5,
      alpha: true,
      powerPreference: "high-performance" as const,
    }),
    [],
  );
  const camera = useMemo(() => ({ position: [0, 0, CAMERA_DISTANCE] as [number, number, number], fov: FOV, near: 0.1, far: 20 }), []);

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    state.pressed = false;
    if (!state.dragging) return;
    state.release = releaseVelocity(state.samples, e.timeStamp, state.speed);
    state.samples = [];
    state.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Two-finger horizontal swipes on a trackpad turn the globe too (vertical scrolling stays with the page).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) < 1 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      event.stopPropagation(); // keep the smooth-scroller from nudging the page
      drag.current.nudge -= event.deltaX * (event.deltaMode === 1 ? 16 : 1) * dragSpeed(el);
      onInteract?.();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onInteract]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      onPointerDown={(e) => {
        const state = drag.current;
        state.pressed = true;
        state.caught = true;
        state.speed = dragSpeed(e.currentTarget);
        state.startX = e.clientX;
        state.x = e.clientX;
        state.samples = [{ t: e.timeStamp, x: e.clientX }];
      }}
      onPointerMove={(e) => {
        const state = drag.current;
        if (!state.pressed) return;
        // every intermediate position the browser recorded, for an exact release speed
        const native = e.nativeEvent;
        const points = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
        for (const p of points.length ? points : [native]) state.samples.push({ t: p.timeStamp, x: p.clientX });
        if (state.samples.length > 48) state.samples.splice(0, state.samples.length - 48);
        state.x = e.clientX;
        if (!state.dragging) {
          if (Math.abs(e.clientX - state.startX) < 5) return;
          // It is a drag: take the pointer so markers underneath stop reacting, and pause the tour.
          state.dragging = true;
          state.fresh = true;
          state.startX = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
          document.body.style.cursor = "";
          onHover(null);
          onInteract?.();
        }
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={(e) => {
        // Only our own capture ending counts. On touch screens the canvas holds the
        // finger first and loses it the moment the drag starts; that event bubbles
        // up here and must not cancel the drag.
        if (e.target !== e.currentTarget) return;
        drag.current.dragging = false;
        drag.current.pressed = false;
      }}
    >
      <Canvas frameloop={active ? "always" : "never"} dpr={dpr} gl={gl} camera={camera}>
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(1, Math.round((d - 0.25) * 100) / 100))}
          onIncline={() => setDpr((d) => Math.min(cap, Math.round((d + 0.25) * 100) / 100))}
          onFallback={() => setDpr(1)}
        />
        <Rig orientIndex={orientIndex} drag={drag}>
          <GlobeBody focusIndex={focusIndex} tier={tier} calm={calm} />
          {MARKETS.map((_, i) => (
            <Marker key={i} index={i} focused={i === focusIndex} calm={calm} drag={drag} onHover={onHover} onSelect={onSelect} />
          ))}
        </Rig>
      </Canvas>
    </div>
  );
}
