"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { decodeLandPoints } from "@/lib/geo/points";
import { CONNECTIONS, MARKETS } from "@/lib/content";
import { arcPoints, latLonToVector3, makeGlowTexture } from "./geo";

type Tier = "high" | "low";
type DragState = { dx: number; dragging: boolean };

type GlobeProps = {
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  tier: Tier;
};

const DEG = Math.PI / 180;
const GOLD = "#c4a779";
const IVORY = "#f1efe8";

/* ── Land dots ─────────────────────────────────────────────────────────── */

const dotVertex = /* glsl */ `
  attribute float aCountry;
  uniform float uFocus;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTime;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFacing = dot(n, normalize(-mv.xyz));
    vNetwork = step(-0.5, aCountry);
    vFocus = 1.0 - step(0.5, abs(aCountry - uFocus));
    float pulse = 1.0 + vFocus * (0.35 + 0.15 * sin(uTime * 2.4));
    gl_PointSize = uSize * uPixelRatio * pulse * (4.6 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uIvory;
  uniform vec3 uGold;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.32, d);
    float rim = smoothstep(-0.05, 0.45, vFacing);
    float tint = max(vNetwork * 0.55, vFocus);
    vec3 col = mix(uIvory, uGold, tint);
    float alpha = edge * rim * mix(0.28, 0.95, max(vNetwork * 0.55, vFocus));
    gl_FragColor = vec4(col, alpha);
  }
`;

function LandDots({ focusIndex, tier }: { focusIndex: number; tier: Tier }) {
  const gl = useThree((s) => s.gl);
  const { geometry, material } = useMemo(() => {
    const pts = decodeLandPoints();
    const positions = new Float32Array(pts.length * 3);
    const country = new Float32Array(pts.length);
    const v = new THREE.Vector3();
    pts.forEach((p, i) => {
      latLonToVector3(p.lat, p.lon, 1.004, v);
      positions.set([v.x, v.y, v.z], i * 3);
      country[i] = p.country;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aCountry", new THREE.BufferAttribute(country, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uFocus: { value: focusIndex },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uSize: { value: tier === "high" ? 3.1 : 2.8 },
        uTime: { value: 0 },
        uIvory: { value: new THREE.Color(IVORY) },
        uGold: { value: new THREE.Color(GOLD) },
      },
    });
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, tier]);

  useEffect(() => {
    material.uniforms.uFocus.value = focusIndex;
  }, [focusIndex, material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points geometry={geometry} material={material} />;
}

/* ── Globe body, atmosphere and graticule ──────────────────────────────── */

const bodyVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const bodyFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = max(dot(vN, vV), 0.0);
    float fres = pow(1.0 - facing, 3.0);
    vec3 light = normalize(vec3(-0.5, 0.6, 0.65));
    float lambert = max(dot(vN, light), 0.0);
    vec3 col = uBase * (0.65 + 0.55 * lambert) + uRim * fres * 0.5;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = dot(vN, vV);
    float glow = pow(clamp(1.0 + facing * 1.6, 0.0, 1.0), 3.0);
    gl_FragColor = vec4(uRim, glow * 0.22);
  }
