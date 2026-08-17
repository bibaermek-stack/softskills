"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { caseById } from "@/lib/caseTasks";
import { readStoredTheme } from "@/lib/dashboardStore";
import { CaseRoleplayRoom } from "@/components/dashboard/games/CaseRoleplayRoom";
import { Icon } from "@/components/dashboard/Icon";

/**
 * QR-код арқылы кейстің рөлдік ойынына кіретін бет.
 *
 * `/play` командалық викторинаны ашады — ондағы «командалар» рөлдік ойынның
 * рөлдері емес. Сондықтан кейстің QR-коды осы бетке апарады: мұнда бөлме коды
 * мен кейс идентификаторы сілтемеден келеді де, оқушы бірден өз рөлін таңдайды.
 */
function JoinContent() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const caseId = params.get("case") ?? "";
  const caseTask = caseById(caseId);

  if (!caseTask) {
    return (
      <div className="dash-card rounded-2xl p-6 text-center">
        <p className="text-[0.86rem] font-semibold text-ink-900 dark:text-white">
          Кейс табылмады.
        </p>
        <p className="mt-1 text-[0.78rem] text-ink-700/80 dark:text-paper-300">
          Сілтеме ескірген болуы мүмкін — мұғалімнен жаңа QR-кодты сұраңыз.
        </p>
      </div>
    );
  }

  return (
    <div className="dash-card rounded-2xl p-4 sm:p-5">
      <p
        className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase"
        style={{ color: caseTask.accent }}
      >
        Рөлдік ойын
      </p>
      <h1 className="mt-0.5 font-display text-xl leading-tight font-bold text-ink-900 dark:text-white">
        {caseTask.title}
      </h1>
      <p className="mt-1.5 mb-4 text-[0.8rem] leading-snug text-ink-700 dark:text-paper-200">
        Атыңызды жазып қосылыңыз, содан кейін өз рөліңізді таңдаңыз.
      </p>

      <CaseRoleplayRoom
        caseId={caseTask.id}
        roles={caseTask.roleplay.roles}
        rounds={caseTask.roleplay.rounds}
        accent={caseTask.accent}
        initialCode={code}
      />
    </div>
  );
}

export default function CasePlayPage() {
  // Панельдегідей тақырып: `dark:` нұсқалары `data-theme` арқылы жүреді,
  // сондықтан оны осы бет те өзі қоюы керек.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => setTheme(readStoredTheme()), []);

  return (
    <main data-theme={theme} className="dash-backdrop min-h-screen">
      <div className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-4">
        <Link
          href="/dashboard/cases"
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.75rem] font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ArrowLeft" className="size-4" strokeWidth={2.2} />
          Кейс тапсырмалар
        </Link>

        <Suspense
          fallback={
            <div className="dash-card rounded-2xl p-6 text-center text-[0.8rem] text-ink-700/80 dark:text-paper-300">
              Жүктелуде…
            </div>
          }
        >
          <JoinContent />
        </Suspense>
      </div>
    </main>
  );
}
