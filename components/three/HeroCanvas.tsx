"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { heroState } from "@/lib/hero-state";
import { decodeLandPoints } from "@/lib/geo/points";
import { CONNECTIONS, MARKETS } from "@/lib/content";
import { arcPoints, makeGlowTexture } from "./geo";

type Tier = "high" | "low";

const GOLD = new THREE.Color("#c4a779");
const CHAMPAGNE = new THREE.Color("#e9d6b0");

/* ── Engraved land texture for the metallic core ───────────────────────── */

function useEngravedMaps(size: number) {
  return useMemo(() => {
    const w = size;
    const h = size / 2;
    const bump = document.createElement("canvas");
    const rough = document.createElement("canvas");
    const color = document.createElement("canvas");
    bump.width = rough.width = color.width = w;
    bump.height = rough.height = color.height = h;
    const b = bump.getContext("2d")!;
    const r = rough.getContext("2d")!;
    const c = color.getContext("2d")!;
    b.fillStyle = "#000";
    b.fillRect(0, 0, w, h);
    r.fillStyle = "#fff";
    r.fillRect(0, 0, w, h);
    // deep bronze "ocean" so gilded continents read clearly at any resolution
    c.fillStyle = "#8d7249";
    c.fillRect(0, 0, w, h);

    // graticule, very fine
    b.strokeStyle = "rgba(255,255,255,0.22)";
    r.strokeStyle = "rgba(150,150,150,1)";
    c.strokeStyle = "rgba(226,201,152,0.4)";
    b.lineWidth = r.lineWidth = c.lineWidth = Math.max(1, w / 2048);
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * h;
      b.beginPath();
      b.moveTo(0, y);
      b.lineTo(w, y);
      b.stroke();
      r.beginPath();
      r.moveTo(0, y);
      r.lineTo(w, y);
      r.stroke();
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const x = ((lon + 180) / 360) * w;
      b.beginPath();
      b.moveTo(x, 0);
      b.lineTo(x, h);
      b.stroke();
      r.beginPath();
      r.moveTo(x, 0);
      r.lineTo(x, h);
      r.stroke();
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }

    // land dots (ellipses compensate for equirectangular stretch)
    const dot = (w / 2048) * 2.3;
    b.fillStyle = "#fff";
    r.fillStyle = "#5a5a5a";
    c.fillStyle = "#fff0cc";
    for (const p of decodeLandPoints()) {
      const x = ((p.lon + 180) / 360) * w;
      const y = ((90 - p.lat) / 180) * h;
      const rx = dot / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180));
      b.beginPath();
      b.ellipse(x, y, rx, dot, 0, 0, Math.PI * 2);
      b.fill();
      r.beginPath();
      r.ellipse(x, y, rx, dot, 0, 0, Math.PI * 2);
      r.fill();
      c.beginPath();
      c.ellipse(x, y, rx * 1.05, dot * 1.05, 0, 0, Math.PI * 2);
      c.fill();
    }

    const bumpTex = new THREE.CanvasTexture(bump);
    const roughTex = new THREE.CanvasTexture(rough);
    const colorTex = new THREE.CanvasTexture(color);
    for (const t of [bumpTex, roughTex, colorTex]) {
      t.anisotropy = 8;
      t.colorSpace = THREE.NoColorSpace;
      t.needsUpdate = true;
    }
    colorTex.colorSpace = THREE.SRGBColorSpace;
    return { bumpTex, roughTex, colorTex };
  }, [size]);
}

/* ── Trade-route arcs flowing over the sphere ──────────────────────────── */

const arcVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const arcFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOffset;
  uniform vec3 uColor;
  varying float vT;
  void main() {
    float head = fract(uTime * 0.12 + uOffset);
    float d = vT - head;
    float trail = smoothstep(-0.32, 0.0, d) * (1.0 - smoothstep(0.0, 0.015, d));
    float base = 0.12 * smoothstep(0.0, 0.08, vT) * (1.0 - smoothstep(0.92, 1.0, vT));
    gl_FragColor = vec4(uColor, base + trail * 0.95);
  }
