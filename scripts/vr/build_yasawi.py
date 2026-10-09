"""STL (Ясауи кесенесі) -> public/vr/models/yasawi.bin

Қолдану: python3 scripts/vr/build_yasawi.py <model.stl> public/vr/models/yasawi.bin
Қажет: numpy.

Бинар STL-дің төбелерін біріктіреді, үшбұрыштарды материал топтарына
бөледі (кірпіш, баннаи қабырға, шатыр, күмбездер, барабандар, ағаш,
күңгірт ойықтар), өлшемді метрге келтіріп, uint16-ға квантайды.

Пішім (little-endian):
  'YSW1' | uint32 jsonLen | JSON (бос орынмен 4-ке толтырылған)
  | uint16 positions[nVerts*3] | (4-ке туралау) | индекстер (әр топ үшін uint16 не uint32)
"""
import json, struct, sys
import numpy as np
from collections import Counter

SCALE = 0.25  # модель бірлігі -> метр

src, dst = sys.argv[1], sys.argv[2]
d = open(src, 'rb').read()
n = struct.unpack('<I', d[80:84])[0]
rec = np.frombuffer(d[84:84 + 50 * n], dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]))
v = rec['v'].reshape(-1, 3).astype(np.float64)
v = np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1)  # Z-жоғары -> Y-жоғары
q = np.round(v / 1e-3).astype(np.int64)
uniq, inv = np.unique(q, axis=0, return_inverse=True)
T = inv.reshape(-1, 3)
P = uniq * 1e-3

# Байланысқан бөліктер (union-find).
parent = np.arange(len(P))
def find(x):
    r = x
    while parent[r] != r:
        r = parent[r]
    while parent[x] != r:
        parent[x], x = r, parent[x]
    return r
for t in T:
    a, b, c = find(t[0]), find(t[1]), find(t[2])
    parent[b] = a
    parent[find(c)] = a
root = np.array([find(i) for i in range(len(P))])
comp = root[T[:, 0]]
order = [c for c, _ in Counter(comp).most_common()]
rank = {c: i for i, c in enumerate(order)}
cr = np.array([rank[c] for c in comp])

A, B, C = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
N = np.cross(B - A, C - A)
N /= np.maximum(np.linalg.norm(N, axis=1), 1e-12)[:, None]
ny = N[:, 1]

def bbox(rk):
    idx = np.unique(T[cr == rk])
    return P[idx].min(0), P[idx].max(0)

def centre_of(rk):
    mn, mx = bbox(rk)
    return [float((mn[0] + mx[0]) / 2), float((mn[2] + mx[2]) / 2)]

# Бөліктерді рөліне қарай анықтау (өлшемдері талдау кезінде тексерілген).
RIBBED, PORTAL, SMALLDOME, TOWER_A, TOWER_B, BIGDOME, BODY = 0, 1, 2, 3, 4, 5, 6
def find_rank(pred):
    for rk in range(len(order)):
        mn, mx = bbox(rk)
        if pred(mn, mx, int((cr == rk).sum())):
            return rk
    raise SystemExit('component not found')
DRUM_RIB = find_rank(lambda mn, mx, k: 500 < k < 700 and mx[1] > 95 and mn[1] > 60)
OCT_BASE = find_rank(lambda mn, mx, k: 200 < k < 300 and (mx - mn)[0] > 80)
BIG_RING = find_rank(lambda mn, mx, k: 30 < k < 60 and mn[1] > 90)

