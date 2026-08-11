"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adaptiveSystem, learnerProfile, personalizedPath } from "@/lib/dashboard";
import { aiAssistant } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip, Panel, ZoneBanner } from "./Panel";
import { Meter } from "./Meter";
import { AnalyticsPanel } from "./AnalyticsPanel";

/* ------------------------------------------------------------------ *\
   2.10 — жекелендірілген оқыту жолы
\* ------------------------------------------------------------------ */

function PersonalizedPanel() {
  return (
    <Panel className="flex flex-col p-3.5">
      <ZoneBanner number={personalizedPath.number} title={personalizedPath.title} />

      <p className="mt-3 text-[0.75rem] font-semibold text-brand-700 dark:text-brand-300">
        {personalizedPath.lead}
      </p>

      <ul className="mt-2.5 space-y-1.5">
        {personalizedPath.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200"
          >
            <span className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300">
              <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* Демо оқушы профилі */}
      <div className="mt-3.5 rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-brand-600/12 font-display text-[0.8rem] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-200">
            {learnerProfile.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[0.82rem] font-semibold text-ink-900 dark:text-white">
              {learnerProfile.name}
            </p>
            <p className="text-[0.7rem] text-ink-700/75 dark:text-paper-300">
              {learnerProfile.grade} · {learnerProfile.level}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {learnerProfile.interests.map((interest) => (
            <Chip key={interest} accent="#2563eb">
              {interest}
            </Chip>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <Meter label="Тапсырма қиындығы" value={learnerProfile.difficulty} accent="#2563eb" />
          <Meter label="Оқу қарқыны" value={learnerProfile.pace} accent="#7c3aed" />
          <Meter label="Қажет қолдау" value={learnerProfile.support} accent="#0891b2" />
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
          Жеке тапсырмалар
        </p>
        <ul className="space-y-1.5">
          {learnerProfile.nextTasks.map((task) => (
            <li
              key={task.title}
              className="flex items-center gap-2 rounded-lg border border-ink-700/8 px-2.5 py-2 dark:border-white/10"
            >
              <span className="min-w-0 flex-1 text-[0.75rem] leading-snug text-ink-800 dark:text-paper-100">
                {task.title}
              </span>
              <Chip>{task.subject}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *\
   Адаптивті жүйе (AI)
\* ------------------------------------------------------------------ */
function AIPanel() {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(2);

  const conversation = aiAssistant.conversation;

  // Әңгіме өздігінен жылжиды; қозғалыс шектелген режимде толық тізім тұрады.
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current >= conversation.length ? 2 : current + 1));
    }, 4200);
    return () => window.clearInterval(timer);
  }, [reduced, conversation.length]);

  const visible = reduced ? conversation : conversation.slice(0, step);

  return (
    <Panel className="flex flex-col p-3.5">
      <ZoneBanner title={adaptiveSystem.title} />

      {/* Тірі ассистент белгісі */}
      <div className="mt-3 flex items-center gap-3">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-135 from-brand-600 to-violet-600 text-white">
          {!reduced ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-brand-500/45"
              animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
          <Icon name="Brain" className="relative size-5" strokeWidth={1.9} />
        </span>
        <p className="text-[0.75rem] leading-snug text-ink-700 dark:text-paper-200">
          Жүйе прогресті талдап, келесі қадамды ұсынады.
        </p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {adaptiveSystem.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200"
          >
            <span className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400">
              <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {adaptiveSystem.capabilities.map((capability) => (
          <div
            key={capability.title}
            className="flex items-center gap-1.5 rounded-lg border border-ink-700/8 px-2 py-1.5 dark:border-white/10"
          >
            <span className="text-violet-600 dark:text-violet-400">
              <Icon name={capability.icon} className="size-3.5" strokeWidth={2} />
            </span>
            <span className="text-[0.7rem] leading-tight text-ink-800 dark:text-paper-100">
              {capability.title}
            </span>
          </div>
        ))}
      </div>

      {/* Диалог үзіндісі */}
      <div className="dash-scroll mt-3 max-h-56 flex-1 space-y-2 overflow-y-auto rounded-xl bg-ink-700/4 p-2.5 dark:bg-white/5">
        {/* Хабарлар тек қосылады, өшпейді — сондықтан AnimatePresence қажет емес. */}
        {visible.map((turn, i) => (
          <motion.div
            key={`${turn.from}-${i}`}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={
              turn.from === "ai"
                ? "ml-auto max-w-[88%] rounded-xl rounded-br-sm bg-linear-135 from-brand-600 to-violet-600 px-2.5 py-2 text-[0.72rem] leading-snug text-white"
                : "max-w-[88%] rounded-xl rounded-bl-sm bg-white px-2.5 py-2 text-[0.72rem] leading-snug text-ink-800 ring-1 ring-ink-700/8 dark:bg-ink-800 dark:text-paper-100 dark:ring-white/10"
            }
          >
            {turn.text}
          </motion.div>
        ))}
      </div>

      <p className="mt-2.5 rounded-lg bg-violet-500/8 px-2.5 py-2 text-[0.7rem] leading-snug text-violet-800 dark:text-violet-200">
        {adaptiveSystem.principle}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *\
   Үш блокты қатар — схемадағыдай көрсеткішпен байланысқан
\* ------------------------------------------------------------------ */
export function AdaptiveRow() {
  return (
    <div id="dash-adaptive" className="grid items-start gap-2.5 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <PersonalizedPanel />

      <span aria-hidden className="hidden self-center text-brand-500/55 lg:block">
        <Icon name="ArrowRight" className="size-5" strokeWidth={2.4} />
      </span>

      <AIPanel />

      <span aria-hidden className="hidden self-center text-brand-500/55 lg:block">
        <Icon name="ArrowRight" className="size-5" strokeWidth={2.4} />
      </span>

      <AnalyticsPanel />
    </div>
  );
}
