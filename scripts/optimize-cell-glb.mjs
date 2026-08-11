import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const src = 'public/models/cell-cross-section.glb';
  const dst = 'public/models/cell-cross-section-opt.glb';

  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
  });

  console.log('Optimizing cell model...');
  const doc = await io.read(src);

  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.2, error: 0.001 }),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' })
  );

  await io.write(dst, doc);
  const before = fs.statSync(src).size / 1024 / 1024;
  const after = fs.statSync(dst).size / 1024 / 1024;
  console.log(`Original: ${before.toFixed(2)} MB -> Optimized: ${after.toFixed(2)} MB`);

  // Replace original with optimized version
  fs.copyFileSync(dst, src);
  fs.unlinkSync(dst);
  console.log('Replaced cell-cross-section.glb with optimized meshopt version!');
}

main().catch(console.error);