`;

function TradeArcs({ radius }: { radius: number }) {
  const lines = useMemo(() => {
    return CONNECTIONS.map(([a, b], i) => {
      const pts = arcPoints(MARKETS[a], MARKETS[b], { radius: radius * 1.005, segments: 72, lift: 0.32 });
      const geometry = new THREE.BufferGeometry().setFromPoints(pts);
      geometry.setAttribute("aT", new THREE.Float32BufferAttribute(pts.map((_, k) => k / (pts.length - 1)), 1));
      const material = new THREE.ShaderMaterial({
        vertexShader: arcVertex,
        fragmentShader: arcFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOffset: { value: (i * 0.137) % 1 }, uColor: { value: CHAMPAGNE.clone() } },
      });
      return new THREE.Line(geometry, material);
    });
  }, [radius]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const line of lines) (line.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
  });

  useEffect(
    () => () => {
      for (const line of lines) {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    },
    [lines],
  );

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

/* ── Armillary rings with travelling beads ─────────────────────────────── */

const RINGS: { radius: number; tube: number; rotation: [number, number, number]; speed: number; beads: number[] }[] = [
  { radius: 1.8, tube: 0.0042, rotation: [Math.PI / 2 - 0.42, 0.16, 0.05], speed: 0.07, beads: [0.4, 3.4] },
  { radius: 2.1, tube: 0.0034, rotation: [Math.PI / 2 + 1.02, -0.32, 0.42], speed: -0.05, beads: [1.6] },
  { radius: 2.46, tube: 0.0028, rotation: [0.22, Math.PI / 2 - 0.34, 0.1], speed: 0.034, beads: [4.2] },
];

function Rings({ tier, still }: { tier: Tier; still: boolean }) {
  const spinners = useRef<(THREE.Group | null)[]>([]);
  const glow = useMemo(() => makeGlowTexture(64), []);
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#d3b989", metalness: 1, roughness: 0.22, envMapIntensity: 1.5 }),
    [],
  );

  useFrame((_, delta) => {
    if (still) return;
    const d = Math.min(delta, 0.05);
    spinners.current.forEach((g, i) => {
      if (g) g.rotation.z += d * RINGS[i].speed * 2.2;
    });
  });

  return (
    <group>
      {RINGS.map((ring, i) => (
        <group key={i} rotation={ring.rotation}>
          <group
            ref={(el) => {
              spinners.current[i] = el;
            }}
          >
            <mesh material={ringMaterial}>
              <torusGeometry args={[ring.radius, ring.tube, 10, tier === "high" ? 420 : 240]} />
            </mesh>
            {ring.beads.map((angle, k) => (
              <group key={k} position={[Math.cos(angle) * ring.radius, Math.sin(angle) * ring.radius, 0]}>
                <mesh>
                  <sphereGeometry args={[0.026, 16, 16]} />
                  <meshBasicMaterial color="#f4e2bd" toneMapped={false} />
                </mesh>
                <sprite scale={[0.42, 0.42, 1]}>
                  <spriteMaterial
                    map={glow}
                    color="#e8cf9e"
                    transparent
                    opacity={0.6}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                  />
                </sprite>
              </group>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

function OrbitLines({ still }: { still: boolean }) {
  const loops = useMemo(() => {
    const make = (radius: number, rotation: [number, number, number], opacity: number) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(360).map((p) => new THREE.Vector3(p.x, p.y, 0)));
      const material = new THREE.LineDashedMaterial({
        color: GOLD,
        dashSize: 0.05,
        gapSize: 0.085,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.rotation.set(...rotation);
      return line;
    };
    return [make(2.95, [Math.PI / 2 - 0.2, 0.5, 0], 0.32), make(3.45, [Math.PI / 2 + 0.6, -0.4, 0.2], 0.2)];
  }, []);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current && !still) group.current.rotation.y += Math.min(delta, 0.05) * 0.015;
  });
  return (
    <group ref={group}>
      {loops.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}

/* ── Atmospheric dust ──────────────────────────────────────────────────── */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.12 + aSeed * 6.2831) * 0.14;
    p.x += cos(uTime * 0.09 + aSeed * 3.1415) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aScale * uPixelRatio * (16.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vAlpha = (0.3 + 0.7 * fract(aSeed * 17.31)) * smoothstep(16.0, 6.0, -mv.z);
  }
`;
const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha * 0.5);
  }
