"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { books } from "@/lib/content";
import { libraryIntro } from "@/lib/dashboard";
import { useDashboard } from "@/lib/dashboardStore";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { BookOverlay } from "@/components/sections/BookOverlay";
import { Icon } from "./Icon";
import { Panel, ZoneBanner } from "./Panel";

// WebGL SSR кезінде іске қосылмауы керек, ал three/drei бөлігі үлкен —
// сондықтан сахна тек клиентте, кейінге қалдырылып жүктеледі.
const BookScene = dynamic(() => import("@/components/three/BookScene"), {
  ssr: false,
  loading: () => <StageSkeleton />,
});

function StageSkeleton() {
  return (
    <div className="grid h-full place-items-center bg-ink-950">
      <div className="flex items-center gap-2.5 text-brand-100/50">
        <span className="size-2 animate-pulse rounded-full bg-brand-300" />
        <span className="text-[0.78rem]">3D кітапхана жүктелуде…</span>
      </div>
    </div>
  );
}

/**
 * Цифрлық кітапхана — төрт GLB кітабы бар сахна.
 *
 * Кітаптар баяу айналып тұрады, меңзегенде көтеріледі, басқанда камера
 * жақындап, оқу панелі ашылады. Сахна мен оқу панелі сайттың басты бетімен
 * ортақ компоненттер (`BookScene`, `BookOverlay`) — мазмұны да, мінезі де
 * екі жерде бірдей болуы үшін.
 */
export function DigitalLibrary() {
  const selected = useDashboard((s) => s.book);
  const openBook = useDashboard((s) => s.openBook);
  const reduced = usePrefersReducedMotion();

  const activeBook = books.find((book) => book.id === selected) ?? null;

  return (
    <Panel id="dash-library" className="p-3.5">
      <ZoneBanner title={libraryIntro.title} />

      <p className="mt-3 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200">
        {libraryIntro.lead}
      </p>

      {/* 3D сахна */}
      <div className="relative mt-3 h-[24rem] overflow-hidden rounded-xl bg-ink-950 sm:h-[30rem]">
        <BookScene selected={selected} onSelect={openBook} onHoverChange={undefined} />

        {/* Нұсқау — кітап ашылмай тұрғанда ғана */}
        {!selected ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-ink-950/70 px-3.5 py-1.5 text-[0.72rem] text-white/75 backdrop-blur-md">
              Кітапты таңдаңыз
            </span>
          </div>
        ) : null}

        {/* Оқу панелі — басты беттегі компоненттің дәл өзі */}
        <BookOverlay book={activeBook} onClose={() => openBook(null)} />
      </div>

      {/* Кітап таңдағыш */}
      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {books.map((book, i) => {
          const isActive = book.id === selected;

          return (
            <motion.button
              key={book.id}
              type="button"
              onClick={() => openBook(isActive ? null : book.id)}
              aria-pressed={isActive}
              className="group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors"
              style={{
                borderColor: isActive
                  ? `color-mix(in srgb, ${book.accent} 55%, transparent)`
                  : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                backgroundColor: isActive
                  ? `color-mix(in srgb, ${book.accent} 8%, transparent)`
                  : undefined,
              }}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06 }}
              whileHover={reduced ? undefined : { y: -3 }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg font-display text-[0.8rem] font-bold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${book.accent} 14%, transparent)`,
                  color: book.accent,
                }}
              >
                {book.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.79rem] leading-tight font-semibold text-ink-900 dark:text-white">
                  {book.title}
                </span>
                <span className="mt-0.5 block text-[0.68rem] leading-snug text-ink-700/75 dark:text-paper-300">
                  {book.subtitle}
                </span>
              </span>
              <span
                className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: book.accent }}
              >
                <Icon name="Expand" className="size-3.5" strokeWidth={2.2} />
              </span>
            </motion.button>
          );
        })}
      </div>
    </Panel>
  );
}
