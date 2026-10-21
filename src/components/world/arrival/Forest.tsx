"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { hash01 } from "@/lib/world/anim";
import { createWindMaterial } from "@/lib/world/wind";
import { useSceneTheme, mixHex } from "@/lib/world/scene-theme";
import { getMistTexture } from "./fx-textures";

type Tier = "high" | "low";

export interface Zone {
  x: number;
  z: number;
  r: number;
}

interface ScatterItem {
  x: number;
  z: number;
  rot: number;
  s: number;
  phase: number;
}

interface WindUniforms {
  time: { value: number };
  player: { value: THREE.Vector2 };
}

const DEFAULT_ZONES: Zone[] = [
  { x: 0, z: 0, r: 2.4 },
  { x: 0, z: -5, r: 1.6 },
  { x: -6, z: -4, r: 2.0 },
  { x: -6.5, z: 3.2, r: 2.8 },
  { x: -4, z: 2.6, r: 1.9 },
];

function inCorridor(x: number, z: number): boolean {
  if (Math.abs(x) < 1.25 && z > -6.5 && z < 6.5) return true;
  const dx = x + 4.2;
  const dz = z - 1.5;
  if (dx * dx + dz * dz < 1.6) return true;
  return false;
}

function blocked(x: number, z: number, zones: Zone[]): boolean {
  if (inCorridor(x, z)) return true;
  for (let i = 0; i < zones.length; i++) {
    const e = zones[i];
    const dx = x - e.x;
    const dz = z - e.z;
    if (dx * dx + dz * dz < e.r * e.r) return true;
  }
  return false;
}

function scatter(
  count: number,
  seedBase: number,
  area: [number, number, number, number],
  clusters: number,
  spread: number,
  zones: Zone[],
  edgeBias = 0,
): ScatterItem[] {
  const out: ScatterItem[] = [];
  const [x0, x1, z0, z1] = area;
  const per = Math.ceil(count / clusters);
  for (let c = 0; c < clusters && out.length < count; c++) {
    const cx = x0 + (x1 - x0) * hash01(seedBase + c * 3.17);
    const cz = z0 + (z1 - z0) * hash01(seedBase + c * 7.73 + 1.3);
    for (let i = 0; i < per && out.length < count; i++) {
      const s = seedBase + c * 131.7 + i * 3.31;
      const x = cx + (hash01(s) - 0.5) * spread;
      const z = cz + (hash01(s + 1.7) - 0.5) * spread;
      const edge = Math.min(1, Math.abs(x) / 11 + Math.abs(z) / 6.5);
      if (edgeBias > 0 && edge < edgeBias * (0.4 + hash01(s + 5) * 0.6)) continue;
      if (blocked(x, z, zones)) continue;
      out.push({ x, z, rot: hash01(s + 2.3) * Math.PI * 2, s: 0.7 + hash01(s + 3.1) * 0.7, phase: hash01(s + 4.9) });
    }
  }
  return out;
}

function makeBlade(w: number, h: number, bend: number, segs = 3): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h, 1, segs);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + h / 2;
    const t = y / h;
    pos.setY(i, y);
    pos.setX(i, pos.getX(i) * (1 - t * 0.82));
    pos.setZ(i, pos.getZ(i) + t * t * bend);
  }
  g.computeVertexNormals();
  return g;
}

function makeFern(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const b = makeBlade(0.11, 0.5 + (i % 3) * 0.14, 0.18);
    b.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.14 - (i % 3) * 0.09));
    b.applyMatrix4(new THREE.Matrix4().makeRotationY((i / n) * Math.PI * 2 + 0.3));
    parts.push(b);
  }
  return mergeGeometries(parts)!;
}

