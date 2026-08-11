"use client";

import { useMemo, useState } from "react";
import type { GameSpec } from "@/lib/lessons";
import { hashString, seededShuffle } from "@/lib/shuffle";
import { Icon } from "../Icon";
import { GameFrame, type GameResult } from "./GameFrame";

type Spec = Extract<GameSpec, { kind: "categorize" }>;

/**
 * «Топтастыру» — элементтерді дұрыс шоғырға бөлу.
 *
 * Әрекет: элементті басып таңдайсыз → шоғырдың тақырыбын басасыз. Шоғырдағы
 * элементті басу оны қорға қайтарады. Сүйреу қолданылмайды — себебі сол
 * `MatchGame` мен `OrderGame`-дегідей: пернетақта мен сенсорлы экранға бірдей.
 */
export function CategorizeGame({
  spec,
  accent,
  onComplete,
}: {
  spec: Spec;
  accent: string;
  onComplete: (result: GameResult) => void;
}) {
  const [attempt, setAttempt] = useState(1);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  /** Элемент id → шоғыр id (әлі бөлінбегені жоқ). */
  const [placed, setPlaced] = useState<Record<string, string>>({});

  const pool = useMemo(
    () => seededShuffle(spec.items, hashString(spec.id) ^ attempt),
    [spec.items, spec.id, attempt],
  );

  const unplaced = pool.filter((item) => !placed[item.id]);
  const total = spec.items.length;
  const correctCount = spec.items.reduce(
    (sum, item) => sum + (placed[item.id] === item.bucket ? 1 : 0),
    0,
  );

  const place = (bucketId: string) => {
    if (!selected || checked) return;
    setPlaced((current) => ({ ...current, [selected]: bucketId }));
    setSelected(null);
  };

  const takeBack = (itemId: string) => {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  };

  const check = () => {
    setChecked(true);
    onComplete({
      score: Math.round((100 * correctCount) / total),
      correct: correctCount,
      total,
      attempts: attempt,
      durationMs: Date.now() - startedAt,
    });
  };

  const restart = () => {
    setAttempt((value) => value + 1);
    setStartedAt(Date.now());
    setChecked(false);
    setSelected(null);
    setPlaced({});
  };

  const result: GameResult | null = checked
    ? {
        score: Math.round((100 * correctCount) / total),
        correct: correctCount,
        total,
        attempts: attempt,
        durationMs: 0,
      }
    : null;

  const status = checked
    ? `${correctCount} / ${total} элемент дұрыс топта.`
    : unplaced.length > 0
      ? selected
        ? "Енді элемент қай топқа жататынын таңдаңыз."
        : `Бөлінбеген элемент: ${unplaced.length}. Біреуін таңдаңыз.`
      : "Барлық элемент бөлінді — «Тексеру» басыңыз.";

  return (
    <GameFrame
      title={spec.title}
      prompt={spec.prompt}
      accent={accent}
      status={status}
      checked={checked}
      result={result}
      canCheck={!checked && unplaced.length === 0}
      onCheck={check}
      onRestart={restart}
    >
      {/* Бөлінбеген элементтер */}
      {unplaced.length > 0 ? (
        <div className="mb-3 rounded-lg border border-dashed border-ink-700/15 p-2.5 dark:border-white/15">
          <p className="mb-1.5 text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
            Бөлінбеген
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {unplaced.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected === item.id}
                  onClick={() => setSelected(selected === item.id ? null : item.id)}
                  className="rounded-full border px-3 py-1.5 text-[0.76rem] font-medium transition-colors"
                  style={{
                    borderColor:
                      selected === item.id
                        ? `color-mix(in srgb, ${accent} 60%, transparent)`
                        : "color-mix(in srgb, var(--color-ink-700) 12%, transparent)",
                    backgroundColor:
                      selected === item.id
                        ? `color-mix(in srgb, ${accent} 10%, transparent)`
                        : undefined,
                    color: selected === item.id ? accent : undefined,
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Шоғырлар */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {spec.buckets.map((bucket) => {
          const inBucket = spec.items.filter((item) => placed[item.id] === bucket.id);

          return (
            <div
              key={bucket.id}
              className="rounded-lg border border-ink-700/8 p-2.5 dark:border-white/10"
            >
              <button
                type="button"
                onClick={() => place(bucket.id)}
                disabled={!selected || checked}
                className="w-full rounded-md px-2 py-1.5 text-left transition-colors enabled:hover:bg-ink-700/5 disabled:cursor-default dark:enabled:hover:bg-white/8"
              >
                <span
                  className="block text-[0.8rem] font-semibold"
                  style={{ color: bucket.label ? accent : undefined }}
                >
                  {bucket.label}
                </span>
                {bucket.hint ? (
                  <span className="block text-[0.68rem] leading-snug text-ink-700/70 dark:text-paper-300">
                    {bucket.hint}
                  </span>
                ) : null}
              </button>

              <ul className="mt-1.5 space-y-1">
                {inBucket.map((item) => {
                  const right = item.bucket === bucket.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => takeBack(item.id)}
                        disabled={checked}
                        className="flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[0.74rem] transition-colors"
                        style={{
                          borderColor: !checked
                            ? "color-mix(in srgb, var(--color-ink-700) 10%, transparent)"
                            : `color-mix(in srgb, ${right ? "#15803d" : "#ea580c"} 45%, transparent)`,
                          backgroundColor: checked
                            ? `color-mix(in srgb, ${right ? "#15803d" : "#ea580c"} 7%, transparent)`
                            : undefined,
                        }}
                      >
                        {checked ? (
                          <span
                            className="shrink-0"
                            style={{ color: right ? "#15803d" : "#ea580c" }}
                          >
                            <Icon
                              name={right ? "Check" : "X"}
                              className="size-3"
                              strokeWidth={2.6}
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1 text-ink-800 dark:text-paper-100">
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Қате орналасқандардың дұрыс тобы */}
      {checked && correctCount < total ? (
        <ul className="mt-2.5 space-y-1">
          {spec.items
            .filter((item) => placed[item.id] !== item.bucket)
            .map((item) => (
              <li key={item.id} className="text-[0.73rem] text-ink-700/85 dark:text-paper-300">
                «{item.label}» →{" "}
                <span style={{ color: accent }}>
                  {spec.buckets.find((bucket) => bucket.id === item.bucket)?.label}
                </span>
              </li>
            ))}
        </ul>
      ) : null}
    </GameFrame>
  );
}
