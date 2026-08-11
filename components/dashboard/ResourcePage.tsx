import Link from "next/link";
import { multimediaResources, onlineTools, type ResourceItem } from "@/lib/dashboard";
import { Icon } from "./Icon";
import { IconBadge } from "./Panel";

/** Барлық ресурс — екі топтың біріктірілген тізімі. */
export const allResources: (ResourceItem & { group: "multimedia" | "online" })[] = [
  ...multimediaResources.map((item) => ({ ...item, group: "multimedia" as const })),
  ...onlineTools.map((item) => ({ ...item, group: "online" as const })),
];

const GROUP_LABEL = {
  multimedia: "2.6 Мультимедиялық ресурстар",
  online: "2.9 Онлайн құралдар және модульдер",
} as const;

/**
 * Ресурс карточкасының жеке беті.
 * Пән модульдері сияқты, бұл да бүйір терезе емес — өз маршруты бар бет.
 */
export function ResourcePage({ id }: { id: string }) {
  const resource = allResources.find((item) => item.id === id);
  if (!resource) return null;

  const siblings = allResources.filter(
    (item) => item.group === resource.group && item.id !== resource.id,
  );

  return (
    <div className="mt-3 flex flex-col gap-3">
      <nav aria-label="Бет орны" className="flex flex-wrap items-center gap-1.5 text-[0.75rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-medium text-ink-800 dark:text-paper-100">
          {GROUP_LABEL[resource.group]}
        </span>
      </nav>

      <header
        className="dash-card overflow-hidden rounded-2xl"
        style={{ borderTop: `3px solid ${resource.accent}` }}
      >
        <div
          className="flex items-start gap-4 p-4 sm:p-6"
          style={{
            backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${resource.accent} 10%, transparent), transparent 55%)`,
          }}
        >
          <IconBadge name={resource.icon} accent={resource.accent} size="lg" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: resource.accent }}
            >
              {GROUP_LABEL[resource.group]}
            </p>
            <h1 className="mt-0.5 font-display text-xl leading-tight font-bold text-ink-900 sm:text-2xl dark:text-white">
              {resource.title}
            </h1>
            <p className="mt-2.5 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {resource.text}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="dash-card rounded-2xl p-4 sm:p-5">
          <h2 className="mb-3.5 flex items-center gap-2 font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
            <span style={{ color: resource.accent }}>
              <Icon name="ListChecks" className="size-4" strokeWidth={2} />
            </span>
            Құрамы
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {resource.items.map((entry) => (
              <div
                key={entry}
                className="flex items-center gap-2 rounded-xl border border-ink-700/8 px-3 py-2.5 transition hover:shadow-soft dark:border-white/10"
              >
                <span className="shrink-0" style={{ color: resource.accent }}>
                  <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                </span>
                <span className="text-[0.82rem] text-ink-800 dark:text-paper-100">{entry}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card rounded-2xl p-4 sm:p-5">
          <h2 className="mb-3.5 flex items-center gap-2 font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
            <span style={{ color: resource.accent }}>
              <Icon name="Lightbulb" className="size-4" strokeWidth={2} />
            </span>
            Қалай қолданылады
          </h2>
          <ol className="space-y-2.5">
            {[
              "Мұғалім сабақ кезеңіне сәйкес ресурсты таңдайды.",
              "Ресурс білім алушының деңгейіне қарай бейімделеді.",
              "Нәтиже аналитика панеліне және портфолиоға жазылады.",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold text-white"
                  style={{ backgroundColor: resource.accent }}
                >
                  {i + 1}
                </span>
                <span className="text-[0.84rem] leading-snug text-ink-700 dark:text-paper-200">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Топтағы басқа ресурстар */}
      <section className="dash-card rounded-2xl p-4 sm:p-5">
        <h2 className="mb-3.5 font-display text-[0.85rem] font-bold tracking-[0.08em] text-ink-800 uppercase dark:text-paper-100">
          Осы топтағы басқа ресурстар
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {siblings.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/resources/${item.id}`}
              className="group flex items-center gap-2.5 rounded-xl border border-ink-700/8 p-3 transition-shadow duration-300 hover:shadow-lift dark:border-white/10"
            >
              <IconBadge
                name={item.icon}
                accent={item.accent}
                size="sm"
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span className="min-w-0 flex-1 text-[0.78rem] leading-snug font-medium text-ink-800 dark:text-paper-100">
                {item.title}
              </span>
              <span className="shrink-0 text-ink-600/40 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
                <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
