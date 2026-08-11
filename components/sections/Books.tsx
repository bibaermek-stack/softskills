"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { books, type BookId } from "@/lib/content";
import { requestOpenBook } from "@/lib/bookBus";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { GalleryTile } from "@/components/ui/GalleryTile";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/cn";

/**
 * The reading counterpart to the hero canvas: full content for all four books,
 * without a second WebGL context. "View in 3D" drives the hero scene instead.
 */
export function Books() {
  const [activeId, setActiveId] = useState<BookId>(books[0].id);
  const active = books.find((b) => b.id === activeId) ?? books[0];
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="books" tone="dark" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_0%,#101b3d_0%,#060b1a_60%)]" />
        <div
          className="absolute top-1/4 -right-40 size-[38rem] rounded-full blur-[130px] transition-colors duration-1000"
          style={{ background: `${active.accent}1f` }}
        />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
      </div>

      <div className="container-x">
        <SectionHeading
          eyebrow="Төрт том"
          tone="dark"
          title={
            <>
              Төрт кітап, бір <span className="text-gradient-light">біртұтас жүйе</span>
            </>
          }
          lead="Әр том платформаның бір бағытын қамтиды. Жоғарыдағы 3D кітапханадан ашыңыз немесе толық мазмұнын осы жерден оқыңыз."
        />

        {/* ---------- selector ---------- */}
        <div
          role="tablist"
          aria-label="Кітаптар"
          className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {books.map((book, i) => {
            const isActive = book.id === activeId;
            return (
              <Reveal key={book.id} from="up" delay={i * 0.06}>
                <button
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(book.id)}
                  className={cn(
                    "group relative h-full w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-500 ease-(--ease-out-expo)",
                    isActive
                      ? "bg-white/10 ring-1 ring-white/25"
                      : "bg-white/[0.03] ring-1 ring-white/8 hover:bg-white/6",
                  )}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-px transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${book.accent}, transparent)`,
                      opacity: isActive ? 1 : 0,
                    }}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="font-display text-2xl font-semibold tabular-nums transition-colors"
                      style={{ color: isActive ? book.accent : "rgba(199,210,254,0.35)" }}
                    >
                      {book.number}
                    </span>
                    <BookSpine accent={book.accent} active={isActive} />
                  </div>
                  <h3
                    className={cn(
                      "mt-4 text-[0.98rem] leading-snug font-semibold transition-colors",
                      isActive ? "text-white" : "text-brand-100/70 group-hover:text-white",
                    )}
                  >
                    {book.title}
                  </h3>
                  <p className="mt-1.5 text-[0.75rem] leading-snug text-brand-100/45">
                    {book.subtitle}
                  </p>
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* ---------- active book detail ---------- */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-dark overflow-hidden rounded-3xl"
            >
              <div className="grid lg:grid-cols-[1.15fr_1fr]">
                {/* left: text */}
                <div className="border-b border-white/8 p-7 sm:p-10 lg:border-r lg:border-b-0">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-1 rounded-full"
                      style={{ background: active.accent }}
                      aria-hidden
                    />
                    <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-brand-100/50 uppercase">
                      {active.number}-том
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl leading-tight text-white sm:text-3xl">
                    {active.title}
                  </h3>
                  <p className="mt-4 text-[0.94rem] leading-relaxed text-brand-100/70">
                    {active.overview}
                  </p>

                  <h4 className="mt-9 text-[0.68rem] font-semibold tracking-[0.12em] text-brand-100/45 uppercase">
                    Міндеттер
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {active.objectives.map((o, i) => (
                      <li key={o} className="flex gap-3.5">
                        <span
                          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.62rem] font-semibold"
                          style={{ background: `${active.accent}26`, color: active.accent }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[0.88rem] leading-relaxed text-brand-100/75">{o}</span>
                      </li>
                    ))}
                  </ul>

                  {/* infographic strip */}
                  <dl className="mt-9 grid grid-cols-3 gap-3">
                    {active.highlights.map((h) => (
                      <div
                        key={h.label}
                        className="rounded-xl bg-white/5 px-3 py-4 text-center ring-1 ring-white/10"
                      >
                        <dt className="sr-only">{h.label}</dt>
                        <dd
                          className="font-display text-2xl font-semibold"
                          style={{ color: active.accent }}
                        >
                          {h.value}
                        </dd>
                        <dd className="mt-1 text-[0.66rem] leading-tight text-brand-100/50">
                          {h.label}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-9 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => requestOpenBook(active.id)}
                      className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-[0.82rem] font-semibold text-ink-900 transition hover:scale-[1.03] active:scale-[0.99]"
                    >
                      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M2 5.5 8 2l6 3.5L8 9 2 5.5Zm0 5L8 14l6-3.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                      3D форматта көру
                    </button>
                    <a
                      href="#research"
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[0.82rem] font-semibold text-white transition hover:bg-white/18"
                    >
                      Зерттеу контексті
                    </a>
                  </div>
                </div>

                {/* right: gallery + documents */}
                <div className="p-7 sm:p-10">
                  <h4 className="text-[0.68rem] font-semibold tracking-[0.12em] text-brand-100/45 uppercase">
                    Галерея
                  </h4>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {active.gallery.map((g) => (
                      <GalleryTile
                        key={g.title}
                        title={g.title}
                        caption={g.caption}
                        tone={g.tone}
                        className="aspect-4/3"
                      />
                    ))}
                  </div>

                  <h4 className="mt-9 text-[0.68rem] font-semibold tracking-[0.12em] text-brand-100/45 uppercase">
                    Құжаттар
                  </h4>
                  <ul className="mt-4 space-y-2.5">
                    {active.documents.map((d) => (
                      <li key={d.title}>
                        <button
                          type="button"
                          className="group flex w-full items-center gap-3.5 rounded-xl bg-white/5 px-4 py-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/10"
                        >
                          <span
                            className="grid size-9 shrink-0 place-items-center rounded-lg"
                            style={{ background: `${active.accent}1f`, color: active.accent }}
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
                            <span className="block text-[0.72rem] text-brand-100/50">{d.meta}</span>
                          </span>
                          <span className="shrink-0 text-[0.66rem] font-semibold tracking-wider text-brand-100/40 transition group-hover:text-brand-100/75">
                            Жүктеу
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}

/** Miniature book spine used as the selector's affordance. */
function BookSpine({ accent, active }: { accent: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 34 26"
      className={cn("h-6 w-8 transition-opacity duration-500", active ? "opacity-100" : "opacity-30")}
      aria-hidden
    >
      <path
        d="M17 6.5C13.5 4.2 9 3.6 4.6 4.7A1 1 0 0 0 4 5.6v14.2c0 .6.6 1.1 1.2 1 3.9-.9 8-.4 11.8 1.6m0-15.9c3.5-2.3 8-2.9 12.4-1.8.4.1.6.5.6.9v14.2c0 .6-.6 1.1-1.2 1-3.9-.9-8-.4-11.8 1.6m0-15.9v15.9"
        fill="none"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
