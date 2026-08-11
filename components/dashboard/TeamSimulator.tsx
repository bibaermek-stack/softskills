"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { teamSimulator } from "@/lib/dashboard";
import { collaborationScenarios } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { IconBadge, Panel, ZoneBanner } from "./Panel";

/**
 * Орталық аймақтың соңғы жолағы — «2.11 Командалық жобалар симуляторы».
 *
 * Схемада бес блок бір қатарда тұр: орта → рөлдер → коммуникация → қақтығыс →
 * нәтиже. Сол рет сақталған; блокты басқанда оның құрамы ашылады, ал қақтығыс
 * блогы бөлек сценарий тізімін көрсетеді.
 */
export function TeamSimulator() {
  const [activeId, setActiveId] = useState<string>("roles");
  const reduced = usePrefersReducedMotion();

  const active = teamSimulator.find((block) => block.id === activeId);

  return (
    <Panel id="dash-team" className="p-3.5">
      <ZoneBanner number="2.11" title="Командалық жобалар симуляторы" />

      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {teamSimulator.map((block, i) => {
          const open = activeId === block.id;

          return (
            <motion.button
              key={block.id}
              type="button"
              onClick={() => setActiveId(block.id)}
              aria-pressed={open}
              className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors"
              style={{
                borderColor: open
                  ? `color-mix(in srgb, ${block.accent} 55%, transparent)`
                  : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                backgroundColor: open
                  ? `color-mix(in srgb, ${block.accent} 8%, transparent)`
                  : undefined,
              }}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06 }}
              whileHover={reduced ? undefined : { y: -4 }}
            >
              <IconBadge name={block.icon} accent={block.accent} size="lg" />
              <span className="font-display text-[0.78rem] leading-tight font-semibold text-ink-900 dark:text-white">
                {block.title}
              </span>
              <span className="text-[0.68rem] leading-snug text-ink-700/75 dark:text-paper-300">
                {block.hint}
              </span>
            </motion.button>
          );
        })}
      </div>

      {active ? (
        // `key` арқылы блок ауысқанда компонент қайта құрылады, сол себепті
        // кіру анимациясы әр таңдауда қайта ойналады.
        <motion.div
          key={active.id}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 rounded-xl border p-3.5"
          style={{
            borderColor: `color-mix(in srgb, ${active.accent} 28%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${active.accent} 6%, transparent)`,
          }}
        >
          <h3 className="mb-2.5 flex items-center gap-2 font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
            <span style={{ color: active.accent }}>
              <Icon name={active.icon} className="size-4" strokeWidth={2} />
            </span>
            {active.title}
          </h3>

          {/* Қақтығыс блогы сценарий сипаттамасымен бірге көрсетіледі */}
          {active.id === "conflict" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {collaborationScenarios.map((scenario) => (
                <div
                  key={scenario.title}
                  className="rounded-lg border border-ink-700/8 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-[0.78rem] font-semibold text-ink-900 dark:text-white">
                    {scenario.title}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] leading-snug text-ink-700/85 dark:text-paper-300">
                    {scenario.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {active.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-ink-700/8 bg-white/70 px-3 py-1.5 text-[0.76rem] font-medium text-ink-800 dark:border-white/10 dark:bg-white/5 dark:text-paper-100"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}
    </Panel>
  );
}
