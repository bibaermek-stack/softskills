"use client";

import { useState } from "react";
import { ObjectivesRail } from "./ObjectivesRail";
import { CoreModules } from "./CoreModules";
import { SubjectGrid } from "./SubjectGrid";
import { LessonFlow } from "./LessonFlow";
import { LessonCatalogue } from "./LessonCatalogue";
import { AdaptiveRow } from "./AdaptiveRow";
import { TeamSimulator } from "./TeamSimulator";
import { DigitalLibrary } from "./DigitalLibrary";
import { ResourceRail } from "./ResourceRail";
import { OutcomesFooter } from "./OutcomesFooter";
import { Icon } from "./Icon";

/**
 * Схеманың негізгі торы:
 *
 *   ┌───────────────── жоғарғы тақырып (қабықта) ─────────────────┐
 *   │ сол жақ  │            орталық аймақ           │   оң жақ    │
 *   └───────────────── төменгі нәтиже ────────────────────────────┘
 *
 * Кең экранда үш бағана қатар тұрады; тар экранда бағаналар схемадағы оқу
 * ретімен бірінің астына бірі тізіледі (міндеттер → орталық → ресурстар).
 */
export function DashGrid() {
  const [mobileRail, setMobileRail] = useState<"objectives" | "resources" | null>(null);

  return (
    <>
      {/* Тар экранға арналған бағана ауыстырғыштары */}
      <div className="mt-3 grid grid-cols-2 gap-2 xl:hidden">
        {(
          [
            { id: "objectives", label: "Негізгі міндеттер", icon: "LayoutGrid" },
            { id: "resources", label: "Ресурстар мен құндылықтар", icon: "Boxes" },
          ] as const
        ).map((rail) => {
          const open = mobileRail === rail.id;
          return (
            <button
              key={rail.id}
              type="button"
              onClick={() => setMobileRail(open ? null : rail.id)}
              aria-expanded={open}
              className={
                open
                  ? "dash-card flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[0.75rem] font-semibold text-brand-700 ring-1 ring-brand-500/40 dark:text-brand-200"
                  : "dash-card flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[0.75rem] font-semibold text-ink-800 dark:text-paper-100"
              }
            >
              <Icon name={rail.icon} className="size-4" strokeWidth={2} />
              {rail.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        <aside
          aria-label="Платформаның негізгі міндеттері"
          className={mobileRail === "objectives" ? "block" : "hidden xl:block"}
        >
          <ObjectivesRail />
        </aside>

        <main className="flex min-w-0 flex-col gap-3">
          <CoreModules />
          <SubjectGrid />
          <LessonFlow />
          {/* Жоғарыдағы үлгінің нақты даналары — сондықтан бірден одан кейін. */}
          <LessonCatalogue variant="block" />
          <AdaptiveRow />
          <TeamSimulator />
          <DigitalLibrary />
        </main>

        <aside
          aria-label="Ресурстар мен құндылықтар"
          className={mobileRail === "resources" ? "block" : "hidden xl:block"}
        >
          <ResourceRail />
        </aside>
      </div>

      <div className="mt-3">
        <OutcomesFooter />
      </div>
    </>
  );
}
