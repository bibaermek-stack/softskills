"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { dashboardHeader, dashboardNav } from "@/lib/dashboard";
import { useDashboard } from "@/lib/dashboardStore";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";

/** Навигация сілтемелерінің ортақ көрінісі. */
const NAV_ITEM_CLASS =
  "flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[0.76rem] font-medium whitespace-nowrap text-white/90 transition hover:border-white/35 hover:bg-white/18 hover:text-white aria-[current=page]:border-white/45 aria-[current=page]:bg-white/20 aria-[current=page]:text-white";

/**
 * Схеманың жоғарғы жолағы: атау, қосымша тақырып және навигация.
 * Фонда баяу жүзетін бөлшектер — қозғалыс шектелген режимде мүлде салынбайды.
 */
function Particles({ count = 26 }: { count?: number }) {
  // Тұрақты тізім: әр рендерде орны секірмеуі үшін бір рет қана есептеледі.
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const rand = seed / 233280;
        const rand2 = ((i * 4517 + 7919) % 10000) / 10000;
        return {
          left: `${(rand * 100).toFixed(2)}%`,
          top: `${(rand2 * 100).toFixed(2)}%`,
          size: 2 + Math.round(rand2 * 4),
          dx: `${(rand - 0.5) * 60}px`,
          dy: `${-70 - rand2 * 90}px`,
          dur: `${11 + rand * 12}s`,
          delay: `${-(rand2 * 14).toFixed(2)}s`,
          opacity: 0.25 + rand * 0.45,
        };
      }),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot, i) => (
        <span
          key={i}
          className="animate-drift-particle absolute rounded-full bg-white"
          style={
            {
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              "--dx": dot.dx,
              "--dy": dot.dy,
              "--dur": dot.dur,
              "--delay": dot.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function DashHeader() {
  const reduced = usePrefersReducedMotion();
  const theme = useDashboard((s) => s.theme);
  const toggleTheme = useDashboard((s) => s.toggleTheme);
  const pathname = usePathname();

  /*
    Тақырып барлық панель беттерінде тұрады, бірақ ішкі беттердің (модуль,
    ресурс) өз <h1> тақырыбы бар. Бір бетте екі <h1> болмауы үшін платформа
    атауы негізгі бетте ғана <h1>, қалғанында жай мәтін болады.
  */
  const isRoot = pathname === "/dashboard";
  const TitleTag = isRoot ? motion.h1 : motion.p;

  return (
    <header
      id="dash-top"
      className="relative overflow-hidden rounded-2xl bg-linear-100 from-deep-700 via-brand-700 to-violet-700 text-white shadow-lift"
    >
      {/* Жұмсақ жарық дақтары */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(28rem 18rem at 8% -20%, rgb(34 211 238 / 0.5), transparent 60%), radial-gradient(26rem 16rem at 96% 120%, rgb(167 139 250 / 0.55), transparent 60%)",
        }}
      />
      {!reduced ? <Particles /> : null}

      <div className="relative px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <TitleTag
              className="font-display text-[1.35rem] leading-tight font-bold tracking-tight text-balance sm:text-[1.7rem] lg:text-[1.95rem]"
              initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {isRoot ? (
                dashboardHeader.title
              ) : (
                <Link href="/dashboard" className="transition-opacity hover:opacity-85">
                  {dashboardHeader.title}
                </Link>
              )}
            </TitleTag>
            <motion.p
              className="mt-2 text-[0.85rem] text-brand-100 sm:text-[0.95rem]"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              {dashboardHeader.subtitle}
            </motion.p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Classroom Presenter Mode Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-presenter-mode"));
              }}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-2 text-[0.76rem] font-bold text-emerald-200 transition hover:bg-emerald-500/35 hover:border-emerald-400 cursor-pointer shadow-lg animate-pulse"
              title="Үлкен экран режимі — Сыныпта сабақ өту және экранға шығару"
            >
              <Icon name="GraduationCap" className="size-4 text-emerald-300" />
              <span className="hidden sm:inline">📺 Экран Режимі</span>
            </button>

            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-global-search"));
              }}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-[0.76rem] font-semibold text-cyan-200 transition hover:bg-cyan-500/30 hover:border-cyan-400 cursor-pointer"
            >
              <Icon name="Search" className="size-4 text-cyan-300" />
              <span className="hidden sm:inline">Іздеу</span>
              <kbd className="hidden lg:inline rounded bg-black/40 px-1.5 py-0.5 text-[0.62rem] font-mono text-cyan-300">
                Ctrl+K
              </kbd>
            </button>

            {/* LocalStorage No-Registration Badge */}
            <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-[0.68rem] font-semibold text-amber-200" title="Барлық деректер құрылғыда сақталады">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              💾 Тіркелусіз (localStorage)
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="grid size-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 cursor-pointer"
              aria-label={theme === "dark" ? "Жарық тақырыпқа ауысу" : "Қараңғы тақырыпқа ауысу"}
            >
              <Icon name={theme === "dark" ? "Sun" : "Moon"} className="size-5" strokeWidth={1.9} />
            </button>

            <Link
              href="/"
              className="hidden rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-[0.78rem] font-semibold text-white transition hover:bg-white/20 sm:block"
            >
              Сайтқа оралу
            </Link>
          </div>
        </div>

        {/*
          Навигация. Зәкірлер тек негізгі панель бетінде жұмыс істейді,
          сондықтан ішкі беттерде олар «/dashboard#dash-x» сілтемесіне
          айналады — әйтпесе басқанда ештеңе болмас еді.
        */}
        <nav aria-label="Панель навигациясы" className="mt-5">
          <ul className="dash-scroll flex gap-1.5 overflow-x-auto pb-1">
            {dashboardNav.map((item) => {
              const content = (
                <>
                  <Icon name={item.icon} className="size-3.5" strokeWidth={1.9} />
                  {item.label}
                </>
              );

              return (
                <li key={item.id}>
                  {item.kind === "route" ? (
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={NAV_ITEM_CLASS}
                    >
                      {content}
                    </Link>
                  ) : isRoot ? (
                    <a href={item.href} className={NAV_ITEM_CLASS}>
                      {content}
                    </a>
                  ) : (
                    <Link href={`/dashboard${item.href}`} className={NAV_ITEM_CLASS}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
