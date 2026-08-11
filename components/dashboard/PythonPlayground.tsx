"use client";

import { useState } from "react";
import { Icon } from "@/components/dashboard/Icon";
import Link from "next/link";

interface CodePreset {
  id: string;
  name: string;
  code: string;
  output: string;
}

const PRESETS: CodePreset[] = [
  {
    id: "ohm",
    name: "⚡ Ом заңын есептеу (Python)",
    code: `# Физика: Ом заңы бойынша ток күшін есептеу
voltage = 220  # Вольт (U)
resistance = 10  # Ом (R)

current = voltage / resistance  # I = U / R
power = voltage * current       # P = U * I

print(f"Кернеу (U): {voltage} V")
print(f"Кедергі (R): {resistance} Ohm")
print(f"Ток күші (I): {current} Ampere")
print(f"Қуат (P): {power} Watt")`,
    output: `Кернеу (U): 220 V
Кедергі (R): 10 Ohm
Ток күші (I): 22.0 Ampere
Қуат (P): 4840.0 Watt
>>> Орындалу уақыты: 0.04с. Қателер жоқ [OK]`,
  },
  {
    id: "pendulum",
    name: "🍎 Маятник периоды (Python)",
    code: `import math

# Математикалық маятник периоды
g = 9.81  # Жердегі эркін түсу үдеуі
length = 1.5  # Маятник ұзындығы (метр)

period = 2 * math.pi * math.sqrt(length / g)

print(f"Маятник ұзындығы: {length} м")
print(f"Эркін түсу үдеуі: {g} м/с²")
print(f"Есептелген период (T0): {round(period, 3)} секунд")`,
    output: `Маятник ұзындығы: 1.5 м
Эркін түсу үдеуі: 9.81 м/с²
Есептелген период (T0): 2.458 секунд
>>> Орындалу уақыты: 0.02с. Қателер жоқ [OK]`,
  },
  {
    id: "dna",
    name: "🧬 ДНҚ нуклеотидтерін сану (BioPython)",
    code: `# Биология: ДНҚ тізбегін талдау
dna_sequence = "ATGCGATCGATCGATCGATCGATCGATCG"

count_A = dna_sequence.count("A")
count_T = dna_sequence.count("T")
count_G = dna_sequence.count("G")
count_C = dna_sequence.count("C")

gc_content = (count_G + count_C) / len(dna_sequence) * 100

print(f"ДНҚ ұзындығы: {len(dna_sequence)} нуклеотид")
print(f"A: {count_A}, T: {count_T}, G: {count_G}, C: {count_C}")
print(f"GC-құрамы: {round(gc_content, 1)}%")`,
    output: `ДНҚ ұзындығы: 29 нуклеотид
A: 7, T: 7, G: 8, C: 7
GC-құрамы: 51.7%
>>> Орындалу уақыты: 0.03с. Қателер жоқ [OK]`,
  },
];

export function PythonPlayground() {
  const [selectedPreset, setSelectedPreset] = useState<CodePreset>(PRESETS[0]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Дайын нәтиже жүктелуде...");
    setTimeout(() => {
      setIsRunning(false);
      setOutput(selectedPreset.output);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div>
          <Link
            href="/dashboard/simulations"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Icon name="ArrowLeft" className="size-3.5" /> Симуляцияларға оралу
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            🐍 Python STEM код мысалдары
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Дайын Python мысалдарын зерттеңіз. Бұл демо кодты браузерде орындамайды — әр мысалдың алдын ала есептелген нәтижесін көрсетеді.
          </p>
        </div>

        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer shadow-lg"
        >
          {isRunning ? (
            <Icon name="Loader" className="size-4 animate-spin" />
          ) : (
            <Icon name="Play" className="size-4" />
          )}
          <span>{isRunning ? "НӘТИЖЕ ЖҮКТЕЛУДЕ..." : "МЫСАЛ НӘТИЖЕСІН КӨРУ"}</span>
        </button>
      </div>

      {/* Presets Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPreset(p);
              setOutput("");
            }}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border ${
              selectedPreset.id === p.id
                ? "bg-slate-900 border-cyan-400 text-cyan-300 shadow-md"
                : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Editor & Console Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Code Editor */}
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
            <span className="flex items-center gap-2 text-cyan-400 font-bold">
              <Icon name="CircuitBoard" className="size-4" /> main.py
            </span>
            <span>Оқу демонстрациясы</span>
          </div>

          <textarea
            value={selectedPreset.code}
            readOnly
            aria-label="Python мысалының коды"
            className="w-full h-80 bg-transparent text-xs text-emerald-300 font-mono focus:outline-none leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>

        {/* Console Terminal */}
        <div className="rounded-2xl border border-white/10 bg-black p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
            <span className="flex items-center gap-2 text-purple-400 font-bold">
              <Icon name="MonitorSmartphone" className="size-4" /> Output Console (Terminal)
            </span>
            <span className="text-[0.65rem] text-slate-500">Алдын ала дайын нәтиже</span>
          </div>

          <pre className="h-80 overflow-y-auto text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {output || "# Мысалдың дайын нәтижесін көру үшін батырманы басыңыз..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
