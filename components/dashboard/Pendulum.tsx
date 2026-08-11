"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEG,
  FIXED_STEP,
  RAD,
  advance,
  correctedPeriod,
  energy,
  smallAnglePeriod,
  stepPendulum,
  type PendulumParams,
  type PendulumState,
} from "@/lib/pendulum";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { saveRecord } from "@/lib/progress";
import { Icon } from "./Icon";
import { PendulumChart, type Sample } from "./PendulumChart";
import { KatexFormula } from "@/components/ui/KatexFormula";

/**
 * Маятник симуляциясы.
 *
 * Көрініс — SVG, WebGL емес. Себебі бұл модульдің мәні — сандар: период,
 * энергия және олардың параметрлерге тәуелділігі. SVG кадр салынбаса да
 * React күйінен тікелей дұрыс көрініс береді, әр мәнді тексеруге болады және
 * бетте екінші WebGL контексі пайда болмайды.
 *
 * Физиканың өзі `lib/pendulum.ts` ішінде — таза функциялар. «Қадам» түймесі
 * автоматты жүріспен дәл сол функцияларды шақырады, сондықтан симуляцияны
 * анимациясыз да толық тексеруге болады.
 */

const PIVOT = { x: 160, y: 34 };
const PX_PER_M = 56;
const TRAIL_LENGTH = 90;
const MAX_SAMPLES = 600;

type Preset = { label: string; value: number };
const GRAVITY_PRESETS: Preset[] = [
  { label: "Ай", value: 1.62 },
  { label: "Марс", value: 3.71 },
  { label: "Жер", value: 9.81 },
  { label: "Юпитер", value: 24.79 },
];

