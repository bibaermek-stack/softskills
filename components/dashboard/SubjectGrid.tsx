"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { subjectPanels } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { IconBadge, Panel, ZoneBanner } from "./Panel";

/** Бағана ішіндегі бір өріс: «Жоба мысалы:», «Құралдар:» т.б. */
function Field({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-0.5 text-[0.74rem] leading-snug text-ink-700 dark:text-paper-200">
        {children}
      </p>
    </div>
  );
}

/**
 * Орталық аймақтың екінші жолағы — «Пәндер интеграциясы: STEM + гуманитарлық».
 *
 * Схемадағы бес бағананың реті, өрістері және түстері сол күйінде сақталған:
 * жоба мысалы → нақты өмірлік жағдаят → құралдар → Soft Skills. Бағананы басу
 * терең мазмұны бар бүйір терезені ашады.
 */
export function SubjectGrid() {
  const reduced = usePrefersReducedMotion();

  return (
    <Panel id="dash-subjects" className="p-3.5">
      <ZoneBanner title="Пәндер интеграциясы: STEM + гуманитарлық" />

      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {subjectPanels.map((subject, i) => (
          <motion.article
            key={subject.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-ink-700/8 dark:border-white/10"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduced ? undefined : { y: -5 }}
            style={{ backgroundColor: subject.tint }}
          >
            {/* Қараңғы тақырыпта ашық реңк орнына мөлдір қабат қолданылады */}
            <div className="flex h-full flex-col dark:bg-ink-900/85">
              <header className="flex items-center gap-2 border-b border-ink-700/8 px-3 py-2.5 dark:border-white/10">
                <IconBadge name={subject.icon} accent={subject.accent} size="sm" />
                <h3
                  className="font-display text-[0.86rem] font-bold tracking-tight"
                  style={{ color: subject.accent }}
                >
                  {subject.name}
                </h3>
              </header>

              <div className="flex flex-1 flex-col gap-2.5 px-3 py-3">
                <Field label="Жоба мысалы:" accent={subject.accent}>
                  {subject.project}
                </Field>
                <Field label="Нақты өмірлік жағдаят:" accent={subject.accent}>
                  {subject.realLife}
                </Field>
                <Field label="Құралдар:" accent={subject.accent}>
                  {subject.tools.join(", ")}
                </Field>
                <Field label="Soft Skills:" accent={subject.accent}>
                  {subject.softSkills.join(", ")}
                </Field>

                <Link
                  href={`/dashboard/modules/${subject.id}`}
                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.74rem] font-semibold text-white transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{ backgroundColor: subject.accent }}
                >
                  Модульді ашу
                  <Icon name="ArrowRight" className="size-3.5" strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </Panel>
  );
}
