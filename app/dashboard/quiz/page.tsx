import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECT_QUIZ_LIST } from "@/data/subjectQuizzes";
import { Icon } from "@/components/dashboard/Icon";
import { IconBadge } from "@/components/dashboard/Panel";

export const metadata: Metadata = {
  title: "5 Пәннен 200 Жағдаяттық Викториналар | Виртуалды STEM",
  description:
    "Математика, физика, тарих, әдебиет және технология пәндері бойынша икемді дағдыларды дамытуға арналған 200 жағдаяттық тесттер жинағы.",
};

export default function QuizHubPage() {
  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* Навигация */}
      <nav aria-label="Бет орны" className="flex items-center gap-1.5 text-[0.78rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold text-brand-600 dark:text-brand-300">
          Икемді дағдылар викториналары
        </span>
      </nav>

      {/* Жоғарғы банер */}
      <header className="dash-card relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-50/80 px-3.5 py-1 text-[0.74rem] font-bold text-brand-700 uppercase tracking-wider dark:bg-brand-950/40 dark:text-brand-300">
            <Icon name="Award" className="size-4" />
            200 Жағдаяттық тест · 5 Пән · 1000 сұрақ
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl lg:text-4xl dark:text-white">
            Икемді дағдыларды дамытуға арналған викториналар
          </h1>

          <p className="mt-3.5 text-[0.92rem] leading-relaxed text-ink-700 dark:text-paper-200">
            Әр пән бойынша 200 жағдаяттық сұрақ: сыни ойлау, шығармашылық, шешім қабылдау,
            коммуникация және командалық жұмыс дағдыларын нақты өмірлік жағдаяттар арқылы бағалау
            және дамыту.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-[0.8rem] font-semibold text-ink-700 dark:text-paper-300">
            <span className="flex items-center gap-1.5">
              <Icon name="Shuffle" className="size-4 text-emerald-500" strokeWidth={2.2} />
              Әр кіргенде автоматты араластыру
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="CheckCircle2" className="size-4 text-blue-500" strokeWidth={2.2} />
              Оқу режимі & емтихан режимі
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="BarChart3" className="size-4 text-purple-500" strokeWidth={2.2} />
              Soft Skills аналитикасы
            </span>
          </div>
        </div>
      </header>

      {/* 5 пәннің карточкалары */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECT_QUIZ_LIST.map((subj) => (
          <article
            key={subj.id}
            className="dash-card group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div
              className="absolute top-0 right-0 size-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30"
              style={{ backgroundColor: subj.accent }}
              aria-hidden
            />

            <div>
              <div className="flex items-center justify-between">
                <IconBadge name={subj.icon} accent={subj.accent} size="lg" />
                <span
                  className="rounded-full px-3 py-1 font-display text-[0.72rem] font-bold text-white shadow-soft"
                  style={{ backgroundColor: subj.accent }}
                >
                  {subj.totalQuestions} сұрақ
                </span>
              </div>

              <h2 className="mt-5 font-display text-xl font-bold text-ink-900 dark:text-white">
                {subj.name} викторинасы
              </h2>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-700/85 dark:text-paper-300">
                {subj.tagline}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-paper-100 px-2 py-0.5 text-[0.68rem] font-medium text-ink-700 dark:bg-white/10 dark:text-paper-300">
                  10 бөлім
                </span>
                <span className="rounded-md bg-paper-100 px-2 py-0.5 text-[0.68rem] font-medium text-ink-700 dark:bg-white/10 dark:text-paper-300">
                  Жағдаяттық тест
                </span>
                <span className="rounded-md bg-paper-100 px-2 py-0.5 text-[0.68rem] font-medium text-ink-700 dark:bg-white/10 dark:text-paper-300">
                  Soft Skills
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-ink-700/8 pt-4 dark:border-white/10">
              <Link
                href={`/dashboard/quiz/${subj.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-display text-[0.85rem] font-bold text-white shadow-soft transition-all group-hover:scale-[1.02]"
                style={{ backgroundColor: subj.accent }}
              >
                Викторинаны ашу
                <Icon name="ArrowRight" className="size-4" strokeWidth={2.2} />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
