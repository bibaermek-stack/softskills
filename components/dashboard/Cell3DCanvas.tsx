"use client";

import { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { Icon } from "@/components/dashboard/Icon";

const GLTF_ARGS = [false, true] as const;

export interface OrganelleInfo {
  id: string;
  name: string;
  nameKk: string;
  desc: string;
  color: string;
  models: string[];
}

export const ORGANELLES: OrganelleInfo[] = [
  {
    id: "nucleus",
    name: "Nucleus & Nucleolus",
    nameKk: "Ядро және Ядрошық (Nucleus)",
    desc: "Генетикалық ақпаратты (ДНҚ) сақтайтын және жасушадағы барлық биохимиялық процестерді басқаратын негізгі органелла.",
    color: "#EC4899",
    models: ["model_3", "model_4", "model_5"],
  },
  {
    id: "er",
    name: "Endoplasmic Reticulum",
    nameKk: "Эндоплазмалық Тор (ER)",
    desc: "Нәруыздар мен липидтерді синтездеп, жасуша ішінде сұрыптау және тасымалдау жүйесін құрайтын қатпарлы мембраналар.",
    color: "#C084FC",
    models: ["model_1", "model_2"],
  },
  {
    id: "mitochondria",
    name: "Mitochondria",
    nameKk: "Митохондрия (Mitochondria)",
    desc: "Жасушаның басты «энергия станциясы». Аэробты тыныс алу арқылы АТФ (аденозинүшфосфор қышқылын) синтездейді.",
    color: "#22D3EE",
    models: ["model_6", "model_9"],
  },
  {
    id: "golgi",
    name: "Golgi Apparatus",
    nameKk: "Гольджи Комплексі (Golgi Apparatus)",
    desc: "Эндоплазмалық тордан келген нәруыздарды модификациялап, қаптайды және қажетті органеллаларға немесе сыртқа жөнелтеді.",
    color: "#EAB308",
    models: ["model_7", "model_8", "model_10"],
  },
  {
    id: "cytoplasm",
    name: "Cytoplasm & Plasma Membrane",
    nameKk: "Цитоплазма мен Мембрана",
    desc: "Жасушаның ішкі қоймалжың ортасы және барлық органеллаларды қоршап тұрған виолет түсті қорғаныс қабықшасы.",
    color: "#8B5CF6",
    models: ["model_0", "model_12"],
  },
  {
    id: "stand",
    name: "Lab Stand",
    nameKk: "Зертханалық Анатомиялық Тұғыр",
    desc: "3D модельдің интерактивті анатомиялық бұрышын ыңғайлы көруге арналған хромдалған металл тұғыр.",
    color: "#C8CDD7",
    models: ["model_11"],
  },
];

function CellModel({
  selectedOrganelle,
}: {
  selectedOrganelle: OrganelleInfo | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/cell-cross-section.glb", ...GLTF_ARGS);

  // Process scene object & apply shadow / material enhancements
  const preparedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Compute bounding box and normalize scale
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const targetHeight = 3.6;
    const scale = targetHeight / Math.max(size.y, 1e-6);
    clone.scale.setScalar(scale);
    clone.position.sub(center.multiplyScalar(scale));

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const mat = (child.material as THREE.MeshStandardMaterial).clone();
          mat.envMapIntensity = 1.4;
          mat.roughness = child.name === "model_11" ? 0.2 : 0.35;
          mat.metalness = child.name === "model_11" ? 0.85 : 0.1;
          child.material = mat;
        }
      }
    });

    return clone;
  }, [scene]);

  // Animate pulse glow on selected organelle
  useFrame((state, delta) => {
    if (!preparedScene) return;

    preparedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        const isHighlighted =
          selectedOrganelle && selectedOrganelle.models.includes(child.name);

        if (isHighlighted) {
          const pulse = Math.sin(state.clock.elapsedTime * 6) * 0.2 + 0.3;
          mat.emissive.set(selectedOrganelle.color);
          mat.emissiveIntensity = pulse;
        } else {
          mat.emissiveIntensity = THREE.MathUtils.damp(
            mat.emissiveIntensity,
            0,
            10,
            delta
          );
        }
      }
    });
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={preparedScene} />
    </group>
  );
}

useGLTF.preload("/models/cell-cross-section.glb", ...GLTF_ARGS);

export function Cell3DCanvas({
  selectedOrganelle,
  onSelectOrganelle,
}: {
  selectedOrganelle: OrganelleInfo | null;
  onSelectOrganelle: (org: OrganelleInfo | null) => void;
}) {
  const [autoRotate, setAutoRotate] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[32rem] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white pointer-events-auto">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          3D Жасуша Қимасы (Cell Cross Section)
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              autoRotate
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                : "bg-slate-900/90 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <Icon name="RefreshCw" className={`size-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            {autoRotate ? "Айналу қосулы" : "Айналу өшірулі"}
          </button>

          <button
            onClick={resetCamera}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name="Expand" className="size-3.5" />
            Бастапқы күй
          </button>
        </div>
      </div>

      {/* R3F 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.8, 5.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 6]} intensity={2.2} castShadow />
        <directionalLight position={[-6, 4, -4]} intensity={1.2} color="#C084FC" />
        <directionalLight position={[0, -5, 4]} intensity={0.8} color="#22D3EE" />

        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#8B5CF6" wireframe />
            </mesh>
          }
        >
          <Center top>
            <CellModel
              selectedOrganelle={selectedOrganelle}
            />
          </Center>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={1.8}
          enablePan={true}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={10}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>

      {/* Bottom Floating Organelle Selector Buttons */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 max-w-full">
          <button
            onClick={() => onSelectOrganelle(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedOrganelle === null
                ? "bg-emerald-500 text-slate-950 font-extrabold"
                : "text-slate-400 hover:text-white bg-slate-800/50"
            }`}
          >
            Барлығы (All)
          </button>
          {ORGANELLES.map((org) => {
            const isSelected = selectedOrganelle?.id === org.id;
            return (
              <button
                key={org.id}
                onClick={() => onSelectOrganelle(isSelected ? null : org)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-950 shadow-lg scale-105"
                    : "text-slate-300 hover:text-white bg-slate-800/40 border border-white/5"
                }`}
              >
                <span
                  className="size-2.5 rounded-full border border-white/20"
                  style={{ backgroundColor: org.color }}
                />
                {org.nameKk.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
