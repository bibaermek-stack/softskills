"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { books, site, heroStats, type BookId } from "@/lib/content";
import { onOpenBook } from "@/lib/bookBus";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { BookOverlay } from "./BookOverlay";

// WebGL must never run during SSR, and the three/drei chunk is large enough
// that it should not block first paint of the hero copy.
const BookScene = dynamic(() => import("@/components/three/BookScene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-14">
          <span className="absolute inset-0 rounded-full border-2 border-brand-400/25" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400 [animation-duration:1.1s]" />
        </div>
        <p className="text-xs font-medium tracking-[0.18em] text-brand-200/50 uppercase">
          Кітапхана жүктелуде
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  const [selected, setSelected] = useState<BookId | null>(null);
  const [hovered, setHovered] = useState<BookId | null>(null);
  const reduced = usePrefersReducedMotion();

  // Sections further down the page can open a book in the hero canvas.
  useEffect(() => {
    return onOpenBook((id) => {
      setSelected(id);
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const handleHover = useCallback((id: BookId | null) => setHovered(id), []);

  const activeBook = books.find((b) => b.id === selected) ?? null;
  const hoveredBook = books.find((b) => b.id === hovered) ?? null;

  return (
    <section
      id="home"
      className="relative isolate min-h-[100svh] overflow-hidden bg-ink-950 text-white"
    >
      {/* ---------- animated gradient field ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-10%,#16307a_0%,#0a1128_45%,#04060f_100%)]" />
        <div className="absolute -top-1/4 left-[8%] size-[46rem] rounded-full bg-brand-600/22 blur-[130px] animate-aurora" />
        <div
          className="absolute top-[18%] right-[4%] size-[38rem] rounded-full bg-violet-600/20 blur-[120px] animate-aurora"
          style={{ animationDelay: "-9s" }}
        />
        <div
          className="absolute bottom-[-14%] left-[28%] size-[34rem] rounded-full bg-cyan-500/16 blur-[110px] animate-aurora"
          style={{ animationDelay: "-17s" }}
        />
        <div className="absolute inset-0 bg-grid opacity-[0.55] [mask-image:radial-gradient(75%_60%_at_50%_35%,#000_20%,transparent_100%)]" />
      </div>

      {/* ---------- 3D canvas ---------- */}
      <div className="absolute inset-0 -z-10">
        <BookScene selected={selected} onSelect={setSelected} onHoverChange={handleHover} />
      </div>

      {/*
        A WebGL canvas exposes no focusable targets, so the books are also
        reachable as real buttons. Visually hidden until focused, then shown.
      */}
      <div className="pointer-events-auto absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <ul className="flex gap-2">
          {books.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => setSelected(selected === book.id ? null : book.id)}
                onFocus={() => setHovered(book.id)}
                onBlur={() => setHovered(null)}
                aria-pressed={selected === book.id}
                className="sr-only focus:not-sr-only focus:relative focus:rounded-full focus:bg-white focus:px-4 focus:py-2.5 focus:text-[0.8rem] focus:font-semibold focus:text-ink-900"
              >
                «{book.title}» кітабын ашу
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Legibility scrim behind the headline; never blocks canvas pointer events. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-[9] h-[58%] bg-gradient-to-b from-ink-950/85 via-ink-950/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[9] h-40 bg-gradient-to-t from-ink-950 to-transparent"
        aria-hidden
      />

      {/* ---------- hero copy ---------- */}
      <div className="pointer-events-none relative flex min-h-[100svh] flex-col">
        <div className="container-x pt-28 sm:pt-32 lg:pt-36">
          <AnimatePresence mode="wait">
            {!selected && (
              <motion.div
                key="hero-copy"
                className="max-w-3xl"
                initial={reduced ? false : { opacity: 0, y: 26, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduced ? undefined : { opacity: 0, y: -18, filter: "blur(10px)" }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="glass-dark pointer-events-auto inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[0.7rem] font-semibold tracking-[0.16em] text-brand-100 uppercase">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-cyan-400" />
                  </span>
                  {site.grantNumber} ғылыми жобасы
                </span>

                {/* The trailing space keeps the two block lines from
                    concatenating into "STEMоқыту" when the heading is copied
                    or read out as a single string. */}
                <h1 className="mt-7 text-display-lg leading-[0.94] font-semibold">
                  <span className="block text-white">Виртуалды STEM </span>
                  <span className="block text-gradient-light">оқыту платформасы</span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-relaxed text-brand-100/70 sm:text-lg">
                  {site.tagline}
                </p>

                <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-3.5">
                  {/*
                    Басты әрекет — платформаны шынымен сынап көру. Бұрын мұнда
                    беттің өзіне қарай айналдыратын зәкір тұрған, ал интерактивті
                    сабақтар келушіге көрінбейтін.
                  */}
                  <Link
                    href="/dashboard/lessons"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 shadow-[0_18px_50px_-18px_rgb(99_102_241_/_0.9)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.99]"
                  >
                    <span className="relative z-10">Интерактивті сабақты бастау</span>
                    <svg
                      className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M3 8h10M8.5 3.5 13 8l-4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="absolute inset-0 -z-0 translate-y-full bg-gradient-to-r from-brand-100 to-cyan-100 transition-transform duration-400 group-hover:translate-y-0" />
                  </Link>

                  <a
                    href="#platform"
                    className="glass-dark inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/12"
                  >
                    Платформаны зерттеу
                    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M8 3v10M3.5 8.5 8 13l4.5-4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelected(books[0].id)}
                    className="glass-dark inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/12"
                  >
                    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M2.5 3.2v9.1c0 .3.3.6.6.5 1.6-.3 3.4-.3 4.9.5V4.2c-1.5-.8-3.3-.9-4.9-.6a.6.6 0 0 0-.6.6ZM13.5 3.2v9.1c0 .3-.3.6-.6.5-1.6-.3-3.4-.3-4.9.5V4.2c1.5-.8 3.3-.9 4.9-.6.3 0 .6.3.6.6Z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Кітаптарды ашу
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* ---------- hover hint / stats strip ---------- */}
        <div className="container-x pb-10">
          <AnimatePresence mode="wait">
            {selected ? null : hoveredBook ? (
              <motion.p
                key={`hint-${hoveredBook.id}`}
                className="mb-6 text-sm font-medium text-cyan-300/90"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                {hoveredBook.number} · {hoveredBook.subtitle} — ашу үшін басыңыз
              </motion.p>
            ) : (
              <motion.p
                key="hint-default"
                className="mb-6 flex items-center gap-3 text-sm text-brand-100/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <span className="relative hidden h-7 w-4 shrink-0 rounded-full border border-white/25 sm:block">
                  <span className="absolute left-1/2 top-1.5 h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-cyan-400 animate-scroll-hint" />
                </span>
                Кітапқа меңзерді апарыңыз — ашу үшін басыңыз
              </motion.p>
            )}
          </AnimatePresence>

          <div className="glass-dark pointer-events-auto grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] px-5 py-4 sm:px-6 sm:py-5">
                <div className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className="mt-1 text-[0.72rem] tracking-wide text-brand-100/55 sm:text-xs">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- open-book content overlay ---------- */}
      <BookOverlay book={activeBook} onClose={() => setSelected(null)} />
    </section>
  );
}
