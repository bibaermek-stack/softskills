"use client";

import Link from "next/link";
import { findSimulation, simulations, type SimulationId } from "@/lib/simulations";
import { Icon } from "./Icon";
import { IconBadge } from "./Panel";
import { Pendulum } from "./Pendulum";
import { TeamSimPlayer } from "./TeamSimPlayer";

/**
 * Симуляцияның жеке беті.
 *
 * Екі симуляция да сабақ ішінде де ашылады, бірақ жеке маршрут бөлек мақсат
 * атқарады: сілтемемен бөлісуге болады және оны сабақтан тыс, зерттеу құралы
 * ретінде де қолдануға болады.
 */

export function SimulationPage({ id }: { id: SimulationId }) {
  const sim = findSimulation(id);
  if (!sim) return null;

  const other = simulations.find((item) => item.id !== id);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <nav aria-label="Бет орны" className="flex flex-wrap items-center gap-1.5 text-[0.75rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <Link
          href="/dashboard/simulations"
          className="rounded-lg px-1.5 py-1.5 font-medium text-ink-700/75 transition hover:text-ink-900 dark:text-paper-300 dark:hover:text-white"
        >
          Симуляциялар
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold" style={{ color: sim.accent }}>
          {sim.title}
        </span>
      </nav>

      <header
        className="dash-card overflow-hidden rounded-2xl"
        style={{ borderTop: `3px solid ${sim.accent}` }}
      >
        <div
          className="flex flex-wrap items-start gap-4 p-4 sm:p-6"
          style={{
            backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${sim.accent} 10%, transparent), transparent 55%)`,
          }}
        >
          <IconBadge name={sim.icon} accent={sim.accent} size="lg" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: sim.accent }}
            >
              {sim.eyebrow}
            </p>
            <h1 className="mt-0.5 font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
              {sim.title}
            </h1>
            <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {sim.lead}
            </p>
          </div>
        </div>

        <ul className="grid gap-px border-t border-ink-700/8 bg-ink-700/6 sm:grid-cols-3 dark:border-white/10 dark:bg-white/10">
          {sim.notes.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2 bg-paper px-4 py-3 text-[0.76rem] leading-snug text-ink-700 dark:bg-ink-900 dark:text-paper-200"
            >
              <span className="mt-0.5 shrink-0" style={{ color: sim.accent }}>
                <Icon name="Lightbulb" className="size-3.5" strokeWidth={2.2} />
              </span>
              {note}
            </li>
          ))}
        </ul>
      </header>

      <section className="dash-card rounded-2xl p-4 sm:p-5">
        {id === "pendulum" ? <Pendulum /> : <TeamSimPlayer />}
      </section>

      {other ? (
        <Link
          href={`/dashboard/simulations/${other.id}`}
          className="dash-card group flex items-center justify-end gap-3 rounded-2xl p-3.5 text-right transition-shadow duration-300 hover:shadow-lift"
        >
          <span className="min-w-0">
            <span className="block text-[0.68rem] text-ink-700/70 dark:text-paper-300">
              Келесі симуляция
            </span>
            <span className="block font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
              {other.title}
            </span>
          </span>
          <IconBadge name={other.icon} accent={other.accent} size="sm" />
          <span className="text-ink-600/50 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
            <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
