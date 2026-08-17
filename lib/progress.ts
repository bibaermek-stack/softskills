"use client";

import { useEffect, useState } from "react";
import type { SubjectId, LessonStageId } from "./dashboard";
import type { GameType, QuizAttempt } from "./types";
import { lessons } from "./lessons";
import { softSkillsRadar } from "./content";
import { useAuthStore } from "./authStore";
import { isSupabaseConfigured, supabase } from "./supabase/client";

/**
 * Оқушының нәтижелерін браузерде сақтау.
 *
 * Сервер де, дерекқор да жоқ: нәтиже тек осы браузердің `localStorage`-ында
 * тұрады. Модульдің басты ережесі — мұндағы ешбір функция **рендер кезінде**
 * шақырылмайды. `localStorage` серверде жоқ, ал оны рендерде оқу гидратация
 * сәйкессіздігіне әкеледі. Сондықтан оқу тек `useEffect` ішінде жүреді
 * (`DashThemeShell` теманы қалпына келтіретін тәсілдің дәл өзі).
 */

const STORAGE_KEY = "vstem-progress-v1";
const PROGRESS_EVENT = "vstem:progress";
const MAX_RECORDS = 200;

export type ActivityKind = "quiz" | "game" | "sim" | "case";

export type ProgressRecord = {
  /** Тест/ойын/симуляция идентификаторы. */
  id: string;
  kind: ActivityKind;
  lessonId: string;
  subject: SubjectId | "general";
  stage: LessonStageId | "sim" | "case";
  /** 0–100. Бағаланбайтын әрекетте `null`. */
  score: number | null;
  correct: number;
  total: number;
  attempts: number;
  durationMs: number;
  /** Supabase analytics uses the shared LMS game taxonomy. */
  gameType?: GameType;
  /**
   * Осы әрекет дамытатын дағдылар — радар осыларды қосады.
   *
   * Сабақта дағды `lessons`-тан табылады, ал кейс пәнге де, сабаққа да
   * байланбайды. Сондықтан кейс өз дағдыларын жазбаның өзіне жазады: радар
   * оларды іздеп жүрмейді, әрі кейс атауы өзгерсе де ескі жазба дұрыс қалады.
   */
  skills?: string[];
  /** Per-question selections retained for review and question-level analytics. */
  quizAnswers?: QuizAttempt["answers"];
  /** Аяқталған уақыты. */
  at: number;
};

export type ProgressState = { version: 1; records: ProgressRecord[] };

const EMPTY: ProgressState = { version: 1, records: [] };

/* ------------------------------------------------------------------ *\
   Оқу және жазу
\* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is ProgressRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.at === "number" &&
    (r.kind === "quiz" || r.kind === "game" || r.kind === "sim" || r.kind === "case") &&
    (typeof r.score === "number" || r.score === null)
  );
}

/**
 * Сақталған нәтижелерді оқу. Бүлінген жазба болса — сол жазба ғана
 * алынып тасталады, қалғаны қолданылады. Блоб әдейі өшірілмейді:
 * келесі сәтті жазу оны бәрібір алмастырады.
 */
export function readProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;

    const state = parsed as Record<string, unknown>;
    if (state.version !== 1 || !Array.isArray(state.records)) return EMPTY;

    return { version: 1, records: state.records.filter(isRecord) };
  } catch {
    // Бүлінген JSON, жабық localStorage — бос күймен жалғастырамыз.
    return EMPTY;
  }
}

function writeProgress(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Орын бітті немесе жеке режим: соңғы 50 жазбамен бір рет қайталап көреміз.
    try {
      const trimmed: ProgressState = { version: 1, records: state.records.slice(-50) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Бұл жолы да болмады — нәтиже сессия ішінде ғана қалады.
    }
  }
}

async function persistRecord(record: ProgressRecord): Promise<void> {
  // Симуляцияда бағаланатын нәтиже жоқ — ол тек тәжірибе алаңы.
  if (!isSupabaseConfigured || !supabase || record.kind === "sim") return;

  const profile = useAuthStore.getState().user;
  if (!profile) return;

  // A demo identity can still be selected while environment keys exist. Verify
  // the actual Supabase session before sending its non-UUID demo id to Postgres.
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== profile.uid) return;

  const eventId = `${record.kind}_${record.at}_${Math.random().toString(36).slice(2, 8)}`;
  const occurredAt = new Date(record.at).toISOString();

  const { saveGameResult, saveQuizAttempt } = await import("./dataStore");

  if (record.kind === "quiz") {
    await saveQuizAttempt({
      id: eventId,
      userId: profile.uid,
      moduleId: record.lessonId,
      score: record.correct,
      total: record.total,
      answers: record.quizAnswers ?? [],
      takenAt: occurredAt,
    });
  } else if (record.kind === "case") {
    // Кейсте бағаланатын жалғыз нәрсе — рөлдік ойын. Ойналмаса (дос жоқ,
    // өткізіп жіберілді) `score` бос болады да, жіберетін нәтиже де болмайды.
    if (record.score === null) return;
    await saveGameResult({
      id: eventId,
      userId: profile.uid,
      moduleId: record.lessonId,
      gameType: "roleplay",
      score: record.score,
      completedAt: occurredAt,
    });
  } else if (record.gameType) {
    await saveGameResult({
      id: eventId,
      userId: profile.uid,
      moduleId: record.lessonId,
      gameType: record.gameType,
      score: record.score ?? 0,
      completedAt: occurredAt,
    });
  }

  const { syncXp } = await import("./xp");
  await syncXp(profile);
}

