import fs from "fs";
import path from "path";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { JSDOM } from "jsdom";

// Setup polyfill for DOM if needed by THREE
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.self = global.window;
global.THREE = THREE;

const modelsDir = path.resolve("public/models/cell");
const outputGlb = path.resolve("public/models/cell.glb");

// Curated Vibrant Biological Organelle Palette
const ORGANELLE_COLORS = [
  0x10b981, // 0: Cell Membrane / Wall (Emerald Green)
  0x6366f1, // 1: Cytoplasm / Matrix (Indigo)
  0xec4899, // 2: Nucleus Outer (Pink)
  0xa855f7, // 3: Nucleolus Core (Purple)
  0xf59e0b, // 4: Mitochondria Outer (Amber)
  0xef4444, // 5: Mitochondria Inner Cristae (Red)
  0x06b6d4, // 6: Endoplasmic Reticulum (Cyan)
  0x3b82f6, // 7: Ribosomes / Vesicles (Blue)
  0x84cc16, // 8: Chloroplast / Plastid (Lime)
  0xf97316, // 9: Golgi Apparatus (Orange)
  0x14b8a6, // 10: Vacuole Membrane (Teal)
  0xeab308, // 11: Peroxisome / Lysosome (Yellow)
  0x64748b, // 12: Cytoskeleton / Microtubules (Slate)
];

async function main() {
  console.log("Loading OBJ files from:", modelsDir);
  const scene = new THREE.Scene();
  const loader = new OBJLoader();

  for (let i = 0; i <= 12; i++) {
    const filePath = path.join(modelsDir, `model_${i}.obj`);
    if (!fs.existsSync(filePath)) {
      console.warn(`File model_${i}.obj not found, skipping.`);
      continue;
    }

    const objContent = fs.readFileSync(filePath, "utf8");
    const group = loader.parse(objContent);

    const colorHex = ORGANELLE_COLORS[i % ORGANELLE_COLORS.length];
    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    group.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.geometry.computeVertexNormals();
      }
    });

    group.name = `organelle_${i}`;
    scene.add(group);
    console.log(`Loaded model_${i}.obj into organelle_${i} with color 0x${colorHex.toString(16)}`);
  }

  // Center & auto-scale scene
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 5 / maxDim;

  scene.position.sub(center.multiplyScalar(scale));
  scene.scale.set(scale, scale, scale);

  console.log("Exporting scene to GLB...");
  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    (gltf) => {
      if (gltf instanceof ArrayBuffer) {
        fs.writeFileSync(outputGlb, Buffer.from(gltf));
        console.log(`✅ Successfully generated public/models/cell.glb (${(fs.statSync(outputGlb).size / 1024 / 1024).toFixed(2)} MB)!`);
      } else {
        const jsonString = JSON.stringify(gltf, null, 2);
        fs.writeFileSync(path.resolve("public/models/cell.gltf"), jsonString);
        console.log("Exported as GLTF JSON.");
      }
    },
    (err) => console.error("Export error:", err),
    { binary: true }
  );
}

main().catch(console.error);
