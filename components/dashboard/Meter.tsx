"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Пайызбен көрсетілетін көрсеткіш жолағы.
 *
 * Жекелендірілген оқыту панелінде де, командалық симуляторда да қолданылады.
 * `Panel.tsx` серверлік компонент болғандықтан (анимация да, хук та жоқ), бұл
 * жерде бөлек тұр.
 */
export function Meter({
  label,
  value,
  accent,
  /** Мәнді пайызбен емес, өз бірлігімен көрсету қажет болса. */
  suffix = "%",
}: {
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.73rem] text-ink-700 dark:text-paper-200">{label}</span>
        <span className="font-display text-[0.75rem] font-semibold text-ink-900 tabular-nums dark:text-white">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700/8 dark:bg-white/12">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accent }}
          initial={reduced ? { width: `${value}%` } : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
