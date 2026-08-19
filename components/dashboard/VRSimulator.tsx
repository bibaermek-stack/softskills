"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

export type VRScenarioId = "physics" | "space" | "history" | "robotics";

interface ScenarioConfig {
  id: VRScenarioId;
  title: string;
  category: string;
  tagline: string;
  accent: string;
  icon: string;
  description: string;
  tasks: { id: string; text: string; done: boolean }[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "physics",
    title: "Оптика және Лазер VR Зертханасы",
    category: "Физика & Оптика (Three.js High-Fidelity)",
    tagline: "Лазер сәулесі, призмалық дисперсия және 7-түсті спектр",
    accent: "#06b6d4",
    icon: "Atom",
    description:
      "Шынайы шыны призма (n=1.52), оптикалық үстел, лазер сәулесінің сынуы және 7 түске жіктелуін (Ньютон спектрі) 3D және Meta Quest көзілдірігінде зерттеңіз.",
    tasks: [
      { id: "t1", text: "Лазер сәулесін призмаға бағыттап, спектрді ашыңыз", done: false },
      { id: "t2", text: "Призманы 45°-қа бұрып, жарықтың сыну бұрышын өзгертіңіз", done: false },
      { id: "t3", text: "Спектр сәулесін оптикалық фото-сенсорға түсіріңіз", done: false },
    ],
  },
  {
    id: "space",
    title: "Күн Жүйесі және Ғарыштық Кеңістік VR",
    category: "Астрономия & Гравитация",
    tagline: "Планеталар қозғалысы, текстуралар және орбиталар",
    accent: "#8b5cf6",
    icon: "Globe",
    description:
      "Күннің тәждік жарқылы, Жер, Марс, Юпитер және Сатурнның сақиналарын жоғары деңгейлі 3D текстуралармен 360° бақылаңыз.",
    tasks: [
      { id: "s1", text: "Жер мен Ай жүйесінің айналу орбитасын бақылаңыз", done: false },
      { id: "s2", text: "Сатурн сақиналары мен Юпитер құрылымын зерттеңіз", done: false },
      { id: "s3", text: "Күн жүйесінің орталық гравитациясын талдаңыз", done: false },
    ],
  },
  {
    id: "history",
    title: "Жібек Жолы Тарихи Мұрасы 3D VR",
    category: "Тарих & Архитектура",
    tagline: "Ортағасырлық кесене, көгілдір күмбез және көне артефактілер",
    accent: "#f59e0b",
    icon: "Landmark",
    description:
      "Отырар мен Түркістанның ою-өрнекті күмбездері, қыш құмыралары мен тарихи жәдігерлерін жоғары сапалы 3D архитектурада аралаңыз.",
    tasks: [
      { id: "h1", text: "Көгілдір қыш күмбез құрылымын қараңыз", done: false },
      { id: "h2", text: "Көне Отырар қыш құмырасының ою-өрнегін тексеріңіз", done: false },
      { id: "h3", text: "Жібек жолы сауда дирхамдары мен жәдігерлерді зерттеңіз", done: false },
    ],
  },
  {
    id: "robotics",
    title: "Инженерлік Манипулятор & Цифрлық Егіз",
    category: "Робототехника & Инженерия",
    tagline: "6-осьтік өндірістік робот буындары және конвейер",
    accent: "#10b981",
    icon: "Cpu",
    description:
      "Өндірістік 6-осьтік робот манипуляторының буындарын басқарып, гидравликалық цилиндрлер мен конвейерді нақты уақытта тестілеңіз.",
    tasks: [
      { id: "r1", text: "Робот манипуляторының буындарын қозғалтыңыз", done: false },
      { id: "r2", text: "Қармауышты (gripper) калибрлеңіз", done: false },
      { id: "r3", text: "Конвейердегі бөлшекті тасымалдауды орындаңыз", done: false },
    ],
  },
];

