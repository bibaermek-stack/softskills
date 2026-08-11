"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { outcomes } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";

/** Көрінген сәтте нөлден нақты мәнге дейін саналатын көрсеткіш. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced || !inView) return;

    let frame = 0;
    const duration = 1300;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo — соңына қарай баяулайды
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

/**
 * Схеманың төменгі жолағы — «Нәтиже».
 * Түпнұсқадағы төрт нәтиже сол ретімен, бірақ анимацияланатын көрсеткішпен.
 */
export function OutcomesFooter() {
  const reduced = usePrefersReducedMotion();

  return (
    <footer className="dash-banner overflow-hidden rounded-2xl shadow-lift">
      <div className="grid items-stretch gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-[auto_repeat(4,1fr)]">
        <div className="flex items-center justify-center bg-linear-100 from-deep-700 to-brand-700 px-5 py-4">
          <h2 className="font-display text-[0.82rem] font-bold tracking-[0.14em] text-white uppercase">
            Нәтиже:
          </h2>
        </div>

        {outcomes.map((outcome, i) => (
          <motion.div
            key={outcome.title}
            className="group flex items-center gap-3 bg-linear-100 from-brand-700 to-violet-700 px-4 py-4"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white transition-transform duration-400 group-hover:scale-110">
              <Icon name={outcome.icon} className="size-5" strokeWidth={1.8} />
            </span>

            <div className="min-w-0">
              <p className="font-display text-lg leading-none font-bold text-white">
                <CountUp value={outcome.value} suffix={outcome.suffix} />
              </p>
              <p className="mt-1 text-[0.76rem] leading-tight font-semibold text-white">
                {outcome.title}
              </p>
              <p className="mt-0.5 text-[0.66rem] leading-snug text-brand-100">{outcome.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </footer>
  );
}
