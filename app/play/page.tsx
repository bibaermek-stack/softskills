"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TeamGamePlayer } from "@/components/dashboard/games/TeamGamePlayer";
import Link from "next/link";
import { Icon } from "@/components/dashboard/Icon";

function PlayContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  return <TeamGamePlayer initialRoomCode={code} />;
}

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <Icon name="ArrowLeft" className="size-4" />
          Басты бетке оралу
        </Link>
        <span className="text-xs font-bold tracking-widest uppercase text-blue-400">
          STEM Team Battle
        </span>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl bg-slate-900 p-8 text-center text-sm text-slate-400 border border-slate-800">
            Жүктелуде...
          </div>
        }
      >
        <PlayContent />
      </Suspense>
    </main>
  );
}
