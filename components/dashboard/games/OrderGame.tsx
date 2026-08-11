"use client";

import { useMemo, useState } from "react";
import type { GameSpec } from "@/lib/lessons";
import { hashString, seededShuffle } from "@/lib/shuffle";
import { Icon } from "../Icon";
import { GameFrame, type GameResult } from "./GameFrame";

type Spec = Extract<GameSpec, { kind: "order" }>;
type Item = Spec["items"][number];

/**
 * «Ретке келтіру» — элементтерді дұрыс ретпен орналастыру.
 *
 * Жылжыту жоғары/төмен түймелерімен жасалады. Сүйреудің орнына түйме
 * алынғанының себебі: пернетақтадан толық басқарылады, сенсорлы экранда
 * қосымша кітапхана қажет етпейді және нәтижесі тексеруге оңай.
 */
export function OrderGame({
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

  const shuffled = useMemo(
    () => seededShuffle(spec.items, hashString(spec.id) ^ attempt),
    [spec.items, spec.id, attempt],
  );
  const [order, setOrder] = useState<Item[]>(shuffled);

  // Жаңа әрекет басталғанда тізім қайта араласады.
  const [lastAttempt, setLastAttempt] = useState(attempt);
  if (lastAttempt !== attempt) {
    setLastAttempt(attempt);
    setOrder(shuffled);
  }

  const total = spec.items.length;
  const correctCount = order.reduce(
    (sum, item, index) => sum + (spec.items[index].id === item.id ? 1 : 0),
    0,
  );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (checked || target < 0 || target >= order.length) return;
    const next = order.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
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
    ? `${correctCount} / ${total} элемент дұрыс орында.`
    : "Жоғары және төмен түймелерімен ретті өзгертіңіз, содан кейін «Тексеру» басыңыз.";

  return (
    <GameFrame
      title={spec.title}
      prompt={spec.prompt}
      accent={accent}
      status={status}
      checked={checked}
      result={result}
      canCheck={!checked}
      onCheck={check}
      onRestart={restart}
    >
      <ol className="space-y-1.5">
        {order.map((item, index) => {
          const rightPlace = spec.items[index].id === item.id;
          const properIndex = spec.items.findIndex((entry) => entry.id === item.id);

          return (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors"
              style={{
                borderColor: !checked
                  ? "color-mix(in srgb, var(--color-ink-700) 8%, transparent)"
                  : rightPlace
                    ? "color-mix(in srgb, #15803d 45%, transparent)"
                    : "color-mix(in srgb, #ea580c 45%, transparent)",
                backgroundColor: checked
                  ? `color-mix(in srgb, ${rightPlace ? "#15803d" : "#ea580c"} 7%, transparent)`
                  : undefined,
              }}
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-md text-[0.7rem] font-bold tabular-nums"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                  color: accent,
                }}
              >
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[0.8rem] leading-snug text-ink-800 dark:text-paper-100">
                  {item.label}
                </span>
                {checked && item.note ? (
                  <span className="block text-[0.7rem] text-ink-700/70 dark:text-paper-300">
                    {item.note}
                  </span>
                ) : null}
              </span>

              {checked ? (
                <span
                  className="shrink-0 text-[0.7rem] font-semibold tabular-nums"
                  style={{ color: rightPlace ? "#15803d" : "#ea580c" }}
                >
                  {rightPlace ? "дұрыс" : `→ ${properIndex + 1}`}
                </span>
              ) : (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`«${item.label}» жоғары жылжыту`}
                    className="grid size-7 place-items-center rounded-md border border-ink-700/10 text-ink-700 transition hover:bg-ink-700/6 disabled:opacity-30 dark:border-white/15 dark:text-paper-200 dark:hover:bg-white/10"
                  >
                    <Icon name="ChevronUp" className="size-3.5" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                    aria-label={`«${item.label}» төмен жылжыту`}
                    className="grid size-7 place-items-center rounded-md border border-ink-700/10 text-ink-700 transition hover:bg-ink-700/6 disabled:opacity-30 dark:border-white/15 dark:text-paper-200 dark:hover:bg-white/10"
                  >
                    <Icon name="ChevronDown" className="size-3.5" strokeWidth={2.4} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </GameFrame>
  );
}
