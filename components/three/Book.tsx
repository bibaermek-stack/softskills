"use client";

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Book as BookData } from "@/lib/content";

/**
 * `false` disables drei's Draco path (which would fetch a decoder from a Google
 * CDN); `true` enables meshopt, whose decoder ships inside three-stdlib. The
 * models in /public/models are meshopt-compressed by scripts/optimize-models.mjs.
 */
const GLTF_ARGS = [false, true] as const;

type BookProps = {
  data: BookData;
  /** Resting position on the platform. */
  position: [number, number, number];
  /** Rotation about Y so each book faces slightly outward. */
  baseRotation: number;
  hovered: boolean;
  selected: boolean;
  anySelected: boolean;
  pointer: THREE.Vector2;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reduced: boolean;
};

export function Book({
  data,
  position,
  baseRotation,
  hovered,
  selected,
  anySelected,
  pointer,
  onHover,
  onSelect,
  reduced,
}: BookProps) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const { scene } = useGLTF(data.model, ...GLTF_ARGS);

  // Each book instance needs its own object graph and its own materials so
  // per-book emissive changes on hover don't leak across the shared cache.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Normalise wildly different export scales to a consistent on-screen height.
    const targetHeight = 2.05;
    const scale = targetHeight / Math.max(size.y, 1e-6);
    clone.scale.setScalar(scale);
    clone.position.sub(center.multiplyScalar(scale));
    // Sit the book on the platform rather than centred on the origin.
    clone.position.y += (size.y * scale) / 2;

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const src = child.material as THREE.MeshStandardMaterial;
      const mat = src.clone();
      mat.envMapIntensity = 1.15;
      mat.emissive = new THREE.Color(data.accent);
      mat.emissiveIntensity = 0;
      child.material = mat;
    });

    return clone;
  }, [scene, data.accent]);

  useLayoutEffect(() => {
    return () => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose();
      });
    };
  }, [model]);

  const accentColor = useMemo(() => new THREE.Color(data.accent), [data.accent]);

  // Animation state that must not trigger React re-renders.
  const state = useRef({ hoverMix: 0, selectMix: 0, dimMix: 0, spin: 0 });

  useFrame((_, rawDelta) => {
    const g = group.current;
    const i = inner.current;
    if (!g || !i) return;

    const delta = Math.min(rawDelta, 0.05); // clamp after tab-switch stalls
    const s = state.current;
    const damp = (current: number, target: number, speed: number) =>
      current + (target - current) * (1 - Math.exp(-speed * delta));

    s.hoverMix = damp(s.hoverMix, hovered && !anySelected ? 1 : 0, 8);
    s.selectMix = damp(s.selectMix, selected ? 1 : 0, 5);
    s.dimMix = damp(s.dimMix, anySelected && !selected ? 1 : 0, 5);

    // Continuous slow rotation, paused while a book is open for reading.
    if (!reduced) s.spin += delta * (selected ? 0.05 : 0.16) * (1 - s.dimMix * 0.6);

    const t = performance.now() / 1000;
    const bob = reduced ? 0 : Math.sin(t * 0.9 + data.index * 1.7) * 0.075;

    // Selected books lift toward the camera; unselected ones sink and fade back.
    const lift = s.selectMix * 0.55 + s.hoverMix * 0.22 - s.dimMix * 0.3;
    g.position.set(
      position[0] * (1 - s.selectMix * 0.85),
      position[1] + bob + lift,
      position[2] * (1 - s.selectMix * 0.85) + s.selectMix * 0.9,
    );

    const scale = 1 + s.hoverMix * 0.14 + s.selectMix * 0.2 - s.dimMix * 0.16;
    g.scale.setScalar(scale);

    // Books tilt toward the cursor — subtle, and disabled once one is open.
    const follow = (1 - s.selectMix) * 0.22;
    const targetY = baseRotation + s.spin + pointer.x * follow;
    const targetX = -pointer.y * follow * 0.55;
    i.rotation.y = damp(i.rotation.y, targetY, 6);
    i.rotation.x = damp(i.rotation.x, targetX, 6);
    // A small roll makes the "opening" read as a book being tipped open.
    i.rotation.z = damp(i.rotation.z, s.selectMix * -0.16 + s.hoverMix * -0.05, 6);

    const emissive = s.hoverMix * 0.5 + s.selectMix * 0.32;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = emissive;
      }
    });

    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = s.hoverMix * 0.4 + s.selectMix * 0.3;
      glowRef.current.scale.setScalar(1 + s.hoverMix * 0.3 + s.selectMix * 0.45);
    }
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(data.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(data.id);
      }}
    >
      <group ref={inner}>
        <primitive object={model} />
      </group>

      {/* Soft additive halo behind the book. */}
      <mesh ref={glowRef} position={[0, 1.05, -0.32]}>
        <circleGeometry args={[1.35, 48]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/*
        Floating title. Deliberately HTML rather than drei's <Text>: troika
        fetches its default font from a Google CDN at runtime, and could not use
        the site's own typeface. This keeps the label on-brand, selectable and
        readable by assistive tech.
      */}
      {hovered && !anySelected ? (
        <Html position={[0, 2.5, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-1/2 whitespace-nowrap rounded-full border border-white/15 bg-ink-950/80 px-4 py-2 text-center font-display text-[0.95rem] font-semibold text-white shadow-lg backdrop-blur-md">
            {data.title}
            <span className="mt-0.5 block text-[0.62rem] font-medium tracking-[0.14em] uppercase" style={{ color: data.accent }}>
              Volume {data.number}
            </span>
          </div>
        </Html>
      ) : null}

      {/* Contact shadow on the platform. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
      </mesh>
    </group>
  );
}
