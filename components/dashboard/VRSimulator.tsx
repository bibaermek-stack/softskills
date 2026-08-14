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
    category: "Физика & Механика",
    tagline: "Сәуленің сынуы, шағылуы және призмалық дисперсия",
    accent: "#06b6d4",
    icon: "Atom",
    description:
      "Лазер сәулесінің бұрышын, айналар мен призмалардың орналасуын реттеп, жарықты нысана-сенсорға дәл түсіріңіз. Мета Quest көзілдірігі мен контроллерлері толық қолдау көрсетеді.",
    tasks: [
      { id: "t1", text: "Лазер сәулесін 45° бұрышқа бұрып шағылдырыңыз", done: false },
      { id: "t2", text: "Призма арқылы жарықты үшбұрышты спектрге жіктеңіз", done: false },
      { id: "t3", text: "Сәулені фото-сенсор нысанасына дәл бағыттаңыз", done: false },
    ],
  },
  {
    id: "space",
    title: "Күн Жүйесі және Ғарыштық Кеңістік VR",
    category: "Астрономия & Физика",
    tagline: "Планеталар қозғалысы, тартылыс күші және орбиталар",
    accent: "#8b5cf6",
    icon: "Globe",
    description:
      "Күн жүйесіндегі планеталардың 3D орбиталарын 360° бақылаңыз, гравитациялық әсерлер мен жылдамдық параметрлерін зерттеңіз.",
    tasks: [
      { id: "s1", text: "Жер және Ай жүйесінің айналу орбитасын талдаңыз", done: false },
      { id: "s2", text: "Юпитер мен Сатурн сақиналарының құрылымын зерттеңіз", done: false },
      { id: "s3", text: "Күн тартылыс күшінің радиусын өлшеңіз", done: false },
    ],
  },
  {
    id: "history",
    title: "Жібек Жолы Тарихи Мұрасы 3D VR",
    category: "Тарих & Мәдениет",
    tagline: "Ежелгі ескерткіштер, артефактілер және архитектуралық тур",
    accent: "#f59e0b",
    icon: "Landmark",
    description:
      "Ортағасырлық Отырар және Түркістан архитектуралық нысандарын 3D иммерсивті кеңістікте аралап, интерактивті ақпарат нүктелерін (hotspot) ашыңыз.",
    tasks: [
      { id: "h1", text: "Күмбезді сәулет құрылымының негізін тексеріңіз", done: false },
      { id: "h2", text: "Көне қыш құмыралар мен жәдігерлер туралы деректі оқыңыз", done: false },
      { id: "h3", text: "3D тарихи карта бойынша сауда жолын салыстырыңыз", done: false },
    ],
  },
  {
    id: "robotics",
    title: "Инженерлік Манипулятор & Цифрлық Егіз",
    category: "Технология & Инженерия",
    tagline: "6-осьтік робот буындары, сервоқозғалтқыштар және конвейер",
    accent: "#10b981",
    icon: "Cpu",
    description:
      "Өндірістік робот манипуляторының әр буынын жеке басқарып, бөлшектерді конвейерден жұмыс алаңына тасымалдауды үйреніңіз.",
    tasks: [
      { id: "r1", text: "Манипулятордың негізгі буынын 90°-қа бұрыңыз", done: false },
      { id: "r2", text: "Қармауышты (gripper) ашып-жауып калибрлеңіз", done: false },
      { id: "r3", text: "Бөлшекті тасымалдау циклін сәтті орындаңыз", done: false },
    ],
  },
];

