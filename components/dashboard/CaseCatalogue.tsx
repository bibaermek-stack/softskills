"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { caseSkills, caseTasks } from "@/lib/caseTasks";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip, IconBadge } from "./Panel";

/**
 * Кейс тапсырмаларының каталогы.
 *
 * Сабақтар каталогынан айырмашылығы — мұнда пән жоқ. Карточкадағы белгі де,
 * беттің тақырыбы да икемді дағды бойынша жүреді, себебі кейстің мақсаты
 * пәндік білім емес: келісім, дәлел және топтағы рөл.
 */
export function CaseCatalogue() {
  const reduced = usePrefersReducedMotion();

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
        <span className="px-1 font-semibold text-ink-800 dark:text-paper-100">
          Кейс тапсырмалар
        </span>
      </nav>

      <header className="dash-card rounded-2xl p-4 sm:p-6">
        <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-brand-600 uppercase dark:text-brand-300">
          Икемді дағдыларға арналған
        </p>
        <h1 className="mt-0.5 font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
          Кейс тапсырмалар
        </h1>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
          Кейс пәнге бөлінбейді. Мұнда бағаланатын нәрсе — формула емес, шешім: ұстанымды
          қалай негіздейсіз, басқаны қалай тыңдайсыз, топта қандай рөл аласыз. Әр кейс төрт
          қадамнан өтеді: бейне → шағын тапсырма → рөлдік ойын → талқылау.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {caseSkills.map((skill) => (
            <Chip key={skill} accent="#7c3aed">
              {skill}
            </Chip>
          ))}
        </div>
      </header>

      <section className="dash-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {caseTasks.map((item, i) => (
            <motion.div
              key={item.id}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduced ? undefined : { y: -4 }}
            >
              <Link
                href={`/dashboard/cases/${item.id}`}
                className="group flex h-full flex-col rounded-xl border border-ink-700/8 p-3 transition-shadow duration-300 hover:shadow-lift dark:border-white/10"
                style={{ borderTop: `3px solid ${item.accent}` }}
              >
                <div className="flex items-start gap-2.5">
                  <IconBadge
                    name={item.icon}
                    accent={item.accent}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[0.85rem] leading-tight font-semibold text-ink-900 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="mt-0.5 text-[0.7rem] text-ink-700/70 dark:text-paper-300">
                      {item.grade} · {item.duration} · 4 қадам
                    </p>
                  </div>
                </div>

                <p className="mt-2 flex-1 text-[0.75rem] leading-snug text-ink-700/85 dark:text-paper-300">
                  {item.summary}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <Chip key={skill} accent={item.accent}>
                      {skill}
                    </Chip>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