mat = np.full(len(T), 'brick', dtype=object)
up = ny > 0.75
vert = np.abs(ny) < 0.35
mat[up] = 'roof'
mat[cr == RIBBED] = 'ribbedDome'
mat[cr == BIGDOME] = 'bigDome'
mat[(cr == DRUM_RIB) & vert] = 'drumRibbed'
mat[(cr == BIG_RING) & vert] = 'drumBig'
mat[(cr == BODY) & vert] = 'bannai'
mat[(cr == OCT_BASE) & vert] = 'bannai'
for rk in range(len(order)):
    k = int((cr == rk).sum())
    mn, mx = bbox(rk)
    dims = mx - mn
    if k == 24 and dims.min() < 3 and dims.max() > 5:
        mat[cr == rk] = 'wood'                # құрылыс арқалықтары
    elif k == 192 and dims[2] < 0.5:
        mat[cr == rk] = 'door'                # қуыс түбіндегі есік
    elif k <= 14 and dims.min() < 0.2:
        mat[cr == rk] = 'dark'                # жалпақ ойықтар, терезелер

# Метрге келтіріп, табанды жерге, ортаны XZ бойынша 0-ге қою.
Pm = P * SCALE
mn_all = Pm.min(0)
mx_all = Pm.max(0)
shift = np.array([-(mn_all[0] + mx_all[0]) / 2, 0.0, -(mn_all[2] + mx_all[2]) / 2])
Pm = Pm + shift
lo = Pm.min(0)
hi = Pm.max(0)

CYL = {
    'ribbedDome': centre_of(RIBBED),
    'bigDome': centre_of(BIGDOME),
    'drumRibbed': centre_of(DRUM_RIB),
    'drumBig': centre_of(BIGDOME),
}
groups = []
pos_chunks = []
idx_chunks = []
v_total = 0
for name in ['brick', 'bannai', 'roof', 'bigDome', 'ribbedDome', 'drumRibbed', 'drumBig', 'wood', 'door', 'dark']:
    sel = np.where(mat == name)[0]
    if len(sel) == 0:
        continue
    tri = T[sel]
    used, local = np.unique(tri.reshape(-1), return_inverse=True)
    local = local.reshape(-1, 3)
    wide = len(used) > 65535
    g = {'mat': name, 'vStart': v_total, 'vCount': int(len(used)), 'iCount': int(local.size), 'i32': wide}
    if name in CYL:
        c = CYL[name]
        g['centre'] = [float(c[0] * SCALE + shift[0]), float(c[1] * SCALE + shift[2])]
    groups.append(g)
    pos_chunks.append(Pm[used])
    idx_chunks.append(local.astype('<u4' if wide else '<u2'))
    v_total += len(used)

pos = np.concatenate(pos_chunks)
qpos = np.round((pos - lo) / (hi - lo) * 65535).astype('<u2')
head = {'min': lo.tolist(), 'max': hi.tolist(), 'groups': groups, 'nVerts': int(v_total)}

def align4(n):
    return n + (4 - n % 4) % 4

# Индекс блоктарының ығысулары тақырыптың өз ұзындығына тәуелді:
# мәндер тұрақталғанша тақырыпты қайта есептейміз.
for g in groups:
    g['iOffset'] = 0
for _ in range(8):
    hj = json.dumps(head, ensure_ascii=False).encode('utf-8')
    o = align4(8 + align4(len(hj)) + qpos.nbytes)
    changed = False
    for g, ic in zip(groups, idx_chunks):
        if g['iOffset'] != o:
            g['iOffset'] = o
            changed = True
        o = align4(o + ic.nbytes)
    if not changed:
        break
hj = json.dumps(head, ensure_ascii=False).encode('utf-8')
hj += b' ' * ((4 - len(hj) % 4) % 4)
out = bytearray(b'YSW1' + struct.pack('<I', len(hj)) + hj)
out += qpos.tobytes()
out += b'\0' * ((4 - len(out) % 4) % 4)
for g, ic in zip(groups, idx_chunks):
    assert len(out) == g['iOffset'], (len(out), g['iOffset'])
    out += ic.tobytes()
    out += b'\0' * ((4 - len(out) % 4) % 4)
open(dst, 'wb').write(out)
print('size', len(out), 'verts', v_total, 'extent m', np.round(hi - lo, 2))
for g in groups:
    print(' ', g['mat'], g['vCount'], g['iCount'] // 3, g.get('centre'))