/** A-Frame HTML Document generator for cross-platform WebXR & Meta Quest */
function generateAFrameHTML(scenario: VRScenarioId): string {
  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8">
  <title>STEM VR Simulator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.5.0/dist/aframe-extras.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #030712; font-family: system-ui, sans-serif; }
    .a-enter-vr { bottom: 20px !important; right: 20px !important; }
    .hud-overlay {
      position: absolute; top: 12px; left: 12px; z-index: 999;
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px;
      color: #fff; padding: 10px 14px; font-size: 13px; max-width: 320px;
      pointer-events: none; user-select: none;
    }
    .hud-title { font-weight: 700; color: #38bdf8; margin-bottom: 3px; }
  </style>
</head>
<body>
  <div class="hud-overlay" id="hud">
    <div class="hud-title">Meta Quest & WebXR Дайын 🥽</div>
    <div id="hud-text">Контроллермен нысандарды басыңыз немесе тышқан/WASD арқылы қозғалыңыз.</div>
  </div>

  <script>
    AFRAME.registerComponent('interactive-object', {
      schema: { info: { type: 'string', default: 'Нысан белсенді' }, color: { type: 'color', default: '#38bdf8' } },
      init: function () {
        var el = this.el;
        var data = this.data;
        var originalColor = el.getAttribute('material') ? el.getAttribute('material').color : '#fff';
        
        el.addEventListener('mouseenter', function () {
          el.setAttribute('scale', '1.1 1.1 1.1');
          document.getElementById('hud-text').innerText = 'Нысан: ' + data.info;
        });
        el.addEventListener('mouseleave', function () {
          el.setAttribute('scale', '1 1 1');
        });
        el.addEventListener('click', function () {
          var anim = el.getAttribute('animation__pulse');
          if (!anim) {
            el.setAttribute('animation__pulse', 'property: rotation; to: 0 360 0; dur: 2000; easing: easeInOutQuad');
          }
          document.getElementById('hud-text').innerText = '✅ Таңдалды: ' + data.info + ' (Әсер іске қосылды)';
          window.parent.postMessage({ type: 'VR_INTERACTION', info: data.info }, '*');
        });
      }
    });

    AFRAME.registerComponent('laser-prism', {
      init: function() {
        var el = this.el;
        var angle = 0;
        el.addEventListener('click', function() {
          angle += 45;
          el.setAttribute('rotation', '0 ' + angle + ' 0');
          document.getElementById('hud-text').innerText = 'Призма бұрышы: ' + angle + '° (Жарық сынуы өзгерді)';
          window.parent.postMessage({ type: 'TASK_PROGRESS', taskId: 't1' }, '*');
        });
      }
    });

    AFRAME.registerComponent('robot-joint', {
      init: function() {
        var el = this.el;
        var currentY = 0;
        el.addEventListener('click', function() {
          currentY = currentY === 0 ? 60 : 0;
          el.setAttribute('animation', 'property: rotation; to: 0 ' + currentY + ' 0; dur: 800; easing: easeOutBack');
          document.getElementById('hud-text').innerText = '🤖 Робот буыны: ' + currentY + '° позициясына орнатылды';
          window.parent.postMessage({ type: 'TASK_PROGRESS', taskId: 'r1' }, '*');
        });
      }
    });

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
    renderer="antialias: true; colorManagement: true;"
    xr-mode-ui="enabled: true; enterAREnabled: true; enterVREnabled: true;"
    webxr="requiredFeatures: local-floor; optionalFeatures: bounded-floor, hand-tracking;"
  >
    <!-- Assets -->
    <a-assets>
      <a-mixin id="interactive" interactive-object></a-mixin>
    </a-assets>

    <!-- Camera and Meta Quest 6DOF Controllers -->
    <a-entity id="rig" movement-controls="fly: false; speed: 0.2" position="0 0 4">
      <a-entity id="camera" camera look-controls position="0 1.6 0">
        <a-cursor
          id="cursor"
          animation__click="property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.1 0.1 0.1; to: 1 1 1"
          animation__fusing="property: fusing; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 1 1 1; to: 0.1 0.1 0.1"
          event-set__mouseenter="_event: mouseenter; color: #38bdf8"
          event-set__mouseleave="_event: mouseleave; color: #ffffff"
          raycaster="objects: .clickable"
          color="#ffffff"
          position="0 0 -1"
          geometry="primitive: ring; radiusInner: 0.015; radiusOuter: 0.025"
        ></a-cursor>
      </a-entity>

      <!-- Meta Quest Oculus Touch Controllers -->
      <a-entity id="leftHand"
        oculus-touch-controls="hand: left"
        laser-controls="hand: left"
        raycaster="objects: .clickable; lineColor: #38bdf8; lineOpacity: 0.7"
        haptics="events: triggerdown; dur: 100; force: 0.5"
      ></a-entity>
      <a-entity id="rightHand"
        oculus-touch-controls="hand: right"
        laser-controls="hand: right"
        raycaster="objects: .clickable; lineColor: #ec4899; lineOpacity: 0.7"
        haptics="events: triggerdown; dur: 100; force: 0.5"
      ></a-entity>
    </a-entity>

    <!-- Common Environment & Lights -->
    <a-entity light="type: ambient; color: #ffffff; intensity: 0.7;"></a-entity>
    <a-entity light="type: directional; color: #ffffff; intensity: 1.2; position: 3 8 4;" castShadow="true"></a-entity>

    ${
      scenario === "physics"
        ? `
      <!-- ================= 1. OPTICS & PHYSICS LAB ================= -->
      <a-sky color="#050b14"></a-sky>
      <!-- Lab Grid Floor -->
      <a-grid width="30" height="30" grid-color="#0284c7" position="0 0 0"></a-grid>
      <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#0b1329" metalness="0.5" roughness="0.6"></a-plane>

      <!-- Central Optical Workbench -->
      <a-box position="0 0.8 0" width="4" height="0.1" depth="2" color="#1e293b" metalness="0.8" roughness="0.2">
        <!-- Laser Source -->
        <a-cylinder class="clickable" interactive-object="info: 650nm Қызыл Лазер генераторы" position="-1.5 0.2 0" radius="0.08" height="0.4" rotation="0 0 -90" color="#ef4444">
          <a-sphere position="0 0.22 0" radius="0.04" color="#ff0000" light="type: point; color: #ef4444; intensity: 2; distance: 4"></a-sphere>
        </a-cylinder>

        <!-- Laser Beam Ray -->
        <a-cylinder position="-0.75 0.2 0" radius="0.012" height="1.5" rotation="0 0 90" color="#ef4444" opacity="0.85" material="emissive: #ef4444; emissiveIntensity: 2;"></a-cylinder>

        <!-- Rotatable Prism -->
        <a-entity class="clickable" laser-prism interactive-object="info: Оптикалық призма (Басып бұрыңыз)" position="0 0.3 0">
          <a-cone radius-bottom="0.25" radius-top="0" height="0.4" color="#38bdf8" opacity="0.75" metalness="0.9" roughness="0.1"></a-cone>
          <a-ring position="0 -0.19 0" rotation="-90 0 0" radius-inner="0.24" radius-outer="0.28" color="#38bdf8"></a-ring>
        </a-entity>

        <!-- Reflected Beam -->
        <a-cylinder position="0.6 0.2 -0.4" radius="0.01" height="1.2" rotation="0 45 90" color="#38bdf8" opacity="0.8" material="emissive: #38bdf8; emissiveIntensity: 1.5;"></a-cylinder>

        <!-- Target Sensor -->
        <a-entity class="clickable" interactive-object="info: Фотосезгіш оптикалық сенсор" position="1.4 0.25 -0.8">
          <a-box width="0.3" height="0.3" depth="0.05" color="#10b981" material="emissive: #10b981; emissiveIntensity: 0.5;"></a-box>
          <a-cylinder position="0 0 0.05" radius="0.08" height="0.05" rotation="90 0 0" color="#059669"></a-cylinder>
        </a-entity>
      </a-box>

      <!-- Newton Pendulum on Table -->
      <a-entity position="0 0.85 0.7">
        <a-box width="0.8" height="0.02" depth="0.3" color="#334155"></a-box>
        <a-sphere class="clickable" interactive-object="info: Ньютон тербелмесі (Шар 1)" position="-0.2 0.25 0" radius="0.05" color="#cbd5e1" metalness="0.9" animation="property: position; to: -0.35 0.35 0; dir: alternate; loop: true; dur: 600; easing: easeInOutSine;"></a-sphere>
        <a-sphere class="clickable" interactive-object="info: Ньютон тербелмесі (Шар 2)" position="-0.1 0.2 0" radius="0.05" color="#cbd5e1" metalness="0.9"></a-sphere>
        <a-sphere class="clickable" interactive-object="info: Ньютон тербелмесі (Шар 3)" position="0 0.2 0" radius="0.05" color="#cbd5e1" metalness="0.9"></a-sphere>
        <a-sphere class="clickable" interactive-object="info: Ньютон тербелмесі (Шар 4)" position="0.1 0.2 0" radius="0.05" color="#cbd5e1" metalness="0.9"></a-sphere>
        <a-sphere class="clickable" interactive-object="info: Ньютон тербелмесі (Шар 5)" position="0.2 0.25 0" radius="0.05" color="#cbd5e1" metalness="0.9" animation="property: position; to: 0.35 0.35 0; dir: alternate; loop: true; dur: 600; delay: 600; easing: easeInOutSine;"></a-sphere>
      </a-entity>

      <!-- 3D UI Information Panels in 3D Space -->
      <a-entity position="-2 2 -1" rotation="0 30 0">
        <a-plane width="1.6" height="1.0" color="#0f172a" opacity="0.9" material="side: double;">
          <a-text value="ЛАЗЕР ЗЕРТХАНАСЫ\n- Толкын узындыгы: 650 нм\n- Призма сыну корсеткиши: n = 1.52\n- Жарык жылдамдыгы: 300 000 км/с" color="#38bdf8" align="center" width="1.4" position="0 0 0.02"></a-text>
        </a-plane>
      </a-entity>
    `
        : scenario === "space"
        ? `
      <!-- ================= 2. SPACE & SOLAR SYSTEM ================= -->
      <a-sky color="#02040a"></a-sky>
      <!-- Distant Stars Particles -->
      <a-sphere position="0 0 0" radius="60" material="side: back; color: #050b18; wireframe: true; opacity: 0.15;"></a-sphere>

      <!-- Central Glowing Sun -->
      <a-entity position="0 1.5 -4">
        <a-sphere class="clickable" interactive-object="info: Кун (Күн жүйесінің орталық жұлдызы, T = 5778 K)" radius="0.8" color="#f59e0b" material="emissive: #f59e0b; emissiveIntensity: 1.5;" animation="property: rotation; to: 0 360 0; loop: true; dur: 20000; easing: linear;">
          <a-light type="point" color="#fbbf24" intensity="2.5" distance="30"></a-light>
        </a-sphere>
      </a-entity>

      <!-- Mercury Orbit -->
      <a-entity position="0 1.5 -4" animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear;">
        <a-sphere class="clickable" interactive-object="info: Меркурий (Күнге ең жақын планета, R = 2440 км)" position="1.4 0 0" radius="0.08" color="#94a3b8"></a-sphere>
        <a-ring radius-inner="1.39" radius-outer="1.41" rotation="-90 0 0" color="#334155" opacity="0.4"></a-ring>
      </a-entity>

      <!-- Venus Orbit -->
      <a-entity position="0 1.5 -4" animation="property: rotation; to: 0 360 0; loop: true; dur: 7000; easing: linear;">
        <a-sphere class="clickable" interactive-object="info: Шолпан (Қалың атмосфералы планета, T = 464 °C)" position="2.2 0 0" radius="0.14" color="#f97316"></a-sphere>
        <a-ring radius-inner="2.19" radius-outer="2.21" rotation="-90 0 0" color="#334155" opacity="0.4"></a-ring>
      </a-entity>

      <!-- Earth and Moon Orbit -->
      <a-entity position="0 1.5 -4" animation="property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear;">
        <a-ring radius-inner="3.19" radius-outer="3.21" rotation="-90 0 0" color="#0284c7" opacity="0.6"></a-ring>
        <a-entity position="3.2 0 0">
          <a-sphere class="clickable" interactive-object="info: Жер планетасы (Тіршілік бесігі, 1 А.Б.)" radius="0.18" color="#0284c7" material="roughness: 0.6;">
            <!-- Moon -->
            <a-entity animation="property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear;">
              <a-sphere class="clickable" interactive-object="info: Ай (Жердің табиғи серігі)" position="0.35 0 0" radius="0.04" color="#cbd5e1"></a-sphere>
            </a-entity>
          </a-sphere>
        </a-entity>
      </a-entity>

      <!-- Mars Orbit -->
      <a-entity position="0 1.5 -4" animation="property: rotation; to: 0 360 0; loop: true; dur: 14000; easing: linear;">
        <a-sphere class="clickable" interactive-object="info: Марс (Қызыл планета, Олимп жанартауы)" position="4.2 0 0" radius="0.12" color="#ef4444"></a-sphere>
        <a-ring radius-inner="4.19" radius-outer="4.21" rotation="-90 0 0" color="#334155" opacity="0.4"></a-ring>
      </a-entity>

      <!-- Saturn with 3D Rings -->
      <a-entity position="0 1.5 -4" animation="property: rotation; to: 0 360 0; loop: true; dur: 22000; easing: linear;">
        <a-entity position="5.6 0 0">
          <a-sphere class="clickable" interactive-object="info: Сатурн (Газды алып, Ғажайып сақиналар жүйесі)" radius="0.35" color="#eab308">
            <a-ring radius-inner="0.45" radius-outer="0.75" rotation="60 30 0" color="#ca8a04" opacity="0.85"></a-ring>
          </a-sphere>
        </a-entity>
        <a-ring radius-inner="5.58" radius-outer="5.62" rotation="-90 0 0" color="#334155" opacity="0.3"></a-ring>
      </a-entity>
    `
        : scenario === "history"
        ? `
      <!-- ================= 3. HISTORICAL HERITAGE VR ================= -->
      <a-sky color="#fef3c7"></a-sky>
      <!-- Sand & Ancient Ground -->
      <a-plane position="0 0 0" rotation="-90 0 0" width="50" height="50" color="#d97706" roughness="0.9"></a-plane>

      <!-- Ancient Mausoleum Portal / Arch -->
      <a-entity position="0 0 -4">
        <!-- Main Arch Base -->
        <a-box position="-2 2 0" width="0.8" height="4" depth="1.2" color="#b45309" roughness="0.8"></a-box>
        <a-box position="2 2 0" width="0.8" height="4" depth="1.2" color="#b45309" roughness="0.8"></a-box>
        <a-box position="0 3.8 0" width="4.8" height="0.8" depth="1.2" color="#92400e" roughness="0.8"></a-box>

        <!-- Turquoise Dome (Түркістан стиліндегі көгілдір күмбез) -->
        <a-sphere class="clickable" interactive-object="info: Қожа Ахмет Ясауи стиліндегі көгілдір қыш күмбез" position="0 4.8 -1.2" radius="1.6" color="#0284c7" material="roughness: 0.4; metalness: 0.3;"></a-sphere>

        <!-- Ornate Mosaic Pattern -->
        <a-plane position="0 2.5 0.62" width="2.8" height="1.6" color="#0369a1" material="roughness: 0.2;">
          <a-text value="ҰЛЫ ЖІБЕК ЖОЛЫ МҰРАСЫ\nОтырар • Түркістан • Сауран" align="center" color="#ffffff" width="2.4" position="0 0 0.02"></a-text>
        </a-plane>
      </a-entity>

      <!-- Ancient Artifact 1: Clay Amphora on Pedestal -->
      <a-entity position="-2 0 -2">
        <a-cylinder position="0 0.4 0" radius="0.3" height="0.8" color="#78350f"></a-cylinder>
        <a-cylinder class="clickable" interactive-object="info: Отырар қыш құмырасы (XII ғасыр, су сақтау және сауда)" position="0 1.0 0" radius="0.22" height="0.45" color="#b45309">
          <a-torus position="0 0.1 0" radius="0.16" radius-tubular="0.02" color="#92400e"></a-torus>
        </a-cylinder>
      </a-entity>

      <!-- Ancient Artifact 2: Golden Coin & Jewelry Stand -->
      <a-entity position="2 0 -2">
        <a-cylinder position="0 0.4 0" radius="0.3" height="0.8" color="#78350f"></a-cylinder>
        <a-cylinder class="clickable" interactive-object="info: Жібек жолының көне теңгелері (Күміс дирхам және алтын динар)" position="0 0.9 0" radius="0.15" height="0.04" rotation="45 0 0" color="#eab308" metalness="0.9" roughness="0.2"></a-cylinder>
      </a-entity>
    `
        : `
      <!-- ================= 4. ROBOTICS & DIGITAL TWIN ================= -->
      <a-sky color="#0f172a"></a-sky>
      <!-- Industrial Tech Floor -->
      <a-grid width="30" height="30" grid-color="#10b981" position="0 0 0"></a-grid>
      <a-plane position="0 0 0" rotation="-90 0 0" width="30" height="30" color="#0f172a" metalness="0.7" roughness="0.3"></a-plane>

      <!-- Robot Base Stand -->
      <a-entity position="0 0 -2">
        <a-cylinder position="0 0.3 0" radius="0.6" height="0.6" color="#334155" metalness="0.8"></a-cylinder>

        <!-- Base Joint (Rotatable) -->
        <a-cylinder id="robotBase" class="clickable" robot-joint interactive-object="info: Робот негізгі буыны (Басып бұрыңыз)" position="0 0.7 0" radius="0.4" height="0.3" color="#10b981" metalness="0.6">
          <!-- Arm Link 1 -->
          <a-box position="0 0.55 0" width="0.22" height="0.9" depth="0.22" color="#059669">
            <!-- Elbow Joint -->
            <a-sphere position="0 0.45 0" radius="0.18" color="#047857">
              <!-- Arm Link 2 -->
              <a-cylinder position="0.3 0.3 0" radius="0.08" height="0.7" rotation="0 0 -55" color="#10b981">
                <!-- Gripper Hand -->
                <a-box class="clickable" interactive-object="info: Робот қармауышы (Серво-қозғалтқышпен басқарылатын қысқыш)" position="0 0.4 0" width="0.25" height="0.1" depth="0.25" color="#0f172a">
                  <a-box position="-0.08 0.1 0" width="0.04" height="0.12" depth="0.04" color="#ef4444"></a-box>
                  <a-box position="0.08 0.1 0" width="0.04" height="0.12" depth="0.04" color="#ef4444"></a-box>
                </a-box>
              </a-cylinder>
            </a-sphere>
          </a-box>
        </a-cylinder>
      </a-entity>

      <!-- Conveyor Belt -->
      <a-entity position="-1.8 0.4 -2">
        <a-box width="2.5" height="0.3" depth="0.6" color="#1e293b"></a-box>
        <a-cylinder position="0 0.2 0" radius="0.08" height="2.2" rotation="0 0 90" color="#475569"></a-cylinder>
        <!-- Conveyor Part -->
        <a-box class="clickable" interactive-object="info: Өңделетін дайын бөлшек (Цифрлық егіз)" position="0 0.25 0" width="0.2" height="0.15" depth="0.2" color="#f59e0b" animation="property: position; to: 0.8 0.25 0; dir: alternate; loop: true; dur: 2500; easing: linear;"></a-box>
      </a-entity>

      <!-- Industrial Control Screen -->
      <a-entity position="2 1.4 -1.5" rotation="0 -35 0">
        <a-plane width="1.4" height="0.9" color="#022c22" opacity="0.95">
          <a-text value="ЦИФРЛЫК ЕГИЗ БАСКАРУ\n- 6-осьтик робот\n- Серво куаты: 1.2 кВт\n- Жумыс аймагы: R = 1.8 м\n- Цикл уакыты: 2.4 с" color="#34d399" align="center" width="1.2" position="0 0 0.02"></a-text>
        </a-plane>
      </a-entity>
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
              A-Frame WebXR • Meta Quest 🥽
            </span>
            <span className="text-[0.75rem] font-medium text-slate-400">
              Кроссплатформалық VR/AR Тренажер
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
        className="relative mt-4 h-[560px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner"
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
            🥽 <span className="font-bold text-white">Meta Quest:</span> Браузерден ашып, оң жақ төмендегі «Enter VR» басыңыз
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
