"use client";

import { multimedia, integratedTools } from "@/lib/content";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

/** Distinct line icon per resource type, keyed by index. */
const ICONS = [
  "M3 4.5h10v7H3zM13 6.5l3-1.6v5.2L13 8.5", // video
  "M2.5 12.5 6 6l3 4.5L11 8l2.5 4.5z", // recording
  "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5.5v5M5.5 8h5", // animation
  "M2.5 3.5h11v8h-11zM6 13.5h4M8 11.5v2", // presentation
  "M5 2.5v4L2.8 11a2 2 0 0 0 1.8 2.9h6.8A2 2 0 0 0 13.2 11L11 6.5v-4M4.5 2.5h7", // lab
  "M2.5 8a5.5 5.5 0 0 1 11 0M4.5 8v3.5M11.5 8v3.5M2.5 8v2a2 2 0 0 0 2 2M13.5 8v2a2 2 0 0 1-2 2", // AR/VR
  "M3 3.2v9.1c0 .3.3.5.6.5 1.4-.3 3-.2 4.4.5V4.2c-1.4-.7-3-.8-4.4-.5a.5.5 0 0 0-.6.5zM13 3.2v9.1c0 .3-.3.5-.6.5-1.4-.3-3-.2-4.4.5V4.2c1.4-.7 3-.8 4.4-.5.3 0 .6.2.6.5z", // ebook
  "M4 6v4M7 3.5v9M10 5v6M13 7v2M1 7v2", // audio
  "M2.5 13V7M6 13V3.5M9.5 13V9M13 13V5.5", // infographic
  "M3 3.5h10v9H3zM5.5 6.5h5M5.5 9.5h3", // test
  "M8 2.5 9.7 6l3.8.5-2.8 2.7.7 3.8L8 11.2l-3.4 1.8.7-3.8L2.5 6.5 6.3 6z", // quiz
  "M8 2.5 13.5 8 8 13.5 2.5 8zM8 6v4M6 8h4", // quest
  "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9.5 9.5h1.5v1.5H9.5zM12 12h1v1h-1z", // QR
];

export function Multimedia() {
  return (
    <Section id="multimedia" tone="light">
      <div className="container-x">
        <SectionHeading
          eyebrow="Мультимедиялық ресурстар"
          title={
            <>
              Әр жобаның өз <span className="text-gradient">медиакітапханасы</span> бар
            </>
          }
          lead="Он үш ресурс форматы оқу материалын көрнекі, қолжетімді және интерактивті етеді — әрқайсысы өзі қызмет ететін пән мен жобаға байланған."
        />

        <RevealGroup className="mt-14 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {multimedia.map((item, i) => (
            <RevealItem key={item.title}>
              <article className="group relative h-full overflow-hidden rounded-2xl bg-paper-50 p-6 ring-1 ring-ink-700/5 transition-all duration-500 ease-(--ease-out-expo) hover:-translate-y-1.5 hover:bg-white hover:shadow-lift">
                <span
                  className="pointer-events-none absolute -top-20 -right-20 size-44 rounded-full bg-brand-500/20 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                  aria-hidden
                />
                <span className="relative grid size-11 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-ink-700/6 transition-all duration-500 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                  <svg className="size-5" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d={ICONS[i % ICONS.length]}
                      stroke="currentColor"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="relative mt-5 text-[0.98rem] font-semibold text-ink-900">
                  {item.title}
                </h3>
                <p className="relative mt-2 text-[0.83rem] leading-relaxed text-ink-700/65">
                  {item.text}
                </p>
              </article>
            </RevealItem>
          ))}

          {/* QR call-out fills the final grid cell */}
          <RevealItem>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-ink-900 p-6 text-white">
              <div
                className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(70%_70%_at_70%_30%,#000,transparent)]"
                aria-hidden
              />
              <div className="relative">
                <h3 className="text-[0.98rem] font-semibold">Тереңдеу үшін сканерлеңіз</h3>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-brand-100/60">
                  QR кодтар арқылы білім алушылар қосымша бейнематериалдарға, ғылыми мақалаларға,
                  виртуалды экскурсияларға, интерактивті тапсырмаларға, нұсқаулықтарға және бағалау
                  парақтарына өте алады.
                </p>
              </div>
              <div className="relative mt-6 grid grid-cols-4 gap-1" aria-hidden>
                {Array.from({ length: 16 }, (_, i) => (
                  <span
                    key={i}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background:
                        [0, 1, 2, 4, 6, 8, 9, 12, 15].includes(i)
                          ? "rgba(103,232,249,0.85)"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </RevealItem>
        </RevealGroup>

        {/* ---------- integrated services marquee ---------- */}
        <Reveal from="up" className="mt-16">
          <div className="rounded-3xl bg-paper-50 py-8 ring-1 ring-ink-700/5">
            <div className="container-x">
              <Eyebrow>Біріктірілген сервистер</Eyebrow>
            </div>
            <div
              className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
              aria-label="Біріктірілген онлайн құралдар"
            >
              <ul className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused]">
                {[...integratedTools, ...integratedTools].map((tool, i) => (
                  <li
                    key={`${tool}-${i}`}
                    className="shrink-0 rounded-full bg-white px-5 py-2.5 text-[0.84rem] font-medium whitespace-nowrap text-ink-800/75 ring-1 ring-ink-700/6"
                    aria-hidden={i >= integratedTools.length}
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
