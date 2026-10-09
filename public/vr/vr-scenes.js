/* global AFRAME, THREE */
/**
 * STEM VR тренажерінің 3D сахналары.
 *
 * Бұрын сахналар бір TSX файлдың ішіндегі жолмен жасалып, барлық модель
 * қарапайым пішіндерден (қорап, цилиндр, шар) және бір түсті материалдардан
 * тұратын. Мұнда модельдер шынайы пішінмен (жону, экструзия, фаска),
 * PBR материалдармен және нақты текстуралармен жасалады:
 *
 *   - жарық пен шағылысу HDR карталарынан алынады (Poly Haven, CC0);
 *   - планеталар NASA карталарымен жабылған (NASA 3D Resources);
 *   - кірпіш, плитка, тақтай, картон сияқты беттер процедуралық түрде
 *     түс, кедір-бұдыр (roughness) және нормаль карталарымен салынады;
 *   - оптикадағы сәулелер Снеллиус заңы мен шынының дисперсиясы бойынша
 *     нақты есептеледі.
 *
 * Әр сахна — бір A-Frame компоненті. Басылатын нысандар tagObject арқылы
 * белгіленеді; басу ата-панелге VR_INTERACTION және TASK_PROGRESS
 * хабарларын жібереді (VRSimulator.tsx сол хабарларды тыңдайды).
 */