function GrassField({ quality, zones }: { quality: Tier; zones: Zone[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => makeBlade(0.09, 0.58, 0.13), []);
  const windMat = useMemo(
    () => createWindMaterial({ color: "#204f3c", emissive: "#0b231b", emissiveIntensity: 0.3, amp: 0.24, height: 0.58, doubleSide: true, roughness: 0.95 }).material,
    [],
  );
  const items = useMemo(
    () => scatter(quality === "high" ? 1250 : 420, 11.3, [-10.5, 10.5, -6, 6], quality === "high" ? 90 : 40, 2.2, zones, 0.25),
    [quality, zones],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const col = new THREE.Color();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      e.set(0, it.rot, 0);
      q.setFromEuler(e);
      p.set(it.x, 0, it.z);
      s.set(it.s, it.s * (0.8 + hash01(i * 2.1) * 0.6), it.s);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      const t = hash01(i * 4.4);
      col.setHSL(0.36 + t * 0.04, 0.42, 0.2 + t * 0.1);
      mesh.setColorAt(i, col);
    }
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame(({ clock, camera }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshStandardMaterial;
    const wind = material.userData.wind as WindUniforms;
    wind.time.value = clock.elapsedTime;
    wind.player.value.set(camera.position.x, camera.position.z);
  });

  return <instancedMesh ref={ref} args={[geometry, windMat, items.length]} frustumCulled={false} castShadow />;
}

function Ferns({ quality, zones }: { quality: Tier; zones: Zone[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => makeFern(), []);
  const windMat = useMemo(
    () => createWindMaterial({ color: "#1c4634", emissive: "#0c2a1f", emissiveIntensity: 0.3, amp: 0.16, height: 0.7, doubleSide: true, roughness: 0.95 }).material,
    [],
  );
  const items = useMemo(
    () => scatter(quality === "high" ? 90 : 34, 41.9, [-10, 10, -5.8, 5.8], 24, 1.7, zones, 0.15),
    [quality, zones],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      e.set(0, it.rot, 0);
      q.setFromEuler(e);
      p.set(it.x, 0, it.z);
      s.set(it.s * 1.1, it.s * (0.85 + hash01(i * 3.3) * 0.5), it.s * 1.1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);

  useFrame(({ clock, camera }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshStandardMaterial;
    const wind = material.userData.wind as WindUniforms;
    wind.time.value = clock.elapsedTime * 0.9;
    wind.player.value.set(camera.position.x, camera.position.z);
  });

  return <instancedMesh ref={ref} args={[geometry, windMat, items.length]} frustumCulled={false} castShadow />;
}

function Mushrooms({ quality, zones }: { quality: Tier; zones: Zone[] }) {
  const caps = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);

  const capGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    g.scale(1, 0.7, 1);
    g.translate(0, 0.17, 0);
    return g;
  }, []);
  const stemGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.035, 0.05, 0.2, 6);
    g.translate(0, 0.1, 0);
    return g;
  }, []);

  const items = useMemo(
    () => scatter(quality === "high" ? 40 : 16, 71.3, [-9.5, 9.5, -5.5, 5.5], 14, 1.2, zones, 0.5),
    [quality, zones],
  );

  const capMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#5ff0d0") }, uPlayer: { value: new THREE.Vector2(999, 999) } },
        vertexShader: `
          uniform float uTime; uniform vec2 uPlayer;
          attribute float aPhase;
          varying float vI; varying float vNear;
          void main() {
            vI = 0.5 + 0.5 * sin(uTime * 1.1 + aPhase * 6.2831853);
            vec3 p = position;
            #ifdef USE_INSTANCING
              vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            #else
              vec3 ip = vec3(0.0);
            #endif
            vNear = smoothstep(6.0, 1.0, distance(ip.xz, uPlayer));
            vec4 mv = modelViewMatrix * modelMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vI; varying float vNear;
          void main() {
            float g = 0.7 + vI * 1.0 + vNear * 0.7;
            gl_FragColor = vec4(uColor * g, 1.0);
          }`,
        toneMapped: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const phase = new Float32Array(items.length);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      e.set(0, it.rot, 0);
      q.setFromEuler(e);
      p.set(it.x, 0, it.z);
      const sc = it.s * 0.9;
      s.set(sc, sc, sc);
      m.compose(p, q, s);
      caps.current?.setMatrixAt(i, m);
      stems.current?.setMatrixAt(i, m);
      phase[i] = it.phase;
    }
    if (caps.current) {
      caps.current.count = items.length;
      caps.current.instanceMatrix.needsUpdate = true;
      caps.current.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    }
    if (stems.current) {
      stems.current.count = items.length;
      stems.current.instanceMatrix.needsUpdate = true;
    }
  }, [items]);

  useFrame(({ clock, camera }) => {
    if (!caps.current) return;
    const shader = caps.current.material as THREE.ShaderMaterial;
    shader.uniforms.uTime.value = clock.elapsedTime;
    shader.uniforms.uPlayer.value.set(camera.position.x, camera.position.z);
  });

  return (
    <group>
      <instancedMesh ref={caps} args={[capGeo, capMat, items.length]} frustumCulled={false} />
      <instancedMesh ref={stems} args={[stemGeo, undefined, items.length]} frustumCulled={false}>
        <meshStandardMaterial color="#63796e" roughness={0.78} emissive="#2f6f5c" emissiveIntensity={0.16} />
      </instancedMesh>
    </group>
  );
}

