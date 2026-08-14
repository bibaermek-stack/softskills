"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GAME_KIND_ICON, GAME_KIND_LABEL, lessons } from "@/lib/lessons";
import { simulations } from "@/lib/simulations";
import { lessonStatus, useProgress, type LessonStatus } from "@/lib/progress";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip, IconBadge, Panel, ZoneBanner } from "./Panel";

/**
 * Интерактивті сабақтардың каталогы.
 *
 * Екі көріністе бір компонент: панельдегі блок (`block`) және жеке бет
 * (`page`). Карточка торы екеуінде де бірдей болғандықтан, оны қосарлаудың
 * қажеті жоқ.
 */

const STATUS_LABEL: Record<LessonStatus, string | null> = {
  none: null,
  started: "Басталды",
  done: "Аяқталды",
};

const STATUS_TONE: Record<LessonStatus, string> = {
  none: "#2563eb",
  started: "#ea580c",
  done: "#15803d",
};

function LessonCards() {
  const progress = useProgress();
  const reduced = usePrefersReducedMotion();

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson, i) => {
        const status = lessonStatus(progress, lesson.id);
        const statusLabel = STATUS_LABEL[status];

        return (
          <motion.div
            key={lesson.id}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduced ? undefined : { y: -4 }}
          >
            <Link
              href={`/dashboard/lessons/${lesson.id}`}
              className="group flex h-full flex-col rounded-xl border border-ink-700/8 p-3 transition-shadow duration-300 hover:shadow-lift dark:border-white/10"
              style={{ borderTop: `3px solid ${lesson.accent}` }}
            >
              <div className="flex items-start gap-2.5">
                <IconBadge
                  name={lesson.icon}
                  accent={lesson.accent}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[0.85rem] leading-tight font-semibold text-ink-900 dark:text-white">
                    {lesson.title}
                  </h3>
                  <p className="mt-0.5 text-[0.7rem] text-ink-700/70 dark:text-paper-300">
                    {lesson.grade} · {lesson.duration}
                  </p>
                </div>
                {statusLabel ? (
                  <Chip accent={STATUS_TONE[status]}>{statusLabel}</Chip>
                ) : null}
              </div>

              <p className="mt-2 flex-1 text-[0.75rem] leading-snug text-ink-700/85 dark:text-paper-300">
                {lesson.summary}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${lesson.accent} 11%, transparent)`,
                    color: lesson.accent,
                  }}
                >
                  <Icon
                    name={GAME_KIND_ICON[lesson.stages.activity.game.kind]}
                    className="size-3"
                    strokeWidth={2.2}
                  />
                  {GAME_KIND_LABEL[lesson.stages.activity.game.kind]}
                </span>
                <Chip>{lesson.stages.assessment.quiz.questions.length} сұрақ</Chip>
                {lesson.stages.resources.sim ? <Chip>симуляция</Chip> : null}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function SimulationCards() {
  return (
    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
      {simulations.map((sim) => (
        <Link
          key={sim.id}
          href={`/dashboard/simulations/${sim.id}`}
          className="group flex items-start gap-2.5 rounded-xl border border-ink-700/8 p-3 transition-shadow duration-300 hover:shadow-lift dark:border-white/10"
        >
          <IconBadge
            name={sim.icon}
            accent={sim.accent}
            size="lg"
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
              {sim.title}
            </h3>
            <p className="mt-0.5 text-[0.73rem] leading-snug text-ink-700/85 dark:text-paper-300">
              {sim.lead}
            </p>
          </div>
          <span className="mt-1 shrink-0 text-ink-600/40 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
            <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function LessonCatalogue({ variant }: { variant: "block" | "page" }) {
  if (variant === "page") {
    return (
      <div className="mt-3 flex flex-col gap-3">
        <nav aria-label="Бет орны" className="flex items-center gap-1.5 text-[0.75rem]">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
            Панель
          </Link>
          <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
          <span className="px-1 font-semibold text-ink-800 dark:text-paper-100">Сабақтар</span>
        </nav>

        <header className="dash-card rounded-2xl p-4 sm:p-6">
          <h1 className="font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
            Интерактивті сабақтар
          </h1>
          <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
            Әр сабақ дайын сабақ үлгісінің алты кезеңі бойынша жүреді: мақсаттан нақты өмірлік
            жағдаятқа, содан ойын мен симуляцияға және қорытынды тестке дейін.
          </p>
        </header>

        <section className="dash-card rounded-2xl p-4 sm:p-5">
          <LessonCards />
        </section>

        <section className="dash-card rounded-2xl p-4 sm:p-5">
          <h2 className="font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
            Интерактивті симуляциялар
          </h2>
          <SimulationCards />
        </section>
      </div>
    );
  }

  return (
    <Panel id="dash-lessons" className="p-3.5">
      <ZoneBanner title="Интерактивті сабақтар: ойын, симуляция, тест" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-500/20 bg-brand-50/60 p-3.5 dark:bg-brand-950/20 dark:border-brand-500/30">
        <div className="flex items-center gap-2.5">
          <IconBadge name="Award" accent="#3b82f6" size="sm" />
          <div>
            <p className="font-display text-[0.82rem] font-bold text-ink-900 dark:text-white">
              5 Пәннен 200 Жағдаяттық тест викторинасы
            </p>
            <p className="text-[0.72rem] text-ink-700/80 dark:text-paper-300">
              Математика, физика, тарих, әдебиет, технология · Soft Skills диагностикасы
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/quiz"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[0.74rem] font-bold text-white shadow-soft transition hover:bg-brand-500 hover:scale-[1.02]"
        >
          Викториналарға өту
          <Icon name="ArrowRight" className="size-3.5" />
        </Link>
      </div>

      <h3 className="mt-4 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
        Интерактивті симуляциялар
      </h3>
      <SimulationCards />
    </Panel>
  );
}
