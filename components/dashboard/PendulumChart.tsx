"use client";

import { useId, useState } from "react";

/**
 * Маятник шамаларының уақыт бойынша графигі.
 *
 * Сайттағы басқа диаграммалар сияқты: бір мезгілде бір ғана серия салынады,
 * сондықтан түс ешқандай мағына тасымалдамайды және аңыз (legend) қажет емес.
 * Серияны ауыстырғыш арқылы таңдайды.
 */

export type Sample = { t: number; theta: number; energy: number };

const HUE = "#2563eb";
const WINDOW_SECONDS = 10;

export function PendulumChart({ samples }: { samples: Sample[] }) {
  const [series, setSeries] = useState<"theta" | "energy">("theta");
  const gid = useId().replace(/:/g, "");

  const w = 520;
  const h = 150;
  const padX = 34;
  const padY = 14;

  const values = samples.map((s) => (series === "theta" ? (s.theta * 180) / Math.PI : s.energy));
  const maxAbs = Math.max(1e-6, ...values.map((v) => Math.abs(v)));
  // Бұрыш нөлдің екі жағына, ал энергия тек оң жаққа шығады.
  const min = series === "theta" ? -maxAbs : 0;
  const max = maxAbs;

  const tEnd = samples.length > 0 ? samples[samples.length - 1].t : 0;
  const tStart = Math.max(0, tEnd - WINDOW_SECONDS);
  const span = Math.max(0.001, tEnd - tStart);

  const px = (t: number) => padX + ((t - tStart) / span) * (w - padX - 8);
  const py = (v: number) => h - padY - ((v - min) / (max - min || 1)) * (h - padY * 2);

  const path = samples
    .filter((s) => s.t >= tStart)
    .map((s, i) => {
      const value = series === "theta" ? (s.theta * 180) / Math.PI : s.energy;
      return `${i === 0 ? "M" : "L"}${px(s.t).toFixed(1)} ${py(value).toFixed(1)}`;
    })
    .join(" ");

  const unit = series === "theta" ? "°" : "Дж";
  const label =
    samples.length === 0
      ? "График әлі бос — симуляцияны іске қосыңыз."
      : `${series === "theta" ? "Бұрыштың" : "Толық энергияның"} уақыт бойынша өзгерісі. ` +
        `Соңғы мән: ${values[values.length - 1].toFixed(2)} ${unit}.`;

  return (
    <div>
      <div
        role="tablist"
        aria-label="График сериясы"
        className="mb-2 flex gap-1 rounded-lg bg-ink-700/5 p-1 dark:bg-white/8"
      >
        {(
          [
            { id: "theta", label: "Бұрыш, °" },
            { id: "energy", label: "Энергия, Дж" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={series === item.id}
            onClick={() => setSeries(item.id)}
            className={
              series === item.id
                ? "flex-1 rounded-md bg-white px-2 py-1.5 text-[0.71rem] font-semibold text-ink-900 shadow-soft dark:bg-ink-700 dark:text-white"
                : "flex-1 rounded-md px-2 py-1.5 text-[0.71rem] font-medium text-ink-700/75 transition hover:text-ink-900 dark:text-paper-300 dark:hover:text-white"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full text-ink-700 dark:text-paper-200"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={HUE} stopOpacity="0.25" />
            <stop offset="100%" stopColor={HUE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Тор сызықтары */}
        {[max, (max + min) / 2, min].map((value) => (
          <g key={value}>
            <line
              x1={padX}
              y1={py(value)}
              x2={w - 8}
              y2={py(value)}
              stroke="currentColor"
              strokeOpacity="0.12"
            />
            <text x={2} y={py(value) + 3} fontSize="9" fill="currentColor" fillOpacity="0.55">
              {value.toFixed(value === 0 ? 0 : 1)}
            </text>
          </g>
        ))}

        {path ? (
          <path
            d={path}
            fill="none"
            stroke={HUE}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </div>
  );
}
