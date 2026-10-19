"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDotTexture } from "@/components/world/arrival/fx-textures";
import { hash01 } from "@/lib/world/anim";
import { useSceneTheme } from "@/lib/world/scene-theme";

interface GalaxySkyProps {
  quality: "high" | "low";
  reduced: boolean;
}

let nebulaTexture: THREE.CanvasTexture | null = null;

function getNebulaTexture(): THREE.CanvasTexture {
  if (nebulaTexture) return nebulaTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the procedural galaxy sky texture");

  const { width, height } = canvas;
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#040b10");
  background.addColorStop(0.35, "#07151b");
  background.addColorStop(0.5, "#0b2529");
  background.addColorStop(0.62, "#18332f");
  background.addColorStop(0.67, "#493b30");
  background.addColorStop(0.72, "#795034");
  background.addColorStop(0.78, "#30231f");
  background.addColorStop(1, "#091014");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "lighter";
  for (let i = 0; i < 150; i += 1) {
    const x = hash01(i * 7 + 1) * width;
    const band = 0.5 + Math.sin((x / width) * Math.PI * 2 + 0.4) * 0.1;
    const y = (band + (hash01(i * 7 + 2) - 0.5) * 0.26) * height;
    const radiusX = 28 + hash01(i * 7 + 3) * 155;
    const radiusY = 8 + hash01(i * 7 + 4) * 55;
    const colors = ["54, 107, 113", "85, 140, 143", "39, 83, 94", "55, 100, 91", "167, 112, 67"];
    const color = colors[Math.floor(hash01(i * 7 + 5) * colors.length)];

    context.save();
    context.translate(x, y);
    context.rotate((hash01(i * 7 + 6) - 0.5) * 0.42);
    context.scale(radiusX, radiusY);
    const cloud = context.createRadialGradient(0, 0, 0.03, 0, 0, 1);
    cloud.addColorStop(0, `rgba(${color}, ${0.05 + hash01(i * 7 + 7) * 0.08})`);
    cloud.addColorStop(0.38, `rgba(${color}, 0.04)`);
    cloud.addColorStop(1, `rgba(${color}, 0)`);
    context.fillStyle = cloud;
    context.beginPath();
    context.arc(0, 0, 1, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.globalCompositeOperation = "source-over";

  nebulaTexture = new THREE.CanvasTexture(canvas);
  nebulaTexture.colorSpace = THREE.SRGBColorSpace;
  nebulaTexture.wrapS = THREE.RepeatWrapping;
  nebulaTexture.wrapT = THREE.ClampToEdgeWrapping;
  nebulaTexture.anisotropy = 4;
  return nebulaTexture;
}

function makeStarField(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const palette = ["#d6e4dc", "#a9c5c7", "#7dabb2", "#d6b28c", "#ecede0"];

  for (let i = 0; i < count; i += 1) {
    const y = hash01(i * 4 + 1) * 2 - 1;
    const angle = hash01(i * 4 + 2) * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const distance = radius * (0.88 + hash01(i * 4 + 3) * 0.12);
    positions[i * 3] = Math.cos(angle) * ring * distance;
    positions[i * 3 + 1] = y * distance;
    positions[i * 3 + 2] = Math.sin(angle) * ring * distance;

    color.set(palette[Math.floor(hash01(i * 4 + 4) * palette.length)]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  return { positions, colors };
}

export function GalaxySky({ quality, reduced }: GalaxySkyProps) {
  const sky = useRef<THREE.Group>(null);
  const starsMaterial = useRef<THREE.PointsMaterial>(null);
  const palette = useSceneTheme();
  const count = quality === "high" ? 3200 : 1100;
  const stars = useMemo(() => makeStarField(count, 86), [count]);
  const texture = useMemo(() => getDotTexture(), []);
  const nebula = useMemo(() => getNebulaTexture(), []);

  useFrame(({ camera, clock }, delta) => {
    if (!sky.current) return;
    sky.current.position.copy(camera.position);
    if (!reduced) {
      sky.current.rotation.y += delta * 0.00065;
      sky.current.rotation.z = Math.sin(clock.elapsedTime * 0.025) * 0.018;
      if (starsMaterial.current) {
        starsMaterial.current.opacity = 0.86 + Math.sin(clock.elapsedTime * 0.65) * 0.06;
      }
    }
  });

  if (palette.isLight) return null;

  return (
    <group ref={sky}>
      <mesh>
        <sphereGeometry args={[94, 48, 32]} />
        <meshBasicMaterial
          map={nebula}
          color="#ffffff"
          side={THREE.BackSide}
          transparent
          opacity={0.72}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starsMaterial}
          map={texture}
          size={0.3}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.86}
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
