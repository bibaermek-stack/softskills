"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { about, adaptiveModel, teachingMethods } from "@/lib/content";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Gentle parallax on the visual column.
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [40, -40]);

  return (
    <Section id="platform" tone="light" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-light opacity-60 [mask-image:radial-gradient(60%_50%_at_30%_20%,#000,transparent)]" />

      <div className="container-x">
        <div ref={ref} className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ---------- visual ---------- */}
          <motion.div style={{ y }} className="relative order-2 lg:order-1">
            <PlatformVisual />
          </motion.div>

          {/* ---------- copy ---------- */}
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow={about.eyebrow}
              title={about.title}
              lead={about.lead}
              maxWidth="max-w-none"
            />

            <Reveal from="up" delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-ink-700/70">{about.body}</p>
            </Reveal>

            <RevealGroup className="mt-9 grid gap-4 sm:grid-cols-2" stagger={0.1}>
              <RevealItem className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-px shadow-soft">
                <div className="h-full rounded-[calc(1rem-1px)] bg-white p-5">
                  <h3 className="text-[0.68rem] font-semibold tracking-[0.12em] text-brand-600 uppercase">
                    Миссия
                  </h3>
                  <p className="mt-2.5 text-[0.88rem] leading-relaxed text-ink-800/80">
                    {about.mission}
                  </p>
                </div>
              </RevealItem>
              <RevealItem className="rounded-2xl bg-gradient-to-br from-cyan-500 to-brand-600 p-px shadow-soft">
                <div className="h-full rounded-[calc(1rem-1px)] bg-white p-5">
                  <h3 className="text-[0.68rem] font-semibold tracking-[0.12em] text-cyan-600 uppercase">
                    Пайым
                  </h3>
                  <p className="mt-2.5 text-[0.88rem] leading-relaxed text-ink-800/80">
                    {about.vision}
                  </p>
                </div>
              </RevealItem>
            </RevealGroup>
          </div>
        </div>

        {/* ---------- timeline ---------- */}
        <div className="mt-24 lg:mt-32">
          <Reveal from="up">
            <Eyebrow>Негіздер</Eyebrow>
          </Reveal>
          <Reveal from="up" delay={0.06}>
            <h3 className="mt-5 max-w-2xl text-display-sm leading-[1.1]">
              Платформа сүйенетін жеті ұстаным
            </h3>
          </Reveal>

          <Timeline />
        </div>

        {/* ---------- adaptive model + methods ---------- */}
        <div className="mt-24 grid gap-8 lg:mt-28 lg:grid-cols-[1.25fr_1fr]">
          <Reveal from="right" className="rounded-3xl bg-ink-900 p-8 text-white sm:p-10">
            <div>
              <Eyebrow tone="dark">Бейімделген модель</Eyebrow>
              <h3 className="mt-5 text-2xl leading-tight sm:text-3xl">
                Нақты мәселеден рефлексияға дейін — тоғыз кезең
              </h3>
              <ol className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                {adaptiveModel.map((stage, i) => (
                  <li key={stage} className="flex gap-3.5">
                    <span className="mt-px font-display text-[0.78rem] font-semibold text-cyan-400 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.88rem] leading-snug text-brand-100/75">{stage}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal from="left" delay={0.1} className="rounded-3xl bg-paper-50 p-8 ring-hairline sm:p-10">
            <div>
              <Eyebrow>Оқыту әдістері</Eyebrow>
              <h3 className="mt-5 text-2xl leading-tight">Он әдіс, бір жүйе</h3>
              <ul className="mt-7 flex flex-wrap gap-2">
                {teachingMethods.map((m) => (
                  <li
                    key={m}
                    className="rounded-full bg-white px-3.5 py-2 text-[0.8rem] font-medium text-ink-800/80 ring-1 ring-ink-700/8 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                  >
                    {m}
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

/* ------------------------------------------------------------------ *\
   Timeline
\* ------------------------------------------------------------------ */
function Timeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <ol ref={ref} className="relative mt-12 space-y-9 pl-10 sm:space-y-11 sm:pl-14">
      {/* rail */}
      <div
        className="absolute top-1 bottom-1 left-3 w-px bg-ink-700/10 sm:left-4.5"
        aria-hidden
      />
      <motion.div
        className="absolute top-1 left-3 w-px origin-top bg-gradient-to-b from-brand-600 via-violet-600 to-cyan-500 sm:left-4.5"
        style={{ height: "100%", scaleY: reduced ? 1 : scaleY }}
        aria-hidden
      />

      {about.timeline.map((item, i) => (
        <li key={item.step} className="relative">
          <Reveal from="up" delay={i * 0.04}>
            <span
              className="absolute top-1 -left-10 grid size-6 place-items-center rounded-full bg-white text-[0.6rem] font-semibold text-brand-700 ring-1 ring-brand-200 sm:-left-14 sm:size-9 sm:text-[0.68rem]"
              aria-hidden
            >
              {item.step}
            </span>
            <h4 className="text-lg leading-snug font-semibold sm:text-xl">{item.title}</h4>
            <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink-700/65">
              {item.text}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ *\
   Composed visual — the platform rendered as layered glass panels
\* ------------------------------------------------------------------ */
function PlatformVisual() {
  const layers = [
    { label: "Креативті тәрбие", tone: "from-violet-600 to-brand-600", offset: "0" },
    { label: "Икемді дағдылар", tone: "from-brand-600 to-cyan-500", offset: "1" },
    { label: "Цифрлық технологиялар", tone: "from-cyan-500 to-deep-600", offset: "2" },
    { label: "Пәндік білім", tone: "from-deep-600 to-violet-600", offset: "3" },
  ];

  return (
    <div className="relative aspect-square w-full max-w-lg sm:aspect-4/3 lg:aspect-square">
      {/* glow */}
      <div
        className="absolute inset-6 rounded-full bg-gradient-to-br from-brand-500/25 via-violet-500/20 to-cyan-400/25 blur-3xl"
        aria-hidden
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-3.5 p-4">
        {layers.map((layer, i) => (
          <Reveal
            key={layer.label}
            from="up"
            delay={0.08 * i}
            className="w-full"
          >
            <div
              className="group relative w-full rounded-2xl bg-white/70 p-px shadow-soft backdrop-blur-xl transition-transform duration-500 ease-(--ease-out-expo) hover:-translate-y-1"
              style={{
                marginLeft: `${(i % 2 === 0 ? -1 : 1) * (i * 3)}%`,
                width: `${100 - i * 4}%`,
              }}
            >
              <div className="flex items-center gap-4 rounded-[calc(1rem-1px)] bg-white/85 px-5 py-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${layer.tone} text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)]`}
                  aria-hidden
                >
                  <span className="font-display text-[0.8rem] font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="text-[0.9rem] font-semibold text-ink-900">{layer.label}</div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-700/8">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${layer.tone}`}
                      style={{ width: `${92 - i * 9}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}

        <Reveal from="up" delay={0.4} className="w-full">
          <div className="mt-2 rounded-2xl bg-ink-900 px-5 py-4 text-center text-white shadow-lift">
            <div className="text-[0.66rem] font-semibold tracking-[0.12em] text-cyan-400 uppercase">
              Бір экожүйе
            </div>
            <div className="mt-1.5 font-display text-lg font-semibold">
              Біртұтас білім беру ортасы
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
