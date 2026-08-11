/**
 * Book model optimisation pipeline.
 *
 * The raw Meshy exports are ~56 MB each: ~2M triangles of unwelded f32 geometry
 * with 2048px JPEG textures. That is unshippable over the wire, so each model is
 * run through weld -> simplify -> texture resize -> WebP -> meshopt quantisation.
 *
 * Meshopt (not Draco) is deliberate: drei's useGLTF bundles the meshopt decoder
 * from three-stdlib, whereas its Draco path downloads a decoder from a Google
 * CDN at runtime. Meshopt keeps the site self-contained.
 *
 *   npm run optimize:models -- <sourceDir>
 *
 * Source models are not kept in the repo; this script is the record of how
 * public/models/*.glb were produced.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  weld,
  simplify,
  resample,
  prune,
  dedup,
  textureCompress,
  meshopt,
} from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'models');

/** Raw model filename (as exported by Meshy) -> stable public slug. */
const NAME_MAP = {
  Meshy_AI_Physics_STEM_Didactic_0807083423_texture: 'book-methodology',
  Meshy_AI_Physics_STEM_Didactic_0807083429_texture: 'book-modules',
  Meshy_AI_Physics_STEM_Didactic_0807083615_texture: 'book-technology',
  Meshy_AI_Physics_STEM_Didactic_0807083657_texture: 'book-research',
};

const SIMPLIFY_RATIO = 0.02; // ~2M tris -> ~40k tris, plenty for a closed book
const SIMPLIFY_ERROR = 0.005;
const TEXTURE_SIZE = 1024;

async function main() {
  const srcDir = process.argv[2];
  if (!srcDir) {
    console.error('usage: node scripts/optimize-models.mjs <sourceDir>');
    process.exit(1);
  }

  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  await mkdir(OUT_DIR, { recursive: true });

  // The meshopt encoder must be registered on the IO itself: the writer resolves
  // it through the dependency map when serialising EXT_meshopt_compression.
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
  });
  const files = (await readdir(srcDir)).filter((f) => f.toLowerCase().endsWith('.glb'));

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const slug = NAME_MAP[base] ?? base.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const src = path.join(srcDir, file);
    const dst = path.join(OUT_DIR, `${slug}.glb`);

    const before = (await stat(src)).size;
    const doc = await io.read(src);

    await doc.transform(
      dedup(),
      resample(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: SIMPLIFY_RATIO, error: SIMPLIFY_ERROR }),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [TEXTURE_SIZE, TEXTURE_SIZE],
        quality: 82,
      }),
      prune({ keepAttributes: false }),
      meshopt({ encoder: MeshoptEncoder, level: 'high' }),
    );

    await io.write(dst, doc);

    const after = (await stat(dst)).size;
    const mb = (n) => (n / 1024 / 1024).toFixed(2);
    console.log(
      `${slug.padEnd(20)} ${mb(before).padStart(7)} MB -> ${mb(after).padStart(6)} MB ` +
        `(${(100 - (after / before) * 100).toFixed(1)}% smaller)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
