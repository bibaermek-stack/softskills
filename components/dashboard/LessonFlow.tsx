"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { lessonStages } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { IconBadge, Panel, ZoneBanner } from "./Panel";
import { Collapse } from "./Collapse";

/**
 * Орталық аймақтың үшінші жолағы — «2.8 Дайын сабақ үлгісінің құрылымы».
 *
 * Схемада алты кезең солдан оңға қарай көрсеткішпен жалғасады. Кең экранда сол
 * қатар сақталады, тар экранда кезеңдер тігінен тізіледі. Әр кезең басылғанда
 * төменде оның толық сипаттамасы ашылады.
 */
export function LessonFlow() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  const active = lessonStages.find((stage) => stage.id === activeId);

  return (
    <Panel id="dash-lesson" className="p-3.5">
      <ZoneBanner number="2.8" title="Дайын сабақ үлгісінің құрылымы" />

      <ol className="mt-3.5 flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {lessonStages.map((stage, i) => {
          const open = activeId === stage.id;

          return (
            <li key={stage.id} className="flex items-center gap-2 lg:flex-1">
              <motion.button
                type="button"
                onClick={() => setActiveId(open ? null : stage.id)}
                aria-expanded={open}
                className="flex w-full flex-1 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors lg:h-full lg:flex-col lg:items-start"
                style={{
                  borderColor: open
                    ? "color-mix(in srgb, var(--color-brand-600) 55%, transparent)"
                    : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                  backgroundColor: open
                    ? "color-mix(in srgb, var(--color-brand-600) 8%, transparent)"
                    : undefined,
                }}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{ duration: 0.45, delay: reduced ? 0 : i * 0.06 }}
                whileHover={reduced ? undefined : { y: -3 }}
              >
                <IconBadge name={stage.icon} accent="#4f46e5" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.79rem] leading-tight font-semibold text-ink-900 dark:text-white">
                    {stage.title}
                  </span>
                  <span className="mt-0.5 block text-[0.69rem] leading-snug text-ink-700/75 dark:text-paper-300">
                    {stage.hint}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-ink-700/6 px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink-700 tabular-nums lg:mt-1 dark:bg-white/10 dark:text-paper-200">
                  {stage.duration}
                </span>
              </motion.button>

              {i < lessonStages.length - 1 ? (
                <span aria-hidden className="shrink-0 text-brand-500/55">
                  {/* Тар экранда ағын төмен, кең экранда оңға қарай жүреді */}
                  <Icon name="ChevronRight" className="hidden size-4 lg:block" strokeWidth={2.4} />
                  <Icon name="ChevronDown" className="size-4 lg:hidden" strokeWidth={2.4} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <Collapse open={Boolean(active)}>
        {active ? (
          <div className="mt-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3.5">
            <h3 className="mb-2 flex items-center gap-2 font-display text-[0.84rem] font-semibold text-ink-900 dark:text-white">
              <span className="text-brand-600 dark:text-brand-300">
                <Icon name={active.icon} className="size-4" strokeWidth={2} />
              </span>
              {active.title}
              <span className="text-[0.72rem] font-normal text-ink-700/70 dark:text-paper-300">
                · {active.hint}
              </span>
            </h3>
            <ul className="space-y-1.5">
              {active.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-2 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200"
                >
                  <span className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300">
                    <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Collapse>
    </Panel>
  );
}
