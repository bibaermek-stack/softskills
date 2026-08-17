"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { caseById } from "@/lib/caseTasks";
import {
  listStudentCaseResponses,
  setCaseFeedback,
  type CaseResponse,
} from "@/lib/supabase/caseResponses";
import { Icon } from "./Icon";

/**
 * Мұғалім кабинетіндегі кейс жауаптары.
 *
 * Беттің қалған бөлігі — демо, ал бұл блок нақты деректі көрсетеді: қабылданған
 * оқушылардың кейске жазған жауабы, рөлдік ойындағы нәтижесі және мұғалімнің
 * пікірі. Сондықтан бос тізім де мағыналы — «әлі ешкім жазған жоқ» деген
 * шынайы жағдай, ойдан құрастырылған жол емес.
 */
export function CaseResponseReview() {
  const me = useAuthStore((s) => s.user);
  const [items, setItems] = useState<CaseResponse[] | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    if (!me) return;
    try {
      const rows = await listStudentCaseResponses(me);
      setItems(rows);
      setError("");
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Жауаптарды алу мүмкін болмады.");
    }
  }, [me]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitFeedback = async (id: string) => {
    if (!me) return;
    setSaving(id);
    try {
      await setCaseFeedback(me, id, drafts[id] ?? "");
      await load();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Пікір сақталмады.");
    } finally {
      setSaving("");
    }
  };

  if (!me || (me.role !== "teacher" && me.role !== "admin")) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Icon name="NotebookPen" className="size-5 text-cyan-300" />
          Кейс жауаптары
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-300">
            нақты дерек
          </span>
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[0.72rem] font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <Icon name="RefreshCw" className="size-3.5" />
          Жаңарту
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Оқушылардың кейстің екінші қадамында өз сөзімен жазған жауаптары. Тек сізді
        мұғалім ретінде қабылдаған оқушылар көрінеді.
      </p>

      {error ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {error}
        </p>
      ) : null}

      {items === null ? (
        <p className="text-xs text-slate-400">Жүктелуде…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-slate-400">
          Әзірге жауап жоқ. Оқушы кейстің тапсырма қадамын аяқтағанда осында шығады.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const caseTask = caseById(item.caseId);
            const draft = drafts[item.id] ?? item.teacherFeedback ?? "";
            return (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {item.student?.fullName ?? "Оқушы"}
                  </span>
                  <span className="text-[0.7rem] text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString("kk-KZ")}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[0.66rem] font-semibold text-cyan-300">
                    {caseTask?.title ?? item.caseId}
                  </span>
                  {item.play ? (
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[0.66rem] font-semibold text-emerald-300">
                      Рөлдік ойын: {item.play.correct}/{item.play.total}
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-[0.66rem] font-semibold text-slate-400">
                      Рөлдік ойын ойналмаған
                    </span>
                  )}
                </div>

                <p className="mt-2.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                  {item.answer}
                </p>

                {item.teacherFeedback ? (
                  <p className="mt-2 text-[0.7rem] text-emerald-300">
                    <Icon name="Check" className="mr-1 inline size-3" />
                    Пікір жазылған
                    {item.reviewedAt
                      ? ` · ${new Date(item.reviewedAt).toLocaleDateString("kk-KZ")}`
                      : ""}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="Оқушыға пікір жазыңыз…"
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => void submitFeedback(item.id)}
                    disabled={saving === item.id || draft === (item.teacherFeedback ?? "")}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
                  >
                    {saving === item.id ? "Сақталуда…" : "Сақтау"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
