"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/dashboard/Icon";
import { KatexFormula } from "@/components/ui/KatexFormula";
import Link from "next/link";

interface Planet {
  name: string;
  distanceAU: number;
  massRatio: number;
  color: string;
  size: number;
  periodDays: number;
  gravity: number;
}

const PLANETS: Planet[] = [
  { name: "Меркурий", distanceAU: 0.39, massRatio: 0.055, color: "#94a3b8", size: 10, periodDays: 88, gravity: 3.7 },
  { name: "Шолпан (Venus)", distanceAU: 0.72, massRatio: 0.815, color: "#fef08a", size: 14, periodDays: 225, gravity: 8.87 },
  { name: "Жер (Earth)", distanceAU: 1.0, massRatio: 1.0, color: "#38bdf8", size: 16, periodDays: 365, gravity: 9.81 },
  { name: "Марс", distanceAU: 1.52, massRatio: 0.107, color: "#f87171", size: 12, periodDays: 687, gravity: 3.71 },
  { name: "Юпитер", distanceAU: 5.2, massRatio: 317.8, color: "#fb923c", size: 30, periodDays: 4333, gravity: 24.79 },
];

export function AstronomySimulator() {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet>(PLANETS[2]); // Earth
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div>
          <Link
            href="/dashboard/simulations"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Icon name="ArrowLeft" className="size-3.5" /> Симуляцияларға оралу
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            🪐 Күн Жүйесі & Гравитация Симуляторы
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Планеталардың орбиталық қозғалысын және Бүкіләлемдік тартылыс заңын зерттеңіз.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 3D Solar System Viewport (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950 p-6 flex flex-col justify-between relative overflow-hidden min-h-[28rem]">
          <div className="flex items-center justify-between text-xs text-slate-400 z-10">
            <span>3D Интерактивті Орбиталар</span>
            <span className="text-cyan-300 font-bold">Жылдамдық: {speedMultiplier}x</span>
          </div>

          {/* Animated Solar System Orbits */}
          <div className="my-8 flex items-center justify-center relative min-h-[16rem] z-10">
            {/* The Sun */}
            <div className="grid size-16 place-items-center rounded-full bg-amber-400 text-slate-950 font-extrabold shadow-[0_0_50px_rgba(251,191,36,0.8)] border-4 border-amber-200 z-20">
              ☀️ КҮН
            </div>

            {/* Orbit Rings & Orbiting Planets */}
            {PLANETS.map((planet, idx) => {
              const radius = 60 + idx * 36;
              const duration = (planet.periodDays / 30) / speedMultiplier;
              const isSelected = selectedPlanet.name === planet.name;

              return (
                <div
                  key={planet.name}
                  className={`absolute rounded-full border ${
                    isSelected ? "border-cyan-400 border-2" : "border-white/15"
                  } pointer-events-none`}
                  style={{
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full relative"
                  >
                    <button
                      onClick={() => setSelectedPlanet(planet)}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer flex flex-col items-center group"
                    >
                      <div
                        className="rounded-full shadow-lg transition group-hover:scale-125"
                        style={{
                          width: `${planet.size}px`,
                          height: `${planet.size}px`,
                          backgroundColor: planet.color,
                        }}
                      />
                      <span className="text-[0.62rem] font-bold text-white opacity-80 group-hover:opacity-100 mt-1 whitespace-nowrap">
                        {planet.name.split(" ")[0]}
                      </span>
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Speed Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 z-10">
            <span className="text-xs text-slate-400 font-semibold">Симуляция жылдамдығы:</span>
            <div className="flex items-center gap-2">
              {[0.5, 1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    speedMultiplier === s
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Physics Formula Panel (1 col) */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5 text-white">
          <div>
            <span className="text-xs text-cyan-400 font-bold">Таңдалған Планета:</span>
            <h2 className="text-xl font-bold text-white mt-1">{selectedPlanet.name}</h2>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Күннен қашықтығы:</span>
              <span className="font-bold text-cyan-300">{selectedPlanet.distanceAU} А.Б.</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Айналу периоды:</span>
              <span className="font-bold text-purple-300">{selectedPlanet.periodDays} күн</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span>Эркін түсу үдеуі (g):</span>
              <span className="font-bold text-emerald-300">{selectedPlanet.gravity} м/с²</span>
            </div>
          </div>

          {/* KaTeX Gravity Formula Box */}
          <div className="rounded-xl bg-slate-950 p-4 border border-white/10 space-y-3">
            <div className="text-xs font-semibold text-slate-400">
              Бүкіләлемдік Тартылыс Заңы (Newton&apos;s Gravity):
            </div>
            <div className="rounded-xl bg-black/60 p-3 text-center text-cyan-300 border border-cyan-500/30">
              <KatexFormula math={'F = G \\cdot \\frac{m_1 \\cdot m_2}{r^2}'} block />
            </div>
            <p className="text-[0.72rem] text-slate-400 leading-normal">
              Планеталардың тартылыс күші олардың массаларына тура пропорционал және арақашықтықтың квадратына кері пропорционал.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
