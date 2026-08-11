"use client";

import { useEffect, useReducer, useRef } from "react";
import { motion } from "framer-motion";
import {
  METERS,
  METER_START,
  clampMeter,
  environments,
  feedbackTier,
  members,
  roles,
  scenarios,
  scoreTeamSim,
  resultDimensions,
  type MeterId,
} from "@/lib/teamSim";
import { saveRecord } from "@/lib/progress";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip, IconBadge } from "./Panel";
import { Meter } from "./Meter";
import { Collapse } from "./Collapse";

/**
 * Командалық жобалар симуляторы (2.11) — интерактивті нұсқа.
 *
 * Төрт қадам: орта таңдау → рөлдерді бөлу → қақтығыс сценарийлері → нәтиже.
 * Әр таңдаудың төрт көрсеткішке (коммуникация, мерзім, сапа, көңіл күй) нақты
 * әсері бар, сондықтан қорытынды ұпай кездейсоқ емес — шешімдердің салдары.
 */

type Step = "environment" | "roles" | "scenario" | "result";

type State = {
  step: Step;
  environmentId: string | null;
  /** Мүше id → рөл id. */
  assignments: Record<string, string | null>;
  scenarioIndex: number;
  choices: { scenarioId: string; optionId: string }[];
  meters: Record<MeterId, number>;
  startedAt: number;
};

type Action =
  | { type: "environment"; id: string }
  | { type: "assign"; memberId: string; roleId: string }
  | { type: "confirmRoles" }
  | { type: "choose"; optionId: string }
  | { type: "advance" }
  | { type: "restart" };

function initialState(): State {
  return {
    step: "environment",
    environmentId: null,
    assignments: Object.fromEntries(members.map((member) => [member.id, null])),
    scenarioIndex: 0,
    choices: [],
    meters: Object.fromEntries(METERS.map((meter) => [meter.id, METER_START])) as Record<
      MeterId,
      number
    >,
    startedAt: Date.now(),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "environment":
      return { ...state, environmentId: action.id, step: "roles" };

    case "assign": {
      // Бір рөлді екі мүше алмайды: бұрынғы иесінен босатылады.
      const assignments: Record<string, string | null> = {};
      for (const [memberId, roleId] of Object.entries(state.assignments)) {
        assignments[memberId] = roleId === action.roleId ? null : roleId;
      }
      assignments[action.memberId] =
        state.assignments[action.memberId] === action.roleId ? null : action.roleId;
      return { ...state, assignments };
    }

    case "confirmRoles":
      return Object.values(state.assignments).every(Boolean)
        ? { ...state, step: "scenario" }
        : state;

    case "choose": {
      const scenario = scenarios[state.scenarioIndex];
      if (!scenario) return state;
      if (state.choices.some((choice) => choice.scenarioId === scenario.id)) return state;

      const option = scenario.options.find((item) => item.id === action.optionId);
      if (!option) return state;

      const meters = { ...state.meters };
      for (const [key, delta] of Object.entries(option.effects)) {
        const id = key as MeterId;
        meters[id] = clampMeter(meters[id] + (delta ?? 0));
      }

      return {
        ...state,
        meters,
        choices: [...state.choices, { scenarioId: scenario.id, optionId: option.id }],
      };
    }

    case "advance":
      return state.scenarioIndex + 1 >= scenarios.length
        ? { ...state, step: "result" }
        : { ...state, scenarioIndex: state.scenarioIndex + 1 };

    case "restart":
      return initialState();
  }
}

