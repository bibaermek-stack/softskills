import os
import glob
import trimesh
import numpy as np

src_dir = r"C:\Users\MECHREVO\OneDrive\Downloads\Cell - Cross section(1)"
dst_file = r"C:\Users\MECHREVO\OneDrive\Desktop\dashboard\public\models\cell-cross-section.glb"

# Color mappings to match the user's reference image perfectly
COLOR_MAP = {
    "model_0.obj":  [139, 92, 246, 255],   # Outer Cell Wall - Deep Violet (#8B5CF6)
    "model_1.obj":  [192, 132, 252, 255],  # Inner ER folds - Light Magenta-Purple (#C084FC)
    "model_2.obj":  [162, 28, 175, 255],   # ER tubules - Rich Purple (#A21CAF)
    "model_3.obj":  [236, 72, 153, 255],   # Nucleolus Core - Vibrant Pink (#EC4899)
    "model_4.obj":  [244, 114, 182, 255],  # Nuclear envelope inner - Soft Pink (#F472B6)
    "model_5.obj":  [253, 224, 71, 255],   # Nuclear pore / stripes - Gold Yellow (#FDE047)
    "model_6.obj":  [34, 211, 238, 255],   # Mitochondria - Bright Cyan (#22D3EE)
    "model_7.obj":  [234, 179, 8, 255],    # Golgi apparatus - Bright Yellow (#EAB308)
    "model_8.obj":  [249, 115, 22, 255],   # Ribosomes / granules - Orange (#F97316)
    "model_9.obj":  [6, 182, 212, 255],    # Cytoplasmic vesicles - Turquoise Cyan (#06B6D4)
    "model_10.obj": [59, 130, 246, 255],   # Peroxisomes - Royal Blue (#3B82F6)
    "model_11.obj": [200, 205, 215, 255],  # Metallic Stand Base - Silver Chrome (#C8CDD7)
    "model_12.obj": [126, 66, 214, 255],   # Cytoplasm Body - Rich Violet (#7E42D6)
}

scene = trimesh.Scene()

for filename, rgba in COLOR_MAP.items():
    filepath = os.path.join(src_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping missing {filename}")
        continue
    
    mesh = trimesh.load(filepath)
    if isinstance(mesh, trimesh.Scene):
        mesh = mesh.dump(concatenate=True)
    
    # Assign vertex colors and PBR material properties
    colors = np.full((len(mesh.vertices), 4), rgba, dtype=np.uint8)
    mesh.visual.vertex_colors = colors

    # Metalness for the stand base
    is_metal = (filename == "model_11.obj")
    material = trimesh.visual.material.PBRMaterial(
        name=filename.replace('.obj', ''),
        baseColorFactor=[c / 255.0 for c in rgba],
        metallicFactor=0.9 if is_metal else 0.1,
        roughnessFactor=0.2 if is_metal else 0.4
    )
    mesh.visual.material = material
    
    node_name = filename.replace('.obj', '')
    scene.add_geometry(mesh, node_name=node_name)
    print(f"Added {filename} ({len(mesh.vertices)} verts, {len(mesh.faces)} faces)")

os.makedirs(os.path.dirname(dst_file), exist_ok=True)
glb_data = scene.export(file_type='glb')
with open(dst_file, 'wb') as f:
    f.write(glb_data)

size_mb = os.path.getsize(dst_file) / (1024 * 1024)
print(f"\nSUCCESS! Exported combined GLB to: {dst_file} ({size_mb:.2f} MB)")
