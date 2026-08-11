"use client";

import type { ReactNode } from "react";
import { Icon } from "../Icon";

/**
 * Барлық ойынға ортақ қабық: тақырып, нұсқау, күй жолағы және түймелер.
 *
 * Әр механика тек өз тақтасын салады, ал тексеру/қайта бастау логикасының
 * көрінісі мен қолжетімділігі осында бір рет жазылған.
 */

export type GameResult = {
  /** 0–100. */
  score: number;
  correct: number;
  total: number;
  attempts: number;
  durationMs: number;
};

export function GameFrame({
  title,
  prompt,
  accent,
  /** Экрандық оқығышқа айтылатын ағымдағы күй. */
  status,
  checked,
  result,
  canCheck,
  onCheck,
  onRestart,
  children,
}: {
  title: string;
  prompt: string;
  accent: string;
  status: string;
  checked: boolean;
  result: GameResult | null;
  canCheck: boolean;
  onCheck: () => void;
  onRestart: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-700/8 p-4 dark:border-white/10">
      <header className="mb-3">
        <h3 className="font-display text-[0.9rem] font-semibold text-ink-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-700/85 dark:text-paper-300">
          {prompt}
        </p>
      </header>

      {children}

      {/* Күй жолағы — көзбен де, экрандық оқығышпен де оқылады */}
      <p
        aria-live="polite"
        className="mt-3 text-[0.75rem] font-medium text-ink-700 dark:text-paper-200"
      >
        {status}
      </p>

      {checked && result ? (
        <div
          className="mt-2.5 flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5"
          style={{
            backgroundColor: `color-mix(in srgb, ${result.score === 100 ? "#15803d" : accent} 9%, transparent)`,
          }}
        >
          <span
            className="font-display text-lg leading-none font-bold tabular-nums"
            style={{ color: result.score === 100 ? "#15803d" : accent }}
          >
            {result.score}%
          </span>
          <span className="text-[0.78rem] text-ink-700 dark:text-paper-200">
            {result.correct} / {result.total} дұрыс
            {result.attempts > 1 ? ` · ${result.attempts}-әрекет` : ""}
          </span>
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap gap-2">
        {!checked ? (
          <button
            type="button"
            onClick={onCheck}
            disabled={!canCheck}
            aria-disabled={!canCheck}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            <Icon name="Check" className="size-3.5" strokeWidth={2.4} />
            Тексеру
          </button>
        ) : null}

        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 rounded-lg border border-ink-700/10 px-3.5 py-2 text-[0.78rem] font-semibold text-ink-800 transition hover:bg-ink-700/5 dark:border-white/15 dark:text-paper-100 dark:hover:bg-white/8"
        >
          <Icon name="RefreshCw" className="size-3.5" strokeWidth={2.2} />
          Қайта бастау
        </button>
      </div>
    </div>
  );
}
