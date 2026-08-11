import type { Metadata } from "next";
import Link from "next/link";
import { DigitalLibrary } from "@/components/dashboard/DigitalLibrary";
import { Icon } from "@/components/dashboard/Icon";
import { ResourceRail } from "@/components/dashboard/ResourceRail";
import { libraryIntro } from "@/lib/dashboard";

export const metadata: Metadata = {
  title: libraryIntro.title,
  description: libraryIntro.lead,
  alternates: { canonical: "/dashboard/resources" },
};

/**
 * A linkable library landing page that reuses the dashboard's existing 3D
 * book scene and static resource cards.
 */
export default function ResourcesPage() {
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
        <span className="px-1 font-semibold text-ink-800 dark:text-paper-100">{libraryIntro.title}</span>
      </nav>

      <header className="dash-card rounded-2xl p-4 sm:p-6">
        <h1 className="font-display text-2xl leading-tight font-bold text-ink-900 sm:text-3xl dark:text-white">
          {libraryIntro.title}
        </h1>
        <p className="mt-2 max-w-3xl text-[0.88rem] leading-relaxed text-ink-700 dark:text-paper-200">
          {libraryIntro.lead}
        </p>
      </header>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <DigitalLibrary />
        <aside aria-label="Оқу ресурстары">
          <ResourceRail />
        </aside>
      </div>
    </div>
  );
}
