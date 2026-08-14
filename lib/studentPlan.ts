// Turns one student's own activity into a personal "what to do next" plan —
// the same idea as the teacher's cohort-wide recommendations
// (data/recommendations.ts), but built from that student's real quiz attempts
// and assignment submissions (via dataStore, so it works against either the
// localStorage mock or Supabase without change) rather than the synthetic
// class-wide dataset in data/cohort.ts. A
// student must never be shown numbers that do not match their own dashboard.

import { ALL_MODULES } from "@/data/modules";
import { getSimulation } from "@/data/simulations";
import { lessons } from "./lessons";
import { getAssignmentSubmissions, getGameResults, getQuizAttempts } from "./dataStore";
import type { ActionItem } from "./types";

/** Below this a lesson is flagged for review. */
const WEAK_THRESHOLD = 70;
/** Below this the tone shifts from "warning" to "critical". */
const CRITICAL_THRESHOLD = 50;

const ORDER = { critical: 0, warning: 1, info: 2 } as const;

const PLAN_UNITS = [
  ...ALL_MODULES.map((module) => ({
    id: String(module.id),
    title: module.title,
    href: `/modules/${module.id}`,
    simulationHref: `/modules/${module.id}?tab=simulation`,
    legacyModuleId: module.id,
  })),
  ...lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    href: `/dashboard/lessons/${lesson.id}`,
    simulationHref: lesson.stages.resources.sim
      ? `/dashboard/simulations/${lesson.stages.resources.sim}`
      : null,
    legacyModuleId: null,
  })),
];

/**
 * Best quiz score (%) per lesson, in module order. `null` = not attempted.
 * "Best" rather than "latest" so a retake after review counts for the student.
 */
export async function studentLessonScores(userId: string): Promise<(number | null)[]> {
  const attempts = await getQuizAttempts(userId);
  const best = new Map<string, number>();
  for (const a of attempts) {
    const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
    const moduleId = String(a.moduleId);
    const prev = best.get(moduleId);
    if (prev === undefined || pct > prev) best.set(moduleId, pct);
  }
  return PLAN_UNITS.map((unit) => best.get(unit.id) ?? null);
}