/** Жаңа нәтижені қосу және барлық тыңдаушыға хабарлау. */
export function saveRecord(record: ProgressRecord): void {
  const current = readProgress();
  const records = [...current.records, record].slice(-MAX_RECORDS);
  writeProgress({ version: 1, records });
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));

  void persistRecord(record).catch((error: unknown) => {
    console.error("Оқу нәтижесін Supabase-ке сақтау мүмкін болмады:", error);
  });
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Өшіру мүмкін болмаса да, интерфейс жаңаруы керек.
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

/* ------------------------------------------------------------------ *\
   React хугі
\* ------------------------------------------------------------------ */

/**
 * Нәтижелерді оқитын хук.
 *
 * Бастапқы мән әрқашан бос: сервердегі және клиенттегі алғашқы рендер бірдей
 * болуы керек. Нақты деректер гидратациядан кейін бір кадрда келеді.
 */
export function useProgress(): ProgressState {
  const [state, setState] = useState<ProgressState>(EMPTY);

  useEffect(() => {
    const sync = () => setState(readProgress());
    sync();

    window.addEventListener(PROGRESS_EVENT, sync);
    // Басқа қойындыда нәтиже қосылса, бұл қойынды да жаңарады.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ *\
   Жиынтықтар — бәрі таза функциялар
\* ------------------------------------------------------------------ */

const DAY_LABELS = ["Жк", "Дс", "Сс", "Ср", "Бс", "Жм", "Сн"] as const;
/** Аптаның дүйсенбіден басталатын реті — диаграммадағы баған реті. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * Апталық белсенділік: дәл жеті баған, дүйсенбіден жексенбіге дейін.
 * `WeeklyBars` компонентінің құрылымы өзгермеуі үшін пішіні `monitoring.weekly`
 * пішінімен бірдей.
 */
export function weeklyActivity(
  state: ProgressState,
  now: number = Date.now(),
): { day: string; value: number }[] {
  const counts = new Map<number, number>();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  for (const record of state.records) {
    if (record.at < weekAgo) continue;
    const day = new Date(record.at).getDay();
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return WEEK_ORDER.map((day) => ({
    day: DAY_LABELS[day],
    value: Math.min(100, (counts.get(day) ?? 0) * 12),
  }));
}

/**
 * Дағды профилі: радардың сегіз осі, реті мен саны өзгермейді.
 * Дерек жоқ осьте демонстрациялық мән қалады, әйтпесе диаграмма «жабысып»
 * қалған сияқты көрінер еді.
 */
export function skillProfile(state: ProgressState): { axis: string; value: number }[] {
  const sums = new Map<string, { total: number; count: number }>();

  for (const record of state.records) {
    if (record.score === null) continue;
    // Жазбаның өз дағдысы бірінші: кейс сабақ тізімінде жоқ, сондықтан
    // `lessons`-пен ғана шектелсек, кейстің нәтижесі радарға жетпей қалады.
    const axes = record.skills ?? lessons.find((item) => item.id === record.lessonId)?.skills;
    if (!axes?.length) continue;

    for (const axis of axes) {
      const entry = sums.get(axis) ?? { total: 0, count: 0 };
      entry.total += record.score;
      entry.count += 1;
      sums.set(axis, entry);
    }
  }

  return softSkillsRadar.map((item) => {
    const entry = sums.get(item.axis);
    return {
      axis: item.axis,
      value: entry && entry.count > 0 ? Math.round(entry.total / entry.count) : item.value,
    };
  });
}

export function summary(state: ProgressState) {
  const scored = state.records.filter((record) => record.score !== null);
  const meanScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((sum, record) => sum + (record.score ?? 0), 0) / scored.length);
  const minutes = Math.round(
    state.records.reduce((sum, record) => sum + record.durationMs, 0) / 60000,
  );

  return { count: state.records.length, meanScore, minutes };
}

export type LessonStatus = "none" | "started" | "done";

/** Сабақ аяқталды деп саналады: ойын да, тест те орындалғанда. */
export function lessonStatus(state: ProgressState, lessonId: string): LessonStatus {
  const own = state.records.filter((record) => record.lessonId === lessonId);
  if (own.length === 0) return "none";

  const hasGame = own.some((record) => record.kind === "game");
  const hasQuiz = own.some((record) => record.kind === "quiz");
  return hasGame && hasQuiz ? "done" : "started";
}

/** Портфолиодағы үш жетістіктің ашылу шарты. */
export function earnedAchievements(state: ProgressState): Record<string, boolean> {
  const sims = state.records.filter((record) => record.kind === "sim");
  const games = state.records.filter((record) => record.kind === "game");

  return {
    Зерттеуші: sims.length >= 3,
    "Команда сүйенішті": state.records.some(
      (record) => record.id === "team-project" && (record.score ?? 0) >= 70,
    ),
    Шығармашыл: games.filter((record) => record.score === 100).length >= 2,
  };
}
