"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { lessonStages, type LessonStageId } from "@/lib/dashboard";
import { GAME_KIND_LABEL, STAGE_ORDER, type Lesson } from "@/lib/lessons";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip, IconBadge } from "./Panel";
import { Game } from "./games/Game";
import { Quiz } from "./Quiz";
import { Pendulum } from "./Pendulum";
import { TeamSimPlayer } from "./TeamSimPlayer";

/**
 * Сабақ плеері — 2.8 үлгісінің алты кезеңі бойынша жүреді.
 *
 * Үш кезеңде нақты интерактив бар: «Іс-әрекет» ойынға, «Цифрлық ресурстар»
 * симуляцияға, «Бағалау» тестке ашылады. Қалған кезеңдер сол интерактивке
 * дайындайтын мазмұнды береді.
 */

/** Кезең тақырыбын үлгіден алады — атаулар бір жерде сақталады. */
function stageMeta(id: LessonStageId) {
  return lessonStages.find((stage) => stage.id === id) ?? lessonStages[0];
}

function StageBlock({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: Parameters<typeof IconBadge>[0]["name"];
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dash-card rounded-2xl p-4 sm:p-5">
      <h2 className="mb-3.5 flex items-center gap-2 font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
        <span style={{ color: accent }}>
          <Icon name={icon} className="size-4" strokeWidth={2} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [stageId, setStageId] = useState<LessonStageId>("goals");
  const reduced = usePrefersReducedMotion();

  const index = STAGE_ORDER.indexOf(stageId);
  const meta = stageMeta(stageId);
  const previous = STAGE_ORDER[index - 1];
  const next = STAGE_ORDER[index + 1];
  const stages = lesson.stages;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Навигация тізбегі */}
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
          href="/dashboard/lessons"
          className="rounded-lg px-1.5 py-1.5 font-medium text-ink-700/75 transition hover:text-ink-900 dark:text-paper-300 dark:hover:text-white"
        >
          Сабақтар
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold" style={{ color: lesson.accent }}>
          {lesson.title}
        </span>
      </nav>

      {/* Тақырып */}
      <header
        className="dash-card overflow-hidden rounded-2xl"
        style={{ borderTop: `3px solid ${lesson.accent}` }}
      >
        <div
          className="flex flex-wrap items-start gap-4 p-4 sm:p-6"
          style={{
            backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${lesson.accent} 10%, transparent), transparent 55%)`,
          }}
        >
          <IconBadge name={lesson.icon} accent={lesson.accent} size="lg" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: lesson.accent }}
            >
              Интерактивті сабақ
            </p>
            <h1 className="mt-0.5 font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
              {lesson.title}
            </h1>
            <p className="mt-2 max-w-3xl text-[0.86rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {lesson.summary}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip accent={lesson.accent}>{lesson.grade}</Chip>
              <Chip accent={lesson.accent}>{lesson.duration}</Chip>
              <Chip>{GAME_KIND_LABEL[stages.activity.game.kind]}</Chip>
              <Chip>{stages.assessment.quiz.questions.length} сұрақ</Chip>
            </div>
          </div>
        </div>
      </header>

      {/* Кезеңдер */}
      <nav aria-label="Сабақ кезеңдері" className="dash-card rounded-2xl p-2">
        <ol className="flex gap-1.5 overflow-x-auto dash-scroll pb-1">
          {STAGE_ORDER.map((id, i) => {
            const stage = stageMeta(id);
            const active = id === stageId;
            return (
              <li key={id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setStageId(id)}
                  aria-current={active ? "step" : undefined}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[0.74rem] font-medium whitespace-nowrap transition-colors"
                  style={{
                    borderColor: active
                      ? `color-mix(in srgb, ${lesson.accent} 55%, transparent)`
                      : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                    backgroundColor: active
                      ? `color-mix(in srgb, ${lesson.accent} 9%, transparent)`
                      : undefined,
                    color: active ? lesson.accent : undefined,
                  }}
                >
                  <span className="font-bold tabular-nums">{i + 1}</span>
                  <Icon name={stage.icon} className="size-3.5" strokeWidth={2} />
                  {stage.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Кезең мазмұны */}
      <motion.div
        key={stageId}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3"
      >
        {stageId === "goals" ? (
          <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
            <h3 className="mb-1.5 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
              Оқу мақсаттары
            </h3>
            <ul className="space-y-1.5">
              {stages.goals.objectives.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[0.82rem] leading-snug text-ink-700 dark:text-paper-200">
                  <span className="mt-0.5 shrink-0" style={{ color: lesson.accent }}>
                    <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="mt-4 mb-1.5 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
              Икемді дағдылар
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {stages.goals.softSkills.map((skill) => (
                <Chip key={skill} accent={lesson.accent}>
                  {skill}
                </Chip>
              ))}
            </div>
          </StageBlock>
        ) : null}

        {stageId === "context" ? (
          <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
            <p className="text-[0.86rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {stages.context.situation}
            </p>
            <p
              className="mt-3 rounded-lg px-3 py-2.5 text-[0.86rem] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${lesson.accent} 9%, transparent)`,
                color: lesson.accent,
              }}
            >
              {stages.context.question}
            </p>
            <ul className="mt-3 space-y-1.5">
              {stages.context.facts.map((fact) => (
                <li key={fact} className="flex items-start gap-2 text-[0.8rem] leading-snug text-ink-700 dark:text-paper-200">
                  <span className="mt-0.5 shrink-0 text-ink-600/50 dark:text-paper-300">
                    <Icon name="Info" className="size-3.5" strokeWidth={2.2} />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </StageBlock>
        ) : null}

        {stageId === "activity" ? (
          <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
            <p className="mb-3 text-[0.82rem] leading-snug text-ink-700 dark:text-paper-200">
              {stages.activity.intro}
            </p>
            <Game
              spec={stages.activity.game}
              lessonId={lesson.id}
              subject={lesson.subject}
              accent={lesson.accent}
            />
          </StageBlock>
        ) : null}

        {stageId === "resources" ? (
          <>
            <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
              <p className="mb-3 text-[0.82rem] leading-snug text-ink-700 dark:text-paper-200">
                {stages.resources.intro}
              </p>
              <ul className="space-y-1.5">
                {stages.resources.materials.map((material) => (
                  <li
                    key={material.title}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
                  >
                    <span className="text-[0.8rem] text-ink-800 dark:text-paper-100">
                      {material.title}
                    </span>
                    <span className="shrink-0 text-[0.72rem] text-ink-600/70 dark:text-paper-300">
                      {material.meta}
                    </span>
                  </li>
                ))}
              </ul>
            </StageBlock>

            {stages.resources.sim === "pendulum" ? (
              <StageBlock title="Маятник симуляциясы" icon="Atom" accent={lesson.accent}>
                <Pendulum lessonId={lesson.id} />
              </StageBlock>
            ) : null}
            {stages.resources.sim === "team-project" ? (
              <StageBlock title="Командалық жоба симуляторы" icon="UsersRound" accent={lesson.accent}>
                <TeamSimPlayer lessonId={lesson.id} />
              </StageBlock>
            ) : null}
          </>
        ) : null}

        {stageId === "teamwork" ? (
          <>
            <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
              <ul className="space-y-1.5">
                {stages.teamwork.prompts.map((prompt) => (
                  <li
                    key={prompt}
                    className="rounded-lg border border-ink-700/8 px-3 py-2.5 text-[0.82rem] leading-snug text-ink-700 dark:border-white/10 dark:text-paper-200"
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </StageBlock>

            {stages.teamwork.sim === "team-project" ? (
              <StageBlock title="Командалық жоба симуляторы" icon="UsersRound" accent={lesson.accent}>
                <TeamSimPlayer lessonId={lesson.id} />
              </StageBlock>
            ) : null}
          </>
        ) : null}

        {stageId === "assessment" ? (
          <StageBlock title={meta.title} icon={meta.icon} accent={lesson.accent}>
            <p className="mb-3 text-[0.82rem] leading-snug text-ink-700 dark:text-paper-200">
              {stages.assessment.intro}
            </p>
            <Quiz
              spec={stages.assessment.quiz}
              lessonId={lesson.id}
              subject={lesson.subject}
              accent={lesson.accent}
            />
          </StageBlock>
        ) : null}
      </motion.div>

      {/* Кезеңдер арасында жүру */}
      <nav aria-label="Кезеңдер арасында жүру" className="grid gap-2 sm:grid-cols-2">
        {previous ? (
          <button
            type="button"
            onClick={() => setStageId(previous)}
            className="dash-card group flex items-center gap-3 rounded-2xl p-3.5 text-left transition-shadow duration-300 hover:shadow-lift"
          >
            <span className="text-ink-600/50 transition-transform duration-300 group-hover:-translate-x-0.5 dark:text-paper-300">
              <Icon name="ChevronLeft" className="size-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.68rem] text-ink-700/70 dark:text-paper-300">
                Алдыңғы кезең
              </span>
              <span className="block font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
                {stageMeta(previous).title}
              </span>
            </span>
          </button>
        ) : (
          <span />
        )}

        {next ? (
          <button
            type="button"
            onClick={() => setStageId(next)}
            className="dash-card group flex items-center justify-end gap-3 rounded-2xl p-3.5 text-right transition-shadow duration-300 hover:shadow-lift"
          >
            <span className="min-w-0">
              <span className="block text-[0.68rem] text-ink-700/70 dark:text-paper-300">
                Келесі кезең
              </span>
              <span className="block font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
                {stageMeta(next).title}
              </span>
            </span>
            <span className="text-ink-600/50 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
              <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
            </span>
          </button>
        ) : null}
      </nav>
    </div>
  );
}