`;

function Dust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const { gl } = useThree();
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.pow(Math.random(), 0.7) * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.8;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1.5;
      scales[i] = 0.6 + Math.random() * 1.8;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uColor: { value: new THREE.Color("#e6d3ad") },
      },
    });
    return { geometry: geo, material: mat };
  }, [count, gl]);

  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    if (points.current) points.current.rotation.y += Math.min(delta, 0.05) * 0.012;
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points ref={points} geometry={geometry} material={material} />;
}

/* ── Scene ─────────────────────────────────────────────────────────────── */

const CORE_RADIUS = 1.36;
/** Capture lens: covers 7.2 world units at the object (vs 4.823 for the live 30° camera). */
export const CAPTURE_FOV = (2 * Math.atan(3.6 / 9) * 180) / Math.PI;

function Armillary({ tier, still }: { tier: Tier; still: boolean }) {
  const core = useRef<THREE.Group>(null);
  const { bumpTex, roughTex, colorTex } = useEngravedMaps(tier === "high" ? 4096 : 2048);

  useFrame((_, delta) => {
    if (core.current && !still) core.current.rotation.y += Math.min(delta, 0.05) * 0.055;
  });

  return (
    <group rotation={[0.24, -0.5, -0.16]}>
      <group ref={core}>
        <mesh>
          <sphereGeometry args={[CORE_RADIUS, tier === "high" ? 192 : 112, tier === "high" ? 128 : 80]} />
          <meshPhysicalMaterial
            color="#ffffff"
            map={colorTex}
            metalness={1}
            roughness={0.44}
            roughnessMap={roughTex}
            bumpMap={bumpTex}
            bumpScale={tier === "high" ? 3 : 2.2}
            clearcoat={0.5}
            clearcoatRoughness={0.32}
            envMapIntensity={1.2}
          />
        </mesh>
        <TradeArcs radius={CORE_RADIUS} />
      </group>
      <Rings tier={tier} still={still} />
      <OrbitLines still={still} />
    </group>
  );
}

function Scene({ tier, onReady, capture }: { tier: Tier; onReady: () => void; capture: boolean }) {
  const group = useRef<THREE.Group>(null);
  const fired = useRef(false);
  const size = useThree((s) => s.size);

  useFrame((_, delta) => {
    if (!fired.current) {
      fired.current = true;
      requestAnimationFrame(() => onReady());
    }
    const g = group.current;
    if (!g || capture) return;
    const d = Math.min(delta, 0.05);
    const portrait = size.width / size.height < 0.95;
    const p = heroState.progress;
    const baseScale = portrait ? 0.66 : 1;
    const baseY = portrait ? 0.95 : 0;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, heroState.pointerX * 0.3, 2.2, d);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, heroState.pointerY * 0.18, 2.2, d);
    g.position.x = THREE.MathUtils.damp(g.position.x, heroState.pointerX * 0.1, 2, d);
    g.position.y = THREE.MathUtils.damp(g.position.y, baseY + p * 0.9, 5, d);
    const s = baseScale * (1 - p * 0.14);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 5, d));
  });

  return (
    <>
      <Environment frames={1} resolution={tier === "high" ? 256 : 128} background={false}>
        <Lightformer form="rect" intensity={3.2} color="#f6e6c6" position={[-5, 4, 4]} scale={[9, 1.6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#c4a779" position={[6, -1, 3]} scale={[2.2, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.1} color="#ffffff" position={[1, 6, -5]} scale={5} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#6f6c4f" position={[0, -6, 2]} scale={[12, 2, 1]} target={[0, 0, 0]} />
      </Environment>
      <ambientLight intensity={0.05} />
      <directionalLight position={[-5, 6, 6]} intensity={1.4} color="#f4e4c4" />
      <directionalLight position={[6, -2, -5]} intensity={2.4} color="#c4a779" />
      <group ref={group}>
        <Armillary tier={tier} still={capture} />
      </group>
      {capture ? null : <Dust count={tier === "high" ? 900 : 360} />}
    </>
  );
}

/**
 * The hero's armillary globe. `capture` renders a still, centred frame with a
 * wider lens (used to regenerate assets/images/hero-globe.webp — the poster
 * shown before WebGL is ready). See HERO_POSTER in HeroVisual.
 */
export default function HeroCanvas({ tier, onReady, capture = false }: { tier: Tier; onReady: () => void; capture?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let inView = true;
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
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={capture ? 2 : tier === "high" ? [1, 1.75] : [1, 1.3]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
        camera={{ position: [0, 0, 9], fov: capture ? CAPTURE_FOV : 30, near: 0.1, far: 60 }}
        style={{ pointerEvents: "none" }}
      >
        <Scene tier={tier} onReady={onReady} capture={capture} />
      </Canvas>
    </div>
  );
}
