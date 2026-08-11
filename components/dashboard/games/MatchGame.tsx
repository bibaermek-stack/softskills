"use client";

import { useMemo, useState } from "react";
import type { GameSpec } from "@/lib/lessons";
import { hashString, seededShuffle } from "@/lib/shuffle";
import { cn } from "@/lib/cn";
import { Icon } from "../Icon";
import { GameFrame, type GameResult } from "./GameFrame";

type Spec = Extract<GameSpec, { kind: "match" }>;

/**
 * «Жұп табу» — терминді анықтамасымен сәйкестендіру.
 *
 * Әрекет үлгісі — басу арқылы таңдау (сүйреу емес): солдан бірді, оңнан бірді
 * басасыз. Бұл пернетақтадан да, сенсорлы экраннан да бірдей жұмыс істейді
 * және қарапайым `<button>` семантикасын сақтайды.
 */
export function MatchGame({
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
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Оң баған әр әрекетте басқаша араласады, бірақ рендер сайын емес.
  const rightColumn = useMemo(
    () => seededShuffle(spec.pairs, hashString(spec.id) ^ attempt),
    [spec.pairs, spec.id, attempt],
  );

  const total = spec.pairs.length;
  const finish = (solvedCount: number, wrong: number) => {
    const score = Math.round((100 * total) / (total + wrong));
    setDone(true);
    onComplete({
      score,
      correct: solvedCount,
      total,
      attempts: attempt,
      durationMs: Date.now() - startedAt,
    });
  };

  const chooseRight = (pairId: string) => {
    if (!selectedLeft || done) return;

    if (selectedLeft === pairId) {
      const next = [...solved, pairId];
      setSolved(next);
      setSelectedLeft(null);
      setLastWrong(null);
      if (next.length === total) finish(next.length, wrongAttempts);
    } else {
      setWrongAttempts((value) => value + 1);
      setLastWrong(pairId);
      setSelectedLeft(null);
    }
  };

  const restart = () => {
    setAttempt((value) => value + 1);
    setStartedAt(Date.now());
    setSelectedLeft(null);
    setSolved([]);
    setWrongAttempts(0);
    setLastWrong(null);
    setDone(false);
  };

  const result: GameResult | null = done
    ? {
        score: Math.round((100 * total) / (total + wrongAttempts)),
        correct: total,
        total,
        attempts: attempt,
        durationMs: 0,
      }
    : null;

  const status = done
    ? `Барлық жұп табылды. Қате әрекет: ${wrongAttempts}.`
    : selectedLeft
      ? "Енді оң жақтан сәйкес анықтаманы таңдаңыз."
      : `Табылған жұп: ${solved.length} / ${total}. Сол жақтан терминді таңдаңыз.`;

  return (
    <GameFrame
      title={spec.title}
      prompt={spec.prompt}
      accent={accent}
      status={status}
      checked={done}
      result={result}
      canCheck={false}
      onCheck={() => {}}
      onRestart={restart}
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {/* Терминдер */}
        <ul className="space-y-1.5">
          {spec.pairs.map((pair) => {
            const isSolved = solved.includes(pair.id);
            const isSelected = selectedLeft === pair.id;
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  disabled={isSolved || done}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedLeft(isSelected ? null : pair.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[0.8rem] transition-colors",
                    isSolved ? "opacity-60" : "hover:bg-ink-700/4 dark:hover:bg-white/5",
                  )}
                  style={{
                    borderColor: isSolved
                      ? "color-mix(in srgb, #15803d 45%, transparent)"
                      : isSelected
                        ? `color-mix(in srgb, ${accent} 60%, transparent)`
                        : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                    backgroundColor: isSelected
                      ? `color-mix(in srgb, ${accent} 8%, transparent)`
                      : undefined,
                  }}
                >
                  {isSolved ? (
                    <span className="shrink-0 text-[#15803d]">
                      <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 text-ink-800 dark:text-paper-100">
                    {pair.left}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Анықтамалар */}
        <ul className="space-y-1.5">
          {rightColumn.map((pair) => {
            const isSolved = solved.includes(pair.id);
            const isWrong = lastWrong === pair.id;
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  disabled={isSolved || done || !selectedLeft}
                  onClick={() => chooseRight(pair.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-[0.8rem] leading-snug transition-colors",
                    isSolved ? "opacity-60" : "hover:bg-ink-700/4 dark:hover:bg-white/5",
                    !selectedLeft && !isSolved ? "opacity-70" : "",
                  )}
                  style={{
                    borderColor: isSolved
                      ? "color-mix(in srgb, #15803d 45%, transparent)"
                      : isWrong
                        ? "color-mix(in srgb, #ea580c 55%, transparent)"
                        : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                    backgroundColor: isWrong
                      ? "color-mix(in srgb, #ea580c 8%, transparent)"
                      : undefined,
                  }}
                >
                  {isSolved ? (
                    <span className="mt-0.5 shrink-0 text-[#15803d]">
                      <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 text-ink-800 dark:text-paper-100">
                    {pair.right}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </GameFrame>
  );
}
