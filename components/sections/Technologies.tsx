"use client";

import { motion } from "framer-motion";
import { technologies } from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

const ACCENTS = ["#22d3ee", "#6366f1", "#a78bfa", "#38bdf8"];

export function Technologies() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="technology" tone="dark" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(90%_65%_at_50%_0%,#101b3d_0%,#060b1a_65%)]" />
        <div className="absolute top-0 left-1/4 size-[32rem] rounded-full bg-violet-600/12 blur-[120px] animate-aurora" />
        <div
          className="absolute right-1/4 bottom-0 size-[28rem] rounded-full bg-cyan-500/12 blur-[110px] animate-aurora"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <div className="container-x">
        <SectionHeading
          eyebrow="Инновациялық технологиялар"
          tone="dark"
          align="center"
          maxWidth="max-w-3xl"
          title={
            <>
              Оқыту ортасының артындағы{" "}
              <span className="text-gradient-light">он алты технология</span>
            </>
          }
          lead="Адаптивті алгоритмдер мен цифрлық егіздерден бастап құзыреттілік картасы мен автоматты кері байланысқа дейін — жекелендіруді мүмкін ететін техникалық қабат."
        />

        <RevealGroup className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {technologies.map((tech, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <RevealItem key={tech.title}>
                <article className="group relative h-full overflow-hidden bg-ink-900 p-6 transition-colors duration-500 hover:bg-ink-800">
                  <span
                    className="pointer-events-none absolute -top-16 -left-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                    style={{ background: `${accent}55` }}
                    aria-hidden
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <TechGlyph index={i} accent={accent} reduced={reduced} />
                    <span className="font-display text-[0.68rem] font-semibold text-white/20 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="relative mt-5 text-[0.95rem] leading-snug font-semibold text-white">
                    {tech.title}
                  </h3>
                  <p className="relative mt-2 text-[0.8rem] leading-relaxed text-brand-100/55">
                    {tech.text}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Section>
  );
}

/**
 * Sixteen small animated glyphs. Each is built from the same primitive set
 * (ring, core, orbit, bars) recombined, so the grid stays visually coherent.
 */
function TechGlyph({
  index,
  accent,
  reduced,
}: {
  index: number;
  accent: string;
  reduced: boolean;
}) {
  const variant = index % 4;

  return (
    <span className="grid size-11 place-items-center rounded-xl bg-white/6 ring-1 ring-white/10">
      <svg viewBox="0 0 24 24" className="size-5.5" fill="none" aria-hidden>
        {variant === 0 && (
          <>
            <motion.circle
              cx="12"
              cy="12"
              r="8"
              stroke={accent}
              strokeWidth="1.4"
              strokeDasharray="3 4"
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "12px 12px" }}
            />
            <circle cx="12" cy="12" r="3.2" fill={accent} fillOpacity="0.85" />
          </>
        )}

        {variant === 1 && (
          <>
            <rect x="4" y="4" width="16" height="16" rx="4" stroke={accent} strokeWidth="1.4" />
            <motion.rect
              x="8"
              y="8"
              width="8"
              height="8"
              rx="2"
              fill={accent}
              animate={reduced ? {} : { scale: [1, 0.7, 1], opacity: [0.9, 0.5, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "12px 12px" }}
            />
          </>
        )}

        {variant === 2 && (
          <>
            {[6, 11, 16].map((x, i) => (
              <motion.rect
                key={x}
                x={x - 1.4}
                width="2.8"
                rx="1.4"
                fill={accent}
                fillOpacity={0.55 + i * 0.2}
                // SVG needs a concrete height before the keyframes take over,
                // otherwise the first paint has height="undefined".
                initial={{ height: 6, y: 15 }}
                animate={reduced ? { height: 10, y: 7 } : { height: [6, 14, 8, 6], y: [15, 7, 13, 15] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.25,
                }}
              />
            ))}
            <line x1="4" y1="20" x2="20" y2="20" stroke={accent} strokeWidth="1.2" strokeOpacity="0.4" />
          </>
        )}

        {variant === 3 && (
          <>
            <path
              d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5Z"
              stroke={accent}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <motion.circle
              cx="12"
              cy="12"
              r="2.6"
              fill={accent}
              animate={reduced ? {} : { opacity: [1, 0.35, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </svg>
    </span>
  );
}
