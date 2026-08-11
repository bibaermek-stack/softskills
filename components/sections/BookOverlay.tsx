"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Book } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { GalleryTile } from "@/components/ui/GalleryTile";

const PAGES = ["Шолу", "Міндеттер", "Галерея", "Құжаттар"] as const;
type Page = (typeof PAGES)[number];

/**
 * The reading panel that appears when a book is opened in the 3D scene.
 * Page changes use a rotateY turn so switching tabs reads as turning a leaf.
 */
export function BookOverlay({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const [page, setPage] = useState<Page>(PAGES[0]);
  const [direction, setDirection] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  // Reset to the first page whenever a different book is opened.
  useEffect(() => {
    if (book) setPage(PAGES[0]);
  }, [book]);

  // Move focus into the panel so keyboard users land in the right place.
  useEffect(() => {
    if (book) panelRef.current?.focus();
  }, [book]);

  const goTo = (next: Page) => {
    setDirection(PAGES.indexOf(next) > PAGES.indexOf(page) ? 1 : -1);
    setPage(next);
  };

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          key="overlay"
          className="absolute inset-0 z-30 flex items-end justify-center p-3 sm:items-center sm:justify-end sm:p-6 lg:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={`${book.title} — толық мәлімет`}
            tabIndex={-1}
            className="glass-dark relative max-h-[86svh] w-full overflow-hidden rounded-[1.75rem] shadow-[0_40px_120px_-30px_rgba(4,6,15,0.9)] outline-none sm:max-w-lg lg:max-w-xl"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, rotateY: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 30, rotateY: 12, scale: 0.96 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1400 }}
          >
            {/* Accent wash keyed to the book's spine colour */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-30"
              style={{
                background: `radial-gradient(70% 100% at 50% 0%, ${book.accent}, transparent 70%)`,
              }}
              aria-hidden
            />

            {/* ---- header ---- */}
            <div className="relative flex items-start gap-4 border-b border-white/10 px-6 pt-6 pb-5 sm:px-7">
              <span
                className="mt-0.5 font-display text-3xl font-semibold tabular-nums"
                style={{ color: book.accent }}
              >
                {book.number}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg leading-tight font-semibold text-white sm:text-xl">
                  {book.title}
                </h3>
                <p className="mt-1 text-[0.82rem] leading-snug text-brand-100/60">
                  {book.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Кітапты жабу"
                className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/16 hover:text-white"
              >
                <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="m4 4 8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* ---- page tabs ---- */}
            <div
              role="tablist"
              aria-label="Кітап бөлімдері"
              className="flex gap-1 border-b border-white/10 px-4 sm:px-5"
            >
              {PAGES.map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={page === p}
                  onClick={() => goTo(p)}
                  className={`relative px-3 py-3 text-[0.78rem] font-medium transition-colors sm:text-sm ${
                    page === p ? "text-white" : "text-brand-100/45 hover:text-brand-100/80"
                  }`}
                >
                  {p}
                  {page === p && (
                    <motion.span
                      layoutId="book-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ background: book.accent }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ---- page content ---- */}
            <div
              className="max-h-[46svh] overflow-y-auto overscroll-contain px-6 py-6 sm:px-7"
              data-lenis-prevent
              style={{ perspective: 1600 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={page}
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: direction * 32, x: direction * 24 }
                  }
                  animate={{ opacity: 1, rotateY: 0, x: 0 }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: direction * -24, x: direction * -18 }
                  }
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: direction > 0 ? "left center" : "right center" }}
                >
                  {page === "Шолу" && (
                    <div>
                      <p className="text-[0.92rem] leading-relaxed text-brand-100/80">
                        {book.overview}
                      </p>
                      <dl className="mt-6 grid grid-cols-3 gap-3">
                        {book.highlights.map((h) => (
                          <div
                            key={h.label}
                            className="rounded-xl bg-white/5 px-3 py-3 text-center ring-1 ring-white/10"
                          >
                            <dt className="sr-only">{h.label}</dt>
                            <dd
                              className="font-display text-xl font-semibold"
                              style={{ color: book.accent }}
                            >
                              {h.value}
                            </dd>
                            <dd className="mt-1 text-[0.65rem] leading-tight text-brand-100/50">
                              {h.label}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {page === "Міндеттер" && (
                    <ul className="space-y-3.5">
                      {book.objectives.map((o, i) => (
                        <li key={o} className="flex gap-3.5">
                          <span
                            className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[0.68rem] font-semibold"
                            style={{ background: `${book.accent}22`, color: book.accent }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-[0.88rem] leading-relaxed text-brand-100/80">
                            {o}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {page === "Галерея" && (
                    <div className="grid grid-cols-2 gap-3">
                      {book.gallery.map((g) => (
                        <GalleryTile
                          key={g.title}
                          title={g.title}
                          caption={g.caption}
                          tone={g.tone}
                          className="aspect-4/3"
                        />
                      ))}
                    </div>
                  )}

                  {page === "Құжаттар" && (
                    <ul className="space-y-2.5">
                      {book.documents.map((d) => (
                        <li key={d.title}>
                          <button
                            type="button"
                            className="group flex w-full items-center gap-3.5 rounded-xl bg-white/5 px-4 py-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/10"
                          >
                            <span
                              className="grid size-9 shrink-0 place-items-center rounded-lg"
                              style={{ background: `${book.accent}1f`, color: book.accent }}
                            >
                              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                                <path
                                  d="M8 2v8m0 0 3-3M8 10 5 7M3 12.5h10"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.86rem] font-medium text-white">
                                {d.title}
                              </span>
                              <span className="block text-[0.72rem] text-brand-100/50">
                                {d.meta}
                              </span>
                            </span>
                            <span className="text-[0.68rem] font-semibold tracking-wider text-brand-100/40 transition group-hover:text-brand-100/70">
                              Жүктеу
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ---- footer ---- */}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4 sm:px-7">
              <a
                href="#books"
                className="text-[0.78rem] font-medium text-brand-100/60 transition hover:text-white"
              >
Толық бөлімді оқу ↓
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 px-4 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-white/18"
              >
                Кітапты жабу
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