function Slider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  note,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  note?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[0.75rem] text-ink-700 dark:text-paper-200">{label}</span>
        <span className="font-display text-[0.78rem] font-semibold text-ink-900 tabular-nums dark:text-white">
          {value.toFixed(step < 1 ? 2 : 0)} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label}, ${unit}`}
        className="mt-1 w-full accent-brand-600"
      />
      {note ? (
        <span className="block text-[0.66rem] leading-snug text-ink-700/65 dark:text-paper-300">
          {note}
        </span>
      ) : null}
    </label>
  );
}

export function Pendulum({ lessonId = "general" }: { lessonId?: string }) {
  const reduced = usePrefersReducedMotion();

  const [params, setParams] = useState<PendulumParams>({
    length: 1,
    mass: 1,
    gravity: 9.81,
    damping: 0,
  });
  const [theta0, setTheta0] = useState(20);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(true);

  /** Көрсетілетін күй — секундына ~20 рет жаңарады. */
  const [display, setDisplay] = useState<PendulumState>({ theta: 20 * RAD, omega: 0, t: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [measured, setMeasured] = useState<number | null>(null);

  const stateRef = useRef<PendulumState>({ theta: 20 * RAD, omega: 0, t: 0 });
  const carryRef = useRef(0);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const samplesRef = useRef<Sample[]>([]);
  const lastCommitRef = useRef(0);
  const crossRef = useRef<{ last: number | null; halves: number[] }>({ last: null, halves: [] });
  const savedRef = useRef(false);
  /* Слайдер мәндері рендерсіз оқылуы үшін айна: цикл әр өзгерісте қайта
     құрылмайды, сондықтан тәуелділік тізімі қысқа болғаны дұрыс. */
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const wrapperRef = useRef<HTMLDivElement>(null);

  /** Күйді интерфейске шығару (жиілігі шектеулі). */
  const commit = useCallback((now: number, force = false) => {
    if (!force && now - lastCommitRef.current < 50) return;
    lastCommitRef.current = now;
    setDisplay({ ...stateRef.current });
    setTrail([...trailRef.current]);
    setSamples([...samplesRef.current]);
  }, []);

  /**
   * Жаңа күйді тіркеу: периодты өлшеу, ізді және график үлгілерін жаңарту.
   * Автоматты жүріс те, «Қадам» түймесі де осыны шақырады — әйтпесе қолмен
   * қадамдағанда период ешқашан өлшенбей қалар еді.
   */
  const record = useCallback((previousTheta: number) => {
    const state = stateRef.current;
    const params = paramsRef.current;

    // Нөлден өту сәті — жарты период.
    if (previousTheta !== 0 && Math.sign(previousTheta) !== Math.sign(state.theta)) {
      const cross = crossRef.current;
      if (cross.last !== null) {
        cross.halves = [...cross.halves, state.t - cross.last].slice(-2);
        if (cross.halves.length === 2) {
          setMeasured(cross.halves[0] + cross.halves[1]);
        }
      }
      cross.last = state.t;
    }

    const point = {
      x: PIVOT.x + Math.sin(state.theta) * params.length * PX_PER_M,
      y: PIVOT.y + Math.cos(state.theta) * params.length * PX_PER_M,
    };
    trailRef.current = [...trailRef.current, point].slice(-TRAIL_LENGTH);

    samplesRef.current = [
      ...samplesRef.current,
      { t: state.t, theta: state.theta, energy: energy(state, params).total },
    ].slice(-MAX_SAMPLES);
  }, []);

  /** Бір физикалық ілгерілеу. */
  const integrate = useCallback(
    (dt: number) => {
      const before = stateRef.current.theta;
      const { state, carry } = advance(stateRef.current, paramsRef.current, dt, carryRef.current);
      stateRef.current = state;
      carryRef.current = carry;
      record(before);
    },
    [record],
  );

  /* Автоматты жүріс. Бет көрінбесе немесе қойынды жабық болса — тоқтайды. */
  useEffect(() => {
    if (!running || !visible) return;

    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const dt = (now - previous) / 1000;
      previous = now;
      if (!document.hidden) {
        integrate(dt);
        commit(now);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, visible, integrate, commit]);

  /* Экраннан шыққанда есептеуді тоқтату. */
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* Симуляция шынымен қолданылғанда ғана нәтиже жазылады. */
  useEffect(() => {
    if (savedRef.current || display.t < 5) return;
    savedRef.current = true;
    saveRecord({
      id: "pendulum",
      kind: "sim",
      lessonId,
      subject: "physics",
      stage: "sim",
      score: null,
      correct: 0,
      total: 0,
      attempts: 1,
      durationMs: Math.round(display.t * 1000),
      at: Date.now(),
    });
  }, [display.t, lessonId]);

  const reset = useCallback(
    (angleDeg: number = theta0) => {
      stateRef.current = { theta: angleDeg * RAD, omega: 0, t: 0 };
      carryRef.current = 0;
      trailRef.current = [];
      samplesRef.current = [];
      crossRef.current = { last: null, halves: [] };
      setMeasured(null);
      commit(performance.now(), true);
    },
    [theta0, commit],
  );

  /** Дәл 1/60 секунд — төрт тұрақты қадам. Тексеруге ыңғайлы. */
  const stepOnce = () => {
    const before = stateRef.current.theta;
    for (let i = 0; i < 4; i += 1) {
      stateRef.current = stepPendulum(stateRef.current, paramsRef.current, FIXED_STEP);
    }
    record(before);
    commit(performance.now(), true);
  };

  const e = energy(display, params);
  const t0 = smallAnglePeriod(params);
  const tCorrected = correctedPeriod(params, theta0 * RAD);
  const bob = {
    x: PIVOT.x + Math.sin(display.theta) * params.length * PX_PER_M,
    y: PIVOT.y + Math.cos(display.theta) * params.length * PX_PER_M,
  };
  const bobR = 8 + 6 * Math.cbrt(params.mass / 5);
  const energyMax = Math.max(1e-6, e.total);

  return (
    <div ref={wrapperRef} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Сахна мен график */}
      <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
        <svg
          viewBox="0 0 320 250"
          className="w-full text-ink-700 dark:text-paper-200"
          role="img"
          aria-label={`Маятник: бұрыш ${(display.theta * DEG).toFixed(1)} градус, ұзындығы ${params.length.toFixed(2)} метр, өлшенген период ${measured ? measured.toFixed(2) : "әлі белгісіз"} секунд.`}
        >
          {/* Төбе */}
          <line
            x1={90}
            y1={PIVOT.y}
            x2={230}
            y2={PIVOT.y}
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          {/* Тік бағыт */}
          <line
            x1={PIVOT.x}
            y1={PIVOT.y}
            x2={PIVOT.x}
            y2={PIVOT.y + params.length * PX_PER_M + 12}
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeDasharray="3 4"
          />

          {/* Із */}
          {!reduced && trail.length > 1 ? (
            <polyline
              points={trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
              fill="none"
              stroke="#2563eb"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />
          ) : null}

          {/* Сым және жүк */}
          <line
            x1={PIVOT.x}
            y1={PIVOT.y}
            x2={bob.x}
            y2={bob.y}
            stroke="currentColor"
            strokeOpacity="0.75"
            strokeWidth="2"
          />
          <circle cx={PIVOT.x} cy={PIVOT.y} r="4" fill="currentColor" fillOpacity="0.8" />
          <circle cx={bob.x} cy={bob.y} r={bobR} fill="#2563eb" />
          <circle cx={bob.x} cy={bob.y} r={bobR} fill="none" stroke="#1e3a8a" strokeWidth="1.5" />

          {/* Бұрыш белгісі */}
          <text
            x={PIVOT.x + 10}
            y={PIVOT.y + 22}
            fontSize="11"
            fill="currentColor"
            fillOpacity="0.7"
          >
            {(display.theta * DEG).toFixed(1)}°
          </text>
        </svg>

        <div className="mt-2">
          <PendulumChart samples={samples} />
        </div>
      </div>

      {/* Басқару мен көрсеткіштер */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRunning((value) => !value)}
              className="flex items-center gap-1.5 rounded-lg bg-deep-500 px-3 py-2 text-[0.78rem] font-semibold text-white"
            >
              <Icon name={running ? "Pause" : "Play"} className="size-3.5" strokeWidth={2.4} />
              {running ? "Тоқтату" : "Ойнату"}
            </button>
            <button
              type="button"
              onClick={stepOnce}
              className="flex items-center gap-1.5 rounded-lg border border-ink-700/10 px-3 py-2 text-[0.78rem] font-semibold text-ink-800 transition hover:bg-ink-700/5 dark:border-white/15 dark:text-paper-100 dark:hover:bg-white/8"
            >
              <Icon name="SkipForward" className="size-3.5" strokeWidth={2.2} />
              Қадам
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                reset();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-ink-700/10 px-3 py-2 text-[0.78rem] font-semibold text-ink-800 transition hover:bg-ink-700/5 dark:border-white/15 dark:text-paper-100 dark:hover:bg-white/8"
            >
              <Icon name="RotateCcw" className="size-3.5" strokeWidth={2.2} />
              Қалпына келтіру
            </button>
          </div>

          {reduced ? (
            <p className="mt-2 text-[0.68rem] leading-snug text-ink-700/70 dark:text-paper-300">
              Қозғалыс шектелген режим қосулы — симуляция тоқтап тұр. «Қадам» немесе «Ойнату»
              арқылы қолмен жүргізіңіз.
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5 rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
          <Slider
            label="Ұзындығы"
            unit="м"
            value={params.length}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(length) => setParams((p) => ({ ...p, length }))}
          />
          <Slider
            label="Массасы"
            unit="кг"
            value={params.mass}
            min={0.2}
            max={5}
            step={0.1}
            note="Периодқа әсер етпейді — тек энергияға."
            onChange={(mass) => setParams((p) => ({ ...p, mass }))}
          />
          <Slider
            label="Бастапқы бұрыш"
            unit="°"
            value={theta0}
            min={5}
            max={90}
            step={1}
            onChange={(value) => {
              setTheta0(value);
              setRunning(false);
              reset(value);
            }}
          />
          <Slider
            label="Сөну"
            unit="1/с"
            value={params.damping}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(damping) => setParams((p) => ({ ...p, damping }))}
          />
          <Slider
            label="Ауырлық күші"
            unit="м/с²"
            value={params.gravity}
            min={1.6}
            max={25}
            step={0.1}
            onChange={(gravity) => setParams((p) => ({ ...p, gravity }))}
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {GRAVITY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setParams((p) => ({ ...p, gravity: preset.value }))}
                className="rounded-full border border-ink-700/10 px-2.5 py-1 text-[0.7rem] font-medium text-ink-700 transition hover:bg-ink-700/6 dark:border-white/15 dark:text-paper-200 dark:hover:bg-white/10"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Көрсеткіштер */}
        <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
          <dl className="space-y-1.5 text-[0.76rem]">
            {[
              {
                label: "Өлшенген период",
                value: measured ? `${measured.toFixed(3)} с` : "— (тербелісті бастаңыз)",
                strong: true,
              },
              { label: "Кіші бұрыш формуласы T₀", value: `${t0.toFixed(3)} с` },
              { label: "Амплитуда түзетуімен", value: `${tCorrected.toFixed(3)} с` },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-2">
                <dt className="text-ink-700/85 dark:text-paper-300">{row.label}</dt>
                <dd
                  className={
                    row.strong
                      ? "font-display font-bold text-ink-900 tabular-nums dark:text-white"
                      : "text-ink-800 tabular-nums dark:text-paper-100"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 rounded-xl bg-ink-700/5 p-2.5 text-center text-cyan-400 border border-cyan-500/20 dark:bg-black/40">
            <p className="text-[0.65rem] text-slate-400 mb-1 font-semibold">Маятник теңдеуі (KaTeX LaTeX):</p>
            <KatexFormula math={`T_0 = 2\\pi \\sqrt{\\frac{L}{g}} = 2\\pi \\sqrt{\\frac{${params.length}}{${params.gravity}}} = ${t0.toFixed(3)}\\text{ с}`} block />
          </div>

          <p className="mt-2.5 mb-1 text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
            Энергия
          </p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-700/8 dark:bg-white/12">
            <div
              className="h-full"
              style={{ width: `${(e.kinetic / energyMax) * 100}%`, backgroundColor: "#2563eb" }}
            />
            <div
              className="h-full"
              style={{ width: `${(e.potential / energyMax) * 100}%`, backgroundColor: "#7c3aed" }}
            />
          </div>
          <dl className="mt-1.5 space-y-1 text-[0.72rem]">
            <div className="flex justify-between gap-2">
              <dt className="text-[#2563eb]">Кинетикалық</dt>
              <dd className="tabular-nums text-ink-800 dark:text-paper-100">
                {e.kinetic.toFixed(3)} Дж
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#7c3aed]">Потенциалдық</dt>
              <dd className="tabular-nums text-ink-800 dark:text-paper-100">
                {e.potential.toFixed(3)} Дж
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-ink-700/8 pt-1 dark:border-white/10">
              <dt className="font-semibold text-ink-800 dark:text-paper-100">Толық</dt>
              <dd className="font-semibold tabular-nums text-ink-900 dark:text-white">
                {e.total.toFixed(3)} Дж
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