export async function buildStudentPlan(userId: string): Promise<ActionItem[]> {
  const [scores, submissions, games] = await Promise.all([
    studentLessonScores(userId),
    getAssignmentSubmissions(userId),
    getGameResults(userId),
  ]);

  const items: ActionItem[] = [];

  // 1. Lessons already attempted but scored low — worth revising first.
  const weak = scores
    .map((pct, i) => ({ pct, unit: PLAN_UNITS[i] }))
    .filter(
      (item): item is { pct: number; unit: (typeof PLAN_UNITS)[number] } =>
        item.pct !== null && item.pct < WEAK_THRESHOLD
    )
    .sort((a, b) => a.pct - b.pct);
  for (const w of weak.slice(0, 3)) {
    items.push({
      id: `weak-${w.unit.id}`,
      severity: w.pct < CRITICAL_THRESHOLD ? "critical" : "warning",
      kind: "Қайталау",
      title: `«${w.unit.title}» тақырыбын қайталау керек`,
      evidence: `Викторинадағы ең жақсы нәтижең: ${w.pct}%.`,
      action: "Дәрісті қайта қара, глоссарийді пысықта да, викторинаны қайта тапсыр.",
      href: w.unit.href,
    });
  }

  // 2. Where to continue — the first lesson with no attempt at all.
  const attemptedCount = scores.filter((s) => s !== null).length;
  const nextIndex = scores.findIndex((s) => s === null);
  if (nextIndex !== -1) {
    const next = PLAN_UNITS[nextIndex];
    items.push({
      id: "next-lesson",
      severity: "info",
      kind: "Жалғастыру",
      title: attemptedCount === 0 ? "Курсты бастау уақыты келді" : `Келесі сабақ: «${next.title}»`,
      evidence: `${attemptedCount}/${PLAN_UNITS.length} сабақтың викторинасын тапсырдың.`,
      action: "Дәрісті қара, 3D симуляцияны сынап көр, содан кейін викторинаны тапсыр.",
      href: next.href,
    });
  }

  // 3. The lesson's 3D experiment. This one is always present, for whichever
  //    lesson the student is on: the simulations are the point of the course
  //    and the part nobody can edit away, so the plan should never be a list
  //    that quietly omits them. It points at the weakest attempted lesson
  //    first — running the experiment is the fastest way to fix a bad score —
  //    and otherwise at wherever the student currently is.
  const simUnit = weak[0]?.unit ?? PLAN_UNITS[Math.max(0, nextIndex)] ?? PLAN_UNITS[0];
  const legacySim = simUnit.legacyModuleId
    ? getSimulation(simUnit.legacyModuleId)
    : null;
  if (simUnit.simulationHref) {
    items.push({
      id: `simulation-${simUnit.id}`,
      severity: "info",
      kind: "3D тәжірибе",
      title: legacySim
        ? `«${legacySim.title}» симуляциясын жаса`
        : `«${simUnit.title}» интерактив тәжірибесін жаса`,
      evidence: weak[0]
        ? `«${simUnit.title}» бойынша ұпайың ${weak[0].pct}% — тәжірибе ұғымды бекітеді.`
        : legacySim
          ? `${legacySim.devices.join(", ")} қолданылады, шамамен ${legacySim.minutes} минут.`
          : "Интерактив тәжірибе сабақтағы ұғымдарды іс жүзінде бекітеді.",
      action: legacySim?.subtitle ?? "Параметрлерді өзгертіп, нәтижені салыстырып көр.",
      href: simUnit.simulationHref,
    });
  }

  // 4. Games the student has not tried on their current lesson.
  const playedModules = new Set(games.map((g) => String(g.moduleId)));
  const gameTarget = nextIndex !== -1 ? PLAN_UNITS[Math.max(0, nextIndex - 1)] : undefined;
  if (gameTarget && attemptedCount > 0 && !playedModules.has(gameTarget.id)) {
    items.push({
      id: `games-${gameTarget.id}`,
      severity: "info",
      kind: "Ойын",
      title: "Терминдерді ойынмен бекіт",
      evidence: "Бұл сабақтың ойындарын әлі ойнамағансың.",
      action: "Кроссворд, сөз табу немесе жылдам жауап — глоссарийді жаттауға көмектеседі.",
      href: `${gameTarget.href}?tab=game`,
    });
  }

  // 5. Submitted work waiting on the teacher — informational, not a task.
  const pending = submissions.filter((s) => s.status === "pending");
  if (pending.length > 0) {
    items.push({
      id: "pending-feedback",
      severity: "info",
      kind: "БӨЖ",
      title: `${pending.length} тапсырма тексерілуде`,
      evidence: "Оқытушы әлі баға қойған жоқ.",
      action: "Кері байланысты күте тұр, осы уақытта басқа сабақты жалғастыр.",
    });
  }

  // 6. Graded work with a low mark — done, but worth revisiting.
  const lowGraded = submissions.filter(
    (s) => s.status === "reviewed" && typeof s.grade === "number" && s.grade < WEAK_THRESHOLD
  );
  for (const s of lowGraded.slice(0, 2)) {
    const unit = PLAN_UNITS.find((item) => item.id === String(s.moduleId));
    items.push({
      id: `low-grade-${s.id}`,
      severity: "warning",
      kind: "БӨЖ",
      title: unit ? `«${unit.title}» тапсырмасын жақсарту керек` : "БӨЖ тапсырмасын жақсарту керек",
      evidence: `Баға: ${s.grade}%.${s.teacherFeedback ? " Оқытушы пікір қалдырды." : ""}`,
      action: "Оқытушының ескертуін оқы да, тапсырманы қайта тапсыр.",
      href: unit?.href,
    });
  }

  // 7. Nothing flagged and the student has actually started — encouragement,
  //    not silence, and a concrete next step rather than just praise.
  const hasRisk = items.some((i) => i.severity !== "info");
  if (!hasRisk && attemptedCount > 0) {
    const avg = Math.round(
      scores.reduce((a: number, s) => a + (s ?? 0), 0) / attemptedCount
    );
    items.unshift({
      id: "on-track",
      severity: "info",
      kind: "Прогресс",
      title: "Жақсы қарқынмен барасың",
      evidence: `Тапсырған викториналардың орташа ұпайы: ${avg}%. Артта қалған тақырып жоқ.`,
      action: "AI тьюторда қосымша есептер сұрап, білімді тереңдет.",
      href: "/ai-tutor",
    });
  }

  return items.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
