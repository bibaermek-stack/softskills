"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks, site } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("#home");
  const [open, setOpen] = useState(false);

  // Transparent over the dark hero, solid glass once past it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight whichever section currently owns the upper third of the viewport.
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.querySelector(l.href))
      .filter((el): el is Element => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-(--ease-out-expo)",
          scrolled
            ? "border-b border-ink-700/8 bg-white/78 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_24px_-8px_rgba(16,27,61,0.2)]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Негізгі мәзір"
          className="container-x flex h-16 items-center justify-between gap-6 sm:h-18"
        >
          <a
            href="#home"
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${site.name} — басты бет`}
          >
            <Logo className="size-12 sm:size-14" tone={scrolled ? "light" : "dark"} />
            <span
              className={cn(
                "hidden font-display text-[0.95rem] leading-none font-semibold tracking-tight transition-colors duration-400 sm:block",
                scrolled ? "text-ink-900" : "text-white",
              )}
            >
              Виртуалды STEM
              <span
                className={cn(
                  "mt-0.5 block text-[0.62rem] font-medium tracking-[0.1em] uppercase transition-colors duration-400",
                  scrolled ? "text-brand-600/70" : "text-brand-200/60",
                )}
              >
                Оқыту платформасы
              </span>
            </span>
          </a>

          {/* desktop links */}
          <ul className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => {
              const isActive = active === link.href;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors duration-300",
                      scrolled
                        ? isActive
                          ? "text-brand-700"
                          : "text-ink-700/65 hover:text-ink-900"
                        : isActive
                          ? "text-white"
                          : "text-brand-100/60 hover:text-white",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className={cn(
                          "absolute inset-0 -z-10 rounded-full",
                          scrolled ? "bg-brand-50" : "bg-white/10",
                        )}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {/* Интерактивті панель — сайттан бөлек маршрут. */}
            <Link
              href="/dashboard"
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-4 py-2.5 text-[0.82rem] font-semibold transition-all duration-300 sm:inline-flex",
                scrolled
                  ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20",
              )}
            >
              <svg className="size-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M1.75 1.75h4v4h-4v-4Zm6.5 0h4v2.5h-4v-2.5Zm0 4.5h4v5.5h-4v-5.5Zm-6.5 2h4v3.5h-4v-3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              Панель
            </Link>

            <a
              href="#contact"
              className={cn(
                "hidden rounded-full px-5 py-2.5 text-[0.82rem] font-semibold transition-all duration-300 sm:inline-flex",
                scrolled
                  ? "bg-ink-900 text-white hover:bg-brand-700"
                  : "bg-white text-ink-900 hover:bg-brand-100",
              )}
            >
              Хабарласу
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Мәзірді жабу" : "Мәзірді ашу"}
              aria-expanded={open}
              className={cn(
                "grid size-10 place-items-center rounded-full transition-colors lg:hidden",
                scrolled ? "bg-ink-900/6 text-ink-900" : "bg-white/10 text-white",
              )}
            >
              <span className="relative block h-3 w-4.5">
                <span
                  className={cn(
                    "absolute inset-x-0 h-0.5 rounded-full bg-current transition-all duration-300",
                    open ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-current transition-all duration-300",
                    open ? "bottom-1.5 -rotate-45" : "",
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Мобильді мәзір"
              className="absolute inset-x-3 top-20 rounded-3xl border border-ink-700/8 bg-white p-3 shadow-lift"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            >
              <ul className="grid gap-0.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-colors",
                        active === link.href
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-800 hover:bg-paper-100",
                      )}
                    >
                      {link.label}
                      <svg className="size-3.5 opacity-30" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path
                          d="m5 3 4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center rounded-2xl bg-brand-50 px-4 py-3.5 text-sm font-semibold text-brand-700"
              >
                Интерактивті панель
              </Link>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-1.5 flex items-center justify-center rounded-2xl bg-ink-900 px-4 py-3.5 text-sm font-semibold text-white"
              >
                Хабарласу
              </a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
