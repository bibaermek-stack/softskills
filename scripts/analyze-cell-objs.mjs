import fs from 'fs';
import path from 'path';

const dir = 'C:/Users/MECHREVO/OneDrive/Downloads/Cell - Cross section(1)';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.obj'));

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  let vCount = 0;
  let fCount = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const line of lines) {
    if (line.startsWith('v ')) {
      vCount++;
      const parts = line.trim().split(/\s+/).slice(1).map(Number);
      if (parts.length >= 3) {
        if (parts[0] < minX) minX = parts[0];
        if (parts[0] > maxX) maxX = parts[0];
        if (parts[1] < minY) minY = parts[1];
        if (parts[1] > maxY) maxY = parts[1];
        if (parts[2] < minZ) minZ = parts[2];
        if (parts[2] > maxZ) maxZ = parts[2];
      }
    } else if (line.startsWith('f ')) {
      fCount++;
    }
  }

  console.log(`${file.padEnd(14)} Verts: ${vCount.toString().padStart(6)} Faces: ${fCount.toString().padStart(6)} | Bounds X: [${minX.toFixed(1)}, ${maxX.toFixed(1)}] Y: [${minY.toFixed(1)}, ${maxY.toFixed(1)}] Z: [${minZ.toFixed(1)}, ${maxZ.toFixed(1)}]`);
}
