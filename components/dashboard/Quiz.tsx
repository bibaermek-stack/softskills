"use client";

import { useEffect, useReducer, useRef } from "react";
import {
  expectedIndices,
  isAnswerCorrect,
  optionsOf,
  scoreQuiz,
  type QuizQuestion,
  type QuizSpec,
} from "@/lib/lessons";
import { saveRecord } from "@/lib/progress";
import type { SubjectId } from "@/lib/dashboard";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Chip } from "./Panel";
import { Collapse } from "./Collapse";

/**
 * Тест қозғалтқышы.
 *
 * Бір сұрақ — бір экран: жауап беру → «Тексеру» → түсіндірме → келесі сұрақ.
 * Түсіндірмені оқымай өтіп кетуге болмайды, себебі тестің мақсаты — бағалау
 * ғана емес, қатенің себебін көрсету.
 *
 * Барлық ауысу таза әрі синхронды: ешбір күй анимацияның аяқталуын күтпейді.
 */

const OK = "#15803d";
const BAD = "#ea580c";

type State = {
  phase: "playing" | "result";
  index: number;
  /** Сұрақ id → таңдалған нұсқа индекстері. */
  answers: Record<string, number[]>;
  /** Тексерілген сұрақтар. */
  checked: Record<string, true>;
  attempt: number;
  startedAt: number;
};

type Action =
  | { type: "toggle"; question: QuizQuestion; option: number }
  | { type: "check"; question: QuizQuestion }
  | { type: "next"; total: number }
  | { type: "retry" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toggle": {
      const { question, option } = action;
      if (state.checked[question.id]) return state;

      const current = state.answers[question.id] ?? [];
      // `multi` — қосып-алып отыруға болады, қалғанында бір ғана таңдау.
      const next =
        question.kind === "multi"
          ? current.includes(option)
            ? current.filter((value) => value !== option)
            : [...current, option].sort((a, b) => a - b)
          : [option];

      return { ...state, answers: { ...state.answers, [question.id]: next } };
    }

    case "check": {
      if ((state.answers[action.question.id] ?? []).length === 0) return state;
      return { ...state, checked: { ...state.checked, [action.question.id]: true } };
    }

    case "next":
      return state.index + 1 >= action.total
        ? { ...state, phase: "result" }
        : { ...state, index: state.index + 1 };

    case "retry":
      return {
        phase: "playing",
        index: 0,
        answers: {},
        checked: {},
        attempt: state.attempt + 1,
        startedAt: Date.now(),
      };
  }
}

function initialState(): State {
  return { phase: "playing", index: 0, answers: {}, checked: {}, attempt: 1, startedAt: Date.now() };
}

