"use client";

import { useState } from "react";
import { generateRoomCode } from "@/lib/teamGame";
import { TeamGameHost } from "@/components/dashboard/games/TeamGameHost";
import { TeamGamePlayer } from "@/components/dashboard/games/TeamGamePlayer";
import { Icon } from "@/components/dashboard/Icon";

type ViewMode = "portal" | "host" | "player";

export default function TeamGamePage() {
  const [mode, setMode] = useState<ViewMode>("portal");
  const [activeRoomCode, setActiveRoomCode] = useState<string>("");

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setActiveRoomCode(code);
    setMode("host");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Icon name="Users" className="size-3.5" />
            Реалтайм Тірі Ойын
          </span>
          <h1 className="mt-2 font-display text-2xl font-black text-slate-900 dark:text-white">
            Командалық STEM Ойыны
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Мұғалімдер мен Студенттер үшін QR-код немесе 6 таңбалы бөлме коды арқылы тіркелусіз тез кіретін ойын платформасы.
          </p>
        </div>

        {mode !== "portal" && (
          <button
            type="button"
            onClick={() => setMode("portal")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Icon name="ArrowLeft" className="size-4" />
            Порталға оралу
          </button>
        )}
      </div>

      {/* PORTAL SELECTOR */}
      {mode === "portal" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Host Game */}
          <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-6 shadow-sm dark:border-blue-900/30 dark:from-slate-900 dark:to-blue-950/30">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Icon name="Crown" className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                Жаңа Бөлме Ашу (Host)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Мұғалім немесе ұйымдастырушы ретінде бөлме ашып, 6 таңбалы бөлме коды мен QR-кодты проекторға немесе тақтаға шығарыңыз.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Icon name="PlusCircle" className="size-4" />
              Ойын Бөлмесін Ашу
            </button>
          </div>

          {/* Card 2: Join Game */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 shadow-sm dark:border-emerald-900/30 dark:from-slate-900 dark:to-emerald-950/30">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <Icon name="Gamepad2" className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                Бөлмеге Қосылу (Join)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Мұғалім берген 6 таңбалы Бөлме Кодын енгізіп, өз атыңызды жазып командалық жарысқа қосылыңыз.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode("player")}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Icon name="LogIn" className="size-4" />
              Код Арқылы Кіру
            </button>
          </div>
        </div>
      )}

      {/* HOST VIEW */}
      {mode === "host" && (
        <TeamGameHost roomCode={activeRoomCode} onClose={() => setMode("portal")} />
      )}

      {/* PLAYER VIEW */}
      {mode === "player" && (
        <TeamGamePlayer onExit={() => setMode("portal")} />
      )}
    </div>
  );
}
