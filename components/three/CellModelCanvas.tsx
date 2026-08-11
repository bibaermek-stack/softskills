"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Organelle metadata and colors for the 13 OBJ meshes in the cross section model
const ORGANELLES_INFO = [
  { id: 0, name: "Жасушалық қабықша (Cell Wall)", color: 0x10b981, desc: "Тығыз целлюлозалық қорғаныс қабықшасы" },
  { id: 1, name: "Цитоплазмалық матрикс", color: 0x6366f1, desc: "Органеллалар орналасқан ішкі сұйық орта" },
  { id: 2, name: "Ядро қабықшасы (Nucleus Envelope)", color: 0xec4899, desc: "Генетикалық ақпаратты қорғайтын қос мембрана" },
  { id: 3, name: "Ядрошық (Nucleolus)", color: 0xa855f7, desc: "Рибосомалық РНҚ синтезделетін орталық" },
  { id: 4, name: "Митохондрия сыртқы мембранасы", color: 0xf59e0b, desc: "АТФ (энергия) синтездеу станциясы" },
  { id: 5, name: "Митохондрия кристалары", color: 0xef4444, desc: "Аэробты тыныс алу кристалары" },
  { id: "6", name: "Эндоплазмалық тор (ER)", color: 0x06b6d4, desc: "Нәруыз бен липидтер тасымалдау торы" },
  { id: 7, name: "Рибосомалар & Везикулалар", color: 0x3b82f6, desc: "Нәруыз биосинтезін орындайтын кешен" },
  { id: 8, name: "Хлоропласт (Chloroplast)", color: 0x84cc16, desc: "Фотосинтез арқылы глюкоза түзуші органелла" },
  { id: 9, name: "Гольджи кешені (Golgi)", color: 0xf97316, desc: "Заттарды сұрыптау және қаптау орталығы" },
  { id: 10, name: "Орталық Вакуоль", color: 0x14b8a6, desc: "Су және қоректік заттар қорын сақтайтын резервуар" },
  { id: 11, name: "Пероксисома & Лизосома", color: 0xeab308, desc: "Органикалық ыдырату ферменттері" },
  { id: 12, name: "Цитоқаңқа (Cytoskeleton)", color: 0x94a3b8, desc: "Жасуша пішінін ұстап тұратын микротүтікшелер" },
];

type OrganelleInfo = (typeof ORGANELLES_INFO)[number];

function isOrganelleInfo(value: unknown): value is OrganelleInfo {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    (typeof value.id === "number" || typeof value.id === "string") &&
    "name" in value &&
    typeof value.name === "string" &&
    "color" in value &&
    typeof value.color === "number" &&
    "desc" in value &&
    typeof value.desc === "string"
  );
}

export function CellModelCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleInfo | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clean container
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 30;
    controls.minDistance = 4;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(10, 20, 15);
    scene.add(mainLight);

    const blueRimLight = new THREE.PointLight(0x38bdf8, 3, 30);
    blueRimLight.position.set(-10, -5, -10);
    scene.add(blueRimLight);

    const purpleGlowLight = new THREE.PointLight(0xa855f7, 2, 25);
    purpleGlowLight.position.set(0, 10, -10);
    scene.add(purpleGlowLight);

    // Load 13 OBJ parts
    const loader = new OBJLoader();
    const cellGroup = new THREE.Group();
    scene.add(cellGroup);

    let loadedCount = 0;

    for (let i = 0; i <= 12; i++) {
      const info = ORGANELLES_INFO[i];
      loader.load(
        `/models/cell/model_${i}.obj`,
        (obj) => {
          const material = new THREE.MeshStandardMaterial({
            color: info.color,
            roughness: 0.3,
            metalness: 0.2,
            side: THREE.DoubleSide,
          });

          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = material;
              mesh.userData = info;
              mesh.geometry.computeVertexNormals();
            }
          });

          cellGroup.add(obj);
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / 13) * 100));

          if (loadedCount === 13) {
            // Auto Center & Scale
            const box = new THREE.Box3().setFromObject(cellGroup);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 8 / maxDim;

            cellGroup.position.sub(center.multiplyScalar(scale));
            cellGroup.scale.set(scale, scale, scale);
          }
        },
        undefined,
        (err) => console.error(`Error loading model_${i}.obj:`, err)
      );
    }

    // Raycaster for clicking organelles
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cellGroup.children, true);

      if (intersects.length > 0) {
        const hitData = intersects[0].object.userData;
        if (isOrganelleInfo(hitData)) {
          setSelectedOrganelle(hitData);
        }
      }
    };

    const domElem = containerRef.current;
    domElem.addEventListener("pointerdown", handlePointerDown);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      cellGroup.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElem.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[32rem] rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Bar Overlay */}
      {loadingProgress < 100 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white z-20">
          <div className="size-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <span className="text-sm font-bold">3D Жасуша Моделі Жүктелуде... ({loadingProgress}%)</span>
          <span className="text-xs text-slate-400 mt-1">Cell - Cross Section (13 Органелла бөлшегі)</span>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute top-4 left-4 z-10 rounded-xl bg-slate-900/80 px-3.5 py-2 text-[0.72rem] text-slate-300 border border-white/10 backdrop-blur-md">
        🖱️ <b>Айналдыру:</b> Тышқанды сүйреу • <b>Үлкейту:</b> Скролл • <b>Шерту:</b> Органелла ақпараты
      </div>

      {/* Selected Organelle Overlay Card */}
      {selectedOrganelle && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-10 rounded-2xl bg-slate-900/95 p-4 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300 border border-emerald-500/30">
              Таңдалған Органелла
            </span>
            <button
              onClick={() => setSelectedOrganelle(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <h3 className="text-sm font-bold text-white mt-1.5">{selectedOrganelle.name}</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedOrganelle.desc}</p>
        </div>
      )}
    </div>
  );
}
