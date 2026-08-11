"use client";

import { motion } from "framer-motion";
import { coreModules } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { IconBadge, Panel, ZoneBanner } from "./Panel";

/**
 * Орталық аймақтың бірінші жолағы — «Платформаның негізгі модульдері».
 * Схемада алты белгіше бір қатарда тұр; мұнда әрқайсысы көтерілетін карточка.
 */
export function CoreModules() {
  const reduced = usePrefersReducedMotion();

  return (
    <Panel id="dash-modules" className="p-3.5">
      <ZoneBanner title="Платформаның негізгі модульдері" />

      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {coreModules.map((module, i) => (
          <motion.article
            key={module.id}
            className="group relative flex cursor-default flex-col items-center gap-2 overflow-hidden rounded-xl border border-ink-700/7 bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/5"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduced ? undefined : { y: -4 }}
          >
            {/* Меңзегенде жоғары шығатын түсті жарық */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-12 h-16 opacity-0 blur-2xl transition-opacity duration-400 group-hover:opacity-70"
              style={{ backgroundColor: module.accent }}
            />

            <IconBadge
              name={module.icon}
              accent={module.accent}
              size="lg"
              className="transition-transform duration-400 group-hover:scale-110"
            />

            <h3 className="font-display text-[0.78rem] leading-tight font-semibold text-ink-900 dark:text-white">
              {module.title}
            </h3>
            <p className="text-[0.7rem] leading-snug text-ink-700/80 dark:text-paper-300">
              {module.text}
            </p>
          </motion.article>
        ))}
      </div>
    </Panel>
  );
}
