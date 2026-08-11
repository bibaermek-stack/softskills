import type { Metadata } from "next";
import Link from "next/link";
import { simulationCatalog } from "@/lib/simulations";
import { Icon } from "@/components/dashboard/Icon";
import { IconBadge } from "@/components/dashboard/Panel";

export const metadata: Metadata = {
  title: "Интерактивті симуляциялар",
  description:
    "Физика, астрономия, электр тізбектері, бағдарламалау және командалық жұмыс бойынша интерактивті STEM орталары.",
  alternates: { canonical: "/dashboard/simulations" },
};

export default function SimulationsPage() {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <nav aria-label="Бет орны" className="flex items-center gap-1.5 text-[0.75rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold text-ink-800 dark:text-paper-100">Симуляциялар</span>
      </nav>

      <header className="dash-card rounded-2xl p-4 sm:p-6">
        <h1 className="font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
          Интерактивті симуляциялар
        </h1>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
          Параметрлерді өзгертіп, нәтижені бірден бақылауға болатын бес STEM ортасы. Оларды
          сабақ ішінде де, жеке зертхана ретінде де қолдануға болады.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {simulationCatalog.map((sim) => (
          <Link
            key={sim.id}
            href={sim.href}
            className="dash-card group flex flex-col rounded-2xl p-4 transition-shadow duration-300 hover:shadow-lift"
            style={{ borderTop: `3px solid ${sim.accent}` }}
          >
            <div className="flex items-start gap-3">
              <IconBadge
                name={sim.icon}
                accent={sim.accent}
                size="lg"
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[0.66rem] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: sim.accent }}
                >
                  {sim.eyebrow}
                </p>
                <h2 className="font-display text-[1rem] leading-tight font-semibold text-ink-900 dark:text-white">
                  {sim.title}
                </h2>
              </div>
            </div>

            <p className="mt-2.5 flex-1 text-[0.8rem] leading-snug text-ink-700/85 dark:text-paper-300">
              {sim.lead}
            </p>

            <span
              className="mt-3 flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-[0.76rem] font-semibold text-white"
              style={{ backgroundColor: sim.accent }}
            >
              Ашу
              <Icon name="ArrowRight" className="size-3.5" strokeWidth={2.2} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
