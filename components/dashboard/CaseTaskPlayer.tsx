"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CaseTask } from "@/lib/caseTasks";
import { saveRecord } from "@/lib/progress";
import { useAuthStore } from "@/lib/authStore";
import { saveCaseResponse } from "@/lib/supabase/caseResponses";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon } from "./Icon";
import { Chip } from "./Panel";
import { CaseRoleplayRoom } from "./games/CaseRoleplayRoom";

/**
 * Кейс плеері: бейне → тапсырма → рөлдік ойын → талқылау.
 *
 * Рөлдік ойын — жалғыз міндетті емес қадам. Оқушының достары жиналмауы мүмкін,
 * сондықтан «өткізіп жіберу» шынымен жұмыс істейді: кейс аяқталды деп саналады,
 * тек рөлдік ойын өтілмеген деп белгіленеді.
 */

type StepId = "video" | "task" | "roleplay" | "discussion";

const STEPS: { id: StepId; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { id: "video", label: "Бейне", icon: "Video" },
  { id: "task", label: "Тапсырма", icon: "NotebookPen" },
  { id: "roleplay", label: "Рөлдік ойын", icon: "Drama" },
  { id: "discussion", label: "Талқылау", icon: "MessageSquare" },
];

type CaseState = {
  step: StepId;
  done: StepId[];
  answer: string;
  /** Рөлдік ойын өткізіп жіберілді ме. */
  skipped: boolean;
  /** Рөлдік ойынның нәтижесі. Ойналмаса — null, сонда баға да қойылмайды. */
  play: { correct: number; total: number } | null;
};

const EMPTY: CaseState = { step: "video", done: [], answer: "", skipped: false, play: null };

/**
 * Қадам күйін браузерде сақтау. Кейс сабақ плеерінің бір қойындысында тұр —
 * басқа кезеңге ауысқанда компонент ажырайды, ал жазылған жауап жоғалмауы керек.
 */
function readState(caseId: string): CaseState {
  try {
    const raw = window.localStorage.getItem(`vstem-case-${caseId}`);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<CaseState>;
    const known = (id: unknown): id is StepId => STEPS.some((s) => s.id === id);
    return {
      // Қадам атаулары өзгерген болуы мүмкін — танылмағаны басына қайтарады.
      step: known(parsed.step) ? parsed.step : EMPTY.step,
      done: Array.isArray(parsed.done) ? parsed.done.filter(known) : [],
      answer: typeof parsed.answer === "string" ? parsed.answer : "",
      skipped: parsed.skipped === true,
      play:
        parsed.play && typeof parsed.play.total === "number" && parsed.play.total > 0
          ? parsed.play
          : null,
    };
  } catch {
    return EMPTY;
  }
}

function StepCard({
  title,
  hint,
  accent,
  children,
}: {
  title: string;
  hint?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-700/8 p-4 dark:border-white/10">
      <h3 className="font-display text-[0.9rem] font-bold text-ink-900 dark:text-white">{title}</h3>
      {hint ? (
        <p className="mt-1 text-[0.78rem] leading-snug text-ink-700/80 dark:text-paper-300">{hint}</p>
      ) : null}
      <div className="mt-3" style={{ ["--case-accent" as string]: accent }}>
        {children}
      </div>
    </div>
  );
}

