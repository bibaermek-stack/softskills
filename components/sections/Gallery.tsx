"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gallery } from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { GalleryTile } from "@/components/ui/GalleryTile";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/cn";

const SPAN: Record<string, string> = {
  tall: "sm:row-span-2 aspect-4/3 sm:aspect-auto",
  wide: "sm:col-span-2 aspect-16/10",
  normal: "aspect-4/3",
};

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setIndex((i) => (i === null ? i : (i + dir + gallery.length) % gallery.length)),
    [],
  );

  // Lightbox keyboard controls.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  const active = index === null ? null : gallery[index];

  return (
    <Section id="gallery" tone="muted">
      <div className="container-x">
        <SectionHeading
          eyebrow="Галерея"
          title={
            <>
              Зертханалар, жобалар және{" "}
              <span className="text-gradient">оқушы жасаған өнімдер</span>
            </>
          }
          lead="Платформаның бес модулі бойынша қалыптасатын орталар мен нәтижелерге визуалды шолу."
        />

        <div className="mt-14 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, i) => (
            <Reveal
              key={item.title}
              from="up"
              delay={Math.min(i, 6) * 0.05}
              className={cn(SPAN[item.span] ?? SPAN.normal)}
            >
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${item.title} — ашу`}
                className="block size-full text-left"
              >
                <GalleryTile
                  title={item.title}
                  caption={item.caption}
                  tone={item.tone}
                  image={"image" in item ? (item.image as string) : undefined}
                  fit={"fit" in item ? (item.fit as "cover" | "contain") : "cover"}
                  className="size-full"
                />
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal from="up" className="mt-8">
          <p className="text-[0.78rem] text-ink-700/45">
            Галереяда жоба аясында алынған ресми патенттер, өнімдер мен виртуалды зертханалардың модельдері көрсетілген.
          </p>
        </Reveal>
      </div>

      {/* ---------- lightbox ---------- */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-100 grid place-items-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <div className="absolute inset-0 bg-ink-950/88 backdrop-blur-md" onClick={close} />

            <motion.figure
              className="relative w-full max-w-4xl"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <GalleryTile
                title={active.title}
                caption={active.caption}
                tone={active.tone}
                image={"image" in active ? (active.image as string) : undefined}
                fit={"fit" in active ? (active.fit as "cover" | "contain") : "contain"}
                className="aspect-16/10 w-full"
                interactive={false}
              />

              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.95rem] font-semibold text-white">{active.title}</div>
                  <div className="mt-0.5 text-[0.8rem] text-white/55">{active.caption}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mr-2 text-[0.75rem] text-white/40 tabular-nums">
                    {(index ?? 0) + 1} / {gallery.length}
                  </span>
                  <LightboxButton label="Алдыңғы сурет" onClick={() => step(-1)}>
                    <path d="M10 4 6 8l4 4" />
                  </LightboxButton>
                  <LightboxButton label="Келесі сурет" onClick={() => step(1)}>
                    <path d="m6 4 4 4-4 4" />
                  </LightboxButton>
                  <LightboxButton label="Жабу" onClick={close}>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </LightboxButton>
                </div>
              </div>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function LightboxButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
    >
      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
      </svg>
    </button>
  );
}
