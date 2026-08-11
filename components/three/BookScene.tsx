"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment as DreiEnvironment,
  AdaptiveDpr,
  Preload,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { books, type BookId } from "@/lib/content";
import { usePrefersReducedMotion, useMediaQuery } from "@/lib/hooks";
import { Book } from "./Book";
import { Podium, Particles, HoverSparks } from "./Environment";

/** Resting layout: a shallow arc so all four books face the camera. */
const LAYOUT: { position: [number, number, number]; rotation: number }[] = [
  { position: [-3.35, 0, 0.55], rotation: 0.3 },
  { position: [-1.12, 0, -0.2], rotation: 0.1 },
  { position: [1.12, 0, -0.2], rotation: -0.1 },
  { position: [3.35, 0, 0.55], rotation: -0.3 },
];

/* ------------------------------------------------------------------ *\
   Camera rig — dollies in when a book is opened
\* ------------------------------------------------------------------ */
function Rig({
  selected,
  reduced,
  compact,
}: {
  selected: BookId | null;
  reduced: boolean;
  compact: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.35, 0));
  const pointer = useRef(new THREE.Vector2());

  const home = useMemo(
    () => new THREE.Vector3(0, compact ? 3.5 : 3.1, compact ? 13.2 : 9.6),
    [compact],
  );
  const close = useMemo(
    () => new THREE.Vector3(0, 1.95, compact ? 6.4 : 5.15),
    [compact],
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const ease = 1 - Math.exp(-2.6 * delta);

    // Parallax drift, suppressed while reading an open book.
    const drift = selected ? 0 : 1;
    pointer.current.lerp(state.pointer, 1 - Math.exp(-3 * delta));

    const desired = selected ? close : home;
    const px = pointer.current.x * 0.85 * drift;
    const py = pointer.current.y * 0.42 * drift;

    camera.position.lerp(
      new THREE.Vector3(desired.x + px, desired.y + py, desired.z),
      ease,
    );

    const desiredTarget = selected
      ? new THREE.Vector3(0, 1.5, 0.9)
      : new THREE.Vector3(0, 1.35, 0);
    target.current.lerp(desiredTarget, ease);
    camera.lookAt(target.current);
  });

  useEffect(() => {
    if (!reduced) return;
    camera.position.copy(home);
    camera.lookAt(0, 1.35, 0);
  }, [reduced, camera, home]);

  return null;
}

/* ------------------------------------------------------------------ *\
   Scene contents
\* ------------------------------------------------------------------ */
function Scene({
  hovered,
  selected,
  onHover,
  onSelect,
  reduced,
  compact,
}: {
  hovered: BookId | null;
  selected: BookId | null;
  onHover: (id: BookId | null) => void;
  onSelect: (id: BookId) => void;
  reduced: boolean;
  compact: boolean;
}) {
  const pointer = useRef(new THREE.Vector2());

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    pointer.current.lerp(state.pointer, 1 - Math.exp(-4 * delta));
  });

  const activeAccent =
    books.find((b) => b.id === (selected ?? hovered))?.accent ?? "#4f46e5";

  return (
    <>
      <color attach="background" args={["#04060f"]} />
      <fog attach="fog" args={["#04060f", 12, 30]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#93c5fd", "#0b1020", 0.6]} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0008}
      />
      <spotLight
        position={[0, 8.5, 2.5]}
        angle={0.62}
        penumbra={1}
        intensity={38}
        color="#a5b4fc"
        distance={26}
      />
      <pointLight position={[-7, 2.5, 3]} intensity={22} color="#22d3ee" distance={18} />
      <pointLight position={[7, 2.5, 3]} intensity={22} color="#8b5cf6" distance={18} />

      <DreiEnvironment preset="city" environmentIntensity={0.42} />

      <Podium accent={activeAccent} />
      <Particles count={compact ? 130 : 260} reduced={reduced} />

      {books.map((book, i) => (
        <Book
          key={book.id}
          data={book}
          position={LAYOUT[i].position}
          baseRotation={LAYOUT[i].rotation}
          hovered={hovered === book.id}
          selected={selected === book.id}
          anySelected={selected !== null}
          pointer={pointer.current}
          onHover={(id) => onHover(id as BookId | null)}
          onSelect={(id) => onSelect(id as BookId)}
          reduced={reduced}
        />
      ))}

      {books.map((book, i) => (
        <HoverSparks
          key={`spark-${book.id}`}
          position={LAYOUT[i].position}
          active={hovered === book.id && selected === null}
          accent={book.accent}
          reduced={reduced}
        />
      ))}

      <AdaptiveDpr pixelated />
      <Preload all />
    </>
  );
}

/* ------------------------------------------------------------------ *\
   Public component
\* ------------------------------------------------------------------ */
export default function BookScene({
  selected,
  onSelect,
  onHoverChange,
}: {
  selected: BookId | null;
  onSelect: (id: BookId | null) => void;
  onHoverChange?: (id: BookId | null) => void;
}) {
  const [hovered, setHovered] = useState<BookId | null>(null);
  const reduced = usePrefersReducedMotion();
  const compact = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    onHoverChange?.(hovered);
  }, [hovered, onHoverChange]);

  // Cursor affordance for a canvas that has no DOM hit targets of its own.
  useEffect(() => {
    document.body.style.cursor = hovered && !selected ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, selected]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 3.1, 9.6], fov: 42, near: 0.1, far: 60 }}
      // Nothing in the scene reacts to a click on empty space except closing.
      onPointerMissed={() => onSelect(null)}
      className="touch-pan-y"
    >
      <Suspense fallback={null}>
        <Scene
          hovered={hovered}
          selected={selected}
          onHover={setHovered}
          onSelect={(id) => onSelect(selected === id ? null : id)}
          reduced={reduced}
          compact={compact}
        />
        <Rig selected={selected} reduced={reduced} compact={compact} />
      </Suspense>
    </Canvas>
  );
}

// Warm the GLTF cache as soon as this chunk is evaluated. Args must match the
// ones Book.tsx passes, or drei caches under a different key and re-fetches.
books.forEach((book) => useGLTF.preload(book.model, false, true));