export function CaseTaskPlayer({ caseTask }: { caseTask: CaseTask }) {
  const accent = caseTask.accent;
  const [state, setState] = useState<CaseState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const startedAt = useRef(Date.now());
  const reduced = usePrefersReducedMotion();
  const me = useAuthStore((s) => s.user);

  useEffect(() => {
    setState(readState(caseTask.id));
    setHydrated(true);
  }, [caseTask.id]);

  const update = useCallback(
    (patch: Partial<CaseState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.localStorage.setItem(`vstem-case-${caseTask.id}`, JSON.stringify(next));
        } catch {
          // Жеке режим немесе орын жоқ — күй тек осы сессияда қалады.
        }
        return next;
      });
    },
    [caseTask.id],
  );

  const complete = useCallback(
    (id: StepId, nextStep?: StepId) => {
      const done = state.done.includes(id) ? state.done : [...state.done, id];
      update({ done, step: nextStep ?? state.step });

      // Жазба жауапты мұғалім көретін жерге жіберу. Тапсырма қадамы біткенде
      // бір рет, кейс аяқталғанда ойын нәтижесімен бірге тағы бір рет — оқушы
      // ойынға жетпей тоқтап қалса да, жауабы жоғалмайды.
      if ((id === "task" || id === "discussion") && me) {
        void saveCaseResponse(me, {
          caseId: caseTask.id,
          answer: state.answer,
          play: state.play,
          skipped: state.skipped,
        });
      }

      if (id === "discussion") {
        // Бағаланатын жалғыз нәрсе — рөлдік ойын. Ол өткізіп жіберілсе,
        // өлшенген ештеңе жоқ, сондықтан баға да қойылмайды (радар мұндай
        // жазбаны елемейді) — қадамдардың саны баға бола алмайды.
        const play = state.play;
        saveRecord({
          id: caseTask.id,
          kind: "case",
          lessonId: caseTask.id,
          // Кейс пәнге бөлінбейді — аналитикада ол жалпы дағды жазбасы.
          subject: "general",
          stage: "case",
          score: play ? Math.round((play.correct / play.total) * 100) : null,
          correct: play?.correct ?? 0,
          total: play?.total ?? 0,
          attempts: 1,
          durationMs: Date.now() - startedAt.current,
          skills: caseTask.skills,
          at: Date.now(),
        });
      }
    },
    [
      state.done,
      state.step,
      state.play,
      state.answer,
      state.skipped,
      update,
      me,
      caseTask.id,
      caseTask.skills,
    ],
  );

  const index = STEPS.findIndex((s) => s.id === state.step);
  const handlePlayResult = useCallback(
    (result: { correct: number; total: number }) => {
      // Раунд өтпей аяқталған бөлме нәтиже бермейді — бос нәтижені бағаға
      // айналдырсақ, оқушы ойнамай-ақ 0 алар еді.
      if (result.total > 0) update({ play: result, skipped: false });
    },
    [update],
  );

  const answerReady = state.answer.trim().length >= caseTask.task.minChars;
  const finished = state.done.includes("discussion");

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.84rem] leading-relaxed text-ink-700 dark:text-paper-200">
        {caseTask.intro}
      </p>

      {/* Қадамдар жолағы */}
      <ol className="flex gap-1.5 overflow-x-auto dash-scroll pb-1">
        {STEPS.map((step, i) => {
          const active = step.id === state.step;
          const done = state.done.includes(step.id);
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => update({ step: step.id })}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[0.74rem] font-medium whitespace-nowrap transition-colors"
                style={{
                  borderColor: active
                    ? `color-mix(in srgb, ${accent} 55%, transparent)`
                    : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                  backgroundColor: active
                    ? `color-mix(in srgb, ${accent} 9%, transparent)`
                    : undefined,
                  color: active ? accent : undefined,
                }}
              >
                {done ? (
                  <Icon name="CircleCheck" className="size-3.5 text-emerald-500" strokeWidth={2.4} />
                ) : (
                  <span className="font-bold tabular-nums">{i + 1}</span>
                )}
                <Icon name={step.icon} className="size-3.5" strokeWidth={2} />
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>

      <motion.div
        key={state.step}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        className="flex flex-col gap-3"
      >
        {state.step === "video" ? (
          <StepCard
            title={caseTask.video.title}
            hint={[caseTask.video.source, caseTask.video.durationLabel]
              .filter(Boolean)
              .join(" · ")}
            accent={accent}
          >
            {caseTask.video.youtubeId ? (
              <div className="overflow-hidden rounded-xl border border-ink-700/10 bg-black dark:border-white/10">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${caseTask.video.youtubeId}`}
                  title={caseTask.video.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              // Бейне әлі жүктелмеген: кейстің қалған қадамдары жұмыс істей
              // беруі керек, сондықтан бұл жерде тек орын белгісі тұрады.
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/20 px-4 text-center dark:border-white/20">
                <Icon
                  name="Video"
                  className="size-7 text-ink-600/40 dark:text-paper-300/60"
                  strokeWidth={1.8}
                />
                <p className="text-[0.82rem] font-semibold text-ink-800 dark:text-paper-100">
                  Бейне дайындалуда
                </p>
                <p className="max-w-sm text-[0.76rem] leading-snug text-ink-700/75 dark:text-paper-300">
                  Төмендегі сұрақтарды оқып, кейсті бастай беруге болады. Бейне қосылғанда осы
                  жерде ашылады.
                </p>
              </div>
            )}

            <h4 className="mt-3 mb-1.5 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
              Бейнеден нені іздейміз
            </h4>
            <ul className="space-y-1.5">
              {caseTask.video.watchFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[0.8rem] leading-snug text-ink-700 dark:text-paper-200"
                >
                  <span className="mt-0.5 shrink-0" style={{ color: accent }}>
                    <Icon name="Eye" className="size-3.5" strokeWidth={2.2} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => complete("video", "task")}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-bold text-white transition active:scale-[0.98]"
              style={{ backgroundColor: accent }}
            >
              Көрдім, тапсырмаға өту
              <Icon name="ArrowRight" className="size-4" strokeWidth={2.2} />
            </button>
          </StepCard>
        ) : null}

        {state.step === "task" ? (
          <StepCard title="Шағын тапсырма" hint={caseTask.task.hint} accent={accent}>
            <p
              className="rounded-lg px-3 py-2.5 text-[0.84rem] leading-relaxed font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 9%, transparent)`,
                color: accent,
              }}
            >
              {caseTask.task.prompt}
            </p>

            <textarea
              value={state.answer}
              onChange={(e) => update({ answer: e.target.value })}
              rows={5}
              placeholder="Жауабыңызды осында жазыңыз…"
              className="mt-3 w-full rounded-xl border border-ink-700/12 bg-transparent p-3 text-[0.84rem] leading-relaxed text-ink-800 outline-none transition focus:border-ink-700/30 dark:border-white/12 dark:text-paper-100 dark:focus:border-white/30"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[0.72rem] tabular-nums text-ink-600/70 dark:text-paper-300">
                {state.answer.trim().length} / {caseTask.task.minChars} таңба
              </span>
              <div className="flex flex-wrap gap-1.5">
                {caseTask.task.checklist.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!answerReady}
              onClick={() => complete("task", "roleplay")}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              Рөлдік ойынға өту
              <Icon name="ArrowRight" className="size-4" strokeWidth={2.2} />
            </button>
          </StepCard>
        ) : null}

        {state.step === "roleplay" ? (
          <>
            <StepCard
              title="Рөлдік ойын"
              hint={caseTask.roleplay.scenario}
              accent={accent}
            >
              <p className="rounded-lg border border-ink-700/8 px-3 py-2.5 text-[0.8rem] leading-snug text-ink-700 dark:border-white/10 dark:text-paper-200">
                <span className="font-semibold">Мақсат: </span>
                {caseTask.roleplay.goal}
              </p>

              {caseTask.roleplay.materials ? (
                <>
                  <h4 className="mt-4 mb-2 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
                    Қажетті құралдар
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {caseTask.roleplay.materials.map((material) => (
                      <li key={material}>
                        <Chip accent={accent}>{material}</Chip>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {/* Рөлдер мен таймер бөлменің ішінде — мұнда тек шолу. */}
              <h4 className="mt-4 mb-2 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
                Рөлдер
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {caseTask.roleplay.roles.map((role) => (
                  <Chip key={role.id} accent={accent}>
                    {role.emoji} {role.name}
                  </Chip>
                ))}
              </div>

              <h4 className="mt-4 mb-2 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
                Раундтар
              </h4>
              <ol className="space-y-1.5">
                {caseTask.roleplay.rounds.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-lg border border-ink-700/8 px-3 py-2.5 dark:border-white/10"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-[0.8rem] font-semibold text-ink-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[0.72rem] font-semibold tabular-nums text-ink-600/70 dark:text-paper-300">
                        {item.minutes} мин
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.77rem] leading-snug text-ink-700 dark:text-paper-200">
                      {item.prompt}
                    </span>
                  </li>
                ))}
              </ol>
            </StepCard>

            <StepCard
              title="Онлайн ойнау — достарды шақырыңыз"
              hint="Бөлме ашсаңыз, достарыңыз QR-код немесе 6 таңбалы кодпен қосылады. Әркім өз рөлін таңдайды, содан кейін ойын басталады. Командалық чат бөлменің ішінде."
              accent={accent}
            >
              <CaseRoleplayRoom
                caseId={caseTask.id}
                roles={caseTask.roleplay.roles}
                rounds={caseTask.roleplay.rounds}
                accent={accent}
                onResult={handlePlayResult}
              />

              <p className="mt-3 rounded-lg border border-dashed border-ink-700/15 px-3 py-2.5 text-[0.76rem] leading-snug text-ink-700/85 dark:border-white/15 dark:text-paper-300">
                {caseTask.roleplay.soloNote}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    update({ skipped: false });
                    complete("roleplay", "discussion");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-bold transition active:scale-[0.98]"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                    color: accent,
                  }}
                >
                  Ойнадық — талқылауға өту
                  <Icon name="ArrowRight" className="size-4" strokeWidth={2.2} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    update({ skipped: true });
                    complete("roleplay", "discussion");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-ink-700/12 px-4 py-2.5 text-[0.8rem] font-bold text-ink-700 transition hover:bg-ink-700/5 active:scale-[0.98] dark:border-white/12 dark:text-paper-200 dark:hover:bg-white/5"
                >
                  <Icon name="SkipForward" className="size-4" strokeWidth={2.2} />
                  Дос жоқ — өткізіп жіберу
                </button>
              </div>
            </StepCard>
          </>
        ) : null}

        {state.step === "discussion" ? (
          <StepCard
            title="Талқылауға арналған сұрақтар"
            hint="Сыныпта ауызша талқыланады — әр сұраққа бірнеше жауап болуы қалыпты."
            accent={accent}
          >
            {state.play ? (
              <p className="mb-3 flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-2.5 text-[0.78rem]"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)` }}
              >
                <span
                  className="font-display text-[1.05rem] font-black tabular-nums"
                  style={{ color: accent }}
                >
                  {state.play.correct}/{state.play.total}
                </span>
                <span className="font-semibold text-ink-800 dark:text-paper-100">
                  рөлдік ойындағы нәтижеңіз
                </span>
                <span className="text-ink-700/75 dark:text-paper-300">
                  · дағды профиліңізге қосылды
                </span>
              </p>
            ) : state.skipped ? (
              <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-[0.76rem] leading-snug text-amber-700 dark:text-amber-300">
                Рөлдік ойын өткізіп жіберілді, сондықтан бұл кейс дағды профиліне баға қоспайды.
                Оны кез келген уақытта қайта ашуға болады.
              </p>
            ) : null}

            <ol className="space-y-1.5">
              {caseTask.discussion.map((question, i) => (
                <li
                  key={question}
                  className="flex items-start gap-2.5 rounded-lg border border-ink-700/8 px-3 py-2.5 text-[0.8rem] leading-snug text-ink-700 dark:border-white/10 dark:text-paper-200"
                >
                  <span
                    className="mt-px shrink-0 font-display text-[0.78rem] font-bold tabular-nums"
                    style={{ color: accent }}
                  >
                    {i + 1}.
                  </span>
                  {question}
                </li>
              ))}
            </ol>

            {finished ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-[0.8rem] font-semibold text-emerald-700 dark:text-emerald-300">
                <Icon name="CircleCheck" className="size-4" strokeWidth={2.2} />
                Кейс аяқталды.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => complete("discussion")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-bold text-white transition active:scale-[0.98]"
                style={{ backgroundColor: accent }}
              >
                <Icon name="Check" className="size-4" strokeWidth={2.4} />
                Кейсті аяқтау
              </button>
            )}
          </StepCard>
        ) : null}
      </motion.div>

      {index > 0 ? (
        <button
          type="button"
          onClick={() => update({ step: STEPS[index - 1].id })}
          className="self-start rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          ← {STEPS[index - 1].label}
        </button>
      ) : null}
    </div>
  );
}