function Rocks({ quality, zones }: { quality: Tier; zones: Zone[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.32, 0), []);
  const items = useMemo(
    () => scatter(quality === "high" ? 34 : 16, 131.7, [-10, 10, -6, 6], 14, 1.6, zones, 0.35),
    [quality, zones],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      e.set(hash01(i * 2.3) * 0.4, it.rot, hash01(i * 5.1) * 0.4);
      q.setFromEuler(e);
      p.set(it.x, it.s * 0.12, it.z);
      s.set(it.s, it.s * (0.7 + hash01(i * 1.9) * 0.4), it.s);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} frustumCulled={false} castShadow>
      <meshStandardMaterial color={mixHex(palette.stoneDark, palette.stone, 0.4)} roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

interface DriftConfig {
  color: string;
  size: number;
  rise: number;
  wander: number;
  bob: number;
  blink: number;
  opacity: number;
  react: number;
}

function Drifters({
  count,
  seedBase,
  yMin,
  yMax,
  cfg,
}: {
  count: number;
  seedBase: number;
  yMin: number;
  yMax: number;
  cfg: DriftConfig;
}) {
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const aSeed = new Float32Array(count);
    const aSize = new Float32Array(count);
    const aPhase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const s = seedBase + i * 2.399;
      positions[i * 3] = (hash01(s) - 0.5) * 19;
      positions[i * 3 + 1] = yMin + hash01(s + 1.1) * (yMax - yMin);
      positions[i * 3 + 2] = (hash01(s + 2.3) - 0.5) * 12;
      aSeed[i] = hash01(s + 3.7) * 10;
      aSize[i] = 0.6 + hash01(s + 4.9) * 1.2;
      aPhase[i] = hash01(s + 6.1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
    return g;
  }, [count, seedBase, yMin, yMax]);

  const ptsRef = useRef<THREE.Points>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPlayer: { value: new THREE.Vector2(999, 999) },
        uColor: { value: new THREE.Color(cfg.color) },
        uSize: { value: cfg.size },
        uRise: { value: cfg.rise },
        uWander: { value: cfg.wander },
        uBob: { value: cfg.bob },
        uBlink: { value: cfg.blink },
        uOpacity: { value: cfg.opacity },
        uReact: { value: cfg.react },
      },
      vertexShader: `
          uniform float uTime; uniform vec2 uPlayer; uniform float uSize; uniform float uRise;
          uniform float uWander; uniform float uBob; uniform float uBlink; uniform float uReact;
          attribute float aSeed; attribute float aSize; attribute float aPhase;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float t = uTime;
            float ph = aPhase * 6.2831853;
            p.y = position.y + mod(t * uRise + aPhase * 4.0, 4.0) * step(0.001, uRise);
            p.x += sin(t * 0.32 + aSeed * 1.3) * uWander;
            p.z += cos(t * 0.27 + aSeed * 1.1) * uWander;
            p.y += sin(t * 0.6 + ph) * uBob;
            float d = distance(p.xz, uPlayer);
            float near = smoothstep(7.0, 1.5, d);
            p.xz += normalize(p.xz - uPlayer + vec2(0.0001)) * near * uReact;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(aSize * uSize * (300.0 / max(-mv.z, 0.1)), 1.0, 64.0);
            float blink = 0.45 + 0.55 * (0.5 + 0.5 * sin(t * uBlink + ph));
            vAlpha = blink * (1.0 + near * 0.9);
            gl_Position = projectionMatrix * mv;
          }`,
      fragmentShader: `
          uniform vec3 uColor; uniform float uOpacity;
          varying float vAlpha;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float r = length(c);
            if (r > 0.5) discard;
            float a = smoothstep(0.5, 0.0, r);
            a *= a;
            gl_FragColor = vec4(uColor, 1.0) * a * vAlpha * uOpacity;
          }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      }),
    [cfg],
  );

  useFrame(({ clock, camera }) => {
    if (!ptsRef.current) return;
    const shader = ptsRef.current.material as THREE.ShaderMaterial;
    shader.uniforms.uTime.value = clock.elapsedTime;
    shader.uniforms.uPlayer.value.set(camera.position.x, camera.position.z);
  });

  return <points ref={ptsRef} geometry={data} material={mat} frustumCulled={false} />;
}

function Mist({ quality, zones }: { quality: Tier; zones: Zone[] }) {
  const texture = useMemo(() => getMistTexture(), []);
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () => scatter(quality === "high" ? 7 : 4, 211.1, [-8, 8, -4, 4], 7, 1.0, zones, 0),
    [quality, zones],
  );

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i];
      child.position.x = items[i].x + Math.sin(t * 0.06 + items[i].phase * 6.28) * 2.4;
      child.position.z = items[i].z + Math.cos(t * 0.045 + items[i].phase * 6.28) * 1.6;
      const d = Math.hypot(child.position.x - camera.position.x, child.position.z - camera.position.z);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.16 * (1 - d / 16)) * (0.7 + 0.3 * Math.sin(t * 0.2 + i));
    }
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, 0.35, it.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 5]} />
          <meshBasicMaterial map={texture} transparent opacity={0.12} depthWrite={false} color="#7fb8b0" />
        </mesh>
      ))}
    </group>
  );
}

export function Forest({
  quality,
  reduced,
  zones = DEFAULT_ZONES,
  grass = true,
}: {
  quality: Tier;
  reduced: boolean;
  zones?: Zone[];
  /** Home supplies a world-scale grass field, so its near-field copy is off. */
  grass?: boolean;
}) {
  const grassZones = useMemo(() => zones, [zones]);

  if (reduced) {
    return (
      <group>
        {grass ? <GrassField quality={quality} zones={grassZones} /> : null}
        <Rocks quality={quality} zones={grassZones} />
      </group>
    );
  }

  return (
    <group>
      {grass ? <GrassField quality={quality} zones={grassZones} /> : null}
      <Ferns quality={quality} zones={grassZones} />
      <Mushrooms quality={quality} zones={grassZones} />
      <Rocks quality={quality} zones={grassZones} />
      <Drifters
        count={quality === "high" ? 74 : 28}
        seedBase={3.1}
        yMin={0.1}
        yMax={0.5}
        cfg={{ color: "#9be8d6", size: 1.5, rise: 0.22, wander: 0.5, bob: 0.25, blink: 0.9, opacity: 0.42, react: 0.35 }}
      />
      <Mist quality={quality} zones={grassZones} />
    </group>
  );
}
