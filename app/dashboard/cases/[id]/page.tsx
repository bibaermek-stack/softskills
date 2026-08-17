import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseById, caseTasks } from "@/lib/caseTasks";
import { CaseTaskPlayer } from "@/components/dashboard/CaseTaskPlayer";
import { Icon } from "@/components/dashboard/Icon";
import { Chip, IconBadge } from "@/components/dashboard/Panel";

/** Кейстер құрастыру кезінде статикалық түрде дайындалады. */
export function generateStaticParams() {
  return caseTasks.map((item) => ({ id: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = caseById(id);
  if (!item) return { title: "Кейс табылмады" };

  return {
    title: `${item.title} — кейс тапсырма`,
    description: item.summary,
    alternates: { canonical: `/dashboard/cases/${item.id}` },
  };
}

export default async function CaseRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = caseById(id);
  if (!item) notFound();

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
        <Link
          href="/dashboard/cases"
          className="rounded-lg px-1.5 py-1.5 font-medium text-ink-700/75 transition hover:text-ink-900 dark:text-paper-300 dark:hover:text-white"
        >
          Кейс тапсырмалар
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold" style={{ color: item.accent }}>
          {item.title}
        </span>
      </nav>

      <header
        className="dash-card overflow-hidden rounded-2xl"
        style={{ borderTop: `3px solid ${item.accent}` }}
      >
        <div
          className="flex flex-wrap items-start gap-4 p-4 sm:p-6"
          style={{
            backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${item.accent} 10%, transparent), transparent 55%)`,
          }}
        >
          <IconBadge name={item.icon} accent={item.accent} size="lg" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: item.accent }}
            >
              Кейс тапсырма · икемді дағдылар
            </p>
            <h1 className="mt-0.5 font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
              {item.title}
            </h1>
            <p className="mt-2 max-w-3xl text-[0.86rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {item.summary}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip accent={item.accent}>{item.grade}</Chip>
              <Chip accent={item.accent}>{item.duration}</Chip>
              {item.skills.map((skill) => (
                <Chip key={skill} accent={item.accent}>
                  {skill}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="dash-card rounded-2xl p-4 sm:p-5">
        <CaseTaskPlayer caseTask={item} />
      </section>
    </div>
  );
}
