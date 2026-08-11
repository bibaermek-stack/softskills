"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { platformObjectives } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { IconBadge, RailHeading } from "./Panel";
import { Collapse } from "./Collapse";

/**
 * Сол жақ бағана — «Платформаның негізгі міндеттері».
 *
 * Схемада әр міндет нөмірленген түсті карточка түрінде тұр. Мұнда сол карточка
 * ашылмалы болды: қысқа сипаттама көрініп тұрады, толық нақтылама басқанда
 * ашылады. Бір мезгілде біреуі ғана ашық — бағана тым ұзарып кетпеуі үшін.
 */
export function ObjectivesRail() {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      <RailHeading title="Платформаның негізгі міндеттері" />

      {platformObjectives.map((objective) => {
        const open = openId === objective.id;

        return (
          <article
            key={objective.id}
            className="dash-card group overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-lift"
            style={{ borderLeft: `3px solid ${objective.accent}` }}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : objective.id)}
              aria-expanded={open}
              className="flex w-full items-start gap-3 p-3.5 text-left"
            >
              <IconBadge name={objective.icon} accent={objective.accent} />

              <span className="min-w-0 flex-1">
                <span
                  className="mb-1 inline-block rounded-md px-1.5 py-0.5 font-display text-[0.68rem] font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${objective.accent} 14%, transparent)`,
                    color: objective.accent,
                  }}
                >
                  {objective.number}
                </span>
                <span className="block font-display text-[0.83rem] leading-snug font-semibold text-ink-900 dark:text-white">
                  {objective.title}
                </span>
                <span className="mt-1 block text-[0.75rem] leading-snug text-ink-700/80 dark:text-paper-300">
                  {objective.summary}
                </span>
              </span>

              <motion.span
                className="mt-1 shrink-0 text-ink-600/60 dark:text-paper-300"
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Icon name="ChevronDown" className="size-4" strokeWidth={2.2} />
              </motion.span>
            </button>

            <Collapse open={open}>
              <div className="border-t border-ink-700/8 px-3.5 py-3 dark:border-white/10">
                <ul className="space-y-1.5">
                  {objective.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 text-[0.76rem] leading-snug text-ink-700 dark:text-paper-200"
                    >
                      <span className="mt-0.5 shrink-0" style={{ color: objective.accent }}>
                        <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-3 flex items-baseline gap-2 rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${objective.accent} 9%, transparent)`,
                  }}
                >
                  <span
                    className="font-display text-lg leading-none font-bold"
                    style={{ color: objective.accent }}
                  >
                    {objective.metric.value}
                  </span>
                  <span className="text-[0.72rem] text-ink-700 dark:text-paper-200">
                    {objective.metric.label}
                  </span>
                </div>
              </div>
            </Collapse>
          </article>
        );
      })}
    </div>
  );
}
