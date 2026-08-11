import Link from "next/link";
import { subjectPanels, type SubjectId } from "@/lib/dashboard";
import { Icon, type IconName } from "./Icon";
import { Chip, IconBadge } from "./Panel";

const LEVEL_TONE: Record<string, string> = {
  Бастапқы: "#15803d",
  Орта: "#2563eb",
  Жоғары: "#7c3aed",
};

/** Беттегі бөлім тақырыбы. */
function PageSection({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: IconName;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dash-card rounded-2xl p-4 sm:p-5">
      <h2 className="mb-3.5 flex items-center gap-2 font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
        <span style={{ color: accent }}>
          <Icon name={icon} className="size-4" strokeWidth={2} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Пәндік модульдің жеке беті.
 *
 * Бұрын бұл мазмұн бүйір терезеде ашылатын — енді өз маршруты бар толық бет:
 * мазмұн кең жайылады, сілтемемен бөлісуге болады және браузердің «артқа»
 * түймесі күткендей жұмыс істейді.
 */
export function SubjectPage({ id }: { id: SubjectId }) {
  const subject = subjectPanels.find((item) => item.id === id);
  if (!subject) return null;

  const index = subjectPanels.findIndex((item) => item.id === id);
  const previous = subjectPanels[index - 1];
  const next = subjectPanels[index + 1];

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Навигация тізбегі */}
      <nav aria-label="Бет орны" className="flex items-center gap-1.5 text-[0.75rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-medium text-ink-800 dark:text-paper-100">Пәндер интеграциясы</span>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold" style={{ color: subject.accent }}>
          {subject.name}
        </span>
      </nav>

      {/* Бет тақырыбы */}
      <header
        className="dash-card overflow-hidden rounded-2xl"
        style={{ borderTop: `3px solid ${subject.accent}` }}
      >
        <div
          className="flex flex-wrap items-start gap-4 p-4 sm:p-6"
          style={{
            backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${subject.accent} 10%, transparent), transparent 55%)`,
          }}
        >
          <IconBadge name={subject.icon} accent={subject.accent} size="lg" />

          <div className="min-w-0 flex-1">
            <p
              className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: subject.accent }}
            >
              Пәндік модуль
            </p>
            <h1 className="mt-0.5 font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
              {subject.name}
            </h1>
            <p className="mt-2.5 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {subject.detail.intro}
            </p>
          </div>
        </div>

        {/* Негізгі өрістер — схемадағы бағананың мазмұны */}
        <dl className="grid gap-px border-t border-ink-700/8 bg-ink-700/6 sm:grid-cols-3 dark:border-white/10 dark:bg-white/10">
          {[
            { label: "Жоба мысалы", value: subject.project },
            { label: "Нақты өмірлік жағдаят", value: subject.realLife },
            { label: "Құралдар", value: subject.tools.join(", ") },
          ].map((field) => (
            <div key={field.label} className="bg-paper px-4 py-3 dark:bg-ink-900">
              <dt className="text-[0.68rem] font-bold tracking-wide uppercase" style={{ color: subject.accent }}>
                {field.label}
              </dt>
              <dd className="mt-1 text-[0.82rem] leading-snug text-ink-800 dark:text-paper-100">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
          <span className="text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
            Soft Skills:
          </span>
          {subject.softSkills.map((skill) => (
            <Chip key={skill} accent={subject.accent}>
              {skill}
            </Chip>
          ))}
        </div>
      </header>

      {/* Виртуалды зертхана */}
      <PageSection title="Виртуалды зертхана" icon="FlaskConical" accent={subject.accent}>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {subject.detail.features.map((feature) => (
            <article
              key={feature.title}
              className="group flex gap-2.5 rounded-xl border border-ink-700/8 p-3 transition-shadow duration-300 hover:shadow-lift dark:border-white/10"
            >
              <IconBadge
                name={feature.icon}
                accent={subject.accent}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <div className="min-w-0">
                <h3 className="font-display text-[0.82rem] font-semibold text-ink-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-0.5 text-[0.75rem] leading-snug text-ink-700/85 dark:text-paper-300">
                  {feature.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Бейнематериалдар */}
        <PageSection title="Бейнематериалдар" icon="CirclePlay" accent={subject.accent}>
          <ul className="space-y-2">
            {subject.detail.videos.map((video) => (
              <li key={video.title}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-ink-700/8 px-3 py-2.5 text-left transition hover:shadow-soft dark:border-white/10"
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full text-white"
                    style={{ backgroundColor: subject.accent }}
                  >
                    <Icon name="Play" className="size-4" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1 text-[0.82rem] text-ink-800 dark:text-paper-100">
                    {video.title}
                  </span>
                  <span className="shrink-0 text-[0.74rem] tabular-nums text-ink-600/70 dark:text-paper-300">
                    {video.duration}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Оқу материалдары */}
        <PageSection title="Оқу материалдары" icon="FileText" accent={subject.accent}>
          <ul className="space-y-2">
            {subject.detail.materials.map((material) => (
              <li
                key={material.title}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
              >
                <span className="text-[0.82rem] text-ink-800 dark:text-paper-100">
                  {material.title}
                </span>
                <span className="shrink-0 text-[0.72rem] text-ink-600/70 dark:text-paper-300">
                  {material.meta}
                </span>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Тапсырмалар */}
        <PageSection title="Тапсырмалар" icon="ClipboardList" accent={subject.accent}>
          <ul className="space-y-2">
            {subject.detail.tasks.map((task) => (
              <li
                key={task.title}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
              >
                <span className="text-[0.82rem] text-ink-800 dark:text-paper-100">{task.title}</span>
                <Chip accent={LEVEL_TONE[task.level]}>{task.level}</Chip>
              </li>
            ))}
          </ul>
        </PageSection>

        {/* Жүктеп алу */}
        <PageSection title="Жүктеп алу" icon="Download" accent={subject.accent}>
          <ul className="space-y-2">
            {subject.detail.downloads.map((file) => (
              <li key={file.title}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl border border-ink-700/8 px-3 py-2.5 text-left transition hover:shadow-soft dark:border-white/10"
                >
                  <span style={{ color: subject.accent }}>
                    <Icon name="Download" className="size-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 text-[0.82rem] text-ink-800 dark:text-paper-100">
                    {file.title}
                  </span>
                  <Chip>{file.format}</Chip>
                  <span className="shrink-0 text-[0.72rem] tabular-nums text-ink-600/70 dark:text-paper-300">
                    {file.size}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PageSection>
      </div>

      {/* Көрші модульдер */}
      <nav aria-label="Басқа модульдер" className="grid gap-2 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/dashboard/modules/${previous.id}`}
            className="dash-card group flex items-center gap-3 rounded-2xl p-3.5 transition-shadow duration-300 hover:shadow-lift"
          >
            <span className="text-ink-600/50 transition-transform duration-300 group-hover:-translate-x-0.5 dark:text-paper-300">
              <Icon name="ChevronLeft" className="size-4" strokeWidth={2.2} />
            </span>
            <IconBadge name={previous.icon} accent={previous.accent} size="sm" />
            <span className="min-w-0">
              <span className="block text-[0.68rem] text-ink-700/70 dark:text-paper-300">
                Алдыңғы модуль
              </span>
              <span className="block font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
                {previous.name}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            href={`/dashboard/modules/${next.id}`}
            className="dash-card group flex items-center justify-end gap-3 rounded-2xl p-3.5 text-right transition-shadow duration-300 hover:shadow-lift"
          >
            <span className="min-w-0">
              <span className="block text-[0.68rem] text-ink-700/70 dark:text-paper-300">
                Келесі модуль
              </span>
              <span className="block font-display text-[0.85rem] font-semibold text-ink-900 dark:text-white">
                {next.name}
              </span>
            </span>
            <IconBadge name={next.icon} accent={next.accent} size="sm" />
            <span className="text-ink-600/50 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
              <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
            </span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