export function TeamSimPlayer({ lessonId = "general" }: { lessonId?: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const reduced = usePrefersReducedMotion();
  const savedRef = useRef(false);

  const environment = environments.find((item) => item.id === state.environmentId);
  const scenario = scenarios[state.scenarioIndex];
  const currentChoice = scenario
    ? state.choices.find((choice) => choice.scenarioId === scenario.id)
    : undefined;
  const chosenOption = scenario?.options.find((option) => option.id === currentChoice?.optionId);

  const outcome = scoreTeamSim(state.meters, state.assignments);
  const tier = feedbackTier(outcome.score);
  const assignedCount = Object.values(state.assignments).filter(Boolean).length;

  useEffect(() => {
    if (state.step !== "result" || savedRef.current) return;
    savedRef.current = true;
    saveRecord({
      id: "team-project",
      kind: "sim",
      lessonId,
      subject: "general",
      stage: "sim",
      score: outcome.score,
      correct: outcome.matched,
      total: members.length,
      attempts: 1,
      durationMs: Date.now() - state.startedAt,
      at: Date.now(),
    });
  }, [state.step, state.startedAt, outcome.score, outcome.matched, lessonId]);

  useEffect(() => {
    if (state.step === "environment") savedRef.current = false;
  }, [state.step]);

  const steps: { id: Step; label: string }[] = [
    { id: "environment", label: "Орта" },
    { id: "roles", label: "Рөлдер" },
    { id: "scenario", label: "Жағдаяттар" },
    { id: "result", label: "Нәтиже" },
  ];
  const stepIndex = steps.findIndex((item) => item.id === state.step);

  return (
    <div className="flex flex-col gap-3">
      {/* Қадамдар жолағы */}
      <ol className="flex flex-wrap gap-1.5">
        {steps.map((item, i) => (
          <li key={item.id} className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium"
              style={{
                backgroundColor:
                  i <= stepIndex ? "color-mix(in srgb, #2563eb 12%, transparent)" : undefined,
                color: i <= stepIndex ? "#2563eb" : undefined,
              }}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              <span className="font-bold tabular-nums">{i + 1}</span>
              {item.label}
            </span>
            {i < steps.length - 1 ? (
              <Icon name="ChevronRight" className="size-3 text-ink-600/35" strokeWidth={2.4} />
            ) : null}
          </li>
        ))}
      </ol>

      <motion.div
        key={state.step}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-ink-700/8 p-4 dark:border-white/10"
      >
        {/* ---------- 1. Орта ---------- */}
        {state.step === "environment" ? (
          <div>
            <h3 className="mb-1 font-display text-[0.9rem] font-semibold text-ink-900 dark:text-white">
              Виртуалды ортаны таңдаңыз
            </h3>
            <p className="mb-3 text-[0.78rem] text-ink-700/85 dark:text-paper-300">
              Орта жобаның сипатын және қандай шешім маңызды болатынын анықтайды.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {environments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => dispatch({ type: "environment", id: item.id })}
                  className="flex items-start gap-2.5 rounded-lg border border-ink-700/8 p-3 text-left transition hover:shadow-soft dark:border-white/10"
                >
                  <IconBadge name={item.icon} accent={item.accent} />
                  <span className="min-w-0">
                    <span className="block font-display text-[0.82rem] font-semibold text-ink-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="block text-[0.72rem] leading-snug text-ink-700/80 dark:text-paper-300">
                      {item.text}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ---------- 2. Рөлдер ---------- */}
        {state.step === "roles" ? (
          <div>
            <h3 className="mb-1 font-display text-[0.9rem] font-semibold text-ink-900 dark:text-white">
              Рөлдерді бөліңіз
            </h3>
            <p className="mb-3 text-[0.78rem] text-ink-700/85 dark:text-paper-300">
              Әр мүшенің күшті жағы бар. Рөл сол күшті жаққа сай келсе, команда тиімдірек жұмыс
              істейді. Бір рөлді бір ғана мүше алады.
            </p>

            <ul className="space-y-2">
              {members.map((member) => {
                const assigned = state.assignments[member.id];
                return (
                  <li
                    key={member.id}
                    className="rounded-lg border border-ink-700/8 p-2.5 dark:border-white/10"
                  >
                    <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-[0.82rem] font-semibold text-ink-900 dark:text-white">
                        {member.name}
                      </span>
                      <span className="text-[0.7rem] text-ink-700/75 dark:text-paper-300">
                        {member.trait}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map((role) => {
                        const active = assigned === role.id;
                        const takenBy = Object.entries(state.assignments).find(
                          ([memberId, roleId]) => roleId === role.id && memberId !== member.id,
                        );
                        const fits = member.strengths.includes(role.id);

                        return (
                          <button
                            key={role.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              dispatch({ type: "assign", memberId: member.id, roleId: role.id })
                            }
                            className="rounded-full border px-2.5 py-1 text-[0.72rem] font-medium transition-colors"
                            style={{
                              borderColor: active
                                ? `color-mix(in srgb, ${role.accent} 60%, transparent)`
                                : "color-mix(in srgb, var(--color-ink-700) 10%, transparent)",
                              backgroundColor: active
                                ? `color-mix(in srgb, ${role.accent} 12%, transparent)`
                                : undefined,
                              color: active ? role.accent : undefined,
                              opacity: takenBy && !active ? 0.45 : 1,
                            }}
                          >
                            {role.title}
                            {fits ? " ★" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-2.5 text-[0.72rem] text-ink-700/75 dark:text-paper-300">
              ★ — мүшенің күшті жағына сай рөл. Бөлінген рөл: {assignedCount} / {members.length}
            </p>

            <button
              type="button"
              onClick={() => dispatch({ type: "confirmRoles" })}
              disabled={assignedCount < members.length}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-deep-500 px-3.5 py-2 text-[0.78rem] font-semibold text-white disabled:opacity-40"
            >
              Жағдаяттарға өту
              <Icon name="ArrowRight" className="size-3.5" strokeWidth={2.2} />
            </button>
          </div>
        ) : null}

        {/* ---------- 3. Сценарийлер ---------- */}
        {state.step === "scenario" && scenario ? (
          <div>
            <div className="mb-2 flex items-start gap-2.5">
              <IconBadge name={scenario.icon} accent={scenario.accent} />
              <div className="min-w-0">
                <h3 className="font-display text-[0.9rem] font-semibold text-ink-900 dark:text-white">
                  {scenario.title}
                </h3>
                <p className="text-[0.72rem] text-ink-700/70 dark:text-paper-300">
                  {state.scenarioIndex + 1} / {scenarios.length} · {scenario.channel}
                </p>
              </div>
            </div>

            <p className="mb-3 text-[0.8rem] leading-snug text-ink-700 dark:text-paper-200">
              {scenario.situation}
            </p>

            <div className="space-y-1.5">
              {scenario.options.map((option) => {
                const picked = currentChoice?.optionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={Boolean(currentChoice)}
                    onClick={() => dispatch({ type: "choose", optionId: option.id })}
                    className="flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-[0.79rem] leading-snug transition-colors disabled:cursor-default"
                    style={{
                      borderColor: picked
                        ? `color-mix(in srgb, ${scenario.accent} 55%, transparent)`
                        : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                      backgroundColor: picked
                        ? `color-mix(in srgb, ${scenario.accent} 8%, transparent)`
                        : undefined,
                      opacity: currentChoice && !picked ? 0.5 : 1,
                    }}
                  >
                    <span className="min-w-0 flex-1 text-ink-800 dark:text-paper-100">
                      {option.label}
                    </span>
                    {picked && option.best ? <Chip accent="#15803d">Ең күшті</Chip> : null}
                  </button>
                );
              })}
            </div>

            <div aria-live="polite">
              <Collapse open={Boolean(chosenOption)}>
                {chosenOption ? (
                  <div className="mt-3 rounded-lg bg-ink-700/4 p-3 dark:bg-white/5">
                    <p className="text-[0.78rem] leading-snug text-ink-700 dark:text-paper-200">
                      {chosenOption.feedback}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(chosenOption.effects).map(([key, delta]) => {
                        const meter = METERS.find((item) => item.id === key);
                        if (!meter || !delta) return null;
                        return (
                          <Chip key={key} accent={delta > 0 ? "#15803d" : "#ea580c"}>
                            {meter.label} {delta > 0 ? `+${delta}` : delta}
                          </Chip>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "advance" })}
                      className="mt-3 flex items-center gap-1.5 rounded-lg bg-deep-500 px-3.5 py-2 text-[0.78rem] font-semibold text-white"
                    >
                      {state.scenarioIndex + 1 >= scenarios.length
                        ? "Нәтижені көру"
                        : "Келесі жағдаят"}
                      <Icon name="ArrowRight" className="size-3.5" strokeWidth={2.2} />
                    </button>
                  </div>
                ) : null}
              </Collapse>
            </div>
          </div>
        ) : null}

        {/* ---------- 4. Нәтиже ---------- */}
        {state.step === "result" ? (
          <div>
            <div role="status" className="flex flex-wrap items-center gap-3">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white tabular-nums"
                style={{ backgroundColor: tier.accent }}
              >
                {outcome.score}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[0.95rem] font-semibold text-ink-900 dark:text-white">
                  {tier.title}
                </p>
                <p className="text-[0.78rem] leading-snug text-ink-700/85 dark:text-paper-300">
                  {tier.text}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {METERS.map((meter) => (
                <Meter
                  key={meter.id}
                  label={meter.label}
                  value={state.meters[meter.id]}
                  accent={meter.accent}
                />
              ))}
            </div>

            <p className="mt-3 text-[0.75rem] text-ink-700/85 dark:text-paper-300">
              Рөл сәйкестігі: {outcome.matched} / {members.length} · бонус +{outcome.fitBonus} балл
              {environment ? ` · орта: ${environment.label}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {resultDimensions.map((dimension) => (
                <Chip key={dimension}>{dimension}</Chip>
              ))}
            </div>

            <h4 className="mt-4 mb-1.5 text-[0.7rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
              Шешімдер журналы
            </h4>
            <ul className="space-y-1.5">
              {state.choices.map((choice) => {
                const item = scenarios.find((entry) => entry.id === choice.scenarioId);
                const option = item?.options.find((entry) => entry.id === choice.optionId);
                const best = item?.options.find((entry) => entry.best);
                if (!item || !option) return null;

                return (
                  <li
                    key={choice.scenarioId}
                    className="rounded-lg border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
                  >
                    <p className="text-[0.78rem] font-semibold text-ink-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[0.74rem] leading-snug text-ink-700/85 dark:text-paper-300">
                      {option.label}
                    </p>
                    {!option.best && best ? (
                      <p className="mt-1 text-[0.72rem] leading-snug" style={{ color: "#15803d" }}>
                        Ең күшті таңдау: {best.label}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => dispatch({ type: "restart" })}
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-ink-700/10 px-3.5 py-2 text-[0.78rem] font-semibold text-ink-800 transition hover:bg-ink-700/5 dark:border-white/15 dark:text-paper-100 dark:hover:bg-white/8"
            >
              <Icon name="RotateCcw" className="size-3.5" strokeWidth={2.2} />
              Қайта өту
            </button>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
