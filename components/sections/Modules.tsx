"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { modules, type ModuleId } from "@/lib/content";
import { GAME_KIND_LABEL, lessonForSubject } from "@/lib/lessons";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { ModuleVisual } from "@/components/ui/ModuleVisual";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export function Modules() {
  const [activeId, setActiveId] = useState<ModuleId>("physics");
  const active = modules.find((m) => m.id === activeId) ?? modules[0];
  const activeLesson = lessonForSubject(active.id);
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="modules" tone="muted">
      <div className="container-x">
        <SectionHeading
          eyebrow="Оқу модульдері"
          title={
            <>
              Бес пән, <span className="text-gradient">бір ортақ мәселе</span> арқылы талданады
            </>
          }
          lead="Әр модуль өз пәндік тереңдігін сақтай отырып, ортақ нақты жобаға үлес қосады — сол арқылы білім бөлшектенбей, өзара байланысады."
        />

        {/* ---------- module cards ---------- */}
        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {modules.map((m) => {
            const isActive = m.id === activeId;
            return (
              <RevealItem key={m.id}>
                <button
                  onClick={() => setActiveId(m.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative h-full w-full overflow-hidden rounded-2xl p-6 text-left transition-all duration-500 ease-(--ease-out-expo)",
                    isActive
                      ? "bg-white shadow-lift ring-1 ring-ink-700/6"
                      : "bg-white/60 shadow-soft ring-1 ring-ink-700/5 hover:bg-white hover:-translate-y-1",
                  )}
                >
                  <span
                    className="absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                    style={{ background: `${m.accent}40`, opacity: isActive ? 0.9 : undefined }}
                    aria-hidden
                  />
                  <div className="relative">
                    <div
                      className={cn(
                        "size-14 transition-transform duration-600 ease-(--ease-out-expo)",
                        "group-hover:scale-110 group-hover:-rotate-6",
                        isActive && "scale-110",
                      )}
                    >
                      <ModuleIcon id={m.id} accent={m.accent} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-ink-900">{m.name}</h3>
                    <p
                      className="mt-1 text-[0.72rem] font-semibold tracking-wide uppercase"
                      style={{ color: m.accent }}
                    >
                      {m.tagline}
                    </p>
                    <p className="mt-3 text-[0.83rem] leading-relaxed text-ink-700/65">
                      {m.description}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-0.5 origin-left transition-transform duration-500 ease-(--ease-out-expo)",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                    style={{ background: m.accent }}
                    aria-hidden
                  />
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* ---------- spotlight ---------- */}
        <Reveal from="up" className="mt-8">
          <div className="overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-ink-700/6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="grid lg:grid-cols-[1fr_1.05fr]"
              >
                {/* visual */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <ModuleVisual id={active.id} accent={active.accent} />

                  <div className="mt-6">
                    <h4 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                      Қолданылатын құралдар
                    </h4>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {active.tools.map((t) => (
                        <li
                          key={t}
                          className="rounded-lg px-3 py-1.5 text-[0.78rem] font-medium"
                          style={{ background: `${active.accent}14`, color: active.accent }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* detail */}
                <div className="border-t border-ink-700/6 bg-paper-50/60 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
                  <div className="flex items-center gap-3.5">
                    <span className="size-9 shrink-0">
                      <ModuleIcon id={active.id} accent={active.accent} />
                    </span>
                    <div>
                      <h3 className="text-xl leading-tight font-semibold sm:text-2xl">
                        {active.name} модулі
                      </h3>
                      <p
                        className="text-[0.72rem] font-semibold tracking-wide uppercase"
                        style={{ color: active.accent }}
                      >
                        {active.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-7 sm:grid-cols-2">
                    <div>
                      <h4 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                        Оқу мақсаттары
                      </h4>
                      <ul className="mt-3.5 space-y-2">
                        {active.objectives.map((o) => (
                          <li key={o} className="flex gap-2.5 text-[0.84rem] text-ink-800/80">
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full"
                              style={{ background: active.accent }}
                              aria-hidden
                            />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                        Жоба мысалдары
                      </h4>
                      <ul className="mt-3.5 space-y-2">
                        {active.projects.map((p) => (
                          <li key={p} className="flex gap-2.5 text-[0.84rem] text-ink-800/80">
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full"
                              style={{ background: active.accent }}
                              aria-hidden
                            />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-ink-700/6">
                    <h4 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                      Дамитын икемді дағдылар
                    </h4>
                    <ul className="mt-3.5 flex flex-wrap gap-2">
                      {active.softSkills.map((s) => (
                        <li
                          key={s}
                          className="rounded-full bg-paper-100 px-3 py-1.5 text-[0.78rem] font-medium text-ink-800/75"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/*
                    Осы пәннің сипаттамасынан оның нақты интерактивті сабағына
                    көпір: ойын, симуляция және тест сол жерде ашылады.
                  */}
                  {activeLesson ? (
                    <Link
                      href={`/dashboard/lessons/${activeLesson.id}`}
                      className="group mt-4 flex items-center gap-3 rounded-2xl p-5 text-white transition-transform duration-300 hover:scale-[1.01]"
                      style={{ backgroundColor: active.accent }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.66rem] font-semibold tracking-[0.12em] uppercase opacity-75">
                          Интерактивті сабақ
                        </span>
                        <span className="mt-1 block text-[0.95rem] font-semibold">
                          «{activeLesson.title}»
                        </span>
                        <span className="mt-0.5 block text-[0.78rem] opacity-85">
                          {GAME_KIND_LABEL[activeLesson.stages.activity.game.kind]} ·{" "}
                          {activeLesson.stages.assessment.quiz.questions.length} сұрақтық тест
                          {activeLesson.stages.resources.sim ? " · симуляция" : ""}
                        </span>
                      </span>
                      <svg
                        className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3 8h10M8.5 3.5 13 8l-4.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
