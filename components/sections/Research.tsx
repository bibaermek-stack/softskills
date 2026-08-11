"use client";

import { research, site } from "@/lib/content";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Research() {
  return (
    <Section id="research" tone="light" className="overflow-hidden">
      <div className="container-x">
        <SectionHeading
          eyebrow={research.eyebrow}
          title={research.title}
          lead="Платформа — креативті тәрбие мен STEM білімді интеграциялау арқылы оқушылардың икемді дағдыларын қалыптастыруды зерттейтін мемлекеттік бағдарламаның нәтижелерінің бірі."
        />

        {/* ---------- funding card ---------- */}
        <Reveal from="up" delay={0.1} className="mt-12">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-8 text-white sm:p-10 lg:p-12">
            <div
              className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_70%_at_80%_20%,#000,transparent)]"
              aria-hidden
            />
            <div
              className="absolute -top-32 -right-32 size-96 rounded-full bg-brand-600/25 blur-[110px]"
              aria-hidden
            />

            <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
              <div className="shrink-0">
                <div className="text-[0.66rem] font-semibold tracking-[0.12em] text-cyan-400 uppercase">
                  Грант нөмірі
                </div>
                <div className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  {site.grantNumber}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[0.95rem] leading-relaxed text-brand-100/85">
                  «{site.grantTitleKk}»
                </p>
                <p
                  className="mt-4 border-t border-white/10 pt-4 text-[0.88rem] leading-relaxed text-brand-100/55"
                  lang="en"
                >
                  {site.grantTitleEn}
                </p>
                <p className="mt-5 text-[0.82rem] leading-relaxed text-brand-100/45">
                  Қаржыландырушы — {site.funderKk}.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------- research cards ---------- */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ResearchCard
            title="Зерттеу міндеттері"
            items={research.objectives}
            accent="brand"
            delay={0}
          />
          <ResearchCard
            title="Әдіснама"
            items={research.methodology}
            accent="violet"
            delay={0.06}
          />
          <ResearchCard
            title="Инновация"
            items={research.innovation}
            accent="cyan"
            delay={0.12}
          />
        </div>

        {/* ---------- phases ---------- */}
        <div className="mt-20">
          <Reveal from="up">
            <Eyebrow>Бағдарлама кезеңдері</Eyebrow>
          </Reveal>

          <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {research.phases.map((p, i) => (
              <RevealItem key={p.period}>
                <article className="group relative h-full rounded-2xl bg-paper-50 p-6 ring-1 ring-ink-700/5 transition-all duration-500 ease-(--ease-out-expo) hover:-translate-y-1 hover:bg-white hover:shadow-lift">
                  {/* connector */}
                  {i < research.phases.length - 1 && (
                    <span
                      className="absolute top-11 -right-2 hidden h-px w-4 bg-ink-700/12 lg:block"
                      aria-hidden
                    />
                  )}
                  <span className="inline-flex items-center rounded-full bg-brand-600/10 px-3 py-1 text-[0.68rem] font-semibold text-brand-700">
                    {p.period}
                  </span>
                  <h3 className="mt-4 text-[0.98rem] font-semibold text-ink-900">{p.title}</h3>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-700/65">{p.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* ---------- outcomes + contribution ---------- */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <Reveal from="right">
            <div className="h-full rounded-3xl bg-paper-50 p-8 ring-1 ring-ink-700/5 sm:p-10">
              <Eyebrow>Күтілетін нәтижелер</Eyebrow>
              <h3 className="mt-5 text-2xl leading-tight">
                Білім алушыда дамитын он екі қабілет
              </h3>
              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {research.outcomes.map((o, i) => (
                  <li key={o} className="flex items-start gap-3">
                    <span className="mt-0.5 font-display text-[0.72rem] font-semibold text-brand-600/45 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.86rem] leading-snug text-ink-800/80">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal from="left" delay={0.08}>
            <div className="h-full rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-8 text-white sm:p-10">
              <Eyebrow tone="dark">Ғылыми үлес</Eyebrow>
              <h3 className="mt-5 text-2xl leading-tight">Бағдарлама не қосады</h3>
              <ul className="mt-8 space-y-4">
                {research.contribution.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 size-4.5 shrink-0 text-cyan-300"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="m4 9.5 3.5 3.5 7-7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[0.9rem] leading-relaxed text-white/90">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function ResearchCard({
  title,
  items,
  accent,
  delay,
}: {
  title: string;
  items: readonly string[];
  accent: "brand" | "violet" | "cyan";
  delay: number;
}) {
  const bar = {
    brand: "from-deep-600 to-brand-600",
    violet: "from-brand-600 to-violet-600",
    cyan: "from-violet-600 to-cyan-500",
  }[accent];

  const dot = {
    brand: "bg-deep-600",
    violet: "bg-violet-600",
    cyan: "bg-cyan-500",
  }[accent];

  return (
    <Reveal from="up" delay={delay}>
      <article className="group h-full overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-ink-700/5 transition-shadow duration-500 hover:shadow-lift">
        <div className={`h-1 w-full bg-gradient-to-r ${bar}`} aria-hidden />
        <div className="p-7 sm:p-8">
          <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          <ul className="mt-5 space-y-3.5">
            {items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
                <span className="text-[0.86rem] leading-relaxed text-ink-700/70">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Reveal>
  );
}
