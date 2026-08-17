"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/dashboard/Icon";
import { CaseResponseReview } from "./CaseResponseReview";

interface Student {
  id: string;
  name: string;
  class: string;
  avgScore: number;
  xp: number;
  completedLessons: number;
  status: "Үздік" | "Жақсы" | "Орташа";
}

const STUDENTS: Student[] = [
  { id: "s1", name: "Арман Болатұлы", class: "9-A", avgScore: 94, xp: 1450, completedLessons: 12, status: "Үздік" },
  { id: "s2", name: "Айсұлу Нұрланова", class: "9-A", avgScore: 91, xp: 1380, completedLessons: 11, status: "Үздік" },
  { id: "s3", name: "Данияр Серіков", class: "9-A", avgScore: 82, xp: 1120, completedLessons: 9, status: "Жақсы" },
  { id: "s4", name: "Мадина Қайратова", class: "9-B", avgScore: 78, xp: 950, completedLessons: 8, status: "Жақсы" },
  { id: "s5", name: "Ерасыл Темірханов", class: "9-B", avgScore: 68, xp: 740, completedLessons: 6, status: "Орташа" },
];

export function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState("9-A");
  const [assignedSuccess, setAssignedSuccess] = useState(false);

  const filteredStudents = STUDENTS.filter((s) => s.class === selectedClass);

  const handleAssignLesson = () => {
    setAssignedSuccess(true);
    setTimeout(() => setAssignedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div>
          <span className="rounded-md bg-cyan-500/20 px-2.5 py-1 text-[0.68rem] font-bold text-cyan-300 border border-cyan-500/30">
            Мұғалім порталы · демо
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">
            👩‍🏫 Сынып Үлгерімі & Аналитика Мониторингі
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Үлгі деректер арқылы сынып аналитикасы мен тапсырма жіберу сценарийін алдын ала қарау.
          </p>
        </div>

        <button
          onClick={handleAssignLesson}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-lg"
        >
          <Icon name="ClipboardCheck" className="size-4" />
          <span>Тапсырма жіберуді көрсету</span>
        </button>
      </div>

      {assignedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-500/20 p-4 text-xs text-emerald-300 border border-emerald-500/30 font-semibold"
        >
          Демо: {selectedClass} сыныбына тапсырма жіберу қадамы көрсетілді. Серверге дерек жіберілген жоқ.
        </motion.div>
      )}

      {/* Class Selector & Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        {["9-A", "9-B", "10-A", "10-B"].map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`rounded-2xl p-4 border transition text-left cursor-pointer ${
              selectedClass === cls
                ? "bg-slate-900 border-cyan-400 text-white shadow-lg"
                : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs font-semibold">Сынып</div>
            <div className="text-xl font-bold text-cyan-300 mt-1">{cls} Сыныбы</div>
            <div className="text-[0.7rem] text-slate-400 mt-2">24 Оқушы • Орташа: 87%</div>
          </button>
        ))}
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span>{selectedClass} Сыныбы Оқушыларының Тізімі</span>
          <span className="text-xs text-slate-400 font-normal">Жалпы: {filteredStudents.length} оқушы</span>
        </h2>

        <div className="dash-scroll overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-white/10 bg-slate-950 text-slate-400 uppercase text-[0.68rem]">
              <tr>
                <th className="p-3">Оқушы Аты-жөні</th>
                <th className="p-3">Сыныбы</th>
                <th className="p-3">Орташа Ұпай</th>
                <th className="p-3">Аяқталған Сабақтар</th>
                <th className="p-3">XP Мөлшері</th>
                <th className="p-3">Мәртебесі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition">
                  <td className="p-3 font-semibold text-white">{s.name}</td>
                  <td className="p-3 text-cyan-400">{s.class}</td>
                  <td className="p-3 font-bold text-emerald-400">{s.avgScore}%</td>
                  <td className="p-3">{s.completedLessons} сабақ</td>
                  <td className="p-3 font-mono text-purple-300">{s.xp} XP</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${
                        s.status === "Үздік"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : s.status === "Жақсы"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CaseResponseReview />
    </div>
  );
}
