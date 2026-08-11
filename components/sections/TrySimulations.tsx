import Link from "next/link";
import { simulations } from "@/lib/simulations";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ModuleIcon } from "@/components/ui/ModuleIcon";

/**
 * Симуляцияларға шақыратын жолақ.
 *
 * Сайттың қалған бөлігі платформаны сипаттайды, ал мұнда келуші оны бірден
 * сынап көре алады: екі симуляция да тіркелусіз, бірден ашылады.
 */
export function TrySimulations() {
  return (
    <Section id="simulations" tone="light">
      <div className="container-x">
        <SectionHeading
          eyebrow="Бірден сынап көріңіз"
          title={
            <>
              Сипаттама емес — <span className="text-gradient">жұмыс істейтін модель</span>
            </>
          }
          lead="Екі интерактивті орта браузерде тікелей жұмыс істейді. Параметрді өзгертіңіз де, нәтижені сол сәтте көріңіз — тіркелудің де, орнатудың да қажеті жоқ."
        />

        <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-2">
          {simulations.map((sim) => (
            <RevealItem key={sim.id}>
              <Link
                href={`/dashboard/simulations/${sim.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white p-7 shadow-soft ring-1 ring-ink-700/6 transition-shadow duration-400 hover:shadow-lift sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="text-[0.66rem] font-semibold tracking-[0.12em] uppercase"
                    style={{ color: sim.accent }}
                  >
                    {sim.eyebrow}
                  </span>
                  <span className="size-12 shrink-0 transition-transform duration-400 group-hover:scale-110">
                    <ModuleIcon
                      id={sim.id === "pendulum" ? "physics" : "technology"}
                      accent={sim.accent}
                    />
                  </span>
                </div>

                <h3 className="mt-4 text-xl leading-tight font-semibold text-ink-900">
                  {sim.title}
                </h3>
                <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-ink-700/75">
                  {sim.lead}
                </p>

                <ul className="mt-5 space-y-2">
                  {sim.notes.map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-2.5 text-[0.82rem] leading-snug text-ink-700/70"
                    >
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: sim.accent }}
                        aria-hidden
                      />
                      {note}
                    </li>
                  ))}
                </ul>

                <span
                  className="mt-6 inline-flex items-center gap-2 self-start rounded-full px-5 py-3 text-[0.85rem] font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5"
                  style={{ backgroundColor: sim.accent }}
                >
                  Симуляцияны ашу
                  <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 8h10M8.5 3.5 13 8l-4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal from="up" className="mt-6">
          <Link
            href="/dashboard/lessons"
            className="group inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-700"
          >
            Бес интерактивті сабақтың бәрін көру
            <svg
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
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
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
