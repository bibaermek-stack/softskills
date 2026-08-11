"use client";

import { navLinks, site, contact } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,#101b3d_0%,#04060f_70%)]" />
        <div className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-600/12 blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)]" />
      </div>

      <div className="container-x pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <Logo className="size-14 sm:size-16" tone="dark" />
              <span className="font-display text-base leading-none font-semibold">
                Виртуалды STEM
                <span className="mt-1 block text-[0.62rem] font-medium tracking-[0.1em] text-brand-200/50 uppercase">
                  Оқыту платформасы
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-[0.85rem] leading-relaxed text-brand-100/50">
              STEM білім беру мен креативті тәрбиені кіріктіру арқылы білім алушылардың икемді
              дағдыларын дамытатын бейімделген цифрлық орта.
            </p>
          </div>

          {/* quick links */}
          <nav aria-label="Футер сілтемелері">
            <h3 className="text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">
              Навигация
            </h3>
            <ul className="mt-5 space-y-2.5">
              {navLinks.slice(0, 5).map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[0.85rem] text-brand-100/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Қосымша сілтемелер">
            <h3 className="text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">
              Бөлімдер
            </h3>
            <ul className="mt-5 space-y-2.5">
              {navLinks.slice(5).map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[0.85rem] text-brand-100/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* research / funding */}
          <div>
            <h3 className="text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">
              Қаржыландыру
            </h3>
            <p className="mt-5 text-[0.8rem] leading-relaxed text-brand-100/55">
              <span className="font-semibold text-cyan-300">{site.grantNumber}</span> гранты.
              Қаржыландырушы — {site.funderKk}.
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-4 inline-block text-[0.82rem] font-medium text-brand-200 underline-offset-4 transition hover:text-white hover:underline"
            >
              {contact.email}
            </a>
          </div>
        </div>

        {/* Гранттың ресми атауы — түпнұсқа қалпында */}
        <div className="mt-14 rounded-2xl border border-white/8 bg-white/[0.025] px-6 py-5">
          <p className="text-[0.72rem] leading-relaxed text-brand-100/45">
            {site.grantNumber} «{site.grantTitleKk}»
            <br />
            <span className="text-brand-100/35">
              Бұл зерттеу аясындағы платформаны әзірлеу {site.funderKk} тарапынан
              қаржыландырылды.
            </span>
          </p>
        </div>

        <div className="mt-10 flex flex-col-reverse items-start justify-between gap-6 border-t border-white/8 pt-8 sm:flex-row sm:items-center">
          <p className="text-[0.76rem] text-brand-100/40">
            © {new Date().getFullYear()} {site.name}. Барлық құқықтар қорғалған.
          </p>

          <div className="flex items-center gap-5">
            <ul className="flex items-center gap-4">
              {contact.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-[0.76rem] text-brand-100/45 transition-colors hover:text-white"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[0.76rem] font-medium text-white/70 transition hover:bg-white/16 hover:text-white"
            >
              Жоғарыға
              <svg
                className="size-3.5 transition-transform group-hover:-translate-y-0.5"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7 11V3m0 0L3.5 6.5M7 3l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
