"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { monitoring } from "@/lib/dashboard";
import { softSkillsRadar } from "@/lib/content";
import {
  clearProgress,
  earnedAchievements,
  skillProfile,
  summary,
  useProgress,
  weeklyActivity,
} from "@/lib/progress";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Panel, ZoneBanner } from "./Panel";

/**
 * «Мониторинг және аналитика» блогы.
 *
 * Сайттың қалған бөлігіндегі диаграммалар сияқты, мұнда да әр диаграмма — бір
 * серияның шамасын көрсететін көрініс. Сондықтан түс ешқандай мағына
 * тасымалдамайды: атауды белгінің өзі береді және аңыз (legend) қажет емес.
 * Тор сызықтары мен мәтін `currentColor` арқылы салынады, сол себепті екі
 * тақырыпта да оқылады.
 */
const HUE = "#2563eb";

/* ---------- апталық белсенділік ---------- */
function WeeklyBars({ data }: { data: readonly { day: string; value: number }[] }) {
  const reduced = usePrefersReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <div
        className="flex h-24 items-end gap-1.5"
        role="img"
        aria-label={`Апталық белсенділік: ${data
          .map((d) => `${d.day} ${d.value}`)
          .join(", ")} (100 балдан).`}
      >
        {data.map((day, i) => (
          <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t-md"
              style={{ backgroundColor: HUE }}
              initial={reduced ? { height: `${(day.value / max) * 100}%` } : { height: 0 }}
              whileInView={{ height: `${(day.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{
                duration: 0.75,
                delay: reduced ? 0 : i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            <span className="text-[0.62rem] text-ink-600/70 dark:text-paper-300">{day.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Soft Skills радары ---------- */
function SkillsRadar({ data }: { data: readonly { axis: string; value: number }[] }) {
  const reduced = usePrefersReducedMotion();
  const gid = useId().replace(/:/g, "");

  const w = 260;
  const h = 200;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 58;
  const n = data.length;

  const point = (i: number, value: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = (value / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const path =
    data
      .map((d, i) => {
        const [x, y] = point(i, d.value);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full text-ink-700 dark:text-paper-200"
      role="img"
      aria-label={`Икемді дағдылар радары: ${data
        .map((d) => `${d.axis} ${d.value}`)
        .join(", ")} (100 балдан).`}
    >
      <defs>
        <radialGradient id={`${gid}-fill`}>
          <stop offset="0%" stopColor={HUE} stopOpacity="0.4" />
          <stop offset="100%" stopColor={HUE} stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {[0.33, 0.66, 1].map((f) => (
        <circle
          key={f}
          cx={cx}
          cy={cy}
          r={radius * f}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
        />
      ))}

      {data.map((d, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (radius + 17);
        const ly = cy + Math.sin(angle) * (radius + 17);
        const anchor =
          Math.abs(Math.cos(angle)) < 0.3 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text
            key={d.axis}
            x={lx}
            y={ly + 3}
            textAnchor={anchor}
            fontSize="7.5"
            fill="currentColor"
            fillOpacity="0.7"
          >
            {d.axis}
          </text>
        );
      })}

      <motion.path
        d={path}
        fill={`url(#${gid}-fill)`}
        stroke={HUE}
        strokeWidth="1.8"
        strokeLinejoin="round"
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.65 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {data.map((d, i) => {
        const [x, y] = point(i, d.value);
        return <circle key={d.axis} cx={x} cy={y} r="2.6" fill={HUE} />;
      })}
    </svg>
  );
}

/* ---------- блок ---------- */
export function AnalyticsPanel() {
  const [tab, setTab] = useState<"progress" | "skills" | "portfolio">("progress");
  const progress = useProgress();

  /*
    Нәтиже болса — диаграммалар нақты деректі көрсетеді, болмаса
    демонстрациялық мәндер қалады. Бос диаграмма панельді «сынған» етіп
    көрсетер еді, ал ескертпе қай режим екенін анық айтады.
  */
  const hasData = progress.records.length > 0;
  const weekly = hasData ? weeklyActivity(progress) : monitoring.weekly;
  const skills = hasData ? skillProfile(progress) : softSkillsRadar;
  const earned = earnedAchievements(progress);
  const totals = summary(progress);

  const tabs = [
    { id: "progress", label: "Прогресс" },
    { id: "skills", label: "Дағдылар" },
    { id: "portfolio", label: "Портфолио" },
  ] as const;

  return (
    <Panel id="dash-analytics" className="flex flex-col p-3.5">
      <ZoneBanner title={monitoring.title} />

      <ul className="mt-3 space-y-1.5">
        {monitoring.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200"
          >
            <span className="mt-0.5 shrink-0 text-deep-600 dark:text-brand-300">
              <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* Қосымша көріністер */}
      <div
        role="tablist"
        aria-label="Аналитика көріністері"
        className="mt-3 flex gap-1 rounded-lg bg-ink-700/5 p-1 dark:bg-white/8"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "flex-1 rounded-md bg-white px-2 py-1.5 text-[0.71rem] font-semibold text-ink-900 shadow-soft dark:bg-ink-700 dark:text-white"
                : "flex-1 rounded-md px-2 py-1.5 text-[0.71rem] font-medium text-ink-700/75 transition hover:text-ink-900 dark:text-paper-300 dark:hover:text-white"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Нақты деректің жиынтығы */}
      {hasData ? (
        <p className="mt-3 rounded-lg bg-deep-500/8 px-2.5 py-2 text-[0.73rem] text-ink-800 dark:text-paper-100">
          <span className="font-semibold tabular-nums">{totals.count}</span> нәтиже · орташа{" "}
          <span className="font-semibold tabular-nums">{totals.meanScore}%</span> ·{" "}
          <span className="font-semibold tabular-nums">{totals.minutes}</span> мин
        </p>
      ) : null}

      <div className="mt-3 flex-1">
        {tab === "progress" ? (
          <div>
            <p className="mb-2 text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
              Апталық белсенділік
            </p>
            <WeeklyBars data={weekly} />
          </div>
        ) : null}

        {tab === "skills" ? <SkillsRadar data={skills} /> : null}

        {tab === "portfolio" ? (
          <div className="space-y-1.5">
            {monitoring.achievements.map((achievement) => {
              const unlocked = earned[achievement.title] ?? false;
              return (
                <div
                  key={achievement.title}
                  className="flex items-start gap-2 rounded-lg border border-ink-700/8 px-2.5 py-2 dark:border-white/10"
                  style={{ opacity: unlocked ? 1 : 0.45 }}
                >
                  <span className="mt-0.5 shrink-0 text-deep-600 dark:text-brand-300">
                    <Icon
                      name={unlocked ? achievement.icon : "Lock"}
                      className="size-4"
                      strokeWidth={2}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.76rem] font-semibold text-ink-900 dark:text-white">
                      {achievement.title}
                    </p>
                    <p className="text-[0.69rem] leading-snug text-ink-700/75 dark:text-paper-300">
                      {unlocked ? achievement.text : "Әлі ашылмаған"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Есептер */}
      <div className="mt-3 grid gap-1.5">
        {monitoring.reports.map((report) => (
          <div
            key={report.title}
            className="flex items-start gap-2 rounded-lg bg-ink-700/4 px-2.5 py-2 dark:bg-white/5"
          >
            <span className="mt-0.5 shrink-0 text-deep-600 dark:text-brand-300">
              <Icon name={report.icon} className="size-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.73rem] font-semibold text-ink-900 dark:text-white">
                {report.title}
              </p>
              <p className="text-[0.68rem] leading-snug text-ink-700/75 dark:text-paper-300">
                {report.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasData ? (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.65rem] text-ink-600/60 dark:text-paper-300">
            Нәтижелер осы браузерде ғана сақталады.
          </p>
          <button
            type="button"
            onClick={clearProgress}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.65rem] font-medium text-ink-600/70 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon name="Trash2" className="size-3" strokeWidth={2.2} />
            Тазалау
          </button>
        </div>
      ) : (
        <div className="mt-2.5">
          <p className="text-[0.65rem] text-ink-600/60 dark:text-paper-300">
            Демонстрациялық деректер — тіркелу де, дерекқор да жоқ.
          </p>
          <Link
            href="/dashboard/lessons"
            className="mt-1 inline-flex items-center gap-1 text-[0.68rem] font-medium text-deep-600 hover:underline dark:text-brand-300"
          >
            Сабақтағы ойын мен тестті орындаңыз
            <Icon name="ArrowRight" className="size-3" strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </Panel>
  );
}
