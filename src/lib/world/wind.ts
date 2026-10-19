import * as THREE from "three";

export interface WindHandle {
  material: THREE.MeshStandardMaterial;
  time: THREE.IUniform<number>;
  player: THREE.IUniform<THREE.Vector2>;
  amp: THREE.IUniform<number>;
}

export function createWindMaterial(opts: {
  color: string;
  amp?: number;
  height?: number;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  doubleSide?: boolean;
}): WindHandle {
  const time: THREE.IUniform<number> = { value: 0 };
  const player: THREE.IUniform<THREE.Vector2> = { value: new THREE.Vector2(999, 999) };
  const amp: THREE.IUniform<number> = { value: opts.amp ?? 0.14 };
  const height = opts.height ?? 1;

  const material = new THREE.MeshStandardMaterial({
    color: opts.color,
    emissive: opts.emissive ?? "#0b1f1c",
    emissiveIntensity: opts.emissiveIntensity ?? 0.15,
    roughness: opts.roughness ?? 0.9,
    metalness: 0,
    side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uPlayer = player;
    shader.uniforms.uAmp = amp;
    shader.uniforms.uHeight = { value: height };
    shader.vertexShader =
      "uniform float uTime;\nuniform vec2 uPlayer;\nuniform float uAmp;\nuniform float uHeight;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec3 iPos = vec3(0.0);
          #ifdef USE_INSTANCING
            iPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #endif
          float ph = iPos.x * 0.7 + iPos.z * 0.9;
          float bend = smoothstep(0.0, uHeight, transformed.y);
          float s = sin(uTime * 1.7 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.6) * 0.4;
          transformed.x += s * bend * uAmp;
          transformed.z += cos(uTime * 1.3 + ph * 1.1) * bend * uAmp * 0.5;
          vec2 wpos = iPos.xz + transformed.xz;
          vec2 dir = wpos - uPlayer;
          float d = length(dir);
          float push = smoothstep(2.0, 0.0, d);
          transformed.xz += (dir / max(d, 0.0001)) * push * bend * 0.5;
        }`,
      );
  };
  material.customProgramCacheKey = () => `wind-${height}`;

  material.userData.wind = { time, player, amp };

  return { material, time, player, amp };
}
