"use client";

import { useState } from "react";
import { contact, site } from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <Section id="contact" tone="light" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-light opacity-50 [mask-image:radial-gradient(55%_55%_at_20%_30%,#000,transparent)]" />

      <div className="container-x">
        <SectionHeading
          eyebrow="Байланыс"
          title={
            <>
              <span className="text-gradient">Ғылыми орталықпен</span> хабарласыңыз
            </>
          }
          lead="Ғылыми ынтымақтастық, мектеппен серіктестік немесе платформа мен оның негізіндегі бағдарлама туралы БАҚ сұраулары бойынша."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* ---------- form ---------- */}
          <Reveal from="right">
            <form
              className="rounded-3xl bg-white p-7 shadow-soft ring-1 ring-ink-700/5 sm:p-9"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Аты-жөні" autoComplete="name" required />
                <Field id="email" label="Электрондық пошта" type="email" autoComplete="email" required />
                <Field
                  id="organisation"
                  label="Ұйым"
                  autoComplete="organization"
                  className="sm:col-span-2"
                />

                <div className="sm:col-span-2">
                  <label
                    htmlFor="subject"
                    className="block text-[0.78rem] font-medium text-ink-800/75"
                  >
                    Тақырып
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="mt-2 w-full rounded-xl border border-ink-700/10 bg-paper-50 px-4 py-3 text-[0.9rem] text-ink-900 transition outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                    defaultValue={contact.subjects[0]}
                  >
                    {contact.subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="block text-[0.78rem] font-medium text-ink-800/75"
                  >
                    Хабарлама
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="mt-2 w-full resize-y rounded-xl border border-ink-700/10 bg-paper-50 px-4 py-3 text-[0.9rem] text-ink-900 transition outline-none placeholder:text-ink-700/30 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Сұрауыңыз туралы жазыңыз…"
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-6 py-3.5 text-[0.88rem] font-semibold text-white transition-all duration-300 hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.99]"
                >
                  Хабарлама жіберу
                  <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M2.5 8h11m0 0-4-4m4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <p
                  className="text-[0.76rem] text-ink-700/45"
                  role="status"
                  aria-live="polite"
                >
                  {sent
                    ? "Бұл — демонстрациялық форма, хабарлама жіберілген жоқ. Бізге тікелей электрондық пошта арқылы жазыңыз."
                    : "Сайт ақпараттық сипатта; форма тек демонстрация үшін."}
                </p>
              </div>
            </form>
          </Reveal>

          {/* ---------- details + map ---------- */}
          <div className="space-y-4">
            <Reveal from="left">
              <div className="rounded-3xl bg-ink-900 p-7 text-white sm:p-8">
                <h3 className="text-[0.66rem] font-semibold tracking-[0.12em] text-cyan-400 uppercase">
                  Ғылыми орталық
                </h3>
                <p className="mt-4 text-[1.02rem] leading-snug font-semibold">
                  {contact.organisation}
                </p>
                <address className="mt-2 text-[0.86rem] leading-relaxed text-brand-100/55 not-italic">
                  {contact.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>

                <dl className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3">
                    <dt className="sr-only">Электрондық пошта</dt>
                    <ContactIcon>
                      <path d="M2.5 4.5h11v7h-11z" />
                      <path d="m2.5 5 5.5 4 5.5-4" />
                    </ContactIcon>
                    <dd>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-[0.88rem] text-brand-100/80 transition hover:text-white"
                      >
                        {contact.email}
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt className="sr-only">Телефон</dt>
                    <ContactIcon>
                      <path d="M3 3.5h3l1 3-1.5 1a7 7 0 0 0 3 3l1-1.5 3 1v3a1 1 0 0 1-1 1A10.5 10.5 0 0 1 2 4.5a1 1 0 0 1 1-1Z" />
                    </ContactIcon>
                    <dd className="text-[0.88rem] text-brand-100/80">{contact.phone}</dd>
                  </div>
                </dl>

                <ul className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-6">
                  {contact.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        className="inline-block rounded-full bg-white/8 px-4 py-2 text-[0.78rem] font-medium text-brand-100/75 transition hover:bg-white/16 hover:text-white"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* map placeholder */}
            <Reveal from="left" delay={0.08}>
              <div className="relative aspect-16/10 overflow-hidden rounded-3xl bg-paper-100 ring-1 ring-ink-700/6">
                <MapPlaceholder />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-white via-white/90 to-transparent px-5 pt-10 pb-4">
                  <div>
                    <div className="text-[0.84rem] font-semibold text-ink-900">
                      {contact.addressLines.join(", ")}
                    </div>
                    <div className="text-[0.72rem] text-ink-700/50">Карта орны</div>
                  </div>
                  <span className="rounded-full bg-ink-900 px-3.5 py-1.5 text-[0.72rem] font-semibold text-white">
                    {site.grantNumber}
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
  autoComplete,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[0.78rem] font-medium text-ink-800/75">
        {label}
        {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-ink-700/10 bg-paper-50 px-4 py-3 text-[0.9rem] text-ink-900 transition outline-none placeholder:text-ink-700/30 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}

function ContactIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/8 text-cyan-400">
      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
      </svg>
    </span>
  );
}

/** Шартты карта — нақты embed үшінші тарап трекерлерін жүктер еді. */
function MapPlaceholder() {
  return (
    <svg viewBox="0 0 400 250" className="absolute inset-0 size-full" aria-hidden>
      <rect width="400" height="250" fill="#f1f5fb" />
      <g stroke="#d3dcec" strokeWidth="1.2" fill="none">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50 + 26} y2="250" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50 - 14} />
        ))}
      </g>
      <path d="M0 156 L400 128" stroke="#c7d2fe" strokeWidth="7" fill="none" />
      <path d="M126 0 L172 250" stroke="#c7d2fe" strokeWidth="6" fill="none" />
      <circle cx="150" cy="140" r="26" fill="#e0e7ff" opacity="0.75" />
      <circle cx="296" cy="72" r="18" fill="#e0e7ff" opacity="0.6" />

      {/* pin */}
      <g transform="translate(186 92)">
        <circle cx="0" cy="0" r="17" fill="#4f46e5" opacity="0.14" />
        <path
          d="M0-13a9 9 0 0 0-9 9c0 6.5 9 15 9 15s9-8.5 9-15a9 9 0 0 0-9-9Z"
          fill="#4f46e5"
        />
        <circle cx="0" cy="-4" r="3.4" fill="#ffffff" />
      </g>
    </svg>
  );
}