export function Quiz({
  spec,
  lessonId,
  subject,
  accent,
}: {
  spec: QuizSpec;
  lessonId: string;
  subject: SubjectId;
  accent: string;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Нәтиже бір-ақ рет жазылуы керек (React strict-mode екі рет шақырады). */
  const savedAttempt = useRef(0);

  const question = spec.questions[state.index];
  const total = spec.questions.length;
  const given = question ? (state.answers[question.id] ?? []) : [];
  const isChecked = question ? Boolean(state.checked[question.id]) : false;
  const isCorrect = question && isChecked ? isAnswerCorrect(question, given) : false;
  const result = scoreQuiz(spec, state.answers);
  const passed = result.score >= spec.passScore;

  // Нәтиже экранына шыққанда жазбаны сақтау.
  useEffect(() => {
    if (state.phase !== "result" || savedAttempt.current === state.attempt) return;
    savedAttempt.current = state.attempt;

    saveRecord({
      id: spec.id,
      kind: "quiz",
      lessonId,
      subject,
      stage: "assessment",
      score: result.score,
      correct: result.correct,
      total: result.total,
      attempts: state.attempt,
      durationMs: Date.now() - state.startedAt,
      at: Date.now(),
    });
  }, [state.phase, state.attempt, state.startedAt, spec.id, lessonId, subject, result.score, result.correct, result.total]);

  // Келесі сұраққа өткенде фокусты жаңа картаға жылжыту.
  useEffect(() => {
    if (state.phase === "playing" && state.index > 0) {
      cardRef.current?.focus({ preventScroll: true });
    }
  }, [state.index, state.phase]);

  /* ---------------- нәтиже ---------------- */
  if (state.phase === "result") {
    return (
      <div className="rounded-xl border border-ink-700/8 p-4 dark:border-white/10">
        <div role="status" className="flex flex-wrap items-center gap-3">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white tabular-nums"
            style={{ backgroundColor: passed ? OK : BAD }}
          >
            {result.score}%
          </span>
          <div className="min-w-0">
            <p className="font-display text-[0.95rem] font-semibold text-ink-900 dark:text-white">
              {passed ? "Тест тапсырылды" : "Тест тапсырылмады"}
            </p>
            <p className="text-[0.78rem] text-ink-700/80 dark:text-paper-300">
              {result.correct} / {result.total} дұрыс · өту шегі {spec.passScore}%
              {state.attempt > 1 ? ` · ${state.attempt}-әрекет` : ""}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {spec.questions.map((item, i) => {
            const ok = isAnswerCorrect(item, state.answers[item.id] ?? []);
            return (
              <li
                key={item.id}
                className="rounded-lg border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: ok ? OK : BAD }}>
                    <Icon name={ok ? "Check" : "X"} className="size-3.5" strokeWidth={2.6} />
                  </span>
                  <p className="min-w-0 flex-1 text-[0.79rem] leading-snug text-ink-800 dark:text-paper-100">
                    <span className="text-ink-600/60 dark:text-paper-300">{i + 1}. </span>
                    {item.prompt}
                  </p>
                </div>
                {!ok ? (
                  <p className="mt-1.5 pl-5.5 text-[0.73rem] leading-snug text-ink-700/80 dark:text-paper-300">
                    {item.explain}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => dispatch({ type: "retry" })}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          <Icon name="RotateCcw" className="size-3.5" strokeWidth={2.2} />
          Қайта тапсыру
        </button>
      </div>
    );
  }

  if (!question) return null;

  const options = optionsOf(question);
  const isMulti = question.kind === "multi";
  const correctIndices = expectedIndices(question);

  /* ---------------- сұрақ ---------------- */
  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      className="rounded-xl border border-ink-700/8 p-4 outline-none dark:border-white/10"
    >
      {/* Барыс */}
      <div className="mb-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.index + 1}
          aria-label="Тест барысы"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/8 dark:bg-white/12"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((state.index + 1) / total) * 100}%`, backgroundColor: accent }}
          />
        </div>
        <span className="shrink-0 text-[0.72rem] font-semibold text-ink-700 tabular-nums dark:text-paper-200">
          {state.index + 1} / {total}
        </span>
      </div>

      <fieldset disabled={isChecked}>
        <legend className="mb-2.5 font-display text-[0.88rem] leading-snug font-semibold text-ink-900 dark:text-white">
          {question.prompt}
        </legend>

        {isMulti ? (
          <p className="mb-2 text-[0.72rem] text-ink-700/70 dark:text-paper-300">
            Бірнеше жауап таңдауға болады.
          </p>
        ) : null}

        <div className="space-y-1.5">
          {options.map((option, i) => {
            const selected = given.includes(i);
            // Осы нұсқа күтілетін жауаптың құрамында ма (multi үшін де дұрыс).
            const expected = correctIndices.includes(i);
            /*
              Тексерілгеннен кейін: дұрыс нұсқа әрқашан жасыл болып ашылады —
              оқушы таңдамаса да, қайсысы дұрыс екенін көруі керек. Қате
              таңдалған нұсқа ғана қызғылт сары болады.
            */
            const tone = !isChecked ? null : expected ? OK : selected ? BAD : null;

            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                  isChecked ? "cursor-default" : "hover:bg-ink-700/4 dark:hover:bg-white/5",
                )}
                style={{
                  borderColor: tone
                    ? `color-mix(in srgb, ${tone} 45%, transparent)`
                    : selected
                      ? `color-mix(in srgb, ${accent} 55%, transparent)`
                      : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                  backgroundColor: tone
                    ? `color-mix(in srgb, ${tone} 8%, transparent)`
                    : selected
                      ? `color-mix(in srgb, ${accent} 7%, transparent)`
                      : undefined,
                }}
              >
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={question.id}
                  checked={selected}
                  onChange={() => dispatch({ type: "toggle", question, option: i })}
                  className="mt-0.5 size-4 shrink-0 accent-brand-600"
                />
                <span className="min-w-0 flex-1 text-[0.8rem] leading-snug text-ink-800 dark:text-paper-100">
                  {option}
                </span>
                {tone ? (
                  <span className="shrink-0" style={{ color: tone }}>
                    <Icon
                      name={tone === OK ? "Check" : "X"}
                      className="size-4"
                      strokeWidth={2.6}
                    />
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Тексеру нәтижесі — экрандық оқығышқа да жеткізіледі */}
      <div aria-live="polite">
        <Collapse open={isChecked}>
          {isChecked ? (
            <div
              className="mt-3 rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: `color-mix(in srgb, ${isCorrect ? OK : BAD} 8%, transparent)`,
              }}
            >
              <p
                className="flex items-center gap-1.5 text-[0.79rem] font-semibold"
                style={{ color: isCorrect ? OK : BAD }}
              >
                <Icon name={isCorrect ? "Check" : "X"} className="size-4" strokeWidth={2.6} />
                {isCorrect ? "Дұрыс жауап" : "Қате жауап"}
              </p>
              <p className="mt-1 text-[0.76rem] leading-snug text-ink-700 dark:text-paper-200">
                {question.explain}
              </p>
            </div>
          ) : null}
        </Collapse>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {!isChecked ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "check", question })}
            disabled={given.length === 0}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            <Icon name="Check" className="size-3.5" strokeWidth={2.4} />
            Тексеру
          </button>
        ) : (
          <button
            type="button"
            onClick={() => dispatch({ type: "next", total })}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {state.index + 1 >= total ? "Нәтижені көру" : "Келесі сұрақ"}
            <Icon name="ArrowRight" className="size-3.5" strokeWidth={2.2} />
          </button>
        )}

        <Chip>{spec.title}</Chip>
      </div>
    </div>
  );
}