(function () {
  'use strict';

  const BASE = (function () {
    const src = document.currentScript && document.currentScript.src;
    return src ? src.slice(0, src.lastIndexOf('/') + 1) : '/vr/';
  })();
  const asset = (p) => BASE + p;

  /* ================================================================== *\
     1. Кездейсоқтық, шу және канвас текстуралары
  \* ================================================================== */

  /** Тұқымы бар кездейсоқ сан: текстуралар әр жүктеуде бірдей шығады. */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Периодты мәндік шу: текстура шетінде жік қалмайды. */
  function makeNoise(seed) {
    const r = rng(seed);
    const N = 256;
    const vals = new Float32Array(N * N);
    for (let i = 0; i < vals.length; i++) vals[i] = r();
    const lattice = (x, y, p) => {
      // Период бүтін болуы керек: әйтпесе индекс бөлшек сан болып, NaN береді.
      const P = Math.max(1, Math.round(p));
      const xi = ((x % P) + P) % P;
      const yi = ((y % P) + P) % P;
      return vals[(yi % N) * N + (xi % N)];
    };
    const smooth = (t) => t * t * (3 - 2 * t);
    function noise(x, y, period) {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = smooth(x - x0);
      const fy = smooth(y - y0);
      const a = lattice(x0, y0, period);
      const b = lattice(x0 + 1, y0, period);
      const c = lattice(x0, y0 + 1, period);
      const d = lattice(x0 + 1, y0 + 1, period);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
    return function fbm(x, y, period, octaves) {
      let sum = 0;
      let amp = 0.5;
      let p = period;
      let f = 1;
      for (let o = 0; o < (octaves || 4); o++) {
        sum += amp * noise(x * f, y * f, p);
        amp *= 0.5;
        f *= 2;
        p *= 2;
      }
      return sum;
    };
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /** Мәтінді берілген енге сыйғызу: қаріп өлшемі біртіндеп кішірейеді. */
  function fitText(ctx, text, x, y, maxWidth, size, weight) {
    let px = size;
    const family = '"Segoe UI", Roboto, Arial, sans-serif';
    do {
      ctx.font = (weight || '') + ' ' + px + 'px ' + family;
      if (ctx.measureText(text).width <= maxWidth) break;
      px -= 1;
    } while (px > 8);
    ctx.fillText(text, x, y);
  }

  /**
   * Канвасты текстураға айналдыру. Түс карталары sRGB кеңістігінде,
   * ал нормаль мен кедір-бұдыр карталары сызықтық кеңістікте оқылады.
   */
  function canvasTexture(c, opts) {
    const o = opts || {};
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
    t.anisotropy = 8;
    return t;
  }

  /**
   * Биіктік өрісінен нормаль картасын жасау (OpenGL пішімі, Y жоғары).
   * Канвастың жоғарғы жолы текстураның v = 1 жағына түседі, сондықтан
   * тік градиенттің таңбасы ауысады.
   */
  function normalFromHeight(height, w, h, strength) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const at = (x, y) => height[((y + h) % h) * w + ((x + w) % w)];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5 * strength;
        const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5 * strength;
        let nx = -dx;
        let ny = dy;
        let nz = 1;
        const len = Math.hypot(nx, ny, nz);
        nx /= len;
        ny /= len;
        nz /= len;
        const i = (y * w + x) * 4;
        img.data[i] = (nx * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /** Сұр реңкті өрістен (0..1) канвас — кедір-бұдыр не металдық карта. */
  function grayCanvas(field, w, h) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = Math.max(0, Math.min(255, field[i] * 255));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /**
   * Үлкен жазық беттерге арналған UV: әр жақ өз нормаліне перпендикуляр
   * жазықтыққа проекцияланады да, текстура метрмен өлшенеді. Сонда кірпіш
   * немесе плитка қабырғаның өлшеміне қарамай бірдей көлемде шығады.
   */
  function worldUV(geometry, metersPerTile) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    g.computeVertexNormals();
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const uv = new Float32Array(pos.count * 2);
    const s = 1 / metersPerTile;
    for (let i = 0; i < pos.count; i += 3) {
      // Үшбұрыштың орташа нормалі бойынша бір проекция таңдалады —
      // бір жақтың үш төбесі бір жазықтыққа түсуі үшін.
      const nx = Math.abs(nor.getX(i) + nor.getX(i + 1) + nor.getX(i + 2));
      const ny = Math.abs(nor.getY(i) + nor.getY(i + 1) + nor.getY(i + 2));
      const nz = Math.abs(nor.getZ(i) + nor.getZ(i + 1) + nor.getZ(i + 2));
      for (let k = 0; k < 3; k++) {
        const j = i + k;
        let u;
        let v;
        if (nx >= ny && nx >= nz) {
          u = pos.getZ(j);
          v = pos.getY(j);
        } else if (ny >= nx && ny >= nz) {
          u = pos.getX(j);
          v = pos.getZ(j);
        } else {
          u = pos.getX(j);
          v = pos.getY(j);
        }
        uv[j * 2] = u * s;
        uv[j * 2 + 1] = v * s;
      }
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }

  /** Жиегі жұмсартылған қорап — нақты бұйымдардың қыры ешқашан өткір емес. */
  function roundedBox(w, h, d, r, seg) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    const rr = Math.min(r, w / 2, h / 2);
    s.moveTo(x + rr, y);
    s.lineTo(x + w - rr, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rr);
    s.lineTo(x + w, y + h - rr);
    s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    s.lineTo(x + rr, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rr);
    s.lineTo(x, y + rr);
    s.quadraticCurveTo(x, y, x + rr, y);
    const bevel = Math.min(r, d / 2) * 0.9;
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(0.0001, d - bevel * 2),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.6,
      bevelSegments: seg || 3,
      curveSegments: seg || 4
    });
    geo.translate(0, 0, -(d - bevel * 2) / 2);
    return geo;
  }

  /** Профильден жону (токарлық) арқылы айналмалы дене: [[r, y], ...]. */
  function lathe(profile, segments) {
    const pts = profile.map((p) => new THREE.Vector2(p[0], p[1]));
    const geo = new THREE.LatheGeometry(pts, segments || 48);
    geo.computeVertexNormals();
    return geo;
  }

  /** Нысанды сәулемен табуға қатыспайтын ету — тек басылатындар қалады. */
  function inert(obj) {
    obj.traverse((o) => {
      if (o.isMesh || o.isPoints || o.isLine || o.isSprite) o.raycast = () => {};
    });
    return obj;
  }

  function shadow(obj, cast, receive) {
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = cast !== false;
        o.receiveShadow = receive !== false;
      }
    });
    return obj;
  }

  /* ================================================================== *\
     2. HDR (Radiance RGBE) оқу және шағылысу ортасы
  \* ================================================================== */

  /** .hdr файлын жартылай float RGBA текстураға айналдыру. */
  function parseRGBE(buffer, clampLum) {
    const bytes = new Uint8Array(buffer);
    let pos = 0;
    const readLine = () => {
      let s = '';
      while (pos < bytes.length) {
        const c = bytes[pos++];
        if (c === 10) break;
        s += String.fromCharCode(c);
      }
      return s;
    };
    if (!readLine().startsWith('#?')) throw new Error('RGBE емес файл');
    while (readLine() !== '') { /* тақырып жолдары */ }
    const res = readLine().split(/\s+/);
    const height = parseInt(res[1], 10);
    const width = parseInt(res[3], 10);
    const rgbe = new Uint8Array(width * height * 4);
    const scan = new Uint8Array(width * 4);
    for (let y = 0; y < height; y++) {
      const rle = width >= 8 && width < 32768 && bytes[pos] === 2 && bytes[pos + 1] === 2 &&
        ((bytes[pos + 2] << 8) | bytes[pos + 3]) === width;
      if (rle) {
        pos += 4;
        for (let c = 0; c < 4; c++) {
          let x = 0;
          while (x < width) {
            let n = bytes[pos++];
            if (n > 128) {
              n -= 128;
              const v = bytes[pos++];
              for (let k = 0; k < n; k++) scan[(x + k) * 4 + c] = v;
            } else {
              for (let k = 0; k < n; k++) scan[(x + k) * 4 + c] = bytes[pos++];
            }
            x += n;
          }
        }
        rgbe.set(scan, y * width * 4);
      } else {
        rgbe.set(bytes.subarray(pos, pos + width * 4), y * width * 4);
        pos += width * 4;
      }
    }
    const half = new Uint16Array(width * height * 4);
    const toHalf = THREE.DataUtils.toHalfFloat;
    let sunIdx = 0;
    let sunLum = -1;
    for (let i = 0; i < width * height; i++) {
      const e = rgbe[i * 4 + 3];
      const f = e ? Math.pow(2, e - 136) : 0;
      let r = rgbe[i * 4] * f;
      let g = rgbe[i * 4 + 1] * f;
      let b = rgbe[i * 4 + 2] * f;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum > sunLum) {
        sunLum = lum;
        sunIdx = i;
      }
      // Күнді сахнадағы бағытталған жарық береді: HDR ішіндегі күн дискісі
      // қиылмаса, ол екінші рет жарық қосып, жылтыр беттерде екінші «күн» шағылар еді.
      if (clampLum && lum > clampLum) {
        const k = clampLum / lum;
        r *= k;
        g *= k;
        b *= k;
      }
      half[i * 4] = toHalf(Math.min(r, 65000));
      half[i * 4 + 1] = toHalf(Math.min(g, 65000));
      half[i * 4 + 2] = toHalf(Math.min(b, 65000));
      half[i * 4 + 3] = toHalf(1);
    }
    const tex = new THREE.DataTexture(half, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    tex.flipY = true;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.needsUpdate = true;
    // Ең жарық пиксель — күннің бағыты. Сахнадағы көлеңке түсіретін
    // жарықты сол бағытқа қою үшін керек (three.js equirect пішімі).
    const sx = sunIdx % width;
    const sy = Math.floor(sunIdx / width);
    const u = (sx + 0.5) / width;
    const v = 1 - (sy + 0.5) / height;
    const lat = (v - 0.5) * Math.PI;
    const lon = (u - 0.5) * 2 * Math.PI;
    tex.userData.sunDirection = new THREE.Vector3(
      Math.cos(lon) * Math.cos(lat),
      Math.sin(lat),
      Math.sin(lon) * Math.cos(lat)
    ).normalize();
    return tex;
  }

  function loadHDR(url, clampLum) {
    return fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(url + ' ' + r.status);
        return r.arrayBuffer();
      })
      .then((buf) => parseRGBE(buf, clampLum));
  }

  /** Сахнаға HDR шағылысу ортасын беру (PMREM арқылы сүзілген). */
  function applyEnvironment(sceneEl, hdrTexture, opts) {
    const o = opts || {};
    const pmrem = new THREE.PMREMGenerator(sceneEl.renderer);
    const env = pmrem.fromEquirectangular(hdrTexture).texture;
    pmrem.dispose();
    const scene = sceneEl.object3D;
    scene.environment = env;
    if ('environmentIntensity' in scene) scene.environmentIntensity = o.intensity == null ? 1 : o.intensity;
    // HDR-дегі күннің азимутын сахнадағы күн бағытына бұру.
    if (o.alignSun && scene.environmentRotation && hdrTexture.userData.sunDirection) {
      const a = hdrTexture.userData.sunDirection;
      const want = Math.atan2(o.alignSun.z, o.alignSun.x);
      const have = Math.atan2(a.z, a.x);
      scene.environmentRotation.y = have - want;
    }
    if (o.background) {
      scene.background = hdrTexture;
      if ('backgroundBlurriness' in scene) scene.backgroundBlurriness = o.blur || 0;
    }
    return env;
  }

  const textureLoader = new THREE.TextureLoader();
  /** Сурет текстурасын жүктеу; түс картасы ма, дерек картасы ма — opts.data. */
  function loadTexture(path, opts) {
    const o = opts || {};
    const t = textureLoader.load(asset(path));
    t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  /* ================================================================== *\
     3. Нысанды тану, тапсырмалар және ата-панельмен байланыс
  \* ================================================================== */

  function tagObject(object, label, info, taskId, onSelect) {
    object.userData = Object.assign(object.userData || {}, {
      label: label,
      info: info,
      taskId: taskId,
      onSelect: onSelect
    });
    return object;
  }

  function findTagged(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.label) return node;
      node = node.parent;
    }
    return null;
  }

  function report(label, info, taskId) {
    const hud = document.getElementById('hud-text');
    if (hud) hud.textContent = label + ' — ' + info;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'VR_INTERACTION', info: label + ' — ' + info }, '*');
      if (taskId) window.parent.postMessage({ type: 'TASK_PROGRESS', taskId: taskId }, '*');
    }
  }

  /** Сахнаға бір ортақ басу тыңдаушысы. Бос басу тапсырманы жаппайды. */
  function bindPicking(el) {
    el.addEventListener('click', (e) => {
      const hit = e.detail && e.detail.intersection && e.detail.intersection.object;
      const target = hit ? findTagged(hit) : null;
      if (!target) return;
      const data = target.userData;
      let info = data.info;
      if (typeof data.onSelect === 'function') {
        const extra = data.onSelect(target);
        if (typeof extra === 'string') info = extra;
      }
      report(data.label, info, data.taskId);
    });
  }

  /** Сахна дайын болғанда жүктеу экранын жасыру. */
  function sceneReady() {
    const el = document.getElementById('loading');
    if (el) el.classList.add('done');
  }

  /* ================================================================== *\
     4. Қайта қолданылатын материалдар мен бөлшектер
  \* ================================================================== */

  /** Таттанбайтын болаттың щеткамен өңделген беті (кедір-бұдыр картасымен). */
  function brushedMetalMaps(seed, w, h) {
    // Щетка іздері өте жіңішке әрі әлсіз: тек кедір-бұдырдың аздаған
    // айырмасы. Күшті жолақтар текстура қайталанғанда жолақ-жолақ көрінеді.
    const r = rng(seed);
    const fbm = makeNoise(seed + 7);
    const field = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = (r() - 0.5) * 0.025;
      for (let x = 0; x < w; x++) {
        field[y * w + x] = 0.36 + row + (fbm(x / 32, y / 2, w / 32, 3) - 0.5) * 0.05;
      }
    }
    return field;
  }

  /** Анодталған алюминий, болат, резеңке сияқты жиі қолданылатын материалдар. */
  function standardMaterials() {
    return {
      blackAnodized: new THREE.MeshStandardMaterial({ color: 0x111316, metalness: 0.85, roughness: 0.42 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xc8cdd2, metalness: 1, roughness: 0.28 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.06 }),
      aluminium: new THREE.MeshStandardMaterial({ color: 0xd4d7da, metalness: 1, roughness: 0.35 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0, roughness: 0.92 }),
      blackPlastic: new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0, roughness: 0.55 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xc9a34e, metalness: 1, roughness: 0.3 })
    };
  }

  /** Оптикалық тірек: негіз-табан, тірек ұстағышы және болат білік (Ø12,7 мм). */
  function opticalPost(mats, height) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(roundedBox(0.06, 0.012, 0.03, 0.003), mats.blackAnodized);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.006;
    g.add(base);
    const holderH = height * 0.55;
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, holderH, 32), mats.blackAnodized);
    holder.position.y = 0.012 + holderH / 2;
    g.add(holder);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 12), mats.steel);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0.016, 0.012 + holderH * 0.7, 0);
    g.add(knob);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.00635, 0.00635, height - 0.012, 24), mats.steel);
    post.position.y = 0.012 + (height - 0.012) / 2;
    g.add(post);
    return g;
  }

  /** Қабырғаға ілінетін ақпарат тақтасы (канвасқа салынған мәтін). */
  function infoBoard(title, lines, opts) {
    const o = opts || {};
    const W = 1024;
    const H = Math.round(W * (o.aspect || 0.62));
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = o.paper || '#f4f2ec';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = o.accent || '#1f3a5f';
    ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#ffffff';
    fitText(ctx, title, 44, 80, W - 88, 50, 'bold');
    ctx.fillStyle = o.ink || '#1d2433';
    // Барлық жол бір өлшеммен жазылады: ең ұзын жолға сыятын өлшем алынады.
    let px = 38;
    const weight = o.weight ? o.weight + ' ' : '';
    ctx.font = weight + px + 'px "Segoe UI", Roboto, Arial, sans-serif';
    while (px > 12 && lines.some((l) => ctx.measureText(l).width > W - 100)) {
      px -= 1;
      ctx.font = weight + px + 'px "Segoe UI", Roboto, Arial, sans-serif';
    }
    const step = Math.min(66, (H - 190) / Math.max(1, lines.length));
    lines.forEach((line, i) => ctx.fillText(line, 50, 200 + i * step));
    const tex = canvasTexture(c, { clamp: true });
    const w = o.width || 1.2;
    const h = w * (H / W);
    const g = new THREE.Group();
    const frame = new THREE.Mesh(
      roundedBox(w + 0.04, h + 0.04, 0.025, 0.006),
      new THREE.MeshStandardMaterial({ color: o.frame || 0x9aa1a8, metalness: 1, roughness: 0.4 })
    );
    g.add(frame);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      o.selfLit
        ? new THREE.MeshBasicMaterial({ map: tex, color: 0xd0d0d0 })
        : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0 })
    );
    face.position.z = 0.0135;
    g.add(face);
    return g;
  }

  /** Толқын ұзындығынан (нм) сызықтық RGB — CIE 1931 аналитикалық жуықтауы. */
  function wavelengthToRGB(nm) {
    const g = (x, mu, s1, s2) => {
      const t = (x - mu) / (x < mu ? s1 : s2);
      return Math.exp(-0.5 * t * t);
    };
    const X = 1.056 * g(nm, 599.8, 37.9, 31.0) + 0.362 * g(nm, 442.0, 16.0, 26.7) - 0.065 * g(nm, 501.1, 20.4, 26.2);
    const Y = 0.821 * g(nm, 568.8, 46.9, 40.5) + 0.286 * g(nm, 530.9, 16.3, 31.1);
    const Z = 1.217 * g(nm, 437.0, 11.8, 36.0) + 0.681 * g(nm, 459.0, 26.0, 13.8);
    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    let gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
    // Монитор көрсете алмайтын қаныққан түстерді ақшылдау арқылы шекке келтіру.
    const m = Math.min(r, gg, b);
    if (m < 0) {
      r -= m;
      gg -= m;
      b -= m;
    }
    const mx = Math.max(r, gg, b, 1e-6);
    return new THREE.Color(r / mx, gg / mx, b / mx);
  }

  /** Жұмсақ дөңгелек жарқыл (күн, лазер нүктесі, шамдар үшін). */
  function glowSprite(color, size, opacity) {
    const c = makeCanvas(128, 128);
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    const mat = new THREE.SpriteMaterial({
      map: canvasTexture(c, { clamp: true }),
      color: color,
      transparent: true,
      opacity: opacity == null ? 1 : opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    return s;
  }

  const UP = new THREE.Vector3(0, 1, 0);

  /* ================================================================== *\
     5. Оптика зертханасы: ақ жарықтың призмадағы дисперсиясы
  \* ================================================================== */

  /**
   * N-SF11 ауыр флинт шынысының сыну көрсеткіші (Коши формуласы, λ — мкм).
   * Спектроскопиялық дисперсиялық призмалар осы шыныдан жасалады.
   * n_C = 1,7760, n_d = 1,7847, n_F = 1,8065 — каталог мәндерімен сәйкес.
   */
  const nFlint = (nm) => 1.73897 + 0.015944 / Math.pow(nm / 1000, 2);

  /**
   * Жазықтықтағы (x, z) сәуле трассировкасы: призма үшбұрышымен қиылысу,
   * Снеллиус заңы бойынша сыну, толық ішкі шағылу. Нәтиже — кесінділер,
   * шығатын нүкте мен бағыт, кіру бетіндегі шағылған сәуле.
   */
  function tracePrism(origin, dir, verts, n) {
    let p = origin.clone();
    let d = dir.clone().normalize();
    let inside = false;
    const segs = [];
    let reflected = null;
    const cx = (verts[0].x + verts[1].x + verts[2].x) / 3;
    const cz = (verts[0].y + verts[1].y + verts[2].y) / 3;
    for (let k = 0; k < 8; k++) {
      let best = null;
      for (let e = 0; e < 3; e++) {
        const a = verts[e];
        const b = verts[(e + 1) % 3];
        const ex = b.x - a.x;
        const ez = b.y - a.y;
        const den = d.x * ez - d.y * ex;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((a.x - p.x) * ez - (a.y - p.y) * ex) / den;
        const s = ((a.x - p.x) * d.y - (a.y - p.y) * d.x) / den;
        if (t > 1e-7 && s >= 0 && s <= 1 && (!best || t < best.t)) best = { t: t, ex: ex, ez: ez, a: a };
      }
      if (!best) break;
      const q = new THREE.Vector2(p.x + d.x * best.t, p.y + d.y * best.t);
      segs.push({ a: p.clone(), b: q.clone(), inside: inside });
      let N = new THREE.Vector2(best.ez, -best.ex).normalize();
      if ((best.a.x - cx) * N.x + (best.a.y - cz) * N.y < 0) N.negate();
      if (d.dot(N) > 0) N.negate();
      const cosi = -d.dot(N);
      const eta = inside ? n : 1 / n;
      const k2 = 1 - eta * eta * (1 - cosi * cosi);
      const refl = d.clone().addScaledVector(N, 2 * cosi);
      if (k2 < 0) {
        d = refl;
        p = q;
        continue;
      }
      if (!inside && k === 0) reflected = { from: q.clone(), dir: refl };
      d = d.multiplyScalar(eta).addScaledVector(N, eta * cosi - Math.sqrt(k2)).normalize();
      p = q;
      inside = !inside;
      if (!inside) return { segs: segs, exit: p, dir: d, reflected: reflected, exited: true };
    }
    return { segs: segs, exit: p, dir: d, reflected: reflected, exited: false };
  }

  function buildPhysics(el) {
    const root = new THREE.Group();
    const mats = standardMaterials();
    const TABLE_Y = 0.85;
    const BEAM_Y = TABLE_Y + 0.11;

    /* ---- Бөлме: винил еден, күңгірт қабырғалар, LED панельдер ---- */
    const room = new THREE.Group();
    {
      const S = 512;
      const fbm = makeNoise(11);
      const r = rng(12);
      const c = makeCanvas(S, S);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(S, S);
      const h = new Float32Array(S * S);
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const tileShade = ((x < S / 2) !== (y < S / 2)) ? 0.03 : 0;
          const v = 0.62 + (fbm(x / 64, y / 64, 8, 4) - 0.5) * 0.12 + (r() - 0.5) * 0.05 + tileShade;
          const joint = (x % (S / 2) < 2 || y % (S / 2) < 2) ? 0.45 : 1;
          const i = (y * S + x) * 4;
          const g = v * joint;
          img.data[i] = g * 160; img.data[i + 1] = g * 164; img.data[i + 2] = g * 170; img.data[i + 3] = 255;
          h[y * S + x] = joint < 1 ? 0 : 1;
        }
      }
      ctx.putImageData(img, 0, 0);
      const floorMat = new THREE.MeshStandardMaterial({
        map: canvasTexture(c, { repeat: [7, 7] }),
        normalMap: canvasTexture(normalFromHeight(h, S, S, 2.5), { data: true, repeat: [7, 7] }),
        roughness: 0.55,
        metalness: 0
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.4), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      room.add(floor);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.92, metalness: 0 });
      const walls = [
        { w: 8.4, pos: [0, 1.6, -2.6], rot: 0 },
        { w: 8.4, pos: [0, 1.6, 4.2], rot: Math.PI },
        { w: 6.8, pos: [-3.2, 1.6, 0.8], rot: Math.PI / 2 },
        { w: 6.8, pos: [3.2, 1.6, 0.8], rot: -Math.PI / 2 }
      ];
      walls.forEach((wd) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(wd.w, 3.2), wallMat);
        m.position.set(wd.pos[0], wd.pos[1], wd.pos[2]);
        m.rotation.y = wd.rot;
        m.receiveShadow = true;
        room.add(m);
        const skirting = new THREE.Mesh(new THREE.BoxGeometry(wd.w, 0.1, 0.02), mats.blackPlastic);
        skirting.position.set(wd.pos[0], 0.05, wd.pos[2]);
        skirting.rotation.y = wd.rot;
        skirting.translateZ(0.01);
        room.add(skirting);
      });
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 6.8), new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.95 }));
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, 3.2, 0.8);
      room.add(ceiling);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff7ec, emissiveIntensity: 2.2, roughness: 0.4 });
      [[-0.8, -0.2], [0.8, -0.2], [0, 1.6]].forEach((p) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), panelMat);
        panel.position.set(p[0], 3.19, p[1]);
        room.add(panel);
      });
    }
    root.add(shadow(room, false, true));

    /* ---- Оптикалық үстел: болат беті, M6 тесіктер 25 мм қадаммен ---- */
    const table = new THREE.Group();
    {
      const S = 256;
      const field = brushedMetalMaps(21, S, S);
      const hgt = new Float32Array(S * S).fill(1);
      const c = makeCanvas(S, S);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(S, S);
      const cell = S / 4;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = (x % cell) - cell / 2 + 0.5;
          const dy = (y % cell) - cell / 2 + 0.5;
          const rr = Math.hypot(dx, dy);
          const i = y * S + x;
          let shade = 0.84 + (field[i] - 0.36) * 0.9;
          if (rr < 7.2) {
            shade = 0.08 + rr * 0.008;
            hgt[i] = 0;
            field[i] = 0.75;
          } else if (rr < 9) {
            shade *= 0.8;
            hgt[i] = (rr - 7.2) / 1.8;
          }
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = shade * 255;
          img.data[i * 4 + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const rep = [1.8 / 0.1, 0.9 / 0.1];
      const topMat = new THREE.MeshStandardMaterial({
        color: 0xc9ced3,
        map: canvasTexture(c, { repeat: rep }),
        roughnessMap: canvasTexture(grayCanvas(field, S, S), { data: true, repeat: rep }),
        normalMap: canvasTexture(normalFromHeight(hgt, S, S, 3), { data: true, repeat: rep }),
        metalness: 1,
        roughness: 1
      });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.5, metalness: 0.3 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.9), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
      top.position.y = TABLE_Y - 0.11;
      table.add(top);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x3d434b, roughness: 0.45, metalness: 0.6 });
      [[-0.72, -0.32], [0.72, -0.32], [-0.72, 0.32], [0.72, 0.32]].forEach((p) => {
        const leg = new THREE.Mesh(lathe([[0, 0], [0.13, 0], [0.13, 0.03], [0.11, 0.04], [0.11, 0.56], [0.12, 0.58], [0.12, 0.62], [0, 0.62]], 40), legMat);
        leg.position.set(p[0], 0, p[1]);
        table.add(leg);
      });
      const plaque = makeCanvas(512, 96);
      const pc = plaque.getContext('2d');
      pc.fillStyle = '#1c1f24';
      pc.fillRect(0, 0, 512, 96);
      pc.fillStyle = '#c8ccd2';
      fitText(pc, 'ОПТИКАЛЫҚ ҮСТЕЛ · M6 / 25 мм', 22, 62, 468, 40, 'bold');
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.079), new THREE.MeshStandardMaterial({ map: canvasTexture(plaque, { clamp: true }), roughness: 0.5, metalness: 0.4 }));
      label.position.set(0, TABLE_Y - 0.11, 0.4505);
      table.add(label);
    }
    root.add(shadow(inert(table)));

    /* ---- Жарық көздері ---- */
    const PRISM = new THREE.Vector2(-0.12, 0.13);
    const SRC_X = -0.74;

    function statusLed(on) {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 8), new THREE.MeshBasicMaterial({ color: on ? 0x22ff66 : 0x331111, toneMapped: false }));
      return led;
    }

    function aimAt(group, from) {
      group.position.set(from.x, BEAM_Y, from.y);
      group.rotation.y = -Math.atan2(PRISM.y - from.y, PRISM.x - from.x);
    }

    // Ақ жарық көзі: галоген шам корпусы, конденсор түтігі, реттелетін саңылау.
    const white = new THREE.Group();
    {
      const housingMat = new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.62, metalness: 0.35 });
      const body = new THREE.Mesh(roundedBox(0.15, 0.12, 0.11, 0.012), housingMat);
      body.rotation.y = Math.PI / 2;
      body.position.set(-0.2, 0, 0);
      white.add(body);
      for (let i = 0; i < 7; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.003), mats.aluminium);
        fin.position.set(-0.2, 0.07, -0.042 + i * 0.014);
        white.add(fin);
      }
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.11, 32), mats.blackAnodized);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(-0.07, 0, 0);
      white.add(tube);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 10, 32), mats.brass);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-0.11, 0, 0);
      white.add(ring);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.05, 0.05), mats.blackAnodized);
      plate.position.set(-0.012, 0, 0);
      white.add(plate);
      [-1, 1].forEach((s) => {
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.034, 0.0105), mats.steel);
        jaw.position.set(-0.009, 0, s * 0.0058);
        white.add(jaw);
      });
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 20), mats.steel);
      knob.position.set(-0.012, 0.032, 0);
      white.add(knob);
      const stand = opticalPost(mats, 0.05);
      stand.position.set(-0.2, -0.11, 0);
      white.add(stand);
      const lbl = makeCanvas(256, 96);
      const lc = lbl.getContext('2d');
      lc.fillStyle = '#e9e6dc';
      lc.fillRect(0, 0, 256, 96);
      lc.fillStyle = '#20242a';
      fitText(lc, 'АҚ ЖАРЫҚ КӨЗІ', 14, 38, 228, 26, 'bold');
      fitText(lc, 'галоген · 12 В / 50 Вт', 14, 74, 228, 22);
      const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.028), new THREE.MeshStandardMaterial({ map: canvasTexture(lbl, { clamp: true }), roughness: 0.6 }));
      sticker.position.set(-0.2, 0, 0.0565);
      white.add(sticker);
      white.userData.led = statusLed(true);
      white.userData.led.position.set(-0.13, 0.04, 0.056);
      white.add(white.userData.led);
    }
    aimAt(white, new THREE.Vector2(SRC_X, 0.24));
    root.add(shadow(white));

    // He-Ne лазері: цилиндр түтік, V-тәрізді ұстағыштар, апертура.
    const laser = new THREE.Group();
    {
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.38, metalness: 0.55 });
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.32, 40), tubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(-0.19, 0, 0);
      laser.add(tube);
      const capF = new THREE.Mesh(lathe([[0, 0], [0.0225, 0], [0.0225, 0.018], [0.012, 0.024], [0.004, 0.024], [0.004, 0.02], [0, 0.02]], 32), mats.blackAnodized);
      capF.rotation.z = -Math.PI / 2;
      capF.position.set(-0.03, 0, 0);
      laser.add(capF);
      const capB = new THREE.Mesh(new THREE.CylinderGeometry(0.0225, 0.0225, 0.02, 32), mats.blackAnodized);
      capB.rotation.z = Math.PI / 2;
      capB.position.set(-0.36, 0, 0);
      laser.add(capB);
      const lbl = makeCanvas(512, 128);
      const lc = lbl.getContext('2d');
      lc.fillStyle = '#f5c400';
      lc.fillRect(0, 0, 512, 128);
      lc.fillStyle = '#111';
      fitText(lc, 'ЛАЗЕРЛІК СӘУЛЕ', 20, 52, 472, 40, 'bold');
      fitText(lc, 'He-Ne · 632,8 нм · 3R класс · ≤5 мВт', 20, 100, 472, 30);
      const sticker = new THREE.Mesh(new THREE.CylinderGeometry(0.0222, 0.0222, 0.11, 40, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: canvasTexture(lbl, { clamp: true }), roughness: 0.55 }));
      sticker.rotation.z = Math.PI / 2;
      sticker.rotation.x = Math.PI / 2;
      sticker.position.set(-0.2, 0, 0);
      laser.add(sticker);
      [-0.08, -0.3].forEach((x) => {
        const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.004, 10, 32), mats.blackAnodized);
        clamp.rotation.y = Math.PI / 2;
        clamp.position.set(x, 0, 0);
        laser.add(clamp);
        const post = opticalPost(mats, 0.085);
        post.position.set(x, -0.11, 0);
        laser.add(post);
      });
      const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.37, 0, 0), new THREE.Vector3(-0.42, -0.02, 0.01),
        new THREE.Vector3(-0.45, -0.09, 0.03), new THREE.Vector3(-0.5, -0.11, 0.06)
      ]), 24, 0.0035, 8), mats.rubber);
      laser.add(cable);
      laser.userData.led = statusLed(false);
      laser.userData.led.position.set(-0.36, 0.024, 0);
      laser.add(laser.userData.led);
    }
    aimAt(laser, new THREE.Vector2(SRC_X, 0.02));
    root.add(shadow(laser));

    /* ---- Призма айналмалы үстелшеде ---- */
    const PRISM_SIDE = 0.085;
    const prism = new THREE.Group();
    prism.position.set(PRISM.x, 0, PRISM.y);
    const prismLocal = [];
    {
      const stageTop = BEAM_Y - PRISM_SIDE / 2;
      const post = opticalPost(mats, stageTop - 0.016 - TABLE_Y);
      post.position.y = TABLE_Y;
      prism.add(inert(post));
      const fixed = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.072, 0.008, 64), mats.blackAnodized);
      fixed.position.y = stageTop - 0.012;
      prism.add(inert(fixed));
      const index = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.009, 0.01), mats.steel);
      index.position.set(0, stageTop - 0.011, 0.071);
      prism.add(inert(index));
      // Бұрыш шкаласы: 5° сайын сызық, 30° сайын сан.
      const S = 512;
      const c = makeCanvas(S, S);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#121418';
      ctx.fillRect(0, 0, S, S);
      ctx.translate(S / 2, S / 2);
      ctx.strokeStyle = '#e8e8e8';
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      for (let a = 0; a < 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const long = a % 30 === 0;
        ctx.lineWidth = long ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * 246, Math.sin(rad) * 246);
        ctx.lineTo(Math.cos(rad) * (long ? 214 : 228), Math.sin(rad) * (long ? 214 : 228));
        ctx.stroke();
        if (long) ctx.fillText(String(a), Math.cos(rad) * 190, Math.sin(rad) * 190 + 8);
      }
      const dial = new THREE.Group();
      dial.position.y = stageTop - 0.004;
      // Цилиндр қақпағының UV-і жоғарыдан қарағанда айналы, сондықтан
      // шкала көлденеңінен аударылады — сандар дұрыс оқылады.
      const dialTex = canvasTexture(c, { clamp: true });
      dialTex.repeat.set(-1, 1);
      dialTex.offset.set(1, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.008, 64), [
        mats.blackAnodized,
        new THREE.MeshStandardMaterial({ map: dialTex, metalness: 0.6, roughness: 0.4 }),
        mats.blackAnodized
      ]);
      dial.add(disc);
      prism.add(dial);
      prism.userData.dial = dial;

      // Тең қабырғалы үшбұрыш (жергілікті x, z) — табаны артқы жақта.
      const hTri = (PRISM_SIDE * Math.sqrt(3)) / 2;
      prismLocal.push(new THREE.Vector2(-PRISM_SIDE / 2, -hTri / 3));
      prismLocal.push(new THREE.Vector2(PRISM_SIDE / 2, -hTri / 3));
      prismLocal.push(new THREE.Vector2(0, (2 * hTri) / 3));
      const shape = new THREE.Shape();
      // Пішіннің y осі экструзиядан кейін әлемдегі -z болады.
      shape.moveTo(prismLocal[0].x, -prismLocal[0].y);
      shape.lineTo(prismLocal[1].x, -prismLocal[1].y);
      shape.lineTo(prismLocal[2].x, -prismLocal[2].y);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: PRISM_SIDE, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 2 });
      geo.rotateX(-Math.PI / 2);
      geo.computeVertexNormals();
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0.05,
        ior: 1.785,
        dispersion: 0.4,
        attenuationColor: new THREE.Color(0xeef6ff),
        attenuationDistance: 0.6,
        specularIntensity: 1,
        envMapIntensity: 1.4
      });
      const mesh = new THREE.Mesh(geo, glass);
      mesh.position.y = 0;
      mesh.castShadow = false;
      dial.add(mesh);
      dial.userData.glass = mesh;
      mesh.position.y = 0.004;
    }
    root.add(prism);

    /* ---- Экран және фотосенсор ---- */
    const screen = new THREE.Group();
    {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.15, 0.26), [
        new THREE.MeshStandardMaterial({ color: 0xdcdcd6, roughness: 0.95 }),
        new THREE.MeshStandardMaterial({ color: 0xdcdcd6, roughness: 0.95 }),
        mats.blackPlastic, mats.blackPlastic, mats.blackPlastic, mats.blackPlastic
      ]);
      screen.add(card);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.27), mats.blackAnodized);
      frame.position.y = -0.081;
      screen.add(frame);
      // Экранның үстіңгі жиегіндегі фотосенсор, дисплейі призма жаққа қарап тұр.
      const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.026, 0.05), mats.blackPlastic);
      sensor.position.set(-0.012, 0.088, 0.095);
      screen.add(sensor);
      const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.014), new THREE.MeshBasicMaterial({ color: 0x7cff9b, toneMapped: false }));
      lcd.rotation.y = -Math.PI / 2;
      lcd.position.set(-0.0225, 0.089, 0.095);
      screen.add(lcd);
      const post = opticalPost(mats, 0.026);
      post.position.y = -0.11;
      screen.add(post);
    }
    root.add(shadow(screen));

    /* ---- Сәулелер ---- */
    const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    const MAX = 400;
    const coreMesh = new THREE.InstancedMesh(beamGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), MAX);
    const glowMesh = new THREE.InstancedMesh(beamGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), MAX);
    coreMesh.frustumCulled = glowMesh.frustumCulled = false;
    root.add(inert(coreMesh));
    root.add(inert(glowMesh));
    const spectrumMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    const spectrumMesh = new THREE.Mesh(new THREE.BufferGeometry(), spectrumMat);
    root.add(inert(spectrumMesh));
    const laserDot = glowSprite(0xff2a1a, 0.035, 1);
    root.add(inert(laserDot));
    const sourceGlow = glowSprite(0xffffff, 0.03, 0.9);
    root.add(inert(sourceGlow));

    const WAVES = [];
    for (let nm = 400; nm <= 700; nm += 6) WAVES.push(nm);
    const waveColor = WAVES.map((nm) => {
      const fall = Math.min(1, (nm - 392) / 45) * Math.min(1, (708 - nm) / 45);
      return wavelengthToRGB(nm).multiplyScalar(0.25 + 0.75 * fall);
    });
    const HENE = 632.8;
    const heneColor = new THREE.Color(1, 0.06, 0.03);

    const state = { source: 'white', angle: 0, target: 0, deviation: 0, hitRange: null };
    const tmpM = new THREE.Matrix4();
    const tmpQ = new THREE.Quaternion();
    const tmpS = new THREE.Vector3();
    let coreCount = 0;
    let glowCount = 0;

    function pushSegment(a2, b2, color, coreR, glowR, glowColor) {
      const a = new THREE.Vector3(a2.x, BEAM_Y, a2.y);
      const b = new THREE.Vector3(b2.x, BEAM_Y, b2.y);
      const d = new THREE.Vector3().subVectors(b, a);
      const len = d.length();
      if (len < 1e-5) return;
      tmpQ.setFromUnitVectors(UP, d.clone().normalize());
      const mid = a.clone().addScaledVector(d, 0.5);
      if (coreCount < MAX) {
        tmpM.compose(mid, tmpQ, tmpS.set(coreR, len, coreR));
        coreMesh.setMatrixAt(coreCount, tmpM);
        coreMesh.setColorAt(coreCount, color);
        coreCount++;
      }
      if (glowR && glowCount < MAX) {
        tmpM.compose(mid, tmpQ, tmpS.set(glowR, len, glowR));
        glowMesh.setMatrixAt(glowCount, tmpM);
        glowMesh.setColorAt(glowCount, glowColor || color);
        glowCount++;
      }
    }

    function prismVertsWorld() {
      return prismLocal.map((v) => {
        const p = new THREE.Vector3(v.x, BEAM_Y, v.y);
        p.applyAxisAngle(UP, state.angle);
        return new THREE.Vector2(p.x + PRISM.x, p.z + PRISM.y);
      });
    }

    // Экран жазықтығы (x, z): орталығы мен нормалі. Алғашқы бағдар
    // бойынша ақ жарықтың ең аз ауытқу бағытына перпендикуляр қойылады.
    const screenPlane = { c: new THREE.Vector2(), n: new THREE.Vector2(), t: new THREE.Vector2() };

    function hitScreen(p, d) {
      const den = d.x * screenPlane.n.x + d.y * screenPlane.n.y;
      if (Math.abs(den) < 1e-6) return null;
      const t = ((screenPlane.c.x - p.x) * screenPlane.n.x + (screenPlane.c.y - p.y) * screenPlane.n.y) / den;
      if (t <= 0) return null;
      const q = new THREE.Vector2(p.x + d.x * t, p.y + d.y * t);
      const off = (q.x - screenPlane.c.x) * screenPlane.t.x + (q.y - screenPlane.c.y) * screenPlane.t.y;
      return Math.abs(off) <= 0.128 ? { q: q, off: off } : null;
    }

    function sourceRay(group) {
      const origin = new THREE.Vector2(group.position.x, group.position.z);
      const dir = new THREE.Vector2(PRISM.x - origin.x, PRISM.y - origin.y).normalize();
      return { origin: origin, dir: dir };
    }

    function deviationFor(nm, src) {
      const r = tracePrism(src.origin, src.dir, prismVertsWorld(), nFlint(nm));
      if (!r.exited) return null;
      return Math.acos(Math.max(-1, Math.min(1, r.dir.dot(src.dir))));
    }

    // Ең аз ауытқу бағдарын іздеу (λ = 589 нм, ақ жарық көзі үшін).
    {
      const src = sourceRay(white);
      let best = null;
      for (let deg = -90; deg <= 90; deg += 0.25) {
        state.angle = (deg * Math.PI) / 180;
        const r = tracePrism(src.origin, src.dir, prismVertsWorld(), nFlint(589));
        if (!r.exited || r.segs.length !== 2) continue;
        const dev = Math.acos(r.dir.dot(src.dir));
        if (r.dir.y < 0 && (!best || dev < best.dev)) best = { a: state.angle, dev: dev, exit: r.exit, dir: r.dir };
      }
      state.angle = state.target = best ? best.a : 0;
      const ex = best ? best.exit : PRISM;
      const dir = best ? best.dir : new THREE.Vector2(0.7, -0.7);
      screenPlane.c.set(ex.x + dir.x * 0.55, ex.y + dir.y * 0.55);
      screenPlane.n.set(-dir.x, -dir.y);
      screenPlane.t.set(-dir.y, dir.x);
      screen.position.set(screenPlane.c.x, BEAM_Y, screenPlane.c.y);
      screen.rotation.y = -Math.atan2(screenPlane.n.y, screenPlane.n.x) + Math.PI;
    }
    const baseAngle = state.angle;

    function rebuildBeams() {
      coreCount = 0;
      glowCount = 0;
      prism.userData.dial.rotation.y = state.angle;
      const active = state.source === 'white' ? white : laser;
      const src = sourceRay(active);
      const verts = prismVertsWorld();
      const aperture = src.origin.clone();
      sourceGlow.position.set(aperture.x, BEAM_Y, aperture.y);
      sourceGlow.material.color.set(state.source === 'white' ? 0xfff6e8 : 0xff3322);
      const positions = [];
      const colors = [];
      const hits = [];
      const waves = state.source === 'white' ? WAVES : [HENE];
      waves.forEach((nm, i) => {
        const col = state.source === 'white' ? waveColor[i] : heneColor;
        const r = tracePrism(src.origin, src.dir, verts, nFlint(nm));
        r.segs.forEach((s, k) => {
          if (k === 0) {
            if (i === 0) {
              const c0 = state.source === 'white' ? new THREE.Color(1, 0.97, 0.9) : heneColor;
              pushSegment(s.a, s.b, c0, 0.0011, 0.004, c0);
            }
          } else {
            pushSegment(s.a, s.b, col.clone().multiplyScalar(state.source === 'white' ? 0.25 : 1), 0.0008, 0);
          }
        });
        if (i === 0 && r.reflected) {
          // Шыны бетінен шағылған әлсіз сәуле (Френель бойынша ~5–10 %).
          const end = r.reflected.from.clone().addScaledVector(r.reflected.dir, 0.25);
          const faint = (state.source === 'white' ? new THREE.Color(1, 1, 1) : heneColor.clone()).multiplyScalar(0.045);
          pushSegment(r.reflected.from, end, faint, 0.0007, 0);
        }
        if (r.exited) {
          const h = hitScreen(r.exit, r.dir);
          const end = h ? h.q : r.exit.clone().addScaledVector(r.dir, 1.6);
          const w = state.source === 'white' ? 0.32 : 1;
          pushSegment(r.exit, end, col.clone().multiplyScalar(w), state.source === 'white' ? 0.0009 : 0.0011, state.source === 'white' ? 0.0028 : 0.004, col.clone().multiplyScalar(w * 0.6));
          if (h) hits.push({ q: h.q, off: h.off, col: col, nm: nm });
        }
      });
      coreMesh.count = coreCount;
      glowMesh.count = glowCount;
      coreMesh.instanceMatrix.needsUpdate = true;
      glowMesh.instanceMatrix.needsUpdate = true;
      if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;

      // Экрандағы спектр жолағы (саңылаудың бейнесі).
      laserDot.visible = false;
      const n3 = new THREE.Vector3(screenPlane.n.x, 0, screenPlane.n.y).multiplyScalar(0.0035);
      if (state.source === 'white' && hits.length > 1) {
        for (let i = 0; i < hits.length - 1; i++) {
          const a = hits[i];
          const b = hits[i + 1];
          const quad = [[a, -1], [b, -1], [b, 1], [a, -1], [b, 1], [a, 1]];
          quad.forEach((qd) => {
            const h = qd[0];
            positions.push(h.q.x + n3.x, BEAM_Y + qd[1] * 0.007, h.q.y + n3.z);
            colors.push(h.col.r * 1.15, h.col.g * 1.15, h.col.b * 1.15);
          });
        }
        state.hitRange = hits;
      } else if (state.source === 'laser' && hits.length) {
        laserDot.visible = true;
        laserDot.position.set(hits[0].q.x + n3.x, BEAM_Y, hits[0].q.y + n3.z);
        state.hitRange = hits;
      } else {
        state.hitRange = null;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      spectrumMesh.geometry.dispose();
      spectrumMesh.geometry = g;
      const dev = deviationFor(589, src);
      state.deviation = dev == null ? null : (dev * 180) / Math.PI;
      white.userData.led.material.color.set(state.source === 'white' ? 0x22ff66 : 0x331111);
      laser.userData.led.material.color.set(state.source === 'laser' ? 0x22ff66 : 0x331111);
    }

    /* ---- Ньютон тербелмесі бүйірдегі үстелде ---- */
    const bench = new THREE.Group();
    bench.position.set(-1.75, 0, -0.35);
    const balls = [];
    {
      const topMat = new THREE.MeshStandardMaterial({ color: 0xd9d7d1, roughness: 0.5 });
      const top = new THREE.Mesh(roundedBox(1.0, 0.6, 0.03, 0.01), topMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.9;
      bench.add(top);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x8c939b, metalness: 1, roughness: 0.38 });
      [[-0.46, -0.26], [0.46, -0.26], [-0.46, 0.26], [0.46, 0.26]].forEach((p) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.885, 0.035), frameMat);
        leg.position.set(p[0], 0.4425, p[1]);
        bench.add(leg);
      });
      const cradle = new THREE.Group();
      cradle.position.set(0.05, 0.915, 0.02);
      const base = new THREE.Mesh(roundedBox(0.34, 0.2, 0.025, 0.008), new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }));
      base.rotation.x = -Math.PI / 2;
      base.position.y = 0.0125;
      cradle.add(base);
      const rodR = 0.0035;
      const H = 0.22;
      [-0.075, 0.075].forEach((z) => {
        [-0.15, 0.15].forEach((x) => {
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, H, 16), mats.chrome);
          rod.position.set(x, 0.025 + H / 2, z);
          cradle.add(rod);
        });
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, 0.3, 16), mats.chrome);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0.025 + H, z);
        cradle.add(bar);
      });
      const ballGeo = new THREE.SphereGeometry(0.02, 32, 24);
      const L = 0.15;
      const stringMat = new THREE.LineBasicMaterial({ color: 0xdedede, transparent: true, opacity: 0.8 });
      for (let i = -2; i <= 2; i++) {
        const pivot = new THREE.Group();
        pivot.position.set(i * 0.0401, 0.025 + H, 0);
        const ball = new THREE.Mesh(ballGeo, mats.chrome);
        ball.position.y = -L;
        pivot.add(ball);
        const sg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, -0.075), new THREE.Vector3(0, -L + 0.018, 0), new THREE.Vector3(0, 0, 0.075)
        ]);
        pivot.add(new THREE.Line(sg, stringMat));
        cradle.add(pivot);
        balls.push(pivot);
      }
      bench.add(cradle);
      tagObject(cradle, 'Ньютон тербелмесі', 'Импульс пен энергияның сақталуын көрсетеді: шеткі шар соғылғанда қарсы шеттегі шар ғана ұшады.');
    }
    root.add(shadow(bench));

    /* ---- Қабырғадағы тақта мен ескерту белгісі ---- */
    const board = infoBoard('ПРИЗМАДАҒЫ ЖАРЫҚ ДИСПЕРСИЯСЫ', [
      'Снеллиус заңы:  n₁·sin α = n₂·sin β',
      'N-SF11 ауыр флинт:  n = 1,772 (700 нм) … 1,839 (400 нм)',
      'Ақ жарық → 400–700 нм: 7 түсті спектр',
      'He-Ne лазер → 632,8 нм: дисперсия жоқ, сәуле тек сынады',
      'Ең аз ауытқу (589 нм):  δ ≈ 66°'
    ], { width: 1.5 });
    board.position.set(-0.2, 1.75, -2.585);
    root.add(inert(board));
    {
      const c = makeCanvas(512, 600);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 600);
      ctx.beginPath();
      ctx.moveTo(256, 30);
      ctx.lineTo(486, 430);
      ctx.lineTo(26, 430);
      ctx.closePath();
      ctx.fillStyle = '#f5c400';
      ctx.fill();
      ctx.lineWidth = 26;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111';
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(200, 300, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 9;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(200 + Math.cos(a) * 34, 300 + Math.sin(a) * 34);
        ctx.lineTo(200 + Math.cos(a) * 58, 300 + Math.sin(a) * 58);
        ctx.stroke();
      }
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(200, 300);
      ctx.lineTo(380, 300);
      ctx.stroke();
      ctx.font = 'bold 74px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ЛАЗЕР', 256, 540);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.4), new THREE.MeshStandardMaterial({ map: canvasTexture(c, { clamp: true }), roughness: 0.6 }));
      sign.position.set(1.25, 1.75, -2.59);
      root.add(inert(sign));
    }

    /* ---- Жарық: үстелге бағытталған прожектор, жұмсақ толықтырушы ---- */
    const spot = new THREE.SpotLight(0xfff1df, 18, 0, 0.55, 0.7, 2);
    spot.position.set(-0.3, 3.05, 0.6);
    spot.target.position.set(-0.35, TABLE_Y, 0.1);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.0002;
    spot.shadow.normalBias = 0.01;
    spot.shadow.radius = 4;
    root.add(spot);
    root.add(spot.target);
    const fill = new THREE.HemisphereLight(0xb8c4d6, 0x22252a, 0.35);
    root.add(fill);

    /* ---- Басу ---- */
    const selectSource = (name) => () => {
      state.source = name;
      rebuildBeams();
      return name === 'white'
        ? 'Ақ жарық (400–700 нм) призмада 7 түске жіктелді: күлгін сәуле көбірек, қызыл сәуле азырақ сынады.'
        : 'He-Ne лазері — бір ғана толқын ұзындығы (632,8 нм), сондықтан спектр пайда болмайды: сәуле тек сынып, бағытын өзгертеді.';
    };
    tagObject(white, 'Ақ жарық көзі', '', 't1', selectSource('white'));
    tagObject(laser, 'He-Ne лазері', '', 't1', selectSource('laser'));
    tagObject(prism, 'Ауыр флинт призма (N-SF11)', '', 't2', () => {
      state.target += (10 * Math.PI) / 180;
      const deg = Math.round(((state.target - baseAngle) * 180) / Math.PI) % 360;
      const dev = deviationFor(589, sourceRay(state.source === 'white' ? white : laser));
      return 'Призма ' + deg + '°-қа бұрылды. ' + (dev == null
        ? 'Сәуле призмадан шықпады — толық ішкі шағылу.'
        : 'Ауытқу бұрышы (589 нм): δ = ' + ((dev * 180) / Math.PI).toFixed(1) + '°.');
    });
    tagObject(screen, 'Экран және фотосенсор', '', 't3', () => {
      const h = state.hitRange;
      if (!h || !h.length) return 'Экранға сәуле түспей тұр: призманы бұрып, сәулені экранға қайтарыңыз.';
      if (state.source === 'laser') return 'Бір ғана қызыл дақ: λ = 632,8 нм. Монохромат жарық жіктелмейді.';
      const span = Math.abs(h[h.length - 1].off - h[0].off) * 1000;
      return 'Спектр: ' + h[0].nm + '–' + h[h.length - 1].nm + ' нм, экрандағы ені ≈ ' + span.toFixed(0) + ' мм. Күлгін жиегі ең көп ауытқыған.';
    });

    rebuildBeams();
    el.setObject3D('mesh', root);

    let t = 0;
    return {
      environment: { url: 'hdri/studio.hdr', intensity: 0.4 },
      onEnvironment() {
        // Қараңғы бөлмеде шыны шағылыстыратын ештеңе таппай, көрінбей
        // қалады. Сондықтан призмаға студия ортасын тікелей береміз.
        const glass = prism.userData.dial.userData.glass.material;
        glass.envMap = el.sceneEl.object3D.environment;
        glass.envMapIntensity = 1.0;
        glass.needsUpdate = true;
      },
      tick(dt) {
        t += dt;
        if (Math.abs(state.target - state.angle) > 1e-4) {
          state.angle += (state.target - state.angle) * Math.min(1, dt * 6);
          if (Math.abs(state.target - state.angle) < 1e-4) state.angle = state.target;
          rebuildBeams();
        }
        // Шеткі шар маятниктің жарты периодында шығып, қайтып келеді.
        const w = Math.sqrt(9.81 / 0.15);
        const s = Math.sin(t * w);
        const amp = 0.45;
        balls[0].rotation.z = s > 0 ? -amp * s : 0;
        balls[4].rotation.z = s < 0 ? -amp * s : 0;
      }
    };
  }

  /* ================================================================== *\
     6. Күн жүйесі: NASA карталары, Күн шейдері, Жердің түнгі жағы
  \* ================================================================== */

  /** Меркурий: кратерлі бет (NASA картасы репозиторийде жоқ, сондықтан процедуралық). */
  function mercuryTexture() {
    const W = 1024;
    const H = 512;
    const fbm = makeNoise(31);
    const r = rng(32);
    const h = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) h[y * W + x] = fbm(x / 128, y / 128, 8, 5) * 0.6;
    }
    for (let k = 0; k < 700; k++) {
      const rad = 2 + Math.pow(r(), 3.2) * 46;
      const cx = r() * W;
      const cy = H * 0.08 + r() * H * 0.84;
      const R = Math.ceil(rad * 1.6);
      for (let dy = -R; dy <= R; dy++) {
        const yy = Math.round(cy + dy);
        if (yy < 0 || yy >= H) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = ((Math.round(cx + dx) % W) + W) % W;
          const d = Math.hypot(dx, dy) / rad;
          let v = 0;
          if (d < 1) v = -0.35 * (1 - d * d);
          else if (d < 1.6) v = 0.12 * Math.cos(((d - 1) / 0.6) * Math.PI * 0.5);
          h[yy * W + xx] += v * Math.min(1, rad / 18);
        }
      }
    }
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = 0.42 + h[i] * 0.35;
      img.data[i * 4] = v * 182;
      img.data[i * 4 + 1] = v * 172;
      img.data[i * 4 + 2] = v * 160;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, W, H, 6), { data: true })
    };
  }

  /** Шолпан: көмірқышқыл газ бен күкірт қышқылы бұлттарының ақшыл қабаты. */
  function venusTexture() {
    const W = 1024;
    const H = 512;
    const fbm = makeNoise(41);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const lat = y / H - 0.5;
        const warp = fbm(x / 160, y / 48, 6, 3) * 3.0;
        const v = fbm(x / 220 + warp + lat * 2.5, y / 40, 4, 5);
        const band = 0.5 + 0.5 * Math.sin(lat * 14 + warp * 2);
        const l = 0.8 + (v - 0.5) * 0.28 + band * 0.04;
        const i = (y * W + x) * 4;
        img.data[i] = Math.min(255, l * 255);
        img.data[i + 1] = Math.min(255, l * 236);
        img.data[i + 2] = Math.min(255, l * 192);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(c);
  }

  /**
   * Сатурн сақиналарының радиал профилі (Сатурн радиусымен):
   * C (1,24–1,53), B (1,53–1,95), Кассини саңылауы (1,95–2,03),
   * A (2,03–2,27) ішіндегі Энке саңылауы (2,214), F сақинасы (2,32).
   */
  function saturnRingTexture(inner, outer) {
    const W = 1024;
    const c = makeCanvas(W, 4);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, 4);
    const fbm = makeNoise(51);
    for (let x = 0; x < W; x++) {
      const r = inner + (x / (W - 1)) * (outer - inner);
      const fine = fbm(x / 3, 0.5, 400, 3);
      let a = 0;
      let col = [0.8, 0.74, 0.63];
      if (r < 1.239) a = 0;
      else if (r < 1.527) { a = 0.18 + fine * 0.18; col = [0.58, 0.53, 0.47]; }
      else if (r < 1.951) { a = 0.78 + fine * 0.2; col = [0.88, 0.8, 0.66]; }
      else if (r < 2.025) { a = 0.04 + fine * 0.05; col = [0.5, 0.47, 0.43]; }
      else if (r < 2.267) {
        a = 0.52 + fine * 0.18;
        col = [0.8, 0.74, 0.64];
        if (Math.abs(r - 2.214) < 0.006) a = 0.02;
      } else if (Math.abs(r - 2.32) < 0.004) { a = 0.35; col = [0.85, 0.8, 0.72]; }
      for (let y = 0; y < 4; y++) {
        const i = (y * W + x) * 4;
        img.data[i] = col[0] * 255;
        img.data[i + 1] = col[1] * 255;
        img.data[i + 2] = col[2] * 255;
        img.data[i + 3] = Math.max(0, Math.min(1, a)) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(c, { clamp: true });
  }

  /** Сақина геометриясы: текстура радиус бойынша оқылуы үшін UV қайта есептеледі. */
  function ringGeometry(inner, outer) {
    const geo = new THREE.RingGeometry(inner, outer, 160, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    return geo;
  }

  function sunMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: [
        'varying vec3 vN; varying vec3 vV; varying vec3 vP;',
        'void main() {',
        '  vP = position;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vN = normalize(normalMatrix * normal);',
        '  vV = -mv.xyz;',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;',
        'float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
        'float noise(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
        '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
        'float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }',
        'void main() {',
        '  vec3 p = normalize(vP) * 5.0;',
        '  float cells = fbm(p * 7.0 + vec3(0.0, uTime * 0.05, 0.0));',
        '  float flow = fbm(p * 0.9 - vec3(uTime * 0.02));',
        '  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);',
        '  float limb = 0.35 + 0.65 * pow(mu, 0.55);',
        '  vec3 hot = vec3(1.0, 0.93, 0.78); vec3 warm = vec3(1.0, 0.62, 0.2); vec3 deep = vec3(0.85, 0.3, 0.05);',
        '  vec3 col = mix(warm, hot, smoothstep(0.3, 0.75, cells * 0.55 + flow * 0.45));',
        '  col = mix(deep, col, limb);',
        '  float spot = smoothstep(0.735, 0.77, fbm(p * 0.7 + 17.0));',
        '  col *= 1.0 - 0.75 * spot;',
        '  gl_FragColor = vec4(col * (0.75 + 0.55 * limb), 1.0);',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}'
      ].join('\n')
    });
  }

  /** Атмосфераның жарық жақтағы жиек жарқылы (Рэлей шашырауының жуықтауы). */
  function atmosphereMaterial(color, sunPos, power) {
    return new THREE.ShaderMaterial({
      uniforms: { sunPos: { value: sunPos }, uColor: { value: new THREE.Color(color) }, uPower: { value: power || 3 } },
      vertexShader: [
        'varying vec3 vN; varying vec3 vP;',
        'void main() {',
        '  vN = normalize(mat3(modelMatrix) * normal);',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vP = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 sunPos; uniform vec3 uColor; uniform float uPower; varying vec3 vN; varying vec3 vP;',
        'void main() {',
        '  vec3 V = normalize(cameraPosition - vP);',
        '  vec3 N = normalize(vN);',
        '  float rim = pow(1.0 - abs(dot(N, V)), uPower);',
        '  float lit = smoothstep(-0.35, 0.45, dot(N, normalize(sunPos - vP)));',
        '  float a = rim * lit;',
        '  gl_FragColor = vec4(uColor * a * 1.8, a);',
        '}'
      ].join('\n'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  function buildSpace(el) {
    const root = new THREE.Group();
    const SUN = new THREE.Vector3(0, -0.6, -6.5);

    // Жұлдызды аспан: Tycho каталогынан (NASA) тең бұрышты карта.
    const skyGeo = new THREE.SphereGeometry(600, 64, 32);
    skyGeo.scale(-1, 1, 1);
    const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: loadTexture('textures/stars.jpg'), color: 0x9a9a9a, toneMapped: false, depthWrite: false }));
    sky.rotation.set(0.4, 0, 0.2);
    root.add(inert(sky));

    // Күн: грануляция, дақтар, лимб қараюы; жанында тәж жарқылы.
    const sunMat = sunMaterial();
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 64), sunMat);
    sun.position.copy(SUN);
    root.add(sun);
    const corona1 = glowSprite(0xffd28a, 5.5, 0.9);
    const corona2 = glowSprite(0xff9a3c, 11, 0.28);
    corona1.position.copy(SUN);
    corona2.position.copy(SUN);
    root.add(inert(corona1));
    root.add(inert(corona2));
    const sunLight = new THREE.PointLight(0xfff4e6, 3.4, 0, 0);
    sunLight.position.copy(SUN);
    root.add(sunLight);
    root.add(new THREE.AmbientLight(0x8899bb, 0.03));
    tagObject(sun, 'Күн', 'G2V класты жұлдыз: бетінің температурасы ≈ 5 778 K. Жүйе массасының 99,86 %-ы Күнде, ғаламшарлар оны тартылыс күшімен айналады.', 's3');

    const sunUniform = SUN.clone();
    const planets = [
      { name: 'Меркурий', info: 'Күнге ең жақын ғаламшар. Атмосферасы жоқ, беті кратерге толы. Бір жылы — 88 тәулік.',
        r: 0.12, dist: 2.2, speed: 0.24, spin: 0.01, tilt: 0.0 },
      { name: 'Шолпан', info: 'Тығыз CO₂ атмосферасы мен күкірт қышқылы бұлттары бетін жасырады. Бетінің температурасы ≈ +465 °C.',
        r: 0.22, dist: 3.2, speed: 0.094, spin: -0.004, tilt: 3.1, atmosphere: 0xffd9a0 },
      { name: 'Жер', info: 'Мұхиттар, бұлттар және түнгі жақтағы қалалар шамдары. Осінің көлбеулігі 23,4°, серігі — Ай.',
        taskId: 's1', r: 0.26, dist: 4.5, speed: 0.058, spin: 0.25, tilt: 0.409, earth: true },
      { name: 'Марс', info: 'Темір тотығы бетін қызыл етеді. Олимп тауы — Күн жүйесіндегі ең биік жанартау (≈ 22 км).',
        r: 0.18, dist: 5.8, speed: 0.031, spin: 0.24, tilt: 0.44, map: 'textures/mars.jpg' },
      { name: 'Юпитер', info: 'Газ алыбы. Үлкен Қызыл Дақ — Жерден үлкен дауыл, 350 жылдан астам уақыт бақыланып келеді.',
        taskId: 's2', r: 0.55, dist: 7.6, speed: 0.012, spin: 0.6, tilt: 0.055, map: 'textures/jupiter.jpg' },
      { name: 'Сатурн', info: 'Сақиналары мұз бен тас бөлшектерінен тұрады; ені ≈ 280 000 км, қалыңдығы небәрі ~10 м.',
        taskId: 's2', r: 0.45, dist: 9.4, speed: 0.0066, spin: 0.55, tilt: 0.466, map: 'textures/saturn.jpg', rings: true }
    ];

    const orbitMat = new THREE.LineBasicMaterial({ color: 0x7c8db5, transparent: true, opacity: 0.16 });
    const bodies = [];
    planets.forEach((p, idx) => {
      const pts = [];
      for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist));
      }
      const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat);
      orbit.position.copy(SUN);
      root.add(inert(orbit));

      const holder = new THREE.Group();
      const tilt = new THREE.Group();
      tilt.rotation.z = p.tilt;
      holder.add(tilt);
      let mat;
      if (p.earth) {
        mat = new THREE.MeshStandardMaterial({
          map: loadTexture('textures/earth_day.jpg'),
          normalMap: loadTexture('textures/earth_normal.jpg', { data: true }),
          normalScale: new THREE.Vector2(0.7, 0.7),
          roughnessMap: loadTexture('textures/earth_roughness.jpg', { data: true }),
          roughness: 1,
          metalness: 0,
          emissive: new THREE.Color(0xffd29a),
          emissiveMap: loadTexture('textures/earth_night.jpg'),
          emissiveIntensity: 1.3
        });
        // Қала шамдары тек түнгі жақта жанады.
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.sunPos = { value: sunUniform };
          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vWN;\nvarying vec3 vWP;')
            .replace('#include <project_vertex>', '#include <project_vertex>\nvWN = normalize(mat3(modelMatrix) * objectNormal);\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nuniform vec3 sunPos;\nvarying vec3 vWN;\nvarying vec3 vWP;')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= smoothstep(0.08, -0.22, dot(normalize(vWN), normalize(sunPos - vWP)));');
        };
      } else if (idx === 0) {
        const m = mercuryTexture();
        mat = new THREE.MeshStandardMaterial({ map: m.map, normalMap: m.normalMap, roughness: 0.95, metalness: 0 });
      } else if (idx === 1) {
        mat = new THREE.MeshStandardMaterial({ map: venusTexture(), roughness: 0.85, metalness: 0 });
      } else {
        const tex = loadTexture(p.map);
        mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 });
        if (p.name === 'Марс') {
          mat.bumpMap = tex;
          mat.bumpScale = 1.2;
        }
      }
      const body = new THREE.Mesh(new THREE.SphereGeometry(p.r, 96, 64), mat);
      tilt.add(body);

      if (p.earth) {
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(p.r * 1.012, 96, 64),
          new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: loadTexture('textures/earth_clouds.jpg', { data: true }), transparent: true, depthWrite: false, roughness: 1 })
        );
        tilt.add(clouds);
        body.userData.clouds = clouds;
        const atmo = new THREE.Mesh(new THREE.SphereGeometry(p.r * 1.06, 64, 48), atmosphereMaterial(0x5aa0ff, sunUniform, 3.2));
        tilt.add(inert(atmo));
        const moonPivot = new THREE.Group();
        holder.add(moonPivot);
        const moonTex = loadTexture('textures/moon.jpg');
        const moon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 64, 48), new THREE.MeshStandardMaterial({ map: moonTex, bumpMap: moonTex, bumpScale: 1.5, roughness: 1, metalness: 0 }));
        moon.position.set(0.5, 0, 0);
        moonPivot.add(moon);
        tagObject(moon, 'Ай', 'Жердің табиғи серігі. Бір жағымен ғана Жерге қарап айналады (синхронды айналу). Орбиталық периоды — 27,3 тәулік.', 's1');
        holder.userData.moonPivot = moonPivot;
      }
      if (p.atmosphere) {
        const atmo = new THREE.Mesh(new THREE.SphereGeometry(p.r * 1.05, 48, 32), atmosphereMaterial(p.atmosphere, sunUniform, 2.2));
        tilt.add(inert(atmo));
      }
      if (p.rings) {
        const inner = 1.239;
        const outer = 2.33;
        const ring = new THREE.Mesh(
          ringGeometry(p.r * inner, p.r * outer),
          new THREE.MeshStandardMaterial({ map: saturnRingTexture(inner, outer), transparent: true, side: THREE.DoubleSide, roughness: 0.9, metalness: 0, depthWrite: false })
        );
        ring.rotation.x = -Math.PI / 2;
        tilt.add(ring);
      }
      tagObject(body, p.name, p.info, p.taskId);
      root.add(holder);
      bodies.push({ holder: holder, body: body, cfg: p, angle: [-0.9, 3.5, -0.25, 3.9, -0.75, 3.35][idx] });
    });

    const board = infoBoard('КҮН ЖҮЙЕСІ', [
      'Ғаламшарлар карталары: NASA (Марс, Юпитер, Сатурн, Ай)',
      'Тартылыс заңы:  F = G·M·m / r²',
      'Жер — Күн:  1 а.б. = 149,6 млн км',
      'Масштаб шартты: өлшемдер мен қашықтықтар',
      'көрнекілік үшін сығылған'
    ], { width: 1.5, paper: '#0b1220', ink: '#d7e3ff', accent: '#1e3a8a', frame: 0x334155, selfLit: true });
    board.position.set(-2.4, 1.75, -0.6);
    board.rotation.y = 0.6;
    root.add(inert(board));

    el.setObject3D('mesh', root);

    let t = 0;
    return {
      tick(dt) {
        t += dt;
        sunMat.uniforms.uTime.value = t;
        sun.rotation.y += dt * 0.02;
        bodies.forEach((b) => {
          b.angle += dt * b.cfg.speed;
          b.holder.position.set(SUN.x + Math.cos(b.angle) * b.cfg.dist, SUN.y, SUN.z + Math.sin(b.angle) * b.cfg.dist);
          b.body.rotation.y += dt * b.cfg.spin;
          if (b.body.userData.clouds) b.body.userData.clouds.rotation.y += dt * b.cfg.spin * 0.12;
          if (b.holder.userData.moonPivot) b.holder.userData.moonPivot.rotation.y += dt * 0.35;
        });
      }
    };
  }

  /* ================================================================== *\
     7. Жібек жолы мұрасы: Ясауи кесенесі стиліндегі шартты модель
  \* ================================================================== */

  /** Преетам аспан моделі (three.js Sky.js негізінде, MIT лицензиясы). */
  function skyMaterial(sunDir) {
    return new THREE.ShaderMaterial({
      uniforms: {
        turbidity: { value: 3.2 },
        rayleigh: { value: 1.25 },
        mieCoefficient: { value: 0.005 },
        mieDirectionalG: { value: 0.8 },
        sunPosition: { value: sunDir.clone().multiplyScalar(450000) },
        up: { value: new THREE.Vector3(0, 1, 0) }
      },
      vertexShader: [
        'uniform vec3 sunPosition; uniform float rayleigh; uniform float turbidity; uniform float mieCoefficient; uniform vec3 up;',
        'varying vec3 vWorldPosition; varying vec3 vSunDirection; varying float vSunfade; varying vec3 vBetaR; varying vec3 vBetaM; varying float vSunE;',
        'const float e = 2.71828182845904523536;',
        'const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);',
        'const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);',
        'const float cutoffAngle = 1.6110731556870734; const float steepness = 1.5; const float EE = 1000.0;',
        'float sunIntensity(float c) { c = clamp(c, -1.0, 1.0); return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(c)) / steepness))); }',
        'vec3 totalMie(float T) { float c = (0.2 * T) * 10E-18; return 0.434 * c * MieConst; }',
        'void main() {',
        '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
        '  vWorldPosition = worldPosition.xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position.z = gl_Position.w;',
        '  vSunDirection = normalize(sunPosition);',
        '  vSunE = sunIntensity(dot(vSunDirection, up));',
        '  vSunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);',
        '  float rayleighCoefficient = rayleigh - (1.0 * (1.0 - vSunfade));',
        '  vBetaR = totalRayleigh * rayleighCoefficient;',
        '  vBetaM = totalMie(turbidity) * mieCoefficient;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vWorldPosition; varying vec3 vSunDirection; varying float vSunfade; varying vec3 vBetaR; varying vec3 vBetaM; varying float vSunE;',
        'uniform float mieDirectionalG; uniform vec3 up;',
        'const float pi = 3.141592653589793;',
        'const float rayleighZenithLength = 8.4E3; const float mieZenithLength = 1.25E3;',
        'const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;',
        'const float THREE_OVER_SIXTEENPI = 0.05968310365946075; const float ONE_OVER_FOURPI = 0.07957747154594767;',
        'float rayleighPhase(float c) { return THREE_OVER_SIXTEENPI * (1.0 + pow(c, 2.0)); }',
        'float hgPhase(float c, float g) { float g2 = pow(g, 2.0); float inv = 1.0 / pow(1.0 - 2.0 * g * c + g2, 1.5); return ONE_OVER_FOURPI * ((1.0 - g2) * inv); }',
        'void main() {',
        '  vec3 direction = normalize(vWorldPosition - cameraPosition);',
        '  float zenithAngle = acos(max(0.0, dot(up, direction)));',
        '  float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));',
        '  float sR = rayleighZenithLength * inverse; float sM = mieZenithLength * inverse;',
        '  vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));',
        '  float cosTheta = dot(direction, vSunDirection);',
        '  float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);',
        '  vec3 betaRTheta = vBetaR * rPhase;',
        '  float mPhase = hgPhase(cosTheta, mieDirectionalG);',
        '  vec3 betaMTheta = vBetaM * mPhase;',
        '  vec3 Lin = pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));',
        '  Lin *= mix(vec3(1.0), pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0 - dot(up, vSunDirection), 5.0), 0.0, 1.0));',
        '  vec3 L0 = vec3(0.1) * Fex;',
        '  float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);',
        '  L0 += (vSunE * 19000.0 * Fex) * sundisk;',
        '  vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);',
        '  vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * vSunfade))));',
        '  gl_FragColor = vec4(retColor, 1.0);',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}'
      ].join('\n'),
      side: THREE.BackSide,
      depthWrite: false
    });
  }

  /*
   * Әлемдік координатаға байланған «тозу» шуы. Қайталанатын текстураның
   * торы алыстан көрінбеуі үшін бетке ірі дақтар, тік жаңбыр іздері және
   * жерге жақын ылғал белдеуі қосылады.
   */
  const WEATHER_GLSL = [
    'varying vec3 vWPos;',
    'uniform vec4 uWeather;',
    'uniform float uDampH;',
    'float wHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float wNoise(vec3 x) {',
    '  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(wHash(i), wHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(wHash(i + vec3(0.0, 1.0, 0.0)), wHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
    '             mix(mix(wHash(i + vec3(0.0, 0.0, 1.0)), wHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(wHash(i + vec3(0.0, 1.0, 1.0)), wHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
    '}',
    'vec3 weatherTone(vec3 p) {',
    '  float s = uWeather.x;',
    '  float n = wNoise(p * s) * 0.5 + wNoise(p * s * 2.7) * 0.3 + wNoise(p * s * 7.3) * 0.2;',
    '  float streak = wNoise(vec3(p.x * 2.3, p.y * 0.07, p.z * 2.3)) * smoothstep(0.35, 1.0, wNoise(p * 0.11 + 3.0));',
    '  float damp = 1.0 - smoothstep(0.0, uDampH, p.y);',
    '  float k = 1.0 + (n - 0.5) * 2.0 * uWeather.y - streak * uWeather.z - damp * uWeather.w;',
    '  return vec3(k, k * (1.0 - 0.03 * (n - 0.5)), k * (1.0 - 0.07 * (n - 0.5)));',
    '}'
  ].join('\n');

  function weathered(material, opts) {
    const o = Object.assign({ scale: 0.3, amount: 0.16, streaks: 0.14, damp: 0.14, dampHeight: 1.8 }, opts || {});
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uWeather = { value: new THREE.Vector4(o.scale, o.amount, o.streaks, o.damp) };
      shader.uniforms.uDampH = { value: o.dampHeight };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <worldpos_vertex>', [
          '#include <worldpos_vertex>',
          'vec4 wPos4 = vec4(transformed, 1.0);',
          '#ifdef USE_INSTANCING',
          'wPos4 = instanceMatrix * wPos4;',
          '#endif',
          'vWPos = (modelMatrix * wPos4).xyz;'
        ].join('\n'));
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + WEATHER_GLSL)
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= weatherTone(vWPos);');
    };
    material.customProgramCacheKey = () => 'weathered-v1';
    return material;
  }

  /**
   * Күйдірілген кірпіш қалауы: 25 × 6,25 см модуль (кірпіш + жік),
   * қатарлар жартылай ығысқан. Текстура 2 × 1 м ауданды бейнелейді.
   */
  function brickMaps(seed, palette) {
    const W = 1024;
    const H = 512;
    const pxm = 512;
    const brickL = 0.25 * pxm;
    const row = 0.0625 * pxm;
    const joint = 0.0125 * pxm;
    const r = rng(seed);
    const fbm = makeNoise(seed + 1);
    const tones = [];
    for (let i = 0; i < 4096; i++) tones.push(r());
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    const h = new Float32Array(W * H);
    const rough = new Float32Array(W * H);
    const p = palette || { brick: [204, 176, 134], mortar: [208, 196, 170] };
    for (let y = 0; y < H; y++) {
      const ri = Math.floor(y / row);
      const offset = (ri % 2) * brickL * 0.5;
      const ly = y - ri * row;
      for (let x = 0; x < W; x++) {
        const bx = Math.floor((x + offset) / brickL);
        const lx = (x + offset) - bx * brickL;
        const id = ((ri * 37 + (bx % (W / brickL)) * 11) % 4096 + 4096) % 4096;
        const n = fbm(x / 16, y / 16, W / 16, 4);
        const chip = fbm(x / 4, y / 4, W / 4, 2);
        const inMortar = ly < joint || lx < joint * 0.9;
        const edge = Math.min(ly - joint, row - ly, lx - joint * 0.9, brickL - lx) / joint;
        const i = (y * W + x) * 4;
        let col;
        if (inMortar || (edge < 0.7 && chip > 0.6)) {
          const m = 0.9 + (n - 0.5) * 0.25;
          col = [p.mortar[0] * m, p.mortar[1] * m, p.mortar[2] * m];
          h[y * W + x] = 0.12 + n * 0.2;
          rough[y * W + x] = 0.97;
        } else {
          const tone = 0.8 + tones[id] * 0.32 + (n - 0.5) * 0.2;
          const warm = (tones[(id + 7) % 4096] - 0.5) * 26;
          col = [p.brick[0] * tone + warm, p.brick[1] * tone + warm * 0.4, p.brick[2] * tone - warm * 0.3];
          h[y * W + x] = 0.75 + n * 0.25 - Math.max(0, 0.5 - edge) * 0.4;
          rough[y * W + x] = 0.84 + n * 0.1;
        }
        img.data[i] = Math.max(0, Math.min(255, col[0]));
        img.data[i + 1] = Math.max(0, Math.min(255, col[1]));
        img.data[i + 2] = Math.max(0, Math.min(255, col[2]));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, W, H, 3.2), { data: true }),
      roughnessMap: canvasTexture(grayCanvas(rough, W, H), { data: true }),
      size: [2, 1]
    };
  }

  /**
   * «Баннаи» қалауы: кірпіштер арасына глазурьленген кірпіштер қойылып,
   * ірі ромб торы, ішкі көгілдір ромб және ақ орталық шаршы құралады.
   * Ясауи кесенесінің бүйір қасбеттері осылай безендірілген.
   * Текстура 4 × 4 м; кірпіш беті 12,5 × 6,25 см.
   */
  function bannaiMaps(seed) {
    const S = 1024;
    const pxm = S / 4;
    const bw = 0.125 * pxm;
    const bh = 0.0625 * pxm;
    const joint = 3;
    const P = 2;
    const r = rng(seed);
    const fbm = makeNoise(seed + 5);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const h = new Float32Array(S * S);
    const rough = new Float32Array(S * S);
    const tone = [];
    for (let i = 0; i < 8192; i++) tone.push(r());
    const frac = (v) => v - Math.floor(v);
    const COLORS = [null, [34, 72, 164], [36, 150, 162], [228, 234, 226]];
    for (let y = 0; y < S; y++) {
      const ri = Math.floor(y / bh);
      const off = (ri % 2) * bw * 0.5;
      const ly = y - ri * bh;
      for (let x = 0; x < S; x++) {
        const ci = Math.floor((x + off) / bw);
        const lx = (x + off) - ci * bw;
        const cu = ((ci + 0.5) * bw - off) / pxm;
        const cv = (ri + 0.5) * bh / pxm;
        const a = frac((cu + cv) / P);
        const b = frac((cu - cv) / P);
        const net = Math.min(Math.min(a, 1 - a), Math.min(b, 1 - b)) * P / Math.SQRT2;
        const inner = Math.max(Math.abs(a - 0.5), Math.abs(b - 0.5));
        let kind = 0;
        if (net < 0.1) kind = 1;
        else if (inner < 0.05) kind = 3;
        else if (inner < 0.14) kind = 2;
        const id = ((ri * 131 + ((ci % 32) + 32) % 32 * 7) % 8192 + 8192) % 8192;
        // Глазурьдің бір бөлігі түсіп қалған — астынан қарапайым кірпіш көрінеді.
        if (kind && tone[(id + 3) % 8192] < 0.06) kind = 0;
        const n = fbm(x / 16, y / 16, S / 16, 3);
        const i = (y * S + x) * 4;
        let col;
        if (ly < joint || lx < joint) {
          const m = 0.9 + (n - 0.5) * 0.2;
          col = [200 * m, 186 * m, 158 * m];
          h[y * S + x] = 0.1;
          rough[y * S + x] = 0.96;
        } else if (kind) {
          const k = 0.86 + tone[id] * 0.24 + (n - 0.5) * 0.1;
          col = COLORS[kind].map((v) => v * k);
          h[y * S + x] = 0.82 + n * 0.06;
          rough[y * S + x] = 0.42 + tone[(id + 11) % 8192] * 0.2;
        } else {
          const k = 0.8 + tone[id] * 0.3 + (n - 0.5) * 0.2;
          col = [204 * k, 176 * k, 134 * k];
          h[y * S + x] = 0.78 + n * 0.2;
          rough[y * S + x] = 0.86;
        }
        img.data[i] = Math.max(0, Math.min(255, col[0]));
        img.data[i + 1] = Math.max(0, Math.min(255, col[1]));
        img.data[i + 2] = Math.max(0, Math.min(255, col[2]));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 3), { data: true }),
      roughnessMap: canvasTexture(grayCanvas(rough, S, S), { data: true }),
      size: [4, 4]
    };
  }

  /**
   * Глазурьленген плитка (күмбез, барабан, белдеу): ұсақ плиткалар,
   * көгілдір мен кобальт реңкі, ромб тәрізді геометриялық өрнек.
   */
  function glazedTileMaps(seed, opts) {
    const o = opts || {};
    const S = 512;
    const r = rng(seed);
    const fbm = makeNoise(seed + 3);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const h = new Float32Array(S * S);
    const tw = S / (o.cols || 16);
    const th = S / (o.rows || 32);
    const grout = 2;
    const base = o.base || [30, 158, 166];
    const accent = o.accent || [22, 70, 150];
    const light = o.light || [214, 232, 222];
    const tileTone = [];
    for (let i = 0; i < 2048; i++) tileTone.push(r());
    for (let y = 0; y < S; y++) {
      const rowi = Math.floor(y / th);
      const off = (rowi % 2) * tw * 0.5;
      for (let x = 0; x < S; x++) {
        const coli = Math.floor((x + off) / tw);
        const lx = (x + off) - coli * tw;
        const ly = y - rowi * th;
        const i = (y * S + x) * 4;
        const isGrout = lx < grout || ly < grout;
        const u = ((x / S) * 4) % 1 - 0.5;
        const v = ((y / S) * 4) % 1 - 0.5;
        const dia = Math.abs(Math.abs(u) + Math.abs(v) - 0.42);
        const star = Math.abs(Math.hypot(u, v) - 0.12);
        let col;
        if (isGrout) {
          col = [90, 96, 88];
          h[y * S + x] = 0.2;
        } else {
          const t = tileTone[(rowi * 31 + (coli % (o.cols || 16))) % 2048];
          const n = (fbm(x / 16, y / 16, S / 16, 3) - 0.5) * 0.12;
          if (o.pattern !== false && dia < 0.035) col = accent.slice();
          else if (o.pattern !== false && star < 0.03) col = light.slice();
          else col = base.slice();
          const k = 0.86 + t * 0.22 + n;
          col = [col[0] * k, col[1] * k, col[2] * k];
          h[y * S + x] = 0.85 + n;
        }
        img.data[i] = Math.max(0, Math.min(255, col[0]));
        img.data[i + 1] = Math.max(0, Math.min(255, col[1]));
        img.data[i + 2] = Math.max(0, Math.min(255, col[2]));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 2.4), { data: true })
    };
  }

  /** Құм: ұсақ дән мен жел толқындары. Текстура 4 × 4 м ауданды бейнелейді. */
  function sandMaps(seed) {
    const S = 512;
    const fbm = makeNoise(seed);
    const r = rng(seed + 1);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const h = new Float32Array(S * S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const big = fbm(x / 64, y / 64, S / 64, 4);
        const ripple = Math.sin((y + big * 90 + fbm(x / 32, y / 32, S / 32, 2) * 30) / 6.5 * 1) * 0.5 + 0.5;
        const grain = r();
        const v = 0.86 + (big - 0.5) * 0.2 + (grain - 0.5) * 0.08 + ripple * 0.04;
        const i = (y * S + x) * 4;
        img.data[i] = Math.min(255, v * 214);
        img.data[i + 1] = Math.min(255, v * 186);
        img.data[i + 2] = Math.min(255, v * 140);
        img.data[i + 3] = 255;
        h[y * S + x] = ripple * 0.5 + grain * 0.25 + big * 0.5;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 1.6), { data: true })
    };
  }

  /** Әктас тақталар: 1 × 0,5 м, қатарлары ығысқан. Текстура 4 × 4 м. */
  function pavingMaps(seed) {
    const S = 512;
    const r = rng(seed);
    const fbm = makeNoise(seed + 2);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const h = new Float32Array(S * S);
    const sw = S / 4;
    const sh = S / 8;
    const tones = [];
    for (let i = 0; i < 64; i++) tones.push(r());
    for (let y = 0; y < S; y++) {
      const ri = Math.floor(y / sh);
      const off = (ri % 2) * sw * 0.5;
      for (let x = 0; x < S; x++) {
        const ci = Math.floor((x + off) / sw) % 4;
        const lx = (x + off) % sw;
        const ly = y - ri * sh;
        const joint = lx < 1.5 || ly < 1.5;
        const n = fbm(x / 16, y / 16, S / 16, 4);
        const t = tones[(ri * 5 + ci) % 64];
        const v = joint ? 0.5 : 0.84 + t * 0.12 + (n - 0.5) * 0.16;
        const i = (y * S + x) * 4;
        img.data[i] = v * 220;
        img.data[i + 1] = v * 206;
        img.data[i + 2] = v * 182;
        img.data[i + 3] = 255;
        h[y * S + x] = joint ? 0.2 : 0.8 + n * 0.2;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 2.2), { data: true }),
      size: [4, 4]
    };
  }

  /** Текстураны берілген қайталану санымен көшіру (сурет ортақ қалады). */
  function repeated(tex, rx, ry) {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(rx, ry);
    return t;
  }

  function materialFromMaps(maps, rx, ry, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      map: repeated(maps.map, rx, ry),
      normalMap: maps.normalMap ? repeated(maps.normalMap, rx, ry) : null,
      roughnessMap: maps.roughnessMap ? repeated(maps.roughnessMap, rx, ry) : null,
      roughness: maps.roughnessMap ? 1 : 0.9,
      metalness: 0
    }, extra || {}));
  }

  /** Отырар үлгісіндегі құмыраның текстурасы: саз, көгілдір глазурь, қоңыр өрнек белдеуі. */
  function jugTexture() {
    const W = 1024;
    const H = 512;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const fbm = makeNoise(77);
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = 1 - y / H;
        const drip = 0.3 + Math.sin(x / 23) * 0.02 + (fbm(x / 32, 1, W / 32, 3) - 0.5) * 0.08;
        const n = fbm(x / 32, y / 32, W / 32, 4);
        const i = (y * W + x) * 4;
        let col;
        if (v < drip) col = [176 + n * 30, 112 + n * 20, 76 + n * 10];
        else col = [44 + n * 30, 140 + n * 30, 132 + n * 24];
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(38, 30, 22, 0.9)';
    ctx.fillStyle = 'rgba(38, 30, 22, 0.88)';
    [0.27, 0.43].forEach((v) => {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, v * H);
      ctx.lineTo(W, v * H);
      ctx.stroke();
    });
    for (let k = 0; k < 12; k++) {
      const cx = (k + 0.5) * (W / 12);
      const cy = 0.35 * H;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.stroke();
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 9, 3.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(cx + W / 24, cy - 30);
      ctx.lineTo(cx + W / 24, cy + 30);
      ctx.stroke();
    }
    return canvasTexture(c);
  }

  /** Күміс дирхамның бедері: нүктелі жиек, ішкі шеңберлер, ортадағы жазу жолдары. */
  function coinMaps(seed) {
    const S = 256;
    const h = new Float32Array(S * S);
    const r = rng(seed);
    const set = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < S && y < S) h[y * S + x] = Math.max(h[y * S + x], v);
    };
    const ring = (rad, w, v) => {
      for (let a = 0; a < 2000; a++) {
        const t = (a / 2000) * Math.PI * 2;
        for (let d = -w; d <= w; d++) set(Math.round(S / 2 + Math.cos(t) * (rad + d)), Math.round(S / 2 + Math.sin(t) * (rad + d)), v);
      }
    };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) h[y * S + x] = 0.3 + r() * 0.04;
    ring(118, 3, 1);
    for (let k = 0; k < 48; k++) {
      const t = (k / 48) * Math.PI * 2;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy <= 14) set(Math.round(S / 2 + Math.cos(t) * 104 + dx), Math.round(S / 2 + Math.sin(t) * 104 + dy), 0.9);
        }
      }
    }
    ring(90, 2, 0.85);
    ring(60, 2, 0.85);
    for (let k = 0; k < 6; k++) {
      const y = 92 + k * 15;
      const len = 22 + r() * 40;
      for (let x = Math.round(128 - len); x < 128 + len; x++) {
        if (r() > 0.18) for (let w = -2; w <= 2; w++) set(x, y + w, 0.95);
      }
    }
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) {
      const v = 120 + h[i] * 110;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v * 0.98;
      img.data[i * 4 + 2] = v * 0.93;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c, { clamp: true }),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 6), { data: true, clamp: true })
    };
  }

  /** Алыстағы төбелер сақинасы (Қаратау жотасы солтүстік-шығыста). */
  function hillsRing(seed, mountainDir) {
    const fbm = makeNoise(seed);
    const SEG = 384;
    const RINGS = 10;
    const R0 = 300;
    const R1 = 820;
    const pos = [];
    const idx = [];
    for (let j = 0; j <= RINGS; j++) {
      const t = j / RINGS;
      const rad = R0 + (R1 - R0) * t;
      for (let i = 0; i <= SEG; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const ridge = fbm((i / SEG) * 24, j * 0.9, 24, 5);
        const toward = 0.5 + 0.5 * Math.cos(th - mountainDir);
        const amp = 10 + 95 * Math.pow(toward, 2.2);
        const prof = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.25)), 0.8);
        const y = prof * amp * (0.25 + ridge * 1.1) - (j === RINGS ? 4 : 0);
        pos.push(Math.cos(th) * rad, y, Math.sin(th) * rad);
      }
    }
    for (let j = 0; j < RINGS; j++) {
      for (let i = 0; i < SEG; i++) {
        const a = j * (SEG + 1) + i;
        const b = a + SEG + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = weathered(new THREE.MeshStandardMaterial({ color: 0xb9a587, roughness: 1 }), { scale: 0.02, amount: 0.2, streaks: 0, damp: 0 });
    return new THREE.Mesh(geo, mat);
  }

  /*
   * Ясауи кесенесінің 3D моделі (models/yasawi.bin). Файлды STL-ден
   * tools/build_yasawi.py жасайды: төбелер uint16-ға квантталған, үшбұрыштар
   * материал топтарына бөлінген. Нормальдар мен UV браузерде есептеледі.
   */
  const MAUSOLEUM_UV = {
    brick: { tile: [2, 1] },
    bannai: { tile: [4, 4] },
    roof: { tile: [4, 4] },
    bigDome: { tile: [2.4, 2.4], cyl: true },
    ribbedDome: { tile: [2.4, 2.4], cyl: true },
    drumRibbed: { tile: [3, 3], cyl: true },
    drumBig: { tile: [3, 3], cyl: true },
    wood: { tile: [1, 1] },
    door: { tile: [2, 4] },
    dark: { tile: [1, 1] }
  };

  /** Индекстелген топты жеке үшбұрыштарға жаю: қыр бұрышы бар нормальдар және UV. */
  function expandMausoleumGroup(p, nV, idx, spec, centre) {
    const nT = idx.length / 3;
    const fn = new Float32Array(nT * 3);
    const fa = new Float32Array(nT);
    for (let t = 0; t < nT; t++) {
      const a = idx[t * 3] * 3;
      const b = idx[t * 3 + 1] * 3;
      const c = idx[t * 3 + 2] * 3;
      const e1x = p[b] - p[a];
      const e1y = p[b + 1] - p[a + 1];
      const e1z = p[b + 2] - p[a + 2];
      const e2x = p[c] - p[a];
      const e2y = p[c + 1] - p[a + 1];
      const e2z = p[c + 2] - p[a + 2];
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;
      const len = Math.hypot(nx, ny, nz) || 1e-12;
      fn[t * 3] = nx / len;
      fn[t * 3 + 1] = ny / len;
      fn[t * 3 + 2] = nz / len;
      fa[t] = len;
    }
    // Әр төбеге жанасатын үшбұрыштар тізімі (CSR).
    const start = new Uint32Array(nV + 1);
    for (let i = 0; i < idx.length; i++) start[idx[i] + 1]++;
    for (let v = 0; v < nV; v++) start[v + 1] += start[v];
    const fill = start.slice(0, nV);
    const inc = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) inc[fill[idx[i]]++] = (i / 3) | 0;

    const cosCrease = Math.cos((38 * Math.PI) / 180);
    const pos = new Float32Array(nT * 9);
    const nor = new Float32Array(nT * 9);
    const uv = new Float32Array(nT * 6);
    let rMax = 0;
    if (spec.cyl) {
      for (let v = 0; v < nV; v++) rMax = Math.max(rMax, Math.hypot(p[v * 3] - centre[0], p[v * 3 + 2] - centre[1]));
    }
    const around = spec.cyl ? Math.max(1, Math.round((2 * Math.PI * rMax) / spec.tile[0])) : 1;
    for (let t = 0; t < nT; t++) {
      const tx = fn[t * 3];
      const ty = fn[t * 3 + 1];
      const tz = fn[t * 3 + 2];
      const ax = Math.abs(tx);
      const ay = Math.abs(ty);
      const az = Math.abs(tz);
      for (let k = 0; k < 3; k++) {
        const v = idx[t * 3 + k];
        const o = t * 9 + k * 3;
        const x = p[v * 3];
        const y = p[v * 3 + 1];
        const z = p[v * 3 + 2];
        pos[o] = x;
        pos[o + 1] = y;
        pos[o + 2] = z;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        for (let j = start[v]; j < start[v + 1]; j++) {
          const f = inc[j];
          if (fn[f * 3] * tx + fn[f * 3 + 1] * ty + fn[f * 3 + 2] * tz < cosCrease) continue;
          sx += fn[f * 3] * fa[f];
          sy += fn[f * 3 + 1] * fa[f];
          sz += fn[f * 3 + 2] * fa[f];
        }
        const l = Math.hypot(sx, sy, sz) || 1;
        nor[o] = sx / l;
        nor[o + 1] = sy / l;
        nor[o + 2] = sz / l;
        let u;
        let w;
        if (spec.cyl) {
          const dx = x - centre[0];
          const dz = z - centre[1];
          u = (Math.atan2(dz, dx) / (2 * Math.PI) + 0.5) * around;
          // Меридиан бойымен шамамен доға ұзындығы: биіктік + радиустың кемуі.
          w = (y + (rMax - Math.hypot(dx, dz))) / spec.tile[1];
        } else if (ax >= ay && ax >= az) {
          u = z / spec.tile[0];
          w = y / spec.tile[1];
        } else if (ay >= az) {
          u = x / spec.tile[0];
          w = z / spec.tile[1];
        } else {
          u = x / spec.tile[0];
          w = y / spec.tile[1];
        }
        uv[t * 6 + k * 2] = u;
        uv[t * 6 + k * 2 + 1] = w;
      }
      if (spec.cyl) {
        // Бұрыштың ±π жігінен өтетін үшбұрыштың u мәндерін бір жаққа келтіру.
        const u0 = uv[t * 6];
        const u1 = uv[t * 6 + 2];
        const u2 = uv[t * 6 + 4];
        if (Math.max(u0, u1, u2) - Math.min(u0, u1, u2) > around / 2) {
          for (let k = 0; k < 3; k++) if (uv[t * 6 + k * 2] < around / 2) uv[t * 6 + k * 2] += around;
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    return geo;
  }

  function parseMausoleum(buffer) {
    const dv = new DataView(buffer);
    const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
    if (magic !== 'YSW1') throw new Error('yasawi.bin: пішім танылмады');
    const jsonLen = dv.getUint32(4, true);
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, jsonLen)));
    const q = new Uint16Array(buffer, 8 + jsonLen, head.nVerts * 3);
    const pos = new Float32Array(head.nVerts * 3);
    for (let i = 0; i < head.nVerts; i++) {
      for (let k = 0; k < 3; k++) pos[i * 3 + k] = head.min[k] + (q[i * 3 + k] / 65535) * (head.max[k] - head.min[k]);
    }
    return {
      min: head.min,
      max: head.max,
      groups: head.groups.map((g) => {
        const idx = g.i32 ? new Uint32Array(buffer, g.iOffset, g.iCount) : new Uint16Array(buffer, g.iOffset, g.iCount);
        const spec = MAUSOLEUM_UV[g.mat] || { tile: [2, 2] };
        return { mat: g.mat, centre: g.centre, geometry: expandMausoleumGroup(pos.subarray(g.vStart * 3, (g.vStart + g.vCount) * 3), g.vCount, idx, spec, g.centre) };
      })
    };
  }

  /** Кесене материалдары: кірпіш, баннаи қалау, шатыр, глазурьленген күмбездер. */
  function mausoleumMaterials() {
    const brick = brickMaps(71);
    const bannai = bannaiMaps(73);
    const roof = brickMaps(74, { brick: [178, 156, 122], mortar: [190, 178, 154] });
    const dome = glazedTileMaps(85, { base: [40, 112, 182], pattern: false, cols: 28, rows: 28 });
    const ribbed = glazedTileMaps(81, { base: [34, 116, 176], accent: [18, 52, 124], light: [190, 218, 226] });
    const band = glazedTileMaps(82, { base: [22, 56, 128], accent: [34, 160, 168], light: [228, 230, 214], cols: 20, rows: 24 });
    const band2 = glazedTileMaps(83, { base: [26, 50, 112], accent: [196, 164, 92], light: [232, 230, 214], cols: 20, rows: 24 });
    const glazed = (maps, extra) => new THREE.MeshPhysicalMaterial(Object.assign({
      map: repeated(maps.map, 1, 1),
      normalMap: repeated(maps.normalMap, 1, 1),
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2
    }, extra || {}));
    const door = (() => {
      const S = 256;
      const fbm = makeNoise(91);
      const c = makeCanvas(S, S * 2);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(S, S * 2);
      for (let y = 0; y < S * 2; y++) {
        for (let x = 0; x < S; x++) {
          const grain = fbm(x / 4, y / 64, S / 4, 4);
          const px = x % (S / 2);
          const py = y % (S / 3);
          const panel = px > 12 && px < S / 2 - 12 && py > 12 && py < S / 3 - 12;
          const v = (0.5 + grain * 0.35) * (panel ? 0.85 : 1);
          const i = (y * S + x) * 4;
          img.data[i] = v * 110;
          img.data[i + 1] = v * 72;
          img.data[i + 2] = v * 42;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return new THREE.MeshStandardMaterial({ map: canvasTexture(c), roughness: 0.75 });
    })();
    return {
      brick: weathered(materialFromMaps(brick, 1, 1)),
      bannai: weathered(materialFromMaps(bannai, 1, 1), { amount: 0.12, streaks: 0.12, damp: 0.1 }),
      roof: weathered(materialFromMaps(roof, 1, 1), { scale: 0.15, amount: 0.2, streaks: 0, damp: 0 }),
      bigDome: glazed(dome),
      ribbedDome: glazed(ribbed),
      drumRibbed: glazed(band, { roughness: 0.35, clearcoat: 0.45 }),
      drumBig: glazed(band2, { roughness: 0.35, clearcoat: 0.45 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x5e4b39, roughness: 0.92 }),
      door: door,
      dark: new THREE.MeshStandardMaterial({ color: 0x15110d, roughness: 1 })
    };
  }

  /** Модельді жүктеп, топтарды материалдарымен бірге group ішіне қосу. */
  function loadMausoleum(group) {
    const mats = mausoleumMaterials();
    return fetch(asset('models/yasawi.bin'))
      .then((r) => {
        if (!r.ok) throw new Error('yasawi.bin ' + r.status);
        return r.arrayBuffer();
      })
      .then((buf) => {
        const model = parseMausoleum(buf);
        model.groups.forEach((g) => {
          const mesh = new THREE.Mesh(g.geometry, mats[g.mat] || mats.brick);
          mesh.castShadow = g.mat !== 'dark';
          mesh.receiveShadow = true;
          group.add(inert(mesh));
        });
        return model;
      });
  }

  /** Металл жақтаулы шыны витрина тұғырда. */
  function vitrine(x, z, mats, glass) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const body = new THREE.MeshStandardMaterial({ color: 0x2c2926, metalness: 0.55, roughness: 0.42 });
    const plinth = new THREE.Mesh(roundedBox(0.7, 1.0, 0.7, 0.012), body);
    plinth.geometry.rotateX(0);
    const plinthBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.98, 0.7), body);
    plinthBox.position.y = 0.49 + 0.02;
    g.add(plinthBox);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.66), mats.blackAnodized);
    foot.position.y = 0.02;
    g.add(foot);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.74), body);
    top.position.y = 1.015;
    g.add(top);
    const W = 0.6;
    const H = 0.52;
    const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), glass);
    box.position.y = 1.03 + H / 2;
    g.add(box);
    const e = 0.012;
    const edge = (sx, sy, sz, px, py, pz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mats.brass);
      m.position.set(px, py, pz);
      g.add(m);
    };
    [-1, 1].forEach((i) => [-1, 1].forEach((k) => edge(e, H, e, (i * W) / 2, 1.03 + H / 2, (k * W) / 2)));
    [1.03, 1.03 + H].forEach((y) => {
      [-1, 1].forEach((k) => {
        edge(W + e, e, e, 0, y, (k * W) / 2);
        edge(e, e, W + e, (k * W) / 2, y, 0);
      });
    });
    return g;
  }

  function buildHistory(el) {
    const root = new THREE.Group();
    const scene = el.sceneEl.object3D;
    const SUN = new THREE.Vector3(0.42, 0.62, 0.66).normalize();
    const mats = standardMaterials();

    // Аспан, ауадағы шаң-тұман және күн.
    const sky = new THREE.Mesh(new THREE.SphereGeometry(850, 48, 24), skyMaterial(SUN));
    sky.frustumCulled = false;
    root.add(inert(sky));
    scene.fog = new THREE.Fog(0xcfd5d8, 160, 1050);
    const sunLight = new THREE.DirectionalLight(0xfff1de, 3.1);
    const target = new THREE.Vector3(2, 0, -52);
    sunLight.position.copy(SUN).multiplyScalar(150).add(target);
    sunLight.target.position.copy(target);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    const sc = sunLight.shadow.camera;
    sc.left = -64; sc.right = 64; sc.top = 64; sc.bottom = -64; sc.near = 60; sc.far = 260;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.05;
    root.add(sunLight);
    root.add(sunLight.target);

    // Жер: құмды дала, тас алаң және алыстағы төбелер.
    const sand = sandMaps(61);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1700, 1700),
      weathered(materialFromMaps(sand, 425, 425, { roughness: 0.96 }), { scale: 0.025, amount: 0.22, streaks: 0, damp: 0 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(inert(ground));
    root.add(inert(hillsRing(33, -Math.PI * 0.62)));
    const paving = pavingMaps(62);
    const plaza = new THREE.Mesh(worldUV(new THREE.BoxGeometry(120, 0.12, 150), 1),
      weathered(materialFromMaps(paving, 1 / 4, 1 / 4, { roughness: 0.82 }), { scale: 0.12, amount: 0.12, streaks: 0, damp: 0 }));
    plaza.position.set(4, 0, -62);
    root.add(inert(shadow(plaza, false, true)));

    // Кесене: порталы сол жақта, ұзын бүйір қасбеті оң жақта көрінетіндей бұрылған.
    const building = new THREE.Group();
    building.name = 'mausoleum';
    building.position.set(6, 0.06, -78);
    building.rotation.y = Math.PI * 0.68;
    root.add(building);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const ready = loadMausoleum(building).then((model) => {
      // Таңдау үшін жеңіл көрінбейтін пішіндер: 145 мың үшбұрышты сәулемен тексермеу үшін.
      const ribbed = model.groups.find((g) => g.mat === 'ribbedDome');
      const dome = new THREE.Group();
      const c = ribbed ? ribbed.centre : [0, 24];
      const ball = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), proxyMat);
      ball.position.set(c[0], 26.5, c[1]);
      dome.add(ball);
      building.add(dome);
      tagObject(dome, 'Қабырғалы көгілдір күмбез', 'Гурхана (қабір бөлмесі) үстіндегі қырлы күмбез биік барабанға орнатылған; беті көгілдір глазурьленген плиткамен қапталған. Түркістандағы Қожа Ахмет Ясауи кесенесінің (XIV ғ. соңы) басты белгілерінің бірі.', 'h1');
      const portal = new THREE.Mesh(new THREE.BoxGeometry(model.max[0] - model.min[0], 36, 6), proxyMat);
      portal.position.set(0, 18, model.min[2] + 3);
      building.add(portal);
      tagObject(portal, 'Кесене порталы (пештақ)', 'Сүйір аркалы терең қуыс. Портал аяқталмай қалған: беті қапталмаған, қуыс ішінде құрылыс кезіндегі ағаш арқалықтар сақталған.');
      // A-Frame сәулесі тек .el сілтемесі бар нысандарды санайды; setObject3D-тен
      // кейін қосылған бөліктерге оны өзіміз береміз.
      building.traverse((o) => {
        o.el = el;
      });
    });

    /* ---- Жәдігерлер витриналары ---- */
    const exhibits = new THREE.Group();
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 1, thickness: 0.006, ior: 1.5, specularIntensity: 1 });

    const jugCase = vitrine(-1.45, -0.6, mats, glass);
    {
      const prof = [[0, 0.0], [0.055, 0.0], [0.062, 0.012], [0.058, 0.03], [0.095, 0.08], [0.128, 0.16], [0.124, 0.22],
        [0.09, 0.28], [0.05, 0.31], [0.042, 0.34], [0.05, 0.37], [0.062, 0.385], [0.056, 0.39], [0.04, 0.37], [0.034, 0.34], [0.036, 0.3], [0, 0.29]];
      const jugMat = new THREE.MeshPhysicalMaterial({ map: jugTexture(), roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.25 });
      const jug = new THREE.Mesh(lathe(prof, 96), jugMat);
      jug.position.y = 1.03;
      const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.115, 0.19, 0), new THREE.Vector3(0.175, 0.25, 0), new THREE.Vector3(0.16, 0.33, 0), new THREE.Vector3(0.045, 0.345, 0)
      ]), 32, 0.011, 12), jugMat);
      jug.add(handle);
      jug.rotation.y = -0.6;
      jugCase.add(jug);
      tagObject(jugCase, 'Отырар үлгісіндегі құмыра', 'Саз құмыра: иығы көгілдір глазурьмен жабылып, қоңыр бояумен өрнектелген (шартты модель). Отырар қыш шеберханалары Жібек жолындағы ірі орталықтардың бірі болған.', 'h2');
    }
    exhibits.add(jugCase);

    const coinCase = vitrine(1.45, -0.6, mats, glass);
    {
      const velvet = new THREE.MeshPhysicalMaterial({ color: 0x3a0c12, roughness: 0.9, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x8a2a36) });
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), velvet);
      tray.position.y = 1.045;
      coinCase.add(tray);
      const cm = coinMaps(101);
      const silver = new THREE.MeshStandardMaterial({ color: 0xd9dade, metalness: 1, roughness: 0.34, map: cm.map, normalMap: cm.normalMap });
      const edge = new THREE.MeshStandardMaterial({ color: 0xb8b9bc, metalness: 1, roughness: 0.45 });
      const coinGeo = new THREE.CylinderGeometry(0.0145, 0.0145, 0.0016, 48);
      const r = rng(5);
      [[-0.13, -0.06], [-0.06, 0.04], [0.0, -0.07], [0.07, 0.05], [0.13, -0.04], [-0.12, 0.08], [0.11, 0.1]].forEach((p) => {
        const coin = new THREE.Mesh(coinGeo, [edge, silver, silver]);
        coin.position.set(p[0], 1.0608, p[1]);
        coin.rotation.y = r() * Math.PI * 2;
        coinCase.add(coin);
      });
      tagObject(coinCase, 'Күміс дирхамдар', 'X–XII ғасырлардағы күміс теңгелер (диаметрі ≈ 25–30 мм). Алыс қалалармен сауда байланысының дәлелі — Жібек жолындағы есеп айырысу құралы.', 'h3');
    }
    exhibits.add(coinCase);

    [[-1.45, 'Құмыра · Отырар үлгісі'], [1.45, 'Күміс дирхамдар · X–XII ғғ.']].forEach((d) => {
      const c = makeCanvas(512, 128);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#b08d57';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#231a10';
      fitText(ctx, d[1], 24, 80, 464, 46, 'bold');
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshStandardMaterial({ map: canvasTexture(c, { clamp: true }), metalness: 0.7, roughness: 0.35 }));
      plate.position.set(d[0], 0.84, -0.6 + 0.352);
      exhibits.add(inert(plate));
    });
    exhibits.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.material !== glass;
        o.receiveShadow = true;
      }
    });
    root.add(exhibits);

    // Түсіндірме тақтасы.
    const board = infoBoard('ҚОЖА АХМЕТ ЯСАУИ КЕСЕНЕСІ', [
      'Түркістан · XIV ғ. соңы · Әмір Темірдің бұйрығымен',
      'Қазандық күмбезінің диаметрі 18,2 м',
      'Портал аяқталмаған: қуыста ағаш арқалықтар сақталған',
      'ЮНЕСКО Бүкіләлемдік мұра тізімінде (2003)'
    ], { width: 1.9, accent: '#6b3d17', aspect: 0.5, weight: '600', ink: '#15110c' });
    board.position.set(-3.1, 1.5, -1.0);
    board.rotation.y = 0.62;
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3b3027, metalness: 0.6, roughness: 0.5 });
    [-0.8, 0.8].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), legMat);
      leg.position.set(x, -0.75, -0.03);
      board.add(leg);
    });
    root.add(inert(shadow(board)));

    el.setObject3D('mesh', root);
    return {
      ready: ready,
      environment: { url: 'hdri/desert.hdr', intensity: 0.9, clampLum: 6, alignSun: SUN },
      onEnvironment() {
        glass.envMap = scene.environment;
      }
    };
  }

  /* ================================================================== *\
     8. Робототехника: палеттеу ұяшығы (6 осьтік өнеркәсіптік робот)
  \* ================================================================== */

  /** Эпоксидпен жабылған бетон еден: дақтар, ұсақ түйіршік, кесілген жіктер. 6 × 6 м. */
  function epoxyFloorMaps(seed) {
    const S = 1024;
    const r = rng(seed);
    const fbm = makeNoise(seed + 1);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const rough = new Float32Array(S * S);
    const h = new Float32Array(S * S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const big = fbm(x / 128, y / 128, S / 128, 4);
        const mid = fbm(x / 24, y / 24, S / 24, 3);
        const speck = r();
        const joint = x < 3 || y < 3;
        let v = 0.6 + (big - 0.5) * 0.12 + (mid - 0.5) * 0.05 + (speck > 0.985 ? -0.08 : 0) + (speck < 0.01 ? 0.06 : 0);
        if (joint) v *= 0.55;
        const i = (y * S + x) * 4;
        img.data[i] = v * 214;
        img.data[i + 1] = v * 218;
        img.data[i + 2] = v * 214;
        img.data[i + 3] = 255;
        // Жүру жолдарында жылтыр әрі тозған, шеттерінде күңгірттеу.
        rough[y * S + x] = joint ? 0.9 : 0.28 + big * 0.22 + (mid > 0.62 ? 0.12 : 0);
        h[y * S + x] = joint ? 0 : 1 - speck * 0.02;
      }
    }
    ctx.putImageData(img, 0, 0);
    return {
      map: canvasTexture(c),
      normalMap: canvasTexture(normalFromHeight(h, S, S, 1.5), { data: true }),
      roughnessMap: canvasTexture(grayCanvas(rough, S, S), { data: true }),
      size: [6, 6]
    };
  }

  /** Гофрленген картон қорап: талшықты крафт қағаз, жабысқақ таспа, штрих-код жапсырмасы. */
  function cardboardTexture(seed) {
    const S = 512;
    const r = rng(seed);
    const fbm = makeNoise(seed + 2);
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = fbm(x / 16, y / 16, S / 16, 4);
        const fibre = fbm(x / 2, y / 24, S / 2, 2);
        const v = 0.86 + (n - 0.5) * 0.14 + (fibre - 0.5) * 0.06 + (r() - 0.5) * 0.03;
        const i = (y * S + x) * 4;
        img.data[i] = v * 196;
        img.data[i + 1] = v * 152;
        img.data[i + 2] = v * 104;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Таспа: ортасынан өтетін жылтырлау жолақ.
    ctx.fillStyle = 'rgba(214, 178, 120, 0.85)';
    ctx.fillRect(0, S * 0.44, S, S * 0.12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, S * 0.45, S, S * 0.015);
    // Жапсырма мен штрих-код.
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(S * 0.08, S * 0.66, S * 0.36, S * 0.22);
    ctx.fillStyle = '#1b1b1b';
    let x = S * 0.1;
    while (x < S * 0.42) {
      const w = 1 + Math.floor(r() * 4);
      ctx.fillRect(x, S * 0.7, w, S * 0.11);
      x += w + 1 + Math.floor(r() * 3);
    }
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('KZ-0' + (100 + Math.floor(r() * 899)), S * 0.11, S * 0.86);
    // «Жоғары» белгісі.
    ctx.strokeStyle = 'rgba(30, 24, 18, 0.85)';
    ctx.fillStyle = 'rgba(30, 24, 18, 0.85)';
    ctx.lineWidth = 6;
    [0.62, 0.74].forEach((cx) => {
      ctx.beginPath();
      ctx.moveTo(S * cx, S * 0.86);
      ctx.lineTo(S * cx, S * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(S * cx - 16, S * 0.71);
      ctx.lineTo(S * cx, S * 0.66);
      ctx.lineTo(S * cx + 16, S * 0.71);
      ctx.fill();
    });
    return canvasTexture(c);
  }

  /** Ағаш (қарағай) текстурасы: талшық пен жылдық сақиналар. */
  function pineTexture(seed) {
    const W = 512;
    const H = 128;
    const fbm = makeNoise(seed);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const warp = fbm(x / 64, y / 16, W / 64, 3) * 6;
        const ring = 0.5 + 0.5 * Math.sin((y + warp * 3) * 0.55);
        const n = fbm(x / 8, y / 8, W / 8, 2);
        const v = 0.78 + ring * 0.1 + (n - 0.5) * 0.1;
        const i = (y * W + x) * 4;
        img.data[i] = v * 222;
        img.data[i + 1] = v * 184;
        img.data[i + 2] = v * 130;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(c);
  }

  /** Сымды тор (қоршау панелі): alphaTest арқылы ойықтары мөлдір. */
  function wireMeshTexture() {
    const S = 128;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, S, 10);
    ctx.fillRect(0, 0, 10, S);
    const t = canvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }

  /** Резеңке таспаның беті: ұсақ көлденең бедер. */
  function beltTexture() {
    const W = 64;
    const H = 256;
    const r = rng(9);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const rib = (y % 8) < 3 ? 1.12 : 0.92;
        const v = (0.18 + (r() - 0.5) * 0.03) * rib;
        const i = (y * W + x) * 4;
        img.data[i] = v * 255;
        img.data[i + 1] = v * 255;
        img.data[i + 2] = v * 262;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(c);
  }

  /** Бүйірінен қарағандағы дөңгелектелген, жіңішкеретін буын пішіні (L ұзындық, R1→R2 радиус). */
  function linkGeometry(L, R1, R2, depth) {
    const s = new THREE.Shape();
    s.moveTo(0, -R1);
    s.lineTo(L, -R2);
    s.absarc(L, 0, R2, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(0, R1);
    s.absarc(0, 0, R1, Math.PI / 2, Math.PI * 1.5, false);
    const bevel = Math.min(0.03, depth * 0.2);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 4,
      curveSegments: 32
    });
    geo.translate(0, 0, -(depth - bevel * 2) / 2);
    geo.computeVertexNormals();
    return geo;
  }

  /** Ось бойымен (X) жатқан цилиндр — қозғалтқыштар мен біліктерге. */
  function cylX(r1, r2, len, seg, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, seg || 40), mat);
    m.rotation.z = -Math.PI / 2;
    return m;
  }

  function cylZ(r, len, seg, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 40), mat);
    m.rotation.x = Math.PI / 2;
    return m;
  }

  /** Серво қозғалтқыш: денесі, қырлы радиатор сақиналары, қара қақпақ және коннектор. */
  function servoMotor(len, rad, mats) {
    const g = new THREE.Group();
    const body = cylZ(rad, len, 40, mats.motor);
    body.position.z = len / 2;
    g.add(body);
    for (let i = 1; i < 5; i++) {
      const fin = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.004, 6, 40), mats.motor);
      fin.position.z = (len * i) / 5;
      g.add(fin);
    }
    const cap = cylZ(rad * 0.94, 0.02, 40, mats.cap);
    cap.position.z = len + 0.01;
    g.add(cap);
    const plug = new THREE.Mesh(roundedBox(0.04, 0.035, 0.05, 0.006), mats.cap);
    plug.position.set(0, rad + 0.012, len * 0.7);
    g.add(plug);
    return g;
  }

  /** 6 осьтік робот. Буындар: j1 (бұрылу), j2 (иық), j3 (шынтақ), j5 (білезік), j6 (фланец). */
  function buildRobotArm(mats) {
    const L2 = 0.7;
    const L3 = 0.75;
    const A1 = 0.12;
    const H1 = 0.34;
    const robot = new THREE.Group();

    const base = new THREE.Mesh(lathe([[0, 0], [0.27, 0], [0.27, 0.035], [0.215, 0.05], [0.2, 0.15], [0.19, 0.16], [0, 0.16]], 64), mats.castGrey);
    robot.add(base);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.014, 6), mats.steel);
      bolt.position.set(Math.cos(a) * 0.24, 0.042, Math.sin(a) * 0.24);
      robot.add(bolt);
    }

    const j1 = new THREE.Group();
    j1.position.y = 0.16;
    robot.add(j1);
    const turret = new THREE.Mesh(lathe([[0, 0], [0.19, 0], [0.19, 0.02], [0.18, 0.16], [0.16, 0.2], [0, 0.2]], 64), mats.orange);
    j1.add(turret);
    const housing = new THREE.Mesh(roundedBox(0.32, 0.3, 0.34, 0.06), mats.orange);
    housing.position.set(0.05, 0.22, 0);
    j1.add(housing);
    const shoulderHub = cylZ(0.15, 0.36, 48, mats.orange);
    shoulderHub.position.set(A1, H1, 0);
    j1.add(shoulderHub);
    const m2 = servoMotor(0.17, 0.07, mats);
    m2.position.set(A1, H1, 0.18);
    j1.add(m2);
    const m1 = servoMotor(0.16, 0.06, mats);
    m1.rotation.x = -Math.PI / 2;
    m1.position.set(-0.12, 0.2, 0.05);
    j1.add(m1);

    // Иық буыны және төменгі иін.
    const j2 = new THREE.Group();
    j2.position.set(A1, H1, 0);
    j1.add(j2);
    const link2 = new THREE.Mesh(linkGeometry(L2, 0.135, 0.105, 0.2), mats.orange);
    j2.add(link2);
    const cable2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.12, -0.12), new THREE.Vector3(0.3, 0.14, -0.13), new THREE.Vector3(0.6, 0.12, -0.12)
    ]), 24, 0.022, 10), mats.hose);
    j2.add(cable2);

    // Шынтақ және жоғарғы иін (білек).
    const j3 = new THREE.Group();
    j3.position.set(L2, 0, 0);
    j2.add(j3);
    const elbowHub = cylZ(0.115, 0.28, 48, mats.orange);
    j3.add(elbowHub);
    const m3 = servoMotor(0.13, 0.06, mats);
    m3.position.set(0, 0, 0.14);
    j3.add(m3);
    const rear = new THREE.Mesh(roundedBox(0.34, 0.2, 0.2, 0.05), mats.orange);
    rear.position.set(0.0, 0.0, 0);
    j3.add(rear);
    const m4 = servoMotor(0.14, 0.055, mats);
    m4.rotation.y = -Math.PI / 2;
    m4.position.set(-0.17, 0, 0);
    j3.add(m4);
    const forearm = cylX(0.085, 0.062, 0.56, 48, mats.orange);
    forearm.position.set(0.16 + 0.28, 0, 0);
    j3.add(forearm);
    const ring = cylX(0.07, 0.07, 0.02, 48, mats.castGrey);
    ring.position.set(0.25, 0, 0);
    j3.add(ring);
    [-1, 1].forEach((s) => {
      const plate = new THREE.Mesh(roundedBox(0.13, 0.11, 0.024, 0.01), mats.orange);
      plate.position.set(L3 - 0.03, 0, s * 0.058);
      j3.add(plate);
    });
    const cable3 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.1, -0.11), new THREE.Vector3(0.2, 0.1, -0.09), new THREE.Vector3(0.55, 0.08, -0.07), new THREE.Vector3(0.68, 0.05, -0.04)
    ]), 24, 0.016, 10), mats.hose);
    j3.add(cable3);

    // Білезік (j5) пен фланец (j6).
    const j5 = new THREE.Group();
    j5.position.set(L3, 0, 0);
    j3.add(j5);
    const wristHub = cylZ(0.045, 0.092, 32, mats.castGrey);
    j5.add(wristHub);
    const wrist = cylX(0.047, 0.044, 0.08, 40, mats.orange);
    wrist.position.x = 0.04;
    j5.add(wrist);
    const j6 = new THREE.Group();
    j6.position.x = 0.085;
    j5.add(j6);
    const flange = cylX(0.04, 0.04, 0.014, 40, mats.steel);
    flange.position.x = 0.007;
    j6.add(flange);

    // Пневматикалық параллель қармауыш (саусақтары жергілікті Z бойымен жүреді).
    const gripper = new THREE.Group();
    gripper.position.x = 0.014;
    j6.add(gripper);
    const adapter = cylX(0.04, 0.045, 0.03, 32, mats.aluminium);
    adapter.position.x = 0.015;
    gripper.add(adapter);
    const gBody = new THREE.Mesh(roundedBox(0.075, 0.07, 0.36, 0.008), mats.aluminium);
    gBody.position.x = 0.03 + 0.0375;
    gripper.add(gBody);
    const fingers = [];
    [-1, 1].forEach((s) => {
      const f = new THREE.Group();
      const jaw = new THREE.Mesh(roundedBox(0.03, 0.05, 0.03, 0.004), mats.blackAnodized);
      jaw.position.x = 0.115;
      f.add(jaw);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.012), mats.blackAnodized);
      blade.position.set(0.18, 0, -s * 0.008);
      f.add(blade);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.006), mats.rubber);
      pad.position.set(0.215, 0, -s * 0.017);
      f.add(pad);
      f.userData.side = s;
      gripper.add(f);
      fingers.push(f);
    });
    [-1, 1].forEach((s) => {
      const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, 0.036, s * 0.03), new THREE.Vector3(0.0, 0.06, s * 0.03), new THREE.Vector3(-0.1, 0.07, s * 0.02), new THREE.Vector3(-0.25, 0.06, -0.03)
      ]), 20, 0.0045, 8), s > 0 ? mats.hoseBlue : mats.hose);
      j5.add(hose);
    });

    // Салмақ теңгергіш (газ серіппесі): турельге және төменгі иінге бекітілген.
    const balancer = new THREE.Group();
    const housingB = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 32), mats.castGrey);
    housingB.position.y = 0.15;
    balancer.add(housingB);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 20), mats.chrome);
    balancer.add(rod);
    j1.add(balancer);
    const anchorA = new THREE.Vector3(-0.12, 0.2, -0.2);
    const anchorB = new THREE.Vector3(0.28, 0, -0.2);

    return {
      group: robot,
      j1: j1,
      j2: j2,
      j3: j3,
      j5: j5,
      j6: j6,
      gripper: gripper,
      fingers: fingers,
      L2: L2,
      L3: L3,
      A1: A1,
      H1: 0.16 + H1,
      tool: 0.085 + 0.014 + 0.215,
      updateBalancer() {
        const b = anchorB.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), j2.rotation.z).add(j2.position);
        const dir = b.clone().sub(anchorA);
        const len = dir.length();
        balancer.position.copy(anchorA);
        balancer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        const rodLen = Math.max(0.05, len - 0.28);
        rod.scale.y = rodLen;
        rod.position.y = 0.28 + rodLen / 2;
      },
      setFingers(open) {
        fingers.forEach((f) => {
          f.position.z = f.userData.side * open;
        });
      }
    };
  }

  /** Құралдың ұшы (TCP) берілген нүктеде, құрал тігінен төмен қарайды: θ, r, y → буын бұрыштары. */
  function solveArm(arm, theta, radial, y) {
    const wy = y + arm.tool;
    const rr = radial - arm.A1;
    const zz = wy - arm.H1;
    const L2 = arm.L2;
    const L3 = arm.L3;
    let d = (rr * rr + zz * zz - L2 * L2 - L3 * L3) / (2 * L2 * L3);
    d = Math.max(-1, Math.min(1, d));
    const q3 = -Math.acos(d);
    const q2 = Math.atan2(zz, rr) - Math.atan2(L3 * Math.sin(q3), L2 + L3 * Math.cos(q3));
    return { j1: theta, j2: q2, j3: q3, j5: -Math.PI / 2 - q2 - q3, j6: theta };
  }

  function applyArm(arm, q) {
    arm.j1.rotation.y = q.j1;
    arm.j2.rotation.z = q.j2;
    arm.j3.rotation.z = q.j3;
    arm.j5.rotation.z = q.j5;
    arm.j6.rotation.x = q.j6;
    arm.updateBalancer();
  }

  /** Жартылай палетка 800 × 600 мм: үстіңгі тақтайлар, бөренелер және тіреу блоктары. */
  function halfPallet(woodMat) {
    const g = new THREE.Group();
    const add = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
      m.position.set(x, y, z);
      g.add(m);
    };
    [-0.25, 0, 0.25].forEach((z) => add(0.8, 0.022, 0.1, 0, 0.011, z));
    [-0.35, 0, 0.35].forEach((x) => [-0.25, 0, 0.25].forEach((z) => add(0.1, 0.078, 0.1, x, 0.022 + 0.039, z)));
    [-0.25, 0, 0.25].forEach((z) => add(0.8, 0.022, 0.1, 0, 0.111, z));
    [-0.255, -0.1275, 0, 0.1275, 0.255].forEach((z) => add(0.8, 0.022, 0.09, 0, 0.133, z));
    return g;
  }

  function buildRobotics(el) {
    const root = new THREE.Group();
    const scene = el.sceneEl.object3D;
    const mats = Object.assign(standardMaterials(), {
      orange: new THREE.MeshPhysicalMaterial({ color: 0xe2600c, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28 }),
      castGrey: new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.35, roughness: 0.5 }),
      motor: new THREE.MeshStandardMaterial({ color: 0x24262a, metalness: 0.5, roughness: 0.45 }),
      cap: new THREE.MeshStandardMaterial({ color: 0x101113, metalness: 0.1, roughness: 0.5 }),
      hose: new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.6 }),
      hoseBlue: new THREE.MeshStandardMaterial({ color: 0x1d4f9a, roughness: 0.45 }),
      paintGrey: new THREE.MeshStandardMaterial({ color: 0xd3d5d2, metalness: 0.15, roughness: 0.45 }),
      steelPaint: new THREE.MeshStandardMaterial({ color: 0x4a5058, metalness: 0.4, roughness: 0.5 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xf2c200, metalness: 0.1, roughness: 0.45 })
    });
    scene.background = new THREE.Color(0x2a2d31);

    // Цех: еден, қабырғалар, бағаналар, төбедегі шамдар.
    const floorMaps = epoxyFloorMaps(201);
    const floor = new THREE.Mesh(worldUV(new THREE.BoxGeometry(40, 0.1, 30), 1), materialFromMaps(floorMaps, 1 / 6, 1 / 6));
    floor.position.set(0, -0.05, -6);
    root.add(inert(shadow(floor, false, true)));
    const paint = (w, d, x, z, mat, rot) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      m.rotation.x = -Math.PI / 2;
      if (rot) m.rotation.z = rot;
      m.position.set(x, 0.002, z);
      m.receiveShadow = true;
      root.add(inert(m));
      return m;
    };
    const tape = new THREE.MeshStandardMaterial({ color: 0xe8b800, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
    // Қауіпті аймақ шекарасы: сары-қара көлбеу жолақты лента.
    const hatchC = makeCanvas(256, 32);
    {
      const ctx = hatchC.getContext('2d');
      ctx.fillStyle = '#e8b800';
      ctx.fillRect(0, 0, 256, 32);
      ctx.fillStyle = '#141414';
      for (let x = -32; x < 288; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 32);
        ctx.lineTo(x + 16, 32);
        ctx.lineTo(x + 32, 0);
        ctx.lineTo(x + 16, 0);
        ctx.fill();
      }
    }
    const hatchTex = canvasTexture(hatchC);
    const hatch = (len) => {
      const t = repeated(hatchTex, len / 0.8, 1);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
    };
    paint(8, 0.1, 0, -0.15, hatch(8));
    paint(0.075, 18, -4.6, -4, tape);
    paint(0.075, 18, 4.6, -4, tape);

    const wallC = makeCanvas(256, 256);
    {
      const ctx = wallC.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 256, 0);
      for (let i = 0; i <= 8; i++) {
        g.addColorStop(i / 8, '#c9cdd0');
        if (i < 8) g.addColorStop(i / 8 + 0.06, '#b9bdc0');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    const wallMat = new THREE.MeshStandardMaterial({ map: repeated(canvasTexture(wallC), 10, 1), roughness: 0.6, metalness: 0.2 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 9), wallMat);
    backWall.position.set(0, 4.5, -14);
    root.add(inert(backWall));
    [-1, 1].forEach((s) => {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(30, 9), wallMat);
      side.rotation.y = -s * Math.PI / 2;
      side.position.set(s * 14, 4.5, -6);
      root.add(inert(side));
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0x4b5056, roughness: 0.8 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 9, -6);
    root.add(inert(ceiling));
    // Қос таврлы болат бағаналар мен төбе арқалықтары.
    const iShape = new THREE.Shape();
    {
      const b = 0.2;
      const hh = 0.2;
      const tf = 0.016;
      const tw = 0.01;
      iShape.moveTo(-b / 2, -hh / 2);
      iShape.lineTo(b / 2, -hh / 2);
      iShape.lineTo(b / 2, -hh / 2 + tf);
      iShape.lineTo(tw / 2, -hh / 2 + tf);
      iShape.lineTo(tw / 2, hh / 2 - tf);
      iShape.lineTo(b / 2, hh / 2 - tf);
      iShape.lineTo(b / 2, hh / 2);
      iShape.lineTo(-b / 2, hh / 2);
      iShape.lineTo(-b / 2, hh / 2 - tf);
      iShape.lineTo(-tw / 2, hh / 2 - tf);
      iShape.lineTo(-tw / 2, -hh / 2 + tf);
      iShape.lineTo(-b / 2, -hh / 2 + tf);
      iShape.closePath();
    }
    const columnGeo = new THREE.ExtrudeGeometry(iShape, { depth: 9, bevelEnabled: false });
    columnGeo.rotateX(-Math.PI / 2);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x2f5d8a, metalness: 0.3, roughness: 0.5 });
    [-8, 8].forEach((x) => [-12, -4, 4].forEach((z) => {
      const col = new THREE.Mesh(columnGeo, columnMat);
      col.position.set(x, 0, z);
      col.castShadow = true;
      root.add(inert(col));
    }));
    const beamGeo = new THREE.ExtrudeGeometry(iShape, { depth: 16, bevelEnabled: false });
    beamGeo.rotateY(Math.PI / 2);
    [-12, -4, 4].forEach((z) => {
      const beam = new THREE.Mesh(beamGeo, columnMat);
      beam.position.set(-8, 8.2, z);
      root.add(inert(beam));
    });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x222428, metalness: 0.6, roughness: 0.4 });
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea });
    [[-3, -3], [3, -3], [-3, -9], [3, -9], [0, 2]].forEach((p) => {
      const lamp = new THREE.Group();
      const body = new THREE.Mesh(lathe([[0, 0.25], [0.25, 0.25], [0.3, 0.05], [0.3, 0], [0, 0]], 48), lampMat);
      lamp.add(body);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.y = -0.002;
      lamp.add(lens);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.0, 6), lampMat);
      wire.position.y = 0.75;
      lamp.add(wire);
      lamp.position.set(p[0], 7.2, p[1]);
      root.add(inert(lamp));
      const spot = new THREE.SpotLight(0xfff3e4, 220, 16, 0.95, 0.6, 2);
      spot.position.set(p[0], 7.15, p[1]);
      spot.target.position.set(p[0], 0, p[1]);
      root.add(spot);
      root.add(spot.target);
    });
    const key = new THREE.DirectionalLight(0xfff4e8, 1.4);
    key.position.set(1.5, 8, 2.5);
    key.target.position.set(0, 0, -1.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.5;
    key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 16;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    root.add(key);
    root.add(key.target);

    /* ---- Робот тұғырда ---- */
    const ROBOT = new THREE.Vector3(0, 0, -1.4);
    const pedestal = new THREE.Group();
    pedestal.position.copy(ROBOT);
    const ped = new THREE.Mesh(roundedBox(0.62, 0.24, 0.62, 0.02), mats.steelPaint);
    ped.position.y = 0.12;
    pedestal.add(ped);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.7), mats.steelPaint);
    plate.position.y = 0.0125;
    pedestal.add(plate);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((p) => {
      const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6), mats.steel);
      anchor.position.set(p[0] * 0.31, 0.03, p[1] * 0.31);
      pedestal.add(anchor);
    });
    root.add(inert(shadow(pedestal)));
    const arm = buildRobotArm(mats);
    arm.group.position.set(ROBOT.x, 0.24, ROBOT.z);
    root.add(shadow(arm.group));
    const BASE_Y = 0.24;

    /* ---- Таспалы конвейер ---- */
    const BELT_Y = 0.75;
    const CONV_Z = ROBOT.z;
    const X0 = -3.4;
    const X1 = -0.82;
    const PICK_X = -1.02;
    const conveyor = new THREE.Group();
    const beltTex = beltTexture();
    beltTex.repeat.set(1, (X1 - X0) / 0.12);
    beltTex.rotation = Math.PI / 2;
    beltTex.center.set(0.5, 0.5);
    const beltMat = new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.75 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.012, 0.42), beltMat);
    belt.position.set((X0 + X1) / 2, BELT_Y - 0.006, CONV_Z);
    conveyor.add(belt);
    [-1, 1].forEach((s) => {
      const side = new THREE.Mesh(roundedBox(X1 - X0 + 0.08, 0.1, 0.045, 0.004), mats.aluminium);
      side.position.set((X0 + X1) / 2, BELT_Y - 0.04, CONV_Z + s * 0.24);
      conveyor.add(side);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + 0.06, 0.008, 0.002), mats.blackAnodized);
      slot.position.set((X0 + X1) / 2, BELT_Y - 0.04, CONV_Z + s * 0.2635);
      conveyor.add(slot);
      const guide = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.1, 0.035, 0.008), mats.steel);
      guide.position.set((X0 + X1) / 2, BELT_Y + 0.055, CONV_Z + s * 0.215);
      conveyor.add(guide);
      for (let x = X0 + 0.25; x < X1; x += 0.6) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.012), mats.steel);
        bracket.position.set(x, BELT_Y + 0.025, CONV_Z + s * 0.222);
        conveyor.add(bracket);
      }
      [X0 + 0.08, X1 - 0.08].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, BELT_Y - 0.09, 0.045), mats.aluminium);
        leg.position.set(x, (BELT_Y - 0.09) / 2, CONV_Z + s * 0.22);
        conveyor.add(leg);
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.02, 24), mats.rubber);
        foot.position.set(x, 0.01, CONV_Z + s * 0.22);
        conveyor.add(foot);
      });
    });
    const rollers = [];
    [X0, X1].forEach((x) => {
      const roller = cylZ(0.035, 0.44, 32, mats.steel);
      roller.position.set(x, BELT_Y - 0.035, CONV_Z);
      conveyor.add(roller);
      rollers.push(roller);
    });
    const drive = servoMotor(0.16, 0.055, mats);
    drive.position.set(X0 + 0.05, BELT_Y - 0.12, CONV_Z + 0.27);
    conveyor.add(drive);
    const gearbox = new THREE.Mesh(roundedBox(0.12, 0.14, 0.1, 0.01), mats.paintGrey);
    gearbox.position.set(X0 + 0.05, BELT_Y - 0.09, CONV_Z + 0.27);
    conveyor.add(gearbox);
    const stop = new THREE.Mesh(roundedBox(0.03, 0.08, 0.38, 0.006), mats.yellow);
    stop.position.set(PICK_X + 0.15 + 0.035, BELT_Y + 0.04, CONV_Z);
    conveyor.add(stop);
    const sensor = new THREE.Mesh(roundedBox(0.03, 0.05, 0.02, 0.004), mats.blackPlastic);
    sensor.position.set(PICK_X, BELT_Y + 0.1, CONV_Z + 0.25);
    conveyor.add(sensor);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), new THREE.MeshBasicMaterial({ color: 0x331010 }));
    led.position.set(PICK_X + 0.016, BELT_Y + 0.115, CONV_Z + 0.25);
    conveyor.add(led);
    root.add(shadow(conveyor));

    /* ---- Палетка ---- */
    const woodTex = pineTexture(301);
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    const PALLET = new THREE.Vector3(1.02, 0, ROBOT.z);
    const pallet = halfPallet(woodMat);
    pallet.position.copy(PALLET);
    root.add(inert(shadow(pallet)));
    const PALLET_TOP = 0.144;

    /* ---- Қораптар ---- */
    const BOX = [0.3, 0.2, 0.24];
    const boxGeo = roundedBox(BOX[0], BOX[1], BOX[2], 0.008);
    const boxMats = [cardboardTexture(11), cardboardTexture(12)].map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }));
    let boxSerial = 0;
    const onBelt = [];
    const onPallet = [];
    function spawnBox(x) {
      const b = new THREE.Mesh(boxGeo, boxMats[boxSerial++ % 2]);
      b.castShadow = true;
      b.receiveShadow = true;
      b.position.set(x == null ? X0 + 0.2 : x, BELT_Y + BOX[1] / 2, CONV_Z);
      root.add(inert(b));
      onBelt.push(b);
    }
    const SLOTS = [];
    [0, 1].forEach((layer) => [-1, 1].forEach((sz) => [-1, 1].forEach((sx) => {
      SLOTS.push(new THREE.Vector3(PALLET.x + sx * 0.16, PALLET_TOP + layer * BOX[1], PALLET.z + sz * 0.125));
    })));

    /* ---- Қоршау ---- */
    const meshTex = wireMeshTexture();
    // alphaToCoverage: алыстан сымдар біркелкі жартылай мөлдір торға айналады (муар болмайды).
    const fenceMat = (w, h) => new THREE.MeshStandardMaterial({ map: repeated(meshTex, w / 0.05, h / 0.05), alphaToCoverage: true, transparent: false, color: 0x2a2c30, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
    const fence = new THREE.Group();
    const panel = (x, z, w, rotY) => {
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, 1.7), fenceMat(w, 1.7));
      mesh.position.y = 0.2 + 0.85;
      g.add(mesh);
      [[w, 0.03, 0, 0.2], [w, 0.03, 0, 1.9]].forEach((f) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(f[0], f[1], 0.02), mats.yellow);
        bar.position.set(f[2], f[3], 0);
        g.add(bar);
      });
      [-w / 2, w / 2].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.0, 0.05), mats.yellow);
        post.position.set(px, 1.0, 0);
        g.add(post);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.14), mats.yellow);
        foot.position.set(px, 0.004, 0);
        g.add(foot);
      });
      g.position.set(x, 0, z);
      g.rotation.y = rotY || 0;
      fence.add(g);
    };
    for (let i = 0; i < 5; i++) panel(-4.0 + 1.6 * i + 0.8, -3.4, 1.6);
    for (let i = 0; i < 2; i++) {
      panel(-4.0, -3.4 + 1.6 * i + 0.8, 1.6, Math.PI / 2);
      panel(4.0, -3.4 + 1.6 * i + 0.8, 1.6, Math.PI / 2);
    }
    root.add(inert(fence));

    /* ---- Басқару шкафы, HMI, сигнал бағаны ---- */
    const cab = new THREE.Group();
    cab.position.set(2.2, 0, -0.1);
    cab.rotation.y = -0.45;
    const cabinet = new THREE.Mesh(roundedBox(0.8, 1.8, 0.5, 0.012), mats.paintGrey);
    cabinet.position.y = 0.1 + 0.9;
    cab.add(cabinet);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.5), mats.blackPlastic);
    plinth.position.y = 0.05;
    cab.add(plinth);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.004, 1.7, 0.004), mats.blackPlastic);
    seam.position.set(0.0, 1.0, 0.252);
    cab.add(seam);
    const handle = new THREE.Mesh(roundedBox(0.03, 0.16, 0.03, 0.008), mats.blackPlastic);
    handle.position.set(-0.05, 1.05, 0.27);
    cab.add(handle);
    const hmiC = makeCanvas(512, 320);
    const hmiTex = canvasTexture(hmiC, { clamp: true });
    const hmi = new THREE.Group();
    const bezel = new THREE.Mesh(roundedBox(0.42, 0.29, 0.03, 0.01), mats.blackPlastic);
    hmi.add(bezel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.2375), new THREE.MeshBasicMaterial({ map: hmiTex, toneMapped: false, color: 0xbfbfbf }));
    screen.position.z = 0.0155;
    hmi.add(screen);
    hmi.position.set(0.17, 1.42, 0.27);
    cab.add(hmi);
    const eBase = new THREE.Mesh(roundedBox(0.09, 0.09, 0.06, 0.008), mats.yellow);
    eBase.position.set(0.25, 1.1, 0.28);
    cab.add(eBase);
    const eBtn = new THREE.Mesh(lathe([[0, 0], [0.035, 0], [0.036, 0.012], [0.03, 0.026], [0, 0.03]], 32), new THREE.MeshStandardMaterial({ color: 0xc8101a, roughness: 0.35 }));
    eBtn.rotation.x = Math.PI / 2;
    eBtn.position.set(0.25, 1.1, 0.31);
    cab.add(eBtn);
    const towerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 16), mats.steel);
    towerPole.position.set(0.3, 1.9 + 0.125, 0.1);
    cab.add(towerPole);
    const lamps = {};
    [['green', 0x14c24a, 0], ['amber', 0xffa400, 1], ['red', 0xe5161d, 2]].forEach((d) => {
      const mat = new THREE.MeshStandardMaterial({ color: d[1], emissive: d[1], emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0.92 });
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 32), mat);
      seg.position.set(0.3, 2.18 + d[2] * 0.075, 0.1);
      cab.add(seg);
      lamps[d[0]] = mat;
    });
    const towerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 32), mats.blackPlastic);
    towerCap.position.set(0.3, 2.18 + 2 * 0.075 + 0.045, 0.1);
    cab.add(towerCap);
    root.add(shadow(cab));

    // Түсіндірме тақтасы.
    const board = infoBoard('РОБОТТАНДЫРЫЛҒАН ПАЛЕТТЕУ ҰЯШЫҒЫ', [
      '6 осьтік робот: J1 бұрылу, J2 иық, J3 шынтақ, J4–J6 білезік',
      'Кері кинематика: құрал ұшы берілген нүктеге тігінен келеді',
      'Конвейер → қармауыш → палетка (2 қабат × 4 қорап)',
      'Роботты басу — тоқтату/жалғастыру; апаттық батырма — шкафта'
    ], { width: 1.2, accent: '#9a3d07', aspect: 0.5, weight: '600' });
    board.position.set(-2.0, 1.5, -0.1);
    board.rotation.y = 0.5;
    [-0.5, 0.5].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), mats.steelPaint);
      leg.position.set(x, -0.75, -0.03);
      board.add(leg);
    });
    root.add(inert(shadow(board)));

    /* ---- Цикл: күй машинасы ---- */
    const robotLocal = (p) => new THREE.Vector3(p.x - ROBOT.x, p.y - BASE_Y, p.z - ROBOT.z);
    const cyl = (p) => {
      const l = robotLocal(p);
      return { theta: Math.atan2(-l.z, l.x), r: Math.hypot(l.x, l.z), y: l.y };
    };
    const HOME = { theta: Math.PI / 2, r: 0.85, y: 0.95 };
    const OPEN = 0.175;
    const CLOSED = 0.141;
    const st = {
      running: true,
      phase: 'wait',
      t: 0,
      dur: 0,
      from: HOME,
      to: HOME,
      grip: OPEN,
      carried: null,
      cycles: 0,
      slot: 0,
      calib: 0,
      pose: HOME,
      hmiTimer: 0
    };
    const ease = (t) => t * t * (3 - 2 * t);
    function lerpAngle(a, b, t) {
      let d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return a + d * t;
    }
    function moveTo(target, dur, phase) {
      st.from = st.pose;
      st.to = target;
      st.dur = dur;
      st.t = 0;
      st.phase = phase;
    }
    const above = (c, dy) => ({ theta: c.theta, r: c.r, y: c.y + dy });
    function pickPose() {
      return cyl(new THREE.Vector3(PICK_X, BELT_Y + BOX[1] - 0.075, CONV_Z));
    }
    function placePose() {
      const s = SLOTS[st.slot];
      return cyl(new THREE.Vector3(s.x, s.y + BOX[1] - 0.075, s.z));
    }

    function drawHMI() {
      const ctx = hmiC.getContext('2d');
      ctx.fillStyle = '#0d1b2a';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#16324f';
      ctx.fillRect(0, 0, 512, 52);
      ctx.fillStyle = '#e6f1ff';
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillText('ПАЛЕТТЕУ ҰЯШЫҒЫ', 16, 35);
      ctx.fillStyle = st.running ? '#22c55e' : '#f59e0b';
      ctx.fillRect(380, 12, 118, 28);
      ctx.fillStyle = '#0d1b2a';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(st.running ? 'АВТО' : 'КІДІРІС', 396, 33);
      ctx.fillStyle = '#9fb3c8';
      ctx.font = '20px Arial, sans-serif';
      const q = solveArm(arm, st.pose.theta, st.pose.r, st.pose.y);
      const deg = (v) => (v * 180 / Math.PI).toFixed(1) + '°';
      [['Цикл саны', String(st.cycles)], ['Палеткада', onPallet.length + ' / 8'], ['Кезең', st.phase],
        ['J1', deg(q.j1)], ['J2', deg(q.j2)], ['J3', deg(q.j3)], ['J5', deg(q.j5)]].forEach((row, i) => {
        const col = i < 3 ? 0 : 1;
        const rowi = i < 3 ? i : i - 3;
        ctx.fillStyle = '#9fb3c8';
        ctx.fillText(row[0], 20 + col * 250, 92 + rowi * 50);
        ctx.fillStyle = '#e6f1ff';
        ctx.fillText(row[1], 140 + col * 250, 92 + rowi * 50);
      });
      hmiTex.needsUpdate = true;
    }

    function setLamps() {
      lamps.green.emissiveIntensity = st.running ? 3 : 0;
      lamps.amber.emissiveIntensity = st.running ? 0 : 3;
      lamps.red.emissiveIntensity = 0;
    }

    function step(dt) {
      // Таспа: алдыңғы қорапқа не тіреуішке тірелгенше жылжиды.
      const v = 0.3;
      let moving = false;
      for (let i = 0; i < onBelt.length; i++) {
        const b = onBelt[i];
        const limit = i === 0 ? PICK_X : onBelt[i - 1].position.x - BOX[0] - 0.06;
        if (b.position.x < limit) {
          b.position.x = Math.min(limit, b.position.x + v * dt);
          moving = true;
        }
      }
      if (moving || onBelt.length === 0) {
        beltTex.offset.x -= (v * dt) / 0.12;
        rollers.forEach((r) => {
          r.rotation.y -= (v * dt) / 0.035;
        });
      }
      const last = onBelt[onBelt.length - 1];
      if (onBelt.length < 3 && (!last || last.position.x > X0 + 0.2 + BOX[0] + 0.25)) spawnBox();
      const ready = onBelt.length && Math.abs(onBelt[0].position.x - PICK_X) < 1e-3;
      led.material.color.setHex(ready ? 0xff2020 : 0x331010);

      st.t += dt;
      const k = st.dur ? Math.min(1, st.t / st.dur) : 1;
      const e = ease(k);
      st.pose = {
        theta: lerpAngle(st.from.theta, st.to.theta, e),
        r: st.from.r + (st.to.r - st.from.r) * e,
        y: st.from.y + (st.to.y - st.from.y) * e
      };
      // Тасымалдау кезінде құрал аздап көтеріледі — кедергіден аулақ.
      if (st.phase === 'transfer' || st.phase === 'return') st.pose.y += Math.sin(Math.PI * e) * 0.12;
      const done = k >= 1;
      switch (st.phase) {
        case 'wait':
          if (ready && onPallet.length < SLOTS.length) moveTo(above(pickPose(), 0.18), 1.1, 'approach');
          break;
        case 'approach':
          if (done) moveTo(pickPose(), 0.5, 'descend');
          break;
        case 'descend':
          if (done) {
            st.phase = 'grip';
            st.t = 0;
            st.dur = 0.35;
          }
          break;
        case 'grip':
          st.grip = OPEN + (CLOSED - OPEN) * ease(Math.min(1, st.t / 0.35));
          if (st.t >= 0.35) {
            const b = onBelt.shift();
            arm.gripper.attach(b);
            st.carried = b;
            moveTo(above(pickPose(), 0.25), 0.5, 'lift');
          }
          break;
        case 'lift':
          if (done) moveTo(above(placePose(), 0.2), 1.5, 'transfer');
          break;
        case 'transfer':
          if (done) moveTo(placePose(), 0.55, 'lower');
          break;
        case 'lower':
          if (done) {
            st.phase = 'release';
            st.t = 0;
            st.dur = 0.3;
          }
          break;
        case 'release':
          st.grip = CLOSED + (OPEN - CLOSED) * ease(Math.min(1, st.t / 0.3));
          if (st.t >= 0.3) {
            const b = st.carried;
            root.attach(b);
            const s = SLOTS[st.slot];
            b.position.set(s.x, s.y + BOX[1] / 2, s.z);
            b.rotation.set(0, 0, 0);
            onPallet.push(b);
            st.carried = null;
            st.slot += 1;
            st.cycles += 1;
            moveTo(above(cyl(new THREE.Vector3(s.x, s.y + BOX[1] - 0.075, s.z)), 0.22), 0.45, 'retract');
          }
          break;
        case 'retract':
          if (done) moveTo(HOME, 1.1, 'return');
          break;
        case 'return':
          if (done) {
            st.phase = onPallet.length >= SLOTS.length ? 'full' : 'wait';
            st.t = 0;
          }
          break;
        case 'full':
          // Толған палетканы ауыстыру (жүк тиегіш әкеткендей).
          if (st.t > 2.5) {
            onPallet.splice(0).forEach((b) => root.remove(b));
            st.slot = 0;
            st.phase = 'wait';
          }
          break;
        default:
          break;
      }
      let fingers = st.grip;
      if (st.calib > 0) {
        st.calib = Math.max(0, st.calib - dt);
        if (!st.carried) fingers = CLOSED - 0.03 + (OPEN - CLOSED + 0.03) * (0.5 + 0.5 * Math.cos((1.6 - st.calib) * Math.PI * 2.5));
      }
      arm.setFingers(fingers);
      applyArm(arm, solveArm(arm, st.pose.theta, st.pose.r, st.pose.y));
    }

    applyArm(arm, solveArm(arm, HOME.theta, HOME.r, HOME.y));
    arm.setFingers(OPEN);
    spawnBox(PICK_X - 0.5);
    setLamps();
    drawHMI();

    const toggle = () => {
      st.running = !st.running;
      setLamps();
      drawHMI();
      return st.running;
    };
    tagObject(arm.group, 'Өнеркәсіптік робот (6 ось)', '', 'r1', () => (toggle()
      ? 'Робот жұмысқа қайта қосылды: J1–J3 буындары кері кинематика бойынша қозғалады, білезік (J5) құралды тігінен ұстайды.'
      : 'Робот кідіртілді. Буындар қазіргі күйінде тежегішпен ұсталады. Қайта басу — жалғастыру.'));
    tagObject(arm.gripper, 'Пневматикалық қармауыш', '', 'r2', () => {
      st.calib = 1.6;
      return 'Қармауыш калибрленуде: саусақтар толық ашылып-жабылады. Қорап 240 мм бүйірінен қысылады; J6 буыны қорапты әрдайым бір бағытта ұстайды.';
    });
    tagObject(conveyor, 'Таспалы конвейер', '', 'r3', () => 'Конвейер қорапты шекті тіреуішке дейін жеткізеді (жылдамдығы 0,3 м/с); оптикалық датчик іске қосылғанда робот оны алып, палеткаға қояды. Жеткізілді: ' + st.cycles + ' қорап.');
    tagObject(eBtn, 'Апаттық тоқтату батырмасы', '', null, () => (toggle() ? 'Апаттық тоқтату қалпына келтірілді — ұяшық қайта іске қосылды.' : 'Апаттық тоқтату: робот пен конвейер тоқтады (сигнал бағаны — сары).'));
    tagObject(hmi, 'Оператор панелі (HMI)', 'Цикл саны, палетка толуы және буын бұрыштары нақты уақытта көрсетіледі.');

    el.setObject3D('mesh', root);
    return {
      environment: { url: 'hdri/studio.hdr', intensity: 0.55 },
      tick(dt) {
        if (st.running) step(dt);
        else if (st.calib > 0) {
          st.calib = Math.max(0, st.calib - dt);
          arm.setFingers(st.carried ? st.grip : CLOSED - 0.03 + (OPEN - CLOSED + 0.03) * (0.5 + 0.5 * Math.cos((1.6 - st.calib) * Math.PI * 2.5)));
        }
        st.hmiTimer += dt;
        if (st.hmiTimer > 0.5) {
          st.hmiTimer = 0;
          drawHMI();
        }
      }
    };
  }

  /* ================================================================== *\
     9. Сахналарды тіркеу және белгілеу
  \* ================================================================== */

  const SCENES = {
    physics: buildPhysics,
    space: buildSpace,
    history: buildHistory,
    robotics: buildRobotics
  };

  /** Әр сахнаның бастапқы көрінісі: тұрған орын, басты еңкейту, экспозиция. */
  const VIEWS = {
    physics: { rig: '-0.05 0 0.95', pitch: -0.6, exposure: 1.0 },
    space: { rig: '0 0 3.2', pitch: -0.2, exposure: 1.0 },
    history: { rig: '0 0 2.6', pitch: 0.1, exposure: 1.3, toneMapping: 'neutral' },
    robotics: { rig: '0 0 2.2', pitch: -0.13, exposure: 1.0 }
  };

  AFRAME.registerComponent('start-pitch', {
    schema: { type: 'number' },
    init() {
      const apply = () => {
        const lc = this.el.components['look-controls'];
        if (lc && lc.pitchObject) lc.pitchObject.rotation.x = this.data;
      };
      if (this.el.hasLoaded) apply();
      else this.el.addEventListener('loaded', apply);
      setTimeout(apply, 0);
    }
  });

  AFRAME.registerComponent('vr-scene', {
    schema: { type: 'string', default: 'physics' },
    init() {
      const build = SCENES[this.data] || SCENES.physics;
      // Күндізгі сахнада ACES қаныққан көкті күлгінге ығыстырады — PBR Neutral реңкті сақтайды.
      const view = VIEWS[this.data] || VIEWS.physics;
      const applyToneMapping = () => {
        const r = this.el.sceneEl.renderer;
        if (r && view.toneMapping === 'neutral' && THREE.NeutralToneMapping !== undefined) r.toneMapping = THREE.NeutralToneMapping;
      };
      applyToneMapping();
      this.el.sceneEl.addEventListener('renderstart', applyToneMapping, { once: true });
      this.runtime = build(this.el) || {};
      bindPicking(this.el);
      const sceneEl = this.el.sceneEl;
      const env = this.runtime.environment;
      // Үлкен модельдер (runtime.ready) мен HDR жүктелгенше жүктеу экраны тұрады.
      const assets = Promise.resolve(this.runtime.ready).catch((err) => console.error('Модель жүктелмеді:', err));
      const finish = () => assets.then(sceneReady);
      if (!env || !env.url) {
        finish();
        return;
      }
      const go = () => loadHDR(asset(env.url), env.clampLum)
        .then((tex) => {
          applyEnvironment(sceneEl, tex, env);
          if (this.runtime.onEnvironment) this.runtime.onEnvironment(tex);
        })
        .catch((err) => console.error('HDR жүктелмеді:', err))
        .then(finish);
      if (sceneEl.renderer) go();
      else sceneEl.addEventListener('renderstart', go, { once: true });
    },
    tick(time, delta) {
      if (this.runtime && this.runtime.tick) this.runtime.tick(Math.min(delta || 16, 50) / 1000, time / 1000);
    }
  });

  function markup(id) {
    const key = SCENES[id] ? id : 'physics';
    const v = VIEWS[key];
    const ray = 'objects: .clickable; interval: 80';
    return '' +
      '<a-scene embedded light="defaultLightsEnabled: false" loading-screen="enabled: false"' +
      ' renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true; toneMapping: ACESFilmic; exposure: ' + v.exposure + '; anisotropy: 8"' +
      ' shadow="type: pcfsoft" xr-mode-ui="enabled: true"' +
      ' webxr="optionalFeatures: local-floor, bounded-floor, hand-tracking"' +
      // Компьютерде нысан тышқан көрсеткен жерден таңдалады, шлемде — контроллер сәулесімен.
      ' cursor="rayOrigin: mouse; fuse: false" raycaster="' + ray + '">' +
      '<a-entity id="rig" movement-controls="fly: false; speed: 0.15" position="' + v.rig + '">' +
      '<a-entity id="camera" camera="near: 0.02; far: 900" look-controls start-pitch="' + v.pitch + '" position="0 1.6 0">' +
      '</a-entity>' +
      '<a-entity laser-controls="hand: left" raycaster="' + ray + '; lineColor: #7dd3fc; lineOpacity: 0.8"></a-entity>' +
      '<a-entity laser-controls="hand: right" raycaster="' + ray + '; lineColor: #f9a8d4; lineOpacity: 0.8"></a-entity>' +
      '</a-entity>' +
      '<a-entity vr-scene="' + key + '" class="clickable"></a-entity>' +
      '</a-scene>';
  }

  // Ата-панельдегі «VR шлемді іске қосу» батырмасы осы хабарды жібереді.
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'TRIGGER_ENTER_VR') return;
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    if (scene.is('vr-mode')) scene.exitVR();
    else scene.enterVR();
  });

  window.VRScenes = { markup: markup };
})();
