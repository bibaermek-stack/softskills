"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateRoomCode, getQuestionsForLesson } from "@/lib/teamGame";
import { TeamGameHost } from "./TeamGameHost";
import { TeamGamePlayer } from "./TeamGamePlayer";
import { Icon } from "../Icon";

interface LessonTeamModalProps {
  lessonId: string;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "select" | "host" | "player";

export function LessonTeamModal({ lessonId, lessonTitle, isOpen, onClose }: LessonTeamModalProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [roomCode, setRoomCode] = useState<string>("");

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setMode("host");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Top Bar */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <Icon name="Users" className="size-5" />
              </div>
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Сабақтық Командалық Жарыс
                </span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {lessonTitle}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Icon name="X" className="size-5" />
            </button>
          </div>

          {/* Mode 1: Select Portal */}
          {mode === "select" && (
            <div className="grid gap-6 py-4 md:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/40 p-6 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                    <Icon name="Crown" className="size-6" />
                  </div>
                  <h4 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
                    1. Бөлме Ашу (Host)
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Осы сабақтың сұрақтары бойынша QR-код пен бөлме кодын экранға шығарыңыз.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700"
                >
                  <Icon name="PlusCircle" className="size-4" />
                  Сабақ Бөлмесін Ашу
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                    <Icon name="Gamepad2" className="size-6" />
                  </div>
                  <h4 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
                    2. Бөлмеге Қосылу (Join)
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Мұғалім берген 6 таңбалы бөлме кодын енгізіп, командалық жарысқа кіріңіз.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("player")}
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700"
                >
                  <Icon name="LogIn" className="size-4" />
                  Код Арқылы Қосылу
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Host Room */}
          {mode === "host" && (
            <TeamGameHost
              roomCode={roomCode}
              initialQuestions={getQuestionsForLesson(lessonId)}
              onClose={() => setMode("select")}
            />
          )}

          {/* Mode 3: Player View */}
          {mode === "player" && (
            <TeamGamePlayer onExit={() => setMode("select")} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
