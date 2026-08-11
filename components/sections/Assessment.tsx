"use client";

import { motion } from "framer-motion";
import { assessmentTypes, assessmentCriteria, values } from "@/lib/content";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

export function Assessment() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="assessment" tone="light">
      <div className="container-x">
        <SectionHeading
          eyebrow="Бағалау жүйесі"
          title={
            <>
              Пәндік білім мен икемді дағдылар{" "}
              <span className="text-gradient">біртұтас бағаланады</span>
            </>
          }
          lead="Сегіз бағалау түрі мен он бір критерий өнімді, процесті және оның негізіндегі пайымдауды қамтиды — оның ішінде білім алушының өз жұмысына рефлексия жасау қабілетін де."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* ---------- types ---------- */}
          <RevealGroup className="grid gap-3.5 sm:grid-cols-2">
            {assessmentTypes.map((t, i) => (
              <RevealItem key={t.title}>
                <article className="group relative h-full overflow-hidden rounded-2xl bg-white p-5 shadow-soft ring-1 ring-ink-700/5 transition-all duration-500 ease-(--ease-out-expo) hover:-translate-y-1 hover:shadow-lift">
                  <span
                    className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-gradient-to-b from-brand-600 to-cyan-500 transition-transform duration-500 group-hover:scale-y-100"
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[0.95rem] font-semibold text-ink-900">{t.title}</h3>
                    <span className="font-display text-[0.7rem] font-semibold text-brand-600/40 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-700/65">{t.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* ---------- criteria scoring visual ---------- */}
          <Reveal from="left">
            <div className="h-full rounded-3xl bg-ink-900 p-7 text-white sm:p-9">
              <Eyebrow tone="dark">Бағалау критерийлері</Eyebrow>
              <h3 className="mt-5 text-xl leading-tight sm:text-2xl">
                Әр жобаға қолданылатын он бір критерий
              </h3>

              <ul className="mt-8 space-y-3">
                {assessmentCriteria.map((c, i) => {
                  // Illustrative distribution — deliberately uneven, never a flat 100%.
                  const score = [92, 85, 78, 88, 81, 90, 76, 87, 94, 83, 79][i];
                  return (
                    <li key={c}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[0.8rem] text-brand-100/75">{c}</span>
                        <span className="font-display text-[0.75rem] font-semibold text-cyan-400 tabular-nums">
                          {score}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                          initial={reduced ? { width: `${score}%` } : { width: 0 }}
                          whileInView={{ width: `${score}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.9,
                            delay: reduced ? 0 : i * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-7 text-[0.74rem] leading-relaxed text-brand-100/40">
                Балдар — көрнекі мысал. Платформа рейтингті емес, өсуді көрсетеді: білім алушылар
                бір-бірімен салыстырылмайды.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ *\
   Creative education values
\* ------------------------------------------------------------------ */
export function CreativeEducation() {
  return (
    <Section id="values" tone="muted" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-light opacity-50 [mask-image:radial-gradient(60%_60%_at_70%_30%,#000,transparent)]" />

      <div className="container-x">
        <SectionHeading
          eyebrow="Креативті тәрбие"
          align="center"
          maxWidth="max-w-3xl"
          title={
            <>
              Әрбір техникалық мәселе — сонымен қатар{" "}
              <span className="text-gradient">адами мәселе</span>
            </>
          }
          lead="Ғылыми немесе техникалық мәселені шешумен қатар білім алушылар оның адамға, қоғамға, мәдениетке және қоршаған ортаға әсерін бағалайды. Бұл он екі құндылық барлық модульден өтеді."
        />

        <RevealGroup
          className="mt-14 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          stagger={0.05}
        >
          {values.map((v, i) => (
            <RevealItem key={v.title}>
              <article className="group relative h-full overflow-hidden rounded-2xl bg-white p-6 shadow-soft ring-1 ring-ink-700/5 transition-all duration-500 ease-(--ease-out-expo) hover:-translate-y-1.5 hover:shadow-lift">
                <span
                  className="pointer-events-none absolute -bottom-16 -left-16 size-40 rounded-full bg-gradient-to-tr from-violet-500/25 to-brand-500/25 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                  aria-hidden
                />
                <ValueGlyph index={i} />
                <h3 className="relative mt-4 text-[0.95rem] font-semibold text-ink-900">
                  {v.title}
                </h3>
                <p className="relative mt-2 text-[0.82rem] leading-relaxed text-ink-700/65">
                  {v.text}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/** Twelve small marks built from a shared geometric vocabulary. */
function ValueGlyph({ index }: { index: number }) {
  const paths = [
    "M9 2.5 11 7l4.5.6-3.3 3.2.8 4.5L9 13.2 4.9 15.3l.8-4.5L2.5 7.6 7 7z",
    "M4 9.5 7.5 13l7-7",
    "M9 2.5 15.5 6v5.5L9 15.5 2.5 11.5V6z",
    "M9 15.5s5.5-3.4 5.5-7.2A3.3 3.3 0 0 0 9 5.9a3.3 3.3 0 0 0-5.5 2.4c0 3.8 5.5 7.2 5.5 7.2z",
    "M3 15V7l6-4.5L15 7v8M6.5 15V9.5h5V15",
    "M6 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM3 15.5a6 6 0 0 1 12 0",
    "M9 2.5c2.5 3 3.5 5 3.5 7a3.5 3.5 0 0 1-7 0c0-2 1-4 3.5-7z",
    "M2.5 9h13M9 2.5v13M4.5 4.5l9 9M13.5 4.5l-9 9",
    "M4 14V6l5-3.5L14 6v8M4 14h10",
    "M9 2.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM9 6v3.5l2.5 1.5",
    "M3 6h12M3 9h12M3 12h8",
    "M9 2.5 3 5.5v4c0 3.4 2.6 6.2 6 6.5 3.4-.3 6-3.1 6-6.5v-4z",
  ];

  return (
    <span className="relative grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 text-brand-600 ring-1 ring-brand-100 transition-all duration-500 group-hover:from-brand-600 group-hover:to-violet-600 group-hover:text-white group-hover:ring-brand-600">
      <svg className="size-5" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d={paths[index % paths.length]}
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
