"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { lessons } from "@/lib/lessons";
import {
  lessonStatus,
  summary,
  useProgress,
  type ProgressRecord,
} from "@/lib/progress";
import { Icon } from "@/components/dashboard/Icon";

interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: Parameters<typeof Icon>[0]["name"];
  unlocked: boolean;
  color: string;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Counts a streak only when it includes today or yesterday. */
function currentStreak(records: ProgressRecord[]): number {
  const activeDays = new Set(records.map((record) => dayKey(new Date(record.at))));
  if (activeDays.size === 0) return 0;

  const cursor = new Date();
  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatActivityDate(record: ProgressRecord | undefined): string {
  if (!record) return "Әлі оқу нәтижесі жоқ";

  return new Intl.DateTimeFormat("kk-KZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(record.at));
}

export function ProfilePage() {
  const progress = useProgress();

  const profile = useMemo(() => {
    const totals = summary(progress);
    const completedLessons = lessons.filter(
      (lesson) => lessonStatus(progress, lesson.id) === "done",
    ).length;
    const startedLessons = lessons.filter(
      (lesson) => lessonStatus(progress, lesson.id) === "started",
    ).length;
    const scoredRecords = progress.records.filter((record) => record.score !== null);
    const simulationCount = progress.records.filter((record) => record.kind === "sim").length;
    const highScore = scoredRecords.some((record) => (record.score ?? 0) >= 80);
    const latestRecord = progress.records.reduce<ProgressRecord | undefined>(
      (latest, record) => (!latest || record.at > latest.at ? record : latest),
      undefined,
    );

    const badges: Badge[] = [
      {
        id: "first-step",
        title: "Алғашқы қадам",
        desc: "Алғашқы ойын, тест немесе симуляция аяқталды.",
        icon: "Zap",
        unlocked: totals.count >= 1,
        color: "from-amber-400 to-orange-500",
      },
      {
        id: "lesson-complete",
        title: "Сабақ шебері",
        desc: "Ойын мен тесті бар кемінде бір сабақ аяқталды.",
        icon: "Award",
        unlocked: completedLessons >= 1,
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "researcher",
        title: "Зерттеуші",
        desc: "Кемінде бір интерактивті симуляция орындалды.",
        icon: "FlaskConical",
        unlocked: simulationCount >= 1,
        color: "from-rose-400 to-red-600",
      },
      {
        id: "high-score",
        title: "Нақты жауап",
        desc: "Бағаланған әрекеттердің бірінен 80% не одан жоғары нәтиже алынды.",
        icon: "Target",
        unlocked: highScore,
        color: "from-emerald-400 to-teal-600",
      },
    ];

    return {
      ...totals,
      badges,
      completedLessons,
      startedLessons,
      progressPercent:
        lessons.length === 0 ? 0 : Math.round((completedLessons / lessons.length) * 100),
      streak: currentStreak(progress.records),
      latestActivity: formatActivityDate(latestRecord),
      scoredCount: scoredRecords.length,
      simulationCount,
    };
  }, [progress]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative grid size-20 place-items-center rounded-2xl bg-linear-to-tr from-cyan-400 via-indigo-500 to-purple-600 text-white shadow-xl">
              <Icon name="User" className="size-9" />
              <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950">
                ✓
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Оқу профилі</h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                  {profile.completedLessons} / {lessons.length} сабақ аяқталды
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Көрсеткіштер осы құрылғыдағы оқу нәтижелерінен есептеледі.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-amber-300 shadow-md">
            <Icon name="Flame" className="size-8 text-amber-400" />
            <div>
              <span className="text-[0.7rem] font-bold tracking-wider text-amber-400 uppercase">
                Күндік белсенділік
              </span>
              <p className="text-xl font-bold text-white">
                {profile.streak > 0 ? `${profile.streak} күн қатарынан` : "Белсенділік басталмаған"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 border-t border-white/10 pt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Сабақтар прогресі</span>
            <span className="font-bold text-cyan-300">
              {profile.completedLessons} / {lessons.length} ({profile.progressPercent}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-cyan-400 via-indigo-500 to-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Icon name="Award" className="size-5 text-amber-400" /> Жетістік белгілері
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                  badge.unlocked
                    ? "border-white/15 bg-slate-950/80 text-white"
                    : "border-white/5 bg-slate-950/30 text-slate-500 opacity-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`grid size-10 place-items-center rounded-xl bg-linear-to-tr ${badge.color} text-slate-950 shadow-md`}
                  >
                    <Icon name={badge.icon} className="size-5" />
                  </div>
                  {badge.unlocked ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400">
                      Ашылды
                    </span>
                  ) : (
                    <Icon name="Lock" className="size-4 text-slate-600" />
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-xs font-bold">{badge.title}</h3>
                  <p className="mt-1 text-[0.7rem] leading-snug text-slate-400">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Icon name="BarChart3" className="size-5 text-cyan-400" /> Оқу қорытындысы
          </h2>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <dt className="text-xs text-slate-400">Әрекеттер</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{profile.count}</dd>
              <p className="mt-1 text-[0.7rem] text-slate-500">ойын, тест және симуляция</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <dt className="text-xs text-slate-400">Орташа нәтиже</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{profile.meanScore}%</dd>
              <p className="mt-1 text-[0.7rem] text-slate-500">
                {profile.scoredCount} бағаланған әрекет
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <dt className="text-xs text-slate-400">Оқу уақыты</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{profile.minutes} мин</dd>
              <p className="mt-1 text-[0.7rem] text-slate-500">жазылған әрекеттер бойынша</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <dt className="text-xs text-slate-400">Симуляциялар</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{profile.simulationCount}</dd>
              <p className="mt-1 text-[0.7rem] text-slate-500">соңғы әрекет: {profile.latestActivity}</p>
            </div>
          </dl>

          <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
                <Icon name="ClipboardList" className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Келесі қадам</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {profile.completedLessons === 0
                    ? "Алғашқы сабақты бастау үшін ойын мен тестті орындаңыз."
                    : profile.completedLessons === lessons.length
                      ? "Барлық қолжетімді сабақ аяқталды. Жаңа симуляцияларды зерттеп көріңіз."
                      : `${profile.startedLessons > 0 ? `${profile.startedLessons} басталған сабақты аяқтаңыз немесе ` : ""}келесі сабақты бастаңыз.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300">
              <Icon name="FileText" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">Сертификат және есеп</h3>
                <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-300">
                  Демо
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Алдын ала қарау ғана: PDF сертификат пен есепті жүктеу серверлік қызмет қосылғанда қолжетімді болады.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
