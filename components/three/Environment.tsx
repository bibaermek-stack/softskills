"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *\
   Glowing circular platform the books stand on
\* ------------------------------------------------------------------ */
export function Podium({ accent }: { accent: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(accent), [accent]);
  const current = useRef(new THREE.Color(accent));

  useFrame((_, delta) => {
    // Ease the ring toward the active book's accent colour.
    current.current.lerp(color, 1 - Math.exp(-4 * delta));

    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).color.copy(current.current);
    }

    if (pulseRef.current) {
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(current.current);
      // Expanding ripple that restarts every 3.4s.
      const t = (performance.now() / 1000) % 3.4;
      const p = t / 3.4;
      pulseRef.current.scale.setScalar(1 + p * 1.15);
      mat.opacity = (1 - p) * 0.28;
    }
  });

  return (
    <group>
      {/* Reflective disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.1, 96]} />
        <meshStandardMaterial
          color="#070c1c"
          roughness={0.24}
          metalness={0.72}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Bright rim */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[4.86, 5.06, 128]} />
        <meshBasicMaterial
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner hairline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[3.42, 3.47, 128]} />
        <meshBasicMaterial
          color="#4f46e5"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outward ripple */}
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[4.6, 4.72, 128]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ground glow bleeding out from under the disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshBasicMaterial
          color="#1e3a8a"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *\
   Ambient floating particles
\* ------------------------------------------------------------------ */
export function Particles({ count = 260, reduced }: { count?: number; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 8 - 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.12 + Math.random() * 0.34;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((_, rawDelta) => {
    if (reduced || !ref.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const array = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += speeds[i] * delta;
      if (array[i * 3 + 1] > 7.5) array[i * 3 + 1] = -0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#93c5fd"
        transparent
        opacity={0.62}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ *\
   Burst of accent particles around the hovered book
\* ------------------------------------------------------------------ */
export function HoverSparks({
  position,
  active,
  accent,
  reduced,
}: {
  position: [number, number, number];
  active: boolean;
  accent: string;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Points>(null);
  const opacity = useRef(0);
  const count = 60;

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (Math.random() - 0.5) * 1.5;
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return { positions, seeds };
  }, []);

  const color = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((_, rawDelta) => {
    if (!ref.current) return;
    const delta = Math.min(rawDelta, 0.05);
    opacity.current += ((active ? 1 : 0) - opacity.current) * (1 - Math.exp(-7 * delta));

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = opacity.current * 0.9;
    mat.color.copy(color);

    if (opacity.current < 0.01 || reduced) return;

    const t = performance.now() / 1000;
    const array = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Each spark rises on its own loop and drifts on a lazy sine.
      const phase = (t * (0.28 + seeds[i * 3 + 1] * 0.4) + seeds[i * 3 + 1] * 3) % 1;
      array[i * 3] = seeds[i * 3] * (0.5 + phase * 0.8) + Math.sin(t + i) * 0.08;
      array[i * 3 + 1] = phase * 2.6;
      array[i * 3 + 2] = seeds[i * 3 + 2] * (0.5 + phase * 0.8);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        transparent
        opacity={0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
