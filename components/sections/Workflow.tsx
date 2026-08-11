"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { workflow } from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * The twelve-stage platform algorithm as a horizontal rail. It scrolls
 * horizontally on its own axis rather than hijacking page scroll — pinned
 * horizontal sections trap keyboard and touch users.
 */
export function Workflow() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollXProgress } = useScroll({ container: trackRef });
  const progressWidth = useTransform(scrollXProgress, [0, 1], ["6%", "100%"]);

  return (
    <Section id="methodology" tone="dark" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(90%_65%_at_50%_0%,#101b3d_0%,#060b1a_60%)]" />
        <div className="absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[130px]" />
      </div>

      <div className="container-x">
        <SectionHeading
          eyebrow="Платформаның жұмыс алгоритмі"
          tone="dark"
          title={
            <>
              Он екі кезең — және цикл{" "}
              <span className="text-gradient-light">қайта басталады</span>
            </>
          }
          lead="Әрбір орындалған тапсырманың нәтижесі білім алушының жеке профиліне тіркеледі және келесі тапсырманы таңдауға негіз болады. Бұл алгоритм платформаның барлық міндеттерін бір жүйеге біріктіреді."
        />
      </div>

      {/* progress rail */}
      <div className="container-x mt-10">
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-cyan-400"
            style={{ width: reduced ? "100%" : progressWidth }}
          />
        </div>
      </div>

      {/* horizontal track */}
      <div
        ref={trackRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: "max(1.15rem, calc((100vw - 80rem) / 2 + 2.5rem))" }}
        tabIndex={0}
        role="region"
        aria-label="Платформаның жұмыс кезеңдері — көлденең айналдырыңыз"
      >
        {workflow.map((stage, i) => (
          <Reveal key={stage.step} from="up" delay={Math.min(i, 6) * 0.05}>
            <article className="group relative w-64 shrink-0 snap-start sm:w-72">
              <div className="glass-dark h-full rounded-2xl p-6 transition-colors duration-500 hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-semibold text-white/15 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i === workflow.length - 1 ? (
                    <span
                      className="grid size-8 place-items-center rounded-full bg-cyan-400/15 text-cyan-400"
                      title="Басына қайта оралады"
                    >
                      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5V5h-2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-white/6 text-white/35 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M4 8h8m0 0-3-3m3 3-3 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-[1.02rem] leading-snug font-semibold text-white">
                  {stage.step}
                </h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-brand-100/60">
                  {stage.text}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="container-x mt-4">
        <p className="flex items-center gap-2 text-[0.76rem] text-brand-100/40">
          <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M2.5 8h11m0 0-3-3m3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Толық циклді көру үшін жолақты көлденең айналдырыңыз
        </p>
      </div>
    </Section>
  );
}