/** Advanced A-Frame + Three.js Procedural 3D Generator */
function generateAFrameHTML(scenario: VRScenarioId): string {
  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <title>STEM VR High-Fidelity Simulator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.5.0/dist/aframe-extras.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #030712; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .a-enter-vr { bottom: 20px !important; right: 20px !important; }
    .hud-overlay {
      position: absolute; top: 12px; left: 12px; z-index: 999;
      background: rgba(10, 18, 36, 0.88); backdrop-filter: blur(12px);
      border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px;
      color: #fff; padding: 12px 16px; font-size: 13px; max-width: 340px;
      pointer-events: none; user-select: none; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .hud-title { font-weight: 800; color: #38bdf8; display: flex; items-center; gap: 6px; margin-bottom: 4px; font-size: 14px; }
    .hud-desc { color: #cbd5e1; font-size: 12px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="hud-overlay" id="hud">
    <div class="hud-title"><span>🥽</span> <span>Three.js High-Fidelity VR</span></div>
    <div class="hud-desc" id="hud-text">Контроллердің триггерімен немесе тышқанмен нысандарды басыңыз.</div>
  </div>

  <script>
    // Procedural Texture Helpers using Three.js CanvasTexture
    function createGridTexture() {
      var canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (var i = 0; i <= 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 512);
        ctx.moveTo(0, i); ctx.lineTo(512, i);
        ctx.stroke();
      }
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      for (var j = 0; j <= 512; j += 128) {
        ctx.beginPath();
        ctx.moveTo(j, 0); ctx.lineTo(j, 512);
        ctx.moveTo(0, j); ctx.lineTo(512, j);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    }

    function createLaserWarningTexture() {
      var canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 256;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ АБАЙЛАҢЫЗ: ЛАЗЕР', 256, 80);
      ctx.font = '24px sans-serif';
      ctx.fillText('Класс 3B • 650 нм • Макс: 50 мВт', 256, 140);
      ctx.fillText('Көзді тікелей сәуледен қорғаңыз', 256, 190);
      return new THREE.CanvasTexture(canvas);
    }

    function createHudPanelTexture(title, lines) {
      var canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 384;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, 0, 512, 384);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 372);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(title, 24, 56);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(24, 72, 464, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '22px sans-serif';
      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 24, 120 + i * 42);
      }
      return new THREE.CanvasTexture(canvas);
    }

    /**
     * Сахнаның шағылысу ортасы.
     *
     * Зертханадағы дүниенің бәрі металл: үстел, робот тұғыры, қармауыш,
     * конвейер — бәрінің metalness мәні 0.7-ден жоғары. Ал металл өз түсімен
     * емес, айналасын шағылыстырып көрінеді. Шағылысатын орта болмаса,
     * MeshStandardMaterial оларды тас қара етіп салады — зертхана «сөнген»
     * сияқты көрінетіні содан.
     *
     * Сондықтан жоғарысы жарық, төменгі жағы қараңғы қарапайым градиентті
     * панорама жасап, оны бүкіл сахнаның ортасы етеміз. Ол сурет файлын да,
     * қосымша кітапхананы да қажет етпейді.
     */
    function createEnvironmentTexture() {
      var canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      var ctx = canvas.getContext('2d');

      var sky = ctx.createLinearGradient(0, 0, 0, 128);
      sky.addColorStop(0.0, '#e0f2fe');
      sky.addColorStop(0.45, '#7dd3fc');
      sky.addColorStop(0.55, '#334155');
      sky.addColorStop(1.0, '#0b1120');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 256, 128);

      // Төбедегі шам жолақтары — металда ұзын жарық сызық болып шағылады,
      // сол өндірістік көрініс береді.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 18, 256, 6);
      ctx.fillRect(0, 34, 256, 3);

      var texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    }

    AFRAME.registerComponent('studio-environment', {
      init: function () {
        this.el.object3D.environment = createEnvironmentTexture();
      }
    });

    /* ------------------------------------------------------------------ *\\
       Нысанды тану және тапсырма есебі

       Бұрын әр сахнаның бір ғана «click» тыңдаушысы болатын да, ол бір басу
       үшін үш тапсырманы бірден орындалды деп белгілейтін. Енді әр нысан
       өзінің атын, сипаттамасын және қай тапсырмаға жататынын өзі алып жүреді,
       ал басу сол нысанды тауып, дәл соның тапсырмасын ғана жабады.
    \\* ------------------------------------------------------------------ */

    /** Нысанға ат, сипаттама және тапсырма идентификаторын бекіту. */
    function tagObject(object, label, info, taskId, onSelect) {
      object.userData = { label: label, info: info, taskId: taskId, onSelect: onSelect };
      return object;
    }

    /** Басылған үшбұрыштан жоғары қарай атауы бар ең жақын ата-нысанды табу. */
    function findTagged(object) {
      var node = object;
      while (node) {
        if (node.userData && node.userData.label) return node;
        node = node.parent;
      }
      return null;
    }

    /**
     * Сахнаға бір ортақ басу тыңдаушысын орнату. Нысан танылмаса — ештеңе
     * болмайды: бос басу тапсырманы жаппауы керек.
     */
    function bindPicking(el) {
      el.addEventListener('click', function (e) {
        var hit = e.detail && e.detail.intersection && e.detail.intersection.object;
        var target = hit ? findTagged(hit) : null;
        if (!target) return;

        var data = target.userData;
        if (typeof data.onSelect === 'function') data.onSelect(target);

        var hud = document.getElementById('hud-text');
        if (hud) hud.innerText = data.label + ' — ' + data.info;

        window.parent.postMessage(
          { type: 'VR_INTERACTION', info: data.label + ' — ' + data.info },
          '*'
        );
        if (data.taskId) {
          window.parent.postMessage({ type: 'TASK_PROGRESS', taskId: data.taskId }, '*');
        }
      });
    }

    // 1. High-Fidelity Physics & Laser Lab Component
    AFRAME.registerComponent('highfi-physics-lab', {
      init: function () {
        var el = this.el;
        var scene = el.sceneEl.object3D;
        var group = new THREE.Group();

        // 1. Optical Table Surface (Matte Brushed Metal with grid)
        var tableGeo = new THREE.BoxGeometry(4.2, 0.12, 2.2);
        var tableMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.25,
          metalness: 0.85,
          map: createGridTexture()
        });
        var tableMesh = new THREE.Mesh(tableGeo, tableMat);
        tableMesh.position.set(0, 0.8, 0);
        tableMesh.castShadow = true;
        tableMesh.receiveShadow = true;
        group.add(tableMesh);

        // 4 Chrome Legs
        var legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16);
        var legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
        [[-1.9, -0.9], [1.9, -0.9], [-1.9, 0.9], [1.9, 0.9]].forEach(function(pos) {
          var leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(pos[0], 0.4, pos[1]);
          group.add(leg);
        });

        // 2. High-Tech Laser Head Apparatus
        var laserGroup = new THREE.Group();
        laserGroup.position.set(-1.6, 0.96, 0);

        // Laser Base Mount
        var mountGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 24);
        var mountMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        var mount = new THREE.Mesh(mountGeo, mountMat);
        laserGroup.add(mount);

        // Laser Cylinder Body (Anodized Red & Black)
        var bodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.45, 24);
        var bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.85, roughness: 0.25 });
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        body.position.set(0.15, 0.12, 0);
        laserGroup.add(body);

        // Brass Optical Lens Ring
        var lensRingGeo = new THREE.TorusGeometry(0.075, 0.015, 16, 24);
        var brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
        var lensRing = new THREE.Mesh(lensRingGeo, brassMat);
        lensRing.rotation.y = Math.PI / 2;
        lensRing.position.set(0.38, 0.12, 0);
        laserGroup.add(lensRing);

        // Glowing Laser Emitter Core
        var coreGeo = new THREE.SphereGeometry(0.04, 16, 16);
        var coreMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        var core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0.38, 0.12, 0);
        laserGroup.add(core);

        // Point Light from Laser
        var laserLight = new THREE.PointLight(0xff0044, 2.5, 3);
        laserLight.position.set(0.4, 0.12, 0);
        laserGroup.add(laserLight);

        tagObject(
          laserGroup,
          'Лазер модулі',
          '650 нм қызыл лазер, 3B класы. Сәуле призмаға бағытталған.',
          't1'
        );
        group.add(laserGroup);

        // 3. Volumetric Red Laser Beam (Emitter to Prism)
        var beamGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.6, 16);
        var beamMat = new THREE.MeshBasicMaterial({
          color: 0xff0044,
          transparent: true,
          opacity: 0.9
        });
        var laserBeam = new THREE.Mesh(beamGeo, beamMat);
        laserBeam.rotation.z = Math.PI / 2;
        laserBeam.position.set(-0.6, 1.08, 0);
        group.add(laserBeam);

        // 4. Realistic Glass Triangular Prism (Equilateral)
        var prismGroup = new THREE.Group();
        prismGroup.position.set(0.2, 0.86, 0);

        // Prism Rotary Base with Angle Scale
        var baseGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.04, 32);
        var baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 });
        var pBase = new THREE.Mesh(baseGeo, baseMat);
        pBase.position.y = 0.02;
        prismGroup.add(pBase);

        // Glass Prism Triangle Geometry
        var shape = new THREE.Shape();
        var s = 0.35;
        shape.moveTo(-s, -s * 0.577);
        shape.lineTo(s, -s * 0.577);
        shape.lineTo(0, s * 1.155);
        shape.closePath();

        var extrudeSettings = { depth: 0.45, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        var prismGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        var glassMat = new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.95,
          thickness: 0.6,
          ior: 1.52,
          transparent: true,
          opacity: 0.85
        });
        var prismMesh = new THREE.Mesh(prismGeo, glassMat);
        prismMesh.rotation.x = -Math.PI / 2;
        prismMesh.position.set(0, 0.04, -0.22);
        prismGroup.add(prismMesh);

        var prismAngle = 0;
        tagObject(
          prismGroup,
          'Кварц призмасы',
          'Сыну көрсеткіші n = 1.517. Әр басқанда 45°-қа бұрылады.',
          't2',
          function () {
            prismAngle += Math.PI / 4;
            prismGroup.rotation.y = prismAngle;
            rainbowGroup.rotation.y = prismAngle * 0.8;
          }
        );
        group.add(prismGroup);

        // 5. Seven Rainbow Spectral Beams Dispersing from Prism
        var colors = [
          { name: 'Қызыл (700 нм)', hex: 0xef4444, angle: -0.15 },
          { name: 'Қызғылт сары (620 нм)', hex: 0xf97316, angle: -0.10 },
          { name: 'Сары (580 нм)', hex: 0xeab308, angle: -0.05 },
          { name: 'Жасыл (530 нм)', hex: 0x22c55e, angle: 0.00 },
          { name: 'Көгілдір (490 нм)', hex: 0x06b6d4, angle: 0.05 },
          { name: 'Көк (450 нм)', hex: 0x3b82f6, angle: 0.10 },
          { name: 'Күлгін (400 нм)', hex: 0xa855f7, angle: 0.15 }
        ];

        var rainbowGroup = new THREE.Group();
        rainbowGroup.position.set(0.35, 1.08, 0);

        colors.forEach(function(c) {
          var rGeo = new THREE.CylinderGeometry(0.005, 0.007, 1.4, 8);
          var rMat = new THREE.MeshBasicMaterial({ color: c.hex, transparent: true, opacity: 0.85 });
          var rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.rotation.z = Math.PI / 2 + c.angle;
          rMesh.rotation.y = c.angle * 1.5;
          rMesh.position.set(0.7, 0, c.angle * 1.8);
          rainbowGroup.add(rMesh);
        });
        group.add(rainbowGroup);

        // 6. Target Multi-Channel Optical Photo-Sensor
        var sensorGroup = new THREE.Group();
        sensorGroup.position.set(1.6, 0.96, 0);

        var sBoxGeo = new THREE.BoxGeometry(0.2, 0.35, 0.5);
        var sBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
        var sBox = new THREE.Mesh(sBoxGeo, sBoxMat);
        sBox.position.set(0, 0.12, 0);
        sensorGroup.add(sBox);

        // Glowing LCD sensor screen
        var screenGeo = new THREE.PlaneGeometry(0.02, 0.28);
        var screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        var screen = new THREE.Mesh(screenGeo, screenMat);
        screen.rotation.y = -Math.PI / 2;
        screen.position.set(-0.105, 0.12, 0);
        sensorGroup.add(screen);

        tagObject(
          sensorGroup,
          'Фотосенсор',
          'Спектр сәулесін қабылдап, толқын ұзындығын өлшейді.',
          't3'
        );
        group.add(sensorGroup);

        // 7. Newton's Cradle (Full Steel Physics Apparatus)
        var cradleGroup = new THREE.Group();
        cradleGroup.position.set(0, 0.86, 0.7);

        var cBaseGeo = new THREE.BoxGeometry(0.9, 0.03, 0.4);
        var cBase = new THREE.Mesh(cBaseGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 }));
        cradleGroup.add(cBase);

        // Frame Arch
        var archGeo = new THREE.TorusGeometry(0.25, 0.015, 16, 32, Math.PI);
        var chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.05 });
        var arch1 = new THREE.Mesh(archGeo, chromeMat);
        arch1.position.set(-0.35, 0.25, 0); arch1.rotation.y = Math.PI / 2;
        var arch2 = new THREE.Mesh(archGeo, chromeMat);
        arch2.position.set(0.35, 0.25, 0); arch2.rotation.y = Math.PI / 2;
        cradleGroup.add(arch1); cradleGroup.add(arch2);

        // 5 Mirror Chrome Balls
        var ballGeo = new THREE.SphereGeometry(0.045, 32, 32);
        var ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.02 });
        var balls = [];
        for (var b = -2; b <= 2; b++) {
          var ball = new THREE.Mesh(ballGeo, ballMat);
          ball.position.set(b * 0.09, 0.15, 0);
          cradleGroup.add(ball);
          balls.push(ball);
        }
        tagObject(
          cradleGroup,
          'Ньютон тербелмесі',
          'Импульс пен энергияның сақталу заңын көрсетеді. Тапсырмаға кірмейді.'
        );
        group.add(cradleGroup);

        // 8. 3D Floating Cybernetic HUD
        var hudTexture = createHudPanelTexture('ОПТИКА & ЛАЗЕР ЗЕРТХАНАСЫ', [
          '• Толқын ұзындығы: λ = 650 нм',
          '• Сыну көрсеткіші: n = 1.517 (кварц)',
          '• Сыну заңы: sin α / sin β = n',
          '• 7 түсті спектр: Ньютон дисперсиясы',
          '• Күйі: сенсор қосылды (100% сигнал)'
        ]);
        var hudGeo = new THREE.PlaneGeometry(1.8, 1.35);
        var hudMat = new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
        var hudMesh = new THREE.Mesh(hudGeo, hudMat);
        hudMesh.position.set(-1.8, 2.1, -0.6);
        hudMesh.rotation.y = 0.45;
        group.add(hudMesh);

        // Laser Warning Sign on Front
        var warnGeo = new THREE.PlaneGeometry(0.6, 0.3);
        var warnMat = new THREE.MeshBasicMaterial({ map: createLaserWarningTexture(), side: THREE.DoubleSide });
        var warnMesh = new THREE.Mesh(warnGeo, warnMat);
        warnMesh.position.set(0, 0.8, 1.12);
        group.add(warnMesh);

        el.setObject3D('mesh', group);

        // Animation Loop
        var time = 0;

        function animate() {
          requestAnimationFrame(animate);
          time += 0.03;

          // Newton cradle swing animation
          if (balls.length === 5) {
            balls[0].position.x = -0.18 - Math.max(0, Math.sin(time) * 0.12);
            balls[0].position.y = 0.15 + Math.max(0, Math.sin(time) * 0.06);
            balls[4].position.x = 0.18 + Math.max(0, -Math.sin(time) * 0.12);
            balls[4].position.y = 0.15 + Math.max(0, -Math.sin(time) * 0.06);
          }

          // Pulse glow light
          laserLight.intensity = 2.2 + Math.sin(time * 3) * 0.5;
        }
        animate();

        bindPicking(el);
      }
    });

    // 2. High-Fidelity Solar System Space Component
    AFRAME.registerComponent('highfi-space-lab', {
      init: function () {
        var el = this.el;
        var group = new THREE.Group();

        // High-res Starfield
        var starGeo = new THREE.BufferGeometry();
        var starCount = 2500;
        var starPositions = new Float32Array(starCount * 3);
        for (var i = 0; i < starCount * 3; i += 3) {
          starPositions[i] = (Math.random() - 0.5) * 80;
          starPositions[i+1] = (Math.random() - 0.5) * 80;
          starPositions[i+2] = (Math.random() - 0.5) * 80;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 });
        var starField = new THREE.Points(starGeo, starMat);
        group.add(starField);

        // Glowing Sun with Corona
        var sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
        var sunMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        var sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.set(0, 1.6, -5);
        group.add(sunMesh);

        var sunLight = new THREE.PointLight(0xffedd5, 3.5, 40);
        sunLight.position.set(0, 1.6, -5);
        group.add(sunLight);

        tagObject(
          sunMesh,
          'Күн',
          'G2V класты жұлдыз, беті 5778 K. Жүйенің бүкіл тартылысы осында.',
          's3'
        );

        // Planets configurations
        var planets = [
          { name: 'Меркурий', info: 'Күнге ең жақын ғаламшар. Атмосферасы жоқ.',
            r: 0.12, dist: 2.2, color: 0x94a3b8, speed: 0.04 },
          { name: 'Шолпан', info: 'Көмірқышқыл газды қалың атмосфера, беті +460 °C.',
            r: 0.22, dist: 3.2, color: 0xf97316, speed: 0.025 },
          { name: 'Жер', info: 'Жалғыз серігі — Ай. Орбитаны бір жылда айналады.',
            taskId: 's1', r: 0.26, dist: 4.5, color: 0x0284c7, speed: 0.018, hasMoon: true },
          { name: 'Марс', info: 'Темір тотығынан қызыл түсті. Екі кіші серігі бар.',
            r: 0.18, dist: 5.8, color: 0xef4444, speed: 0.014 },
          { name: 'Юпитер', info: 'Жүйедегі ең үлкен газ алыбы. Үлкен Қызыл Дақ — дауыл.',
            taskId: 's2', r: 0.55, dist: 7.6, color: 0xd97706, speed: 0.009 },
          { name: 'Сатурн', info: 'Сақиналары мұз бен шаң бөлшектерінен тұрады.',
            taskId: 's2', r: 0.45, dist: 9.4, color: 0xeab308, speed: 0.006, hasRings: true }
        ];

        var planetMeshes = [];

        planets.forEach(function(p) {
          // Orbit Line
          var orbitGeo = new THREE.RingGeometry(p.dist - 0.02, p.dist + 0.02, 64);
          var orbitMat = new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
          var orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
          orbitRing.rotation.x = Math.PI / 2;
          orbitRing.position.set(0, 1.6, -5);
          group.add(orbitRing);

          // Planet Body
          var pGeo = new THREE.SphereGeometry(p.r, 32, 32);
          var pMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6, metalness: 0.2 });
          var pMesh = new THREE.Mesh(pGeo, pMat);
          group.add(pMesh);

          // Saturn Rings
          if (p.hasRings) {
            var ringGeo = new THREE.RingGeometry(p.r * 1.4, p.r * 2.4, 32);
            var ringMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 3;
            pMesh.add(ring);
          }

          // Әр ғаламшар өз атымен танылады: бұрын аты деректе жатып,
          // экранда ешқашан көрінбейтін.
          tagObject(pMesh, p.name, p.info, p.taskId);

          planetMeshes.push({ mesh: pMesh, config: p, angle: Math.random() * Math.PI * 2 });
        });

        // 3D HUD
        var hudTexture = createHudPanelTexture('КҮН ЖҮЙЕСІ & ОРБИТАЛАР', [
          '• Орталық жұлдыз: Күн (G2V, 5778 K)',
          '• Жерге дейінгі қашықтық: 1 а.б. (149,6 млн км)',
          '• Тартылыс заңы: F = G·M·m / r²',
          '• Сатурн сақиналары: мұз бен шаң бөлшектері',
          '• Басқару: 360° бақылау, Meta Quest'
        ]);
        var hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true, opacity: 0.9 }));
        hudMesh.position.set(-2, 2.4, -3);
        hudMesh.rotation.y = 0.5;
        group.add(hudMesh);

        el.setObject3D('mesh', group);

        bindPicking(el);

        function animateSpace() {
          requestAnimationFrame(animateSpace);
          planetMeshes.forEach(function(item) {
            item.angle += item.config.speed;
            item.mesh.position.set(
              Math.cos(item.angle) * item.config.dist,
              1.6,
              -5 + Math.sin(item.angle) * item.config.dist
            );
            item.mesh.rotation.y += 0.02;
          });
          sunMesh.rotation.y += 0.005;
        }
        animateSpace();
      }
    });

    // 3. High-Fidelity Historical Heritage Component
    AFRAME.registerComponent('highfi-history-lab', {
      init: function () {
        var el = this.el;
        var group = new THREE.Group();

        // Sandy ancient ground
        var groundGeo = new THREE.PlaneGeometry(40, 40);
        var groundMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Grand Ancient Arch Portal (Iwan)
        var portalGroup = new THREE.Group();
        portalGroup.position.set(0, 0, -4.5);

        var pLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
        pLeft.position.set(-2.2, 2.25, 0);
        portalGroup.add(pLeft);

        var pRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
        pRight.position.set(2.2, 2.25, 0);
        portalGroup.add(pRight);

        var pTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.0, 1.4), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 }));
        pTop.position.set(0, 4.5, 0);
        portalGroup.add(pTop);

        // Turquoise Glazed Ribbed Dome
        var domeGeo = new THREE.SphereGeometry(1.8, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
        var domeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 });
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 5.0, -1.2);
        portalGroup.add(dome);

        // Golden Crescent Finial
        var cres = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 16, 24), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 }));
        cres.position.set(0, 6.9, -1.2);
        portalGroup.add(cres);

        tagObject(
          portalGroup,
          'Көгілдір күмбез',
          'Ясауи кесенесінің стиліндегі қыш күмбез. Ою-өрнегі геометриялық.',
          'h1'
        );
        group.add(portalGroup);

        // Pedestals with Artifacts
        // Artifact 1: Glazed Amphora
        var art1Group = new THREE.Group();
        art1Group.position.set(-2, 0, -2);
        var ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
        ped1.position.y = 0.45;
        art1Group.add(ped1);

        var potGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.55, 24);
        var potMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.2 });
        var pot = new THREE.Mesh(potGeo, potMat);
        pot.position.y = 1.15;
        art1Group.add(pot);
        tagObject(
          art1Group,
          'Отырар құмырасы',
          'XII ғасыр қыш ыдысы. Астық пен суды сақтауға арналған.',
          'h2'
        );
        group.add(art1Group);

        // Artifact 2: Ancient Golden Dirhams & Coins Display
        var art2Group = new THREE.Group();
        art2Group.position.set(2, 0, -2);
        var ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
        ped2.position.y = 0.45;
        art2Group.add(ped2);

        var coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 32);
        var coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.1 });
        var coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 4;
        coin.position.y = 1.05;
        art2Group.add(coin);
        tagObject(
          art2Group,
          'Сауда дирхамы',
          'Жібек жолындағы күміс теңге. Сауда байланысының дәлелі.',
          'h3'
        );
        group.add(art2Group);

        // Warm Ancient Torch Light
        var torchLight = new THREE.PointLight(0xf59e0b, 2.5, 12);
        torchLight.position.set(0, 2.5, -2);
        group.add(torchLight);

        // 3D HUD
        var hudTexture = createHudPanelTexture('ҰЛЫ ЖІБЕК ЖОЛЫ МҰРАСЫ', [
          '• Отырар • Түркістан • Сауран',
          '• Көгілдір қыш күмбез (Ясауи стилі)',
          '• XII ғасыр қыш ыдыстары',
          '• Жәдігерлер мен алтын дирхамдар',
          '• Тарихи эмпатия & 3D архитектура'
        ]);
        var hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true, opacity: 0.9 }));
        hudMesh.position.set(-1.8, 2.2, -1.5);
        hudMesh.rotation.y = 0.4;
        group.add(hudMesh);

        el.setObject3D('mesh', group);

        bindPicking(el);
      }
    });

    // Робот циклінің тұрақтылары мен көмекшілері — компоненттен тыс тұр,
    // себебі оларды tick те, поза есептеу де қолданады.
    var POSE_HOME = { shoulder: -0.35, elbow: -0.60 };
    var POSE_PICK = { shoulder: -1.156, elbow: -0.907 };
    var YAW_CONVEYOR = Math.PI;
    var YAW_TRAY = 0;
    var CYCLE = 5.0;

    function lerp(a, b, t) { return a + (b - a) * t; }

    /** Кезеңнің 0..1 үлесі, басы мен соңы жұмсақ. */
    function phase(t, from, to) {
      if (t <= from) return 0;
      if (t >= to) return 1;
      var k = (t - from) / (to - from);
      return k * k * (3 - 2 * k);
    }

    // 4. High-Fidelity Robotics & Digital Twin Component
    AFRAME.registerComponent('highfi-robotics-lab', {
      init: function () {
        var el = this.el;
        var group = new THREE.Group();

        // High-Tech Industrial Floor
        var floorGeo = new THREE.PlaneGeometry(30, 30);
        var floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7, map: createGridTexture() });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        group.add(floor);

        // 6-Axis Industrial Robotic Arm
        //
        // Буындар бір-бірінің ішінде тұр: турель → иық → шынтақ → білезік.
        // Сондықтан бір бұрышты өзгерткенде одан кейінгі бөліктер бірге
        // қозғалады. Бұрын бәрі бір деңгейде жатқандықтан қол бүгіле алмай,
        // тік бағана болып тұратын да, қорапты ала алмайтын.
        var robotGroup = new THREE.Group();
        robotGroup.position.set(0, 0, -2);

        var jointMat = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.75, roughness: 0.3 });
        var linkMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.35 });

        var rBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 }));
        rBase.position.y = 0.2;
        robotGroup.add(rBase);

        // 1-буын: тік ось бойынша бұрылу
        var turretGroup = new THREE.Group();
        turretGroup.position.y = 0.4;
        var turretMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.35 }));
        turretGroup.add(turretMesh);

        // 2-буын: иық
        var shoulderJoint = new THREE.Group();
        shoulderJoint.position.y = 0.35;
        turretGroup.add(shoulderJoint);
        shoulderJoint.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), jointMat));

        var arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), linkMat);
        arm1.position.y = 0.55;
        shoulderJoint.add(arm1);

        // 3-буын: шынтақ
        var elbowJoint = new THREE.Group();
        elbowJoint.position.y = 1.1;
        shoulderJoint.add(elbowJoint);
        elbowJoint.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), jointMat));

        var arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.6, roughness: 0.35 }));
        arm2.position.y = 0.45;
        elbowJoint.add(arm2);

        // Білезік пен екі саусақты қармауыш
        var wrist = new THREE.Group();
        wrist.position.y = 0.9;
        elbowJoint.add(wrist);

        var gripper = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.26), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 }));
        wrist.add(gripper);

        var fingerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.5 });
        var f1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.16), fingerMat);
        f1.position.set(-0.14, -0.14, 0);
        gripper.add(f1);
        var f2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.16), fingerMat);
        f2.position.set(0.14, -0.14, 0);
        gripper.add(f2);

        tagObject(
          gripper,
          'Қармауыш',
          'Екі саусақты ұстағыш. Қорапты конвейерден алып, науаға қояды.',
          'r2'
        );

        robotGroup.add(turretGroup);
        group.add(robotGroup);

        // Конвейер және қорап
        var convGroup = new THREE.Group();
        convGroup.position.set(-1.8, 0.4, -2);
        var cBed = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 0.6), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 }));
        convGroup.add(cBed);

        // Қораптардың пішіні мен материалы ортақ: цикл сайын жаңа қорап
        // жасалады, ал әрқайсысына бөлек геометрия жасау жадты босқа алар еді.
        var partGeometry = new THREE.BoxGeometry(0.26, 0.18, 0.26);
        var partMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.45 });
        var part = new THREE.Mesh(partGeometry, partMaterial);
        part.position.set(-1.15, 0.22, 0);
        convGroup.add(part);

        tagObject(
          convGroup,
          'Конвейер',
          'Қорап осы жерден алынады. Толық цикл — 5 секунд.',
          'r3'
        );
        group.add(convGroup);

        // Шығыс науасы — қорап осында қойылады
        var trayGroup = new THREE.Group();
        trayGroup.position.set(1.8, 0.4, -2);
        var trayBed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.9), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 }));
        trayGroup.add(trayBed);
        var trayLip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 }));
        trayLip.position.set(0, 0.14, 0.42);
        trayGroup.add(trayLip);
        tagObject(trayGroup, 'Шығыс науасы', 'Дайын қорап осында жиналады.');
        group.add(trayGroup);

        var hudTexture = createHudPanelTexture('ИНЖЕНЕРЛІК ЦИФРЛЫҚ ЕГІЗ', [
          '• 6 осьті робот манипуляторы',
          '• Серво қуаты: 1,5 кВт',
          '• Кинематика: тура және кері есеп',
          '• Толық цикл: 5 секунд',
          '• Meta Quest контроллерін қолдау'
        ]);
        var hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true, opacity: 0.9 }));
        hudMesh.position.set(1.9, 2.5, -0.9);
        hudMesh.rotation.y = -0.4;
        group.add(hudMesh);

        el.setObject3D('mesh', group);

        // Жинақтау циклінің күйі. Анимация tick әдісінде жүреді:
        // A-Frame-нің өз циклы сахна тоқтағанда бірге тоқтайды, ал жеке
        // requestAnimationFrame одан бөлек жүріп, көрінбейтін қойындыда
        // мүлдем іске қосылмайтын.
        this.rig = {
          turret: turretGroup,
          shoulder: shoulderJoint,
          elbow: elbowJoint,
          gripper: gripper,
          f1: f1,
          f2: f2,
          part: part,
          partGeometry: partGeometry,
          partMaterial: partMaterial,
          delivered: [],
          belt: convGroup,
          tray: trayGroup,
          clock: 0,
          carried: false,
          running: true
        };

        this.applyPose(POSE_HOME);
        turretGroup.rotation.y = YAW_CONVEYOR;

        tagObject(
          turretGroup,
          'Манипулятор буыны',
          'Жинақтау циклін тоқтату немесе жалғастыру үшін басыңыз.',
          'r1',
          (function (self) {
            return function () {
              self.rig.running = !self.rig.running;
            };
          })(this)
        );

        bindPicking(el);
      },

      applyPose: function (pose) {
        if (!this.rig) return;
        this.rig.shoulder.rotation.z = pose.shoulder;
        this.rig.elbow.rotation.z = pose.elbow;
      },

      poseBetween: function (t) {
        return {
          shoulder: lerp(POSE_HOME.shoulder, POSE_PICK.shoulder, t),
          elbow: lerp(POSE_HOME.elbow, POSE_PICK.elbow, t)
        };
      },

      /**
       * Таспаға келесі қорапты шығару.
       *
       * Жеткізілген қорап науада қала береді, ал таспаға жаңасы келеді — бір
       * ғана қорапты әрлі-берлі тасысақ, ол науадан таспаға секіріп кеткендей
       * көрінер еді. Науада үшеу жиналған соң ең ескісі алынады: цехта дайын
       * өнімді әкетіп тұрғаны сияқты.
       */
      spawnPart: function () {
        var r = this.rig;
        var box = new THREE.Mesh(r.partGeometry, r.partMaterial);
        box.position.set(-1.15, 0.22, 0);
        r.belt.add(box);
        r.part = box;
        r.carried = false;
      },

      deliverPart: function () {
        var r = this.rig;
        r.tray.attach(r.part);
        r.part.position.set(0, 0.17, (r.delivered.length - 1) * 0.3 - 0.15);
        r.part.rotation.set(0, 0, 0);
        r.delivered.push(r.part);
        if (r.delivered.length > 3) {
          var oldest = r.delivered.shift();
          r.tray.remove(oldest);
        }
        // Науадағы қораптарды қатарлап қою.
        r.delivered.forEach(function (box, i) {
          box.position.set(0, 0.17, i * 0.3 - 0.3);
        });
        r.part = null;
        r.carried = false;
      },

      /**
       * Бір кадр. delta — миллисекунд. A-Frame оны өзі береді, ал тексеру
       * кезінде қолмен де беруге болады.
       */
      tick: function (time, delta) {
        var r = this.rig;
        if (!r || !r.running) return;

        r.clock = (r.clock + Math.min(delta || 16, 50) / 1000) % CYCLE;
        var t = r.clock;

        if (t < 1.2) {
          // Конвейерге бұрылып, еңкею. Бұл кезде келесі қорап таспамен келеді.
          //
          // Жеткізілген қорап науада қалады, ал мұнда жаңасы шығады. Бұрын бір
          // қорап әрлі-берлі тасылатын да, келесі айналымда қармауыш оны
          // науадан іліп әкететін — қорап секіріп кеткендей көрінетіні содан.
          r.turret.rotation.y = YAW_CONVEYOR;
          this.applyPose(this.poseBetween(phase(t, 0.1, 1.2)));
          if (!r.part) this.spawnPart();
          r.part.position.x = lerp(-1.15, 0, phase(t, 0, 0.95));
        } else if (t < 1.7) {
          // Саусақтарды жабу және қорапты ұстау
          this.applyPose(POSE_PICK);
          var close = phase(t, 1.2, 1.6);
          r.f1.position.x = lerp(-0.14, -0.08, close);
          r.f2.position.x = lerp(0.14, 0.08, close);
          if (!r.carried && t > 1.5) {
            r.gripper.attach(r.part);
            r.carried = true;
          }
        } else if (t < 2.3) {
          // Көтеру
          this.applyPose(this.poseBetween(1 - phase(t, 1.7, 2.3)));
        } else if (t < 3.4) {
          // Науаға қарай бұрылу
          r.turret.rotation.y = lerp(YAW_CONVEYOR, YAW_TRAY, phase(t, 2.3, 3.4));
        } else if (t < 4.0) {
          // Науаның үстіне түсу
          r.turret.rotation.y = YAW_TRAY;
          this.applyPose(this.poseBetween(phase(t, 3.4, 4.0)));
        } else if (t < 4.4) {
          // Саусақтарды ашып, қорапты қою
          this.applyPose(POSE_PICK);
          var open = phase(t, 4.0, 4.3);
          r.f1.position.x = lerp(-0.08, -0.14, open);
          r.f2.position.x = lerp(0.08, 0.14, open);
          if (r.carried && t > 4.15) this.deliverPart();
        } else {
          // Бастапқы қалыпқа оралу
          this.applyPose(this.poseBetween(1 - phase(t, 4.4, 5.0)));
        }
      }
    });

    // Global Message Receiver for WebXR Mode Trigger
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'TRIGGER_ENTER_VR') {
        var scene = document.querySelector('a-scene');
        if (scene) {
          if (scene.is('vr-mode')) {
            scene.exitVR();
          } else {
            scene.enterVR();
          }
        }
      }
    });
  </script>

  <a-scene
    embedded
    studio-environment
    renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true;"
    xr-mode-ui="enabled: true; enterAREnabled: true; enterVREnabled: true;"
    webxr="requiredFeatures: local-floor; optionalFeatures: bounded-floor, hand-tracking;"
  >
    <!-- Camera & Meta Quest 6DOF Controllers -->
    <a-entity id="rig" movement-controls="fly: false; speed: 0.2" position="0 0 3.2">
      <a-entity id="camera" camera look-controls position="0 1.6 0">
        <a-cursor
          id="cursor"
          raycaster="objects: .clickable, [highfi-physics-lab], [highfi-space-lab], [highfi-history-lab], [highfi-robotics-lab]"
          color="#38bdf8"
          position="0 0 -1"
          geometry="primitive: ring; radiusInner: 0.012; radiusOuter: 0.022"
        ></a-cursor>
      </a-entity>

      <!-- Meta Quest Oculus Touch Controllers with Laser Pointers -->
      <a-entity id="leftHand"
        oculus-touch-controls="hand: left"
        laser-controls="hand: left"
        raycaster="objects: .clickable, [highfi-physics-lab], [highfi-space-lab], [highfi-history-lab], [highfi-robotics-lab]; lineColor: #38bdf8; lineOpacity: 0.8"
        haptics="events: triggerdown; dur: 80; force: 0.6"
      ></a-entity>
      <a-entity id="rightHand"
        oculus-touch-controls="hand: right"
        laser-controls="hand: right"
        raycaster="objects: .clickable, [highfi-physics-lab], [highfi-space-lab], [highfi-history-lab], [highfi-robotics-lab]; lineColor: #ec4899; lineOpacity: 0.8"
        haptics="events: triggerdown; dur: 80; force: 0.6"
      ></a-entity>
    </a-entity>

    <!-- Жарық: физикалық режимде қарқын шамасы басқаша есептеледі, сондықтан
         бұрынғы мәндер зертхананы қараңғы етіп тұрған. Толықтырушы жарық
         қарама-қарсы жақтан түсіп, көлеңкедегі бөлшектерді ашады. -->
    <a-entity light="type: ambient; color: #cbd5e1; intensity: 1.6;"></a-entity>
    <a-entity light="type: directional; color: #ffffff; intensity: 2.6; position: 3 8 4;" castShadow="true"></a-entity>
    <a-entity light="type: directional; color: #93c5fd; intensity: 0.9; position: -4 3 -3;"></a-entity>

    ${
      scenario === "physics"
        ? `
      <a-sky color="#050b14"></a-sky>
      <a-entity highfi-physics-lab class="clickable"></a-entity>
    `
        : scenario === "space"
        ? `
      <a-sky color="#02040a"></a-sky>
      <a-entity highfi-space-lab class="clickable"></a-entity>
    `
        : scenario === "history"
        ? `
      <a-sky color="#fef3c7"></a-sky>
      <a-entity highfi-history-lab class="clickable"></a-entity>
    `
        : `
      <a-sky color="#0a0f1d"></a-sky>
      <a-entity highfi-robotics-lab class="clickable"></a-entity>
    `
    }
  </a-scene>