`;

function GlobeBody() {
  const { body, halo, graticule } = useMemo(() => {
    const uniforms = { uBase: { value: new THREE.Color("#121412") }, uRim: { value: new THREE.Color(GOLD) } };
    const body = new THREE.ShaderMaterial({ vertexShader: bodyVertex, fragmentShader: bodyFragment, uniforms });
    const halo = new THREE.ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: haloFragment,
      uniforms,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // graticule every 30°
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
    const lineMat = new THREE.LineBasicMaterial({ color: IVORY, transparent: true, opacity: 0.05, depthWrite: false });
    return { body, halo, graticule: new THREE.LineSegments(geo, lineMat) };
  }, []);

  return (
    <>
      <mesh material={body}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      <mesh material={halo} scale={1.16}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <primitive object={graticule} />
    </>
  );
}

/* ── Connection arcs and travelling pulses ─────────────────────────────── */

type Line2Like = { material: { dashOffset: number } };

function Arcs({ focusIndex }: { focusIndex: number }) {
  const arcs = useMemo(
    () =>
      CONNECTIONS.map(([a, b]) => ({
        a,
        b,
        points: arcPoints(MARKETS[a], MARKETS[b], { radius: 1.004, segments: 80, lift: 0.34 }),
      })),
    [],
  );
  const lineRefs = useRef<(Line2Like | null)[]>([]);
  const pulseRefs = useRef<(THREE.Sprite | null)[]>([]);
  const glow = useMemo(() => makeGlowTexture(64), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    lineRefs.current.forEach((line) => {
      if (line) line.material.dashOffset -= Math.min(delta, 0.05) * 0.18;
    });
    pulseRefs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const arc = arcs[i];
      const active = arc.a === focusIndex || arc.b === focusIndex;
      const forward = arc.a === focusIndex || !active;
      let u = (t * (active ? 0.32 : 0.16) + i * 0.173) % 1;
      if (!forward) u = 1 - u;
      const idx = u * (arc.points.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, arc.points.length - 1);
      sprite.position.lerpVectors(arc.points[i0], arc.points[i1], idx - i0);
      const fade = Math.sin(Math.PI * u);
      (sprite.material as THREE.SpriteMaterial).opacity = (active ? 0.95 : 0.35) * fade;
      const s = active ? 0.085 : 0.05;
      sprite.scale.set(s, s, 1);
    });
  });

  return (
    <group>
      {arcs.map((arc, i) => {
        const active = arc.a === focusIndex || arc.b === focusIndex;
        return (
          <group key={i}>
            <Line
              ref={(el: unknown) => {
                lineRefs.current[i] = el as Line2Like | null;
              }}
              points={arc.points}
              color={active ? "#dcc39a" : GOLD}
              lineWidth={active ? 1.6 : 1}
              transparent
              opacity={active ? 0.95 : 0.22}
              dashed
              dashSize={active ? 0.05 : 0.025}
              gapSize={active ? 0.018 : 0.03}
              depthWrite={false}
            />
            <sprite
              ref={(el) => {
                pulseRefs.current[i] = el;
              }}
            >
              <spriteMaterial map={glow} color="#f1dcb2" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </sprite>
          </group>
        );
      })}
    </group>
  );
}

/* ── Market markers ────────────────────────────────────────────────────── */

function Marker({
  index,
  focused,
  onHover,
  onSelect,
}: {
  index: number;
  focused: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const market = MARKETS[index];
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const position = useMemo(() => latLonToVector3(market.lat, market.lon, 1.006), [market]);
  const world = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    group.current?.lookAt(position.clone().multiplyScalar(2));
  }, [position]);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (ring.current) {
      const phase = (t * 0.55 + index * 0.21) % 1;
      const s = 1 + phase * (focused ? 2.4 : 1.6);
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (focused ? 0.9 : 0.5);
    }
    if (label.current && group.current) {
      group.current.getWorldPosition(world);
      const facing = world.clone().normalize().dot(camera.position.clone().normalize());
      label.current.style.opacity = String(THREE.MathUtils.clamp((facing - 0.25) * 3, 0, 1));
    }
  });

  const isFacing = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    event.object.getWorldPosition(world);
    return world.z > 0.15;
  };

  return (
    <group ref={group} position={position}>
      <mesh renderOrder={3}>
        <circleGeometry args={[focused ? 0.017 : 0.012, 24]} />
        <meshBasicMaterial color={focused ? "#f3dfb6" : GOLD} toneMapped={false} depthWrite={false} transparent />
      </mesh>
      <mesh ref={ring} renderOrder={3}>
        <ringGeometry args={[0.02, 0.023, 48]} />
        <meshBasicMaterial color={GOLD} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {focused ? (
        <mesh renderOrder={3}>
          <ringGeometry args={[0.04, 0.0425, 64]} />
          <meshBasicMaterial color="#f3dfb6" transparent opacity={0.85} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {/* Generous invisible hit area */}
      <mesh
        onPointerOver={(e) => {
          if (!isFacing(e)) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(index);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          onHover(null);
        }}
        onClick={(e) => {
          if (!isFacing(e)) return;
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {focused ? (
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div ref={label} className="relative -translate-y-[calc(50%+26px)] whitespace-nowrap transition-opacity duration-300">
            <div className="flex flex-col items-center gap-2">
              <span className="eyebrow bg-ink/80 px-3 py-1.5 text-[10px] text-gold backdrop-blur-sm">{market.name}</span>
              <span className="h-4 w-px bg-gold/70" />
            </div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

/* ── Rotation rig ──────────────────────────────────────────────────────── */

function targetFor(index: number) {
  const m = MARKETS[index];
  const v = latLonToVector3(m.lat, m.lon, 1);
  return { y: -Math.atan2(v.x, v.z), x: m.lat * DEG * 0.78 + 0.06 };
}

function Rig({ focusIndex, drag, children }: { focusIndex: number; drag: MutableRefObject<DragState>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef(targetFor(focusIndex));
  const size = useThree((s) => s.size);

  useEffect(() => {
    const next = targetFor(focusIndex);
    const current = group.current?.rotation.y ?? next.y;
    // choose the equivalent angle closest to the current rotation
    const twoPi = Math.PI * 2;
    next.y += Math.round((current - next.y) / twoPi) * twoPi;
    target.current = next;
  }, [focusIndex]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    if (drag.current.dx !== 0) {
      target.current.y += drag.current.dx * 0.006;
      drag.current.dx = 0;
    }
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target.current.y, drag.current.dragging ? 10 : 2.6, d);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target.current.x, 2.6, d);
    const s = size.width < 520 ? 0.94 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 4, d));
  });

  return (
    <group ref={group} rotation={[target.current.x, target.current.y, 0]}>
      {children}
    </group>
  );
}

export default function GlobeCanvas({ focusIndex, onHover, onSelect, tier }: GlobeProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({ dx: 0, dragging: false });
  const lastX = useRef(0);
  const [active, setActive] = useState(false);

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
        drag.current.dragging = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!drag.current.dragging) return;
        drag.current.dx += e.clientX - lastX.current;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (drag.current.dragging = false)}
      onPointerLeave={() => (drag.current.dragging = false)}
      onPointerCancel={() => (drag.current.dragging = false)}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={tier === "high" ? [1, 1.75] : [1, 1.4]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.6], fov: 30, near: 0.1, far: 20 }}
        flat
      >
        <Rig focusIndex={focusIndex} drag={drag}>
          <GlobeBody />
          <LandDots focusIndex={focusIndex} tier={tier} />
          <Arcs focusIndex={focusIndex} />
          {MARKETS.map((_, i) => (
            <Marker key={i} index={i} focused={i === focusIndex} onHover={onHover} onSelect={onSelect} />
          ))}
        </Rig>
      </Canvas>
    </div>
  );
}
