"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import {
  softSkillsRadar,
  subjectProgress,
  analyticsTrend,
  monitoringIndicators,
  chartHue,
} from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Demo analytics. Every chart here is a single-series magnitude view, so colour
 * carries no identity — labels do. That keeps the whole dashboard legible for
 * colour-vision-deficient readers without needing a legend anywhere.
 */
export function Analytics() {
  const [showTable, setShowTable] = useState(false);

  return (
    <Section id="analytics" tone="dark" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_0%,#0d1733_0%,#060b1a_65%)]" />
        <div className="absolute top-1/3 -left-32 size-[30rem] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="container-x">
        <SectionHeading
          eyebrow="Оқу аналитикасы"
          tone="dark"
          title={
            <>
              Өсуді көрсетеді — <span className="text-gradient-light">рейтингсіз</span>
            </>
          }
          lead="Мониторинг жүйесі пәндік нәтижелер мен икемді дағдылардың дамуын уақыт бойы тіркеп, оларды даму карталары және рейтингтік емес визуалды көрсеткіштер түрінде ұсынады."
        />

        <Reveal from="up" className="mt-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/12 px-3.5 py-1.5 text-[0.72rem] font-medium text-amber-300 ring-1 ring-amber-400/25">
              <svg className="size-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5.6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 4.2v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7" cy="9.7" r="0.8" fill="currentColor" />
              </svg>
              Демонстрациялық деректер — тіркелу де, дерекқор да жоқ
            </span>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}
              className="rounded-full bg-white/8 px-3.5 py-1.5 text-[0.72rem] font-medium text-white/70 ring-1 ring-white/12 transition hover:bg-white/14 hover:text-white"
            >
              {showTable ? "Кестені жасыру" : "Кесте түрінде көру"}
            </button>
          </div>
        </Reveal>

        {/* ---------- dashboard ---------- */}
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* stat tiles */}
          <Reveal from="up" className="lg:col-span-12">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Аяқталған жоба", value: "24", note: "бес модуль бойынша" },
                { label: "Командалық үлес", value: "96%", note: "қатысу деңгейі" },
                { label: "Шығармашылық өнім", value: "11", note: "цифрлық портфолиода" },
                { label: "Рефлексия жазбасы", value: "38", note: "осы тоқсанда" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="glass-dark rounded-2xl px-5 py-5"
                >
                  <div className="text-[0.68rem] font-medium tracking-wide text-brand-100/45 uppercase">
                    {s.label}
                  </div>
                  <div className="mt-2 font-display text-3xl font-semibold text-white tabular-nums">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[0.72rem] text-brand-100/40">{s.note}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* radar */}
          <Reveal from="right" className="lg:col-span-5">
            <figure className="glass-dark h-full rounded-3xl p-6 sm:p-7">
              <figcaption>
                <h3 className="text-[0.95rem] font-semibold text-white">Икемді дағдылар профилі</h3>
                <p className="mt-1 text-[0.76rem] text-brand-100/45">
                  Сегіз өлшем · бір білім алушы · ағымдағы тоқсан
                </p>
              </figcaption>
              <RadarChart />
            </figure>
          </Reveal>

          {/* bars */}
          <Reveal from="left" delay={0.08} className="lg:col-span-7">
            <figure className="glass-dark h-full rounded-3xl p-6 sm:p-7">
              <figcaption>
                <h3 className="text-[0.95rem] font-semibold text-white">Пәндер бойынша прогресс</h3>
                <p className="mt-1 text-[0.76rem] text-brand-100/45">
                  Дәлелденген модуль мақсаттарының үлесі
                </p>
              </figcaption>
              <ProgressBars />
            </figure>
          </Reveal>

          {/* trend */}
          <Reveal from="up" className="lg:col-span-7">
            <figure className="glass-dark h-full rounded-3xl p-6 sm:p-7">
              <figcaption>
                <h3 className="text-[0.95rem] font-semibold text-white">
                  Икемді дағдылар индексінің динамикасы
                </h3>
                <p className="mt-1 text-[0.76rem] text-brand-100/45">
                  Бағдарлама бойындағы он бір бақылау нүктесі
                </p>
              </figcaption>
              <TrendLine />
            </figure>
          </Reveal>

          {/* indicators */}
          <Reveal from="up" delay={0.08} className="lg:col-span-5">
            <div className="glass-dark h-full rounded-3xl p-6 sm:p-7">
              <h3 className="text-[0.95rem] font-semibold text-white">Не бақыланады</h3>
              <ul className="mt-5 grid gap-2">
                {monitoringIndicators.map((m) => (
                  <li key={m} className="flex items-center gap-2.5 text-[0.82rem] text-brand-100/70">
                    <span className="size-1.5 shrink-0 rounded-full bg-cyan-400/70" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ---------- accessible table view ---------- */}
        {showTable && (
          <Reveal from="up" className="mt-6">
            <div className="glass-dark overflow-x-auto rounded-3xl p-6">
              <table className="w-full min-w-125 text-left text-[0.82rem]">
                <caption className="pb-4 text-left text-[0.76rem] text-brand-100/45">
                  Жоғарыдағы диаграммалардың негізіндегі демонстрациялық мәндер.
                </caption>
                <thead>
                  <tr className="border-b border-white/10 text-[0.7rem] tracking-wide text-brand-100/45 uppercase">
                    <th scope="col" className="pb-2.5 font-medium">Көрсеткіш</th>
                    <th scope="col" className="pb-2.5 font-medium">Санат</th>
                    <th scope="col" className="pb-2.5 text-right font-medium">Мән</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-brand-100/75">
                  {softSkillsRadar.map((d) => (
                    <tr key={d.axis}>
                      <td className="py-2">Икемді дағды</td>
                      <td className="py-2">{d.axis}</td>
                      <td className="py-2 text-right tabular-nums">{d.value}</td>
                    </tr>
                  ))}
                  {subjectProgress.map((d) => (
                    <tr key={d.subject}>
                      <td className="py-2">Пәндік прогресс</td>
                      <td className="py-2">{d.subject}</td>
                      <td className="py-2 text-right tabular-nums">{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ *\
   Radar — one series, so no legend; axis labels carry identity
\* ------------------------------------------------------------------ */
function RadarChart() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  // Wide viewBox: Kazakh axis labels are long, and the left/right ones need
  // horizontal room beyond the plot radius or they clip at the SVG edge.
  const w = 400;
  const h = 292;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 84;
  const n = softSkillsRadar.length;

  const point = (i: number, value: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = (value / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const path =
    softSkillsRadar
      .map((d, i) => {
        const [x, y] = point(i, d.value);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img"
        aria-label="Сегіз икемді дағды бойынша радар диаграммасы. Мәндер 100 балдан 68-ден 91-ге дейін.">
        <defs>
          <radialGradient id={`${gid}-fill`}>
            <stop offset="0%" stopColor={chartHue} stopOpacity="0.42" />
            <stop offset="100%" stopColor={chartHue} stopOpacity="0.12" />
          </radialGradient>
        </defs>

        {/* recessive rings */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={cx}
            cy={cy}
            r={radius * f}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.08"
          />
        ))}

        {/* spokes + labels */}
        {softSkillsRadar.map((d, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const [ex, ey] = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
          const lx = cx + Math.cos(angle) * (radius + 20);
          const ly = cy + Math.sin(angle) * (radius + 20);
          const anchor = Math.abs(Math.cos(angle)) < 0.3 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
          return (
            <g key={d.axis}>
              <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#ffffff" strokeOpacity="0.07" />
              <text
                x={lx}
                y={ly + 3}
                textAnchor={anchor}
                fontSize="10"
                fill="#ffffff"
                fillOpacity={active === i ? 0.95 : 0.5}
                className="transition-[fill-opacity]"
              >
                {d.axis}
              </text>
            </g>
          );
        })}

        {/* the series */}
        <motion.path
          d={path}
          fill={`url(#${gid}-fill)`}
          stroke={chartHue}
          strokeWidth="2"
          strokeLinejoin="round"
          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* markers with hover targets */}
        {softSkillsRadar.map((d, i) => {
          const [x, y] = point(i, d.value);
          return (
            <g key={d.axis}>
              <circle cx={x} cy={y} r="4.5" fill={chartHue} stroke="#060b1a" strokeWidth="2" />
              <circle
                cx={x}
                cy={y}
                r="13"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
              {active === i && (
                <g pointerEvents="none">
                  <rect
                    x={x - 30}
                    y={y - 30}
                    width="60"
                    height="21"
                    rx="6"
                    fill="#04060f"
                    stroke="#ffffff"
                    strokeOpacity="0.18"
                  />
                  <text
                    x={x}
                    y={y - 16}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#ffffff"
                    fontWeight="600"
                  >
                    {d.value} / 100
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ *\
   Progress bars — single hue, value labelled directly on each row
\* ------------------------------------------------------------------ */
function ProgressBars() {
  const reduced = usePrefersReducedMotion();

  return (
    <ul className="mt-6 space-y-4">
      {subjectProgress.map((d, i) => (
        <li key={d.subject}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.84rem] font-medium text-brand-100/85">{d.subject}</span>
            <span className="font-display text-[0.84rem] font-semibold text-white tabular-nums">
              {d.value}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full"
              style={{ background: chartHue }}
              initial={reduced ? { width: `${d.value}%` } : { width: 0 }}
              whileInView={{ width: `${d.value}%` }}
              viewport={{ once: true }}
              transition={{
                duration: 1.05,
                delay: reduced ? 0 : 0.08 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *\
   Trend line — 2px stroke, markers, crosshair on hover
\* ------------------------------------------------------------------ */
function TrendLine() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  const w = 620;
  const h = 200;
  const padX = 26;
  const padY = 24;
  const max = 100;

  const pt = (i: number, v: number) =>
    [
      padX + (i / (analyticsTrend.length - 1)) * (w - padX * 2),
      h - padY - (v / max) * (h - padY * 2),
    ] as const;

  const line = analyticsTrend
    .map((v, i) => {
      const [x, y] = pt(i, v);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area = `${line} L ${w - padX} ${h - padY} L ${padX} ${h - padY} Z`;

  return (
    <div className="relative mt-6">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Икемді дағдылар индексінің он бір бақылау нүктесі бойынша сызықтық диаграммасы: ${analyticsTrend[0]}-ден ${analyticsTrend[analyticsTrend.length - 1]}-ге дейін өскен (100 балдан).`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartHue} stopOpacity="0.3" />
            <stop offset="100%" stopColor={chartHue} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* recessive gridlines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = h - padY - (v / max) * (h - padY * 2);
          return (
            <g key={v}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#ffffff" strokeOpacity="0.07" />
              <text x={4} y={y + 3} fontSize="9" fill="#ffffff" fillOpacity="0.32">
                {v}
              </text>
            </g>
          );
        })}

        <motion.path
          d={area}
          fill={`url(#${gid}-area)`}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.35 }}
        />

        <motion.path
          d={line}
          fill="none"
          stroke={chartHue}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        {analyticsTrend.map((v, i) => {
          const [x, y] = pt(i, v);
          const isActive = active === i;
          return (
            <g key={i}>
              {isActive && (
                <line x1={x} y1={padY} x2={x} y2={h - padY} stroke="#ffffff" strokeOpacity="0.2" />
              )}
              <circle
                cx={x}
                cy={y}
                r={isActive ? 6 : 4}
                fill={chartHue}
                stroke="#060b1a"
                strokeWidth="2"
                className="transition-[r]"
              />
              <rect
                x={x - 14}
                y={padY}
                width="28"
                height={h - padY * 2}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActive(i)}
              />
              {isActive && (
                <g pointerEvents="none">
                  <rect
                    x={Math.min(Math.max(x - 26, 2), w - 54)}
                    y={y - 30}
                    width="52"
                    height="21"
                    rx="6"
                    fill="#04060f"
                    stroke="#ffffff"
                    strokeOpacity="0.18"
                  />
                  <text
                    x={Math.min(Math.max(x, 28), w - 28)}
                    y={y - 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#ffffff"
                    fontWeight="600"
                  >
                    {v} / 100
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