</body>
</html>`;
}

export function VRSimulator() {
  const [currentScenarioId, setCurrentScenarioId] = useState<VRScenarioId>("physics");
  const [tasks, setTasks] = useState(SCENARIOS[0].tasks);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentScenario = SCENARIOS.find((s) => s.id === currentScenarioId) ?? SCENARIOS[0];

  // Update tasks when scenario changes
  useEffect(() => {
    setTasks(currentScenario.tasks);
    setActiveInfo(null);
  }, [currentScenario]);

  // Listen to messages from A-Frame iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "VR_INTERACTION") {
        setActiveInfo(event.data.info);
      }
      if (event.data.type === "TASK_PROGRESS") {
        const taskId = event.data.taskId;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, done: true } : t))
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const triggerEnterVR = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "TRIGGER_ENTER_VR" }, "*");
  };

  return (
    <section className="dash-card relative flex flex-col overflow-hidden rounded-3xl border border-brand-500/20 bg-slate-950 p-4 text-white shadow-lift sm:p-6 lg:p-7">
      {/* Жоғарғы бақылау тақырыбы */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-soft"
              style={{ backgroundColor: currentScenario.accent }}
            >
              <Icon name="Scan" className="size-3.5" />
              Three.js & A-Frame WebXR • Meta Quest 🥽
            </span>
            <span className="text-[0.75rem] font-medium text-slate-400">
              High-Fidelity 3D Виртуалды Тренажер
            </span>
          </div>

          <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
            {currentScenario.title}
          </h2>
          <p className="mt-1 max-w-2xl text-[0.82rem] text-slate-300">
            {currentScenario.description}
          </p>
        </div>

        {/* Құрылғы режимдері & Басқару түймелері */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={triggerEnterVR}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-lift transition hover:scale-[1.02] active:scale-[0.98]"
            title="Meta Quest Link немесе SteamVR арқылы қосылған шлемде VR іске қосу"
          >
            <Icon name="Scan" className="size-4" />
            <span>🥽 VR Шлемді іске қосу (Quest Link)</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[0.78rem] font-semibold text-white transition hover:bg-white/20"
            title="Толық экран режимі"
          >
            <Icon name="Expand" className="size-4" />
            <span>{isFullscreen ? "Шығу" : "Толық экран"}</span>
          </button>
        </div>
      </div>

      {/* Сценарийлерді таңдау жолағы */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SCENARIOS.map((sc) => {
          const isActive = sc.id === currentScenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setCurrentScenarioId(sc.id)}
              className={cn(
                "flex flex-col items-start rounded-2xl p-3 text-left transition-all duration-300",
                isActive
                  ? "bg-white text-slate-950 shadow-lift ring-2 ring-brand-400"
                  : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <span
                className="text-[0.66rem] font-bold tracking-wide uppercase"
                style={{ color: isActive ? sc.accent : "#94a3b8" }}
              >
                {sc.category}
              </span>
              <span className="mt-1 font-display text-[0.82rem] font-bold leading-tight">
                {sc.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Негізгі 3D A-Frame Canvas & Интерактивті Аймақ */}
      <div
        ref={containerRef}
        className="relative mt-4 h-[580px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner"
      >
        <iframe
          ref={iframeRef}
          key={currentScenarioId}
          title={currentScenario.title}
          srcDoc={generateAFrameHTML(currentScenarioId)}
          className="size-full border-0"
          allow="accelerometer; autoplay; camera; gyroscope; vr; xr-spatial-tracking; fullscreen"
        />

        {/* Төменгі интерактивті бақылау тақтасы */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
          {/* Таңдалған 3D нысанның сипаттамасы */}
          {activeInfo && (
            <div className="pointer-events-auto max-w-md rounded-xl border border-cyan-500/40 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-md">
              <p className="text-[0.68rem] font-bold text-cyan-400 uppercase">3D Нысанның дерегі:</p>
              <p className="mt-0.5 text-[0.8rem] font-semibold text-white">{activeInfo}</p>
            </div>
          )}

          {/* Meta Quest нұсқаулық баннері */}
          <div className="pointer-events-auto ml-auto rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-[0.72rem] font-medium text-slate-300 backdrop-blur-md">
            🥽 <span className="font-bold text-white">Meta Quest:</span> Браузерден ашып, «Enter VR» немесе батырманы басыңыз
          </div>
        </div>
      </div>

      {/* Интерактивті Зертханалық Тапсырмалар / Миссиялар */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[0.88rem] font-bold uppercase tracking-wider text-white">
            Интерактивті Зертханалық Тапсырмалар ({tasks.filter((t) => t.done).length}/{tasks.length})
          </h3>
          <span className="text-[0.74rem] text-slate-400">
            3D кеңістікте әрекет орындау арқылы белгіленеді
          </span>
        </div>

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 transition-all",
                task.done
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  task.done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"
                )}
              >
                {task.done ? "✓" : "○"}
              </span>
              <span className="text-[0.78rem] leading-snug">{task.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
