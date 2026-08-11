"use client";

import { useState } from "react";
import { Icon } from "@/components/dashboard/Icon";
import { KatexFormula } from "@/components/ui/KatexFormula";
import Link from "next/link";

export function CircuitSimulator() {
  const [voltage, setVoltage] = useState(12); // Volts
  const [resistance, setResistance] = useState(6); // Ohms
  const [isOn, setIsOn] = useState(true);

  // Ohm's Law: I = U / R
  const current = isOn ? (voltage / resistance).toFixed(2) : "0.00";
  const power = isOn ? ((voltage * voltage) / resistance).toFixed(1) : "0.0";
  const bulbBrightness = isOn ? Math.min(1, voltage / 24) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/simulations"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Icon name="ArrowLeft" className="size-3.5" /> Симуляцияларға оралу
            </Link>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            ⚡ Электр Тізбегі & Ом Заңы Симуляторы
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Кернеу (U) және кедергіні (R) өзгертіп, Ток күшінің (I = U/R) өзгеруін және лампочканың жарықтануын бақылаңыз.
          </p>
        </div>

        {/* Master Power Switch */}
        <button
          onClick={() => setIsOn(!isOn)}
          className={`flex items-center gap-3 rounded-2xl px-6 py-3 font-bold transition shadow-lg cursor-pointer ${
            isOn
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              : "bg-rose-600 text-white hover:bg-rose-500"
          }`}
        >
          <Icon name={isOn ? "Zap" : "ZapOff"} className="size-5" />
          <span>{isOn ? "ТІЗБЕК ТҰЙЫҚТАЛҒАН (ON)" : "ТІЗБЕК АЖЫРАТЫЛҒАН (OFF)"}</span>
        </button>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Circuit Diagram Visualizer (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950 p-6 flex flex-col justify-between relative overflow-hidden min-h-[26rem]">
          {/* Background Glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 75% 50%, rgba(251, 191, 36, ${
                bulbBrightness * 0.45
              }), transparent 70%)`,
            }}
          />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 z-10">
            <span>Интерактивті Электр Схемасы</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Icon name="Sun" className="size-4" /> Шам жарығы: {Math.round(bulbBrightness * 100)}%
            </span>
          </div>

          {/* SVG Interactive Animated Schematic */}
          <div className="my-6 relative z-10 flex place-items-center justify-center">
            <svg viewBox="0 0 600 320" className="w-full max-w-lg drop-shadow-2xl">
              {/* Circuit Wires */}
              <rect
                x="50"
                y="50"
                width="500"
                height="220"
                rx="20"
                fill="none"
                stroke={isOn ? "#38bdf8" : "#475569"}
                strokeWidth="6"
                className="transition-colors duration-300"
              />

              {/* Animated Electrons / Current particles when ON */}
              {isOn && (
                <rect
                  x="50"
                  y="50"
                  width="500"
                  height="220"
                  rx="20"
                  fill="none"
                  stroke="#7dd3fc"
                  strokeWidth="6"
                  strokeDasharray="12 16"
                  className="animate-pulse"
                  style={{
                    animation: `dash ${Math.max(0.3, 3 - Number(current) * 0.5)}s linear infinite`,
                  }}
                />
              )}

              {/* DC Battery (Left) */}
              <g transform="translate(50, 160)">
                <rect x="-25" y="-35" width="50" height="70" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <line x1="-12" y1="-20" x2="-12" y2="20" stroke="#f87171" strokeWidth="5" />
                <line x1="12" y1="-10" x2="12" y2="10" stroke="#38bdf8" strokeWidth="5" />
                <text x="-35" y="5" fill="#f87171" fontSize="16" fontWeight="bold">
                  +
                </text>
                <text x="22" y="5" fill="#38bdf8" fontSize="16" fontWeight="bold">
                  -
                </text>
                <text x="-25" y="55" fill="#cbd5e1" fontSize="12">
                  Батарея ({voltage}V)
                </text>
              </g>

              {/* Light Bulb (Right) */}
              <g transform="translate(550, 160)">
                <circle
                  r="32"
                  fill={isOn ? `rgba(251, 191, 36, ${0.2 + bulbBrightness * 0.8})` : "#1e293b"}
                  stroke={isOn ? "#fbbf24" : "#64748b"}
                  strokeWidth="3"
                  className="transition-colors duration-300"
                />
                <path
                  d="M -12,10 L 0,-15 L 12,10"
                  fill="none"
                  stroke={isOn ? "#fef08a" : "#94a3b8"}
                  strokeWidth="3"
                />
                <text x="-30" y="55" fill="#cbd5e1" fontSize="12">
                  Шам ({power} W)
                </text>
              </g>

              {/* Resistor (Top) */}
              <g transform="translate(300, 50)">
                <rect x="-40" y="-18" width="80" height="36" rx="6" fill="#334155" stroke="#a855f7" strokeWidth="3" />
                <text x="-25" y="5" fill="#e9d5ff" fontSize="13" fontWeight="bold">
                  {resistance} Ω
                </text>
                <text x="-35" y="-25" fill="#cbd5e1" fontSize="12">
                  Резистор (R)
                </text>
              </g>

              {/* Ammeter (Bottom) */}
              <g transform="translate(300, 270)">
                <circle r="22" fill="#0f172a" stroke="#22c55e" strokeWidth="3" />
                <text x="-16" y="5" fill="#4ade80" fontSize="13" fontWeight="bold">
                  {current}A
                </text>
                <text x="-35" y="40" fill="#cbd5e1" fontSize="12">
                  Амперметр (I)
                </text>
              </g>
            </svg>
          </div>

          {/* Formulas Rail */}
          <div className="grid grid-cols-3 gap-3 text-center border-t border-white/10 pt-4 z-10">
            <div className="rounded-xl bg-slate-900/80 p-3 border border-cyan-500/20">
              <span className="text-[0.7rem] text-slate-400">Кернеу (U)</span>
              <p className="text-lg font-bold text-cyan-400">{voltage} V</p>
            </div>
            <div className="rounded-xl bg-slate-900/80 p-3 border border-purple-500/20">
              <span className="text-[0.7rem] text-slate-400">Кедергі (R)</span>
              <p className="text-lg font-bold text-purple-400">{resistance} Ω</p>
            </div>
            <div className="rounded-xl bg-slate-900/80 p-3 border border-emerald-500/20">
              <span className="text-[0.7rem] text-slate-400">Ток күші (I)</span>
              <p className="text-lg font-bold text-emerald-400">{current} A</p>
            </div>
          </div>
        </div>

        {/* Controls & Math Panel (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-white space-y-5">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Icon name="Sliders" className="size-5 text-cyan-400" /> Тізбек Параметрлері
            </h3>

            {/* Voltage Control */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Батарея кернеуі (U):</span>
                <span className="text-cyan-400 font-bold">{voltage} Вольт</span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Resistance Control */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Резистор кедергісі (R):</span>
                <span className="text-purple-400 font-bold">{resistance} Ом</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={resistance}
                onChange={(e) => setResistance(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Calculated Formula Box */}
            <div className="rounded-xl bg-slate-950 p-4 border border-white/10 space-y-3">
              <div className="text-xs font-semibold text-slate-400">Ом Заңы (KaTeX LaTeX):</div>
              <div className="rounded-xl bg-black/60 p-3 text-center border border-cyan-500/30 text-cyan-300">
                <KatexFormula math={`I = \\frac{U}{R} = \\frac{${voltage}\\text{V}}{${resistance}\\Omega} = ${current}\\text{ A}`} block />
              </div>
              <p className="text-[0.72rem] text-slate-400 leading-normal">
                Кернеу артқан сайын электрон ағыны (ток) тездейді. Кедергі артқан сайын ток кемиді.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
