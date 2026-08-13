"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { QrCodeDisplay } from "./QrCodeDisplay";
import {
  TEAMS,
  STEM_QUESTIONS,
  type Player,
  type TeamId,
  type GamePhase,
} from "@/lib/teamGame";
import { TeamGameRealtimeEngine, type GameStateBroadcast } from "@/lib/supabase/teamGameRealtime";
import { Icon } from "../Icon";

interface TeamGameHostProps {
  roomCode: string;
  onClose?: () => void;
}

export function TeamGameHost({ roomCode, onClose }: TeamGameHostProps) {
  const [engine] = useState(() => new TeamGameRealtimeEngine(roomCode, true));
  const [gameState, setGameState] = useState<GameStateBroadcast>(() => engine.getCurrentState());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = engine.subscribe((state) => {
      setGameState(state);
    });
    return () => {
      unsubscribe();
      engine.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [engine]);

  // Handle Question Countdown Timer
  useEffect(() => {
    if (gameState.phase === "question") {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timerSeconds <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const updated = {
              ...prev,
              phase: "reveal" as GamePhase,
              revealedAnswerIndex: STEM_QUESTIONS[prev.currentQuestionIndex]?.correctIndex ?? 0,
            };
            engine.broadcastState(updated);
            return updated;
          }
          const updated = { ...prev, timerSeconds: prev.timerSeconds - 1 };
          engine.broadcastState(updated);
          return updated;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase, engine]);

  const handleStartGame = () => {
    const firstQ = STEM_QUESTIONS[0];
    const newState: Partial<GameStateBroadcast> = {
      phase: "countdown",
      currentQuestionIndex: 0,
      timerSeconds: firstQ.timeLimit,
      revealedAnswerIndex: null,
      answersCount: 0,
    };
    engine.broadcastState(newState);

    setTimeout(() => {
      engine.broadcastState({ phase: "question" });
    }, 3000);
  };

  const handleRevealAnswer = () => {
    const q = STEM_QUESTIONS[gameState.currentQuestionIndex];
    engine.broadcastState({
      phase: "reveal",
      revealedAnswerIndex: q ? q.correctIndex : 0,
    });
  };

  const handleNextQuestion = () => {
    const nextIdx = gameState.currentQuestionIndex + 1;
    if (nextIdx >= STEM_QUESTIONS.length) {
      engine.broadcastState({ phase: "game_over" });
    } else {
      const q = STEM_QUESTIONS[nextIdx];
      engine.broadcastState({
        phase: "question",
        currentQuestionIndex: nextIdx,
        timerSeconds: q.timeLimit,
        revealedAnswerIndex: null,
        answersCount: 0,
      });
    }
  };

  const currentQ = STEM_QUESTIONS[gameState.currentQuestionIndex];

  // Group players by Team
  const playersByTeam = TEAMS.reduce((acc, team) => {
    acc[team.id] = gameState.players.filter((p) => p.teamId === team.id);
    return acc;
  }, {} as Record<TeamId, Player[]>);

  // Sorted teams by total score
  const sortedTeams = [...TEAMS]
    .map((team) => {
      const score = (playersByTeam[team.id] || []).reduce((sum, p) => sum + p.score, 0);
      return { ...team, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Icon name="Gamepad2" className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Командалық Ойын Панелі (Host)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Бөлме коды: <span className="font-bold text-blue-600">{roomCode}</span> • Пайдаланушылар: {gameState.players.length}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Icon name="X" className="size-4" />
            Бөлмені жабу
          </button>
        )}
      </div>

      {/* PHASE 1: LOBBY */}
      {gameState.phase === "lobby" && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left: QR Code & Code */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50 md:col-span-5">
            <h3 className="mb-4 text-center font-display text-sm font-bold text-slate-800 dark:text-slate-200">
              Студенттер қосылуы үшін QR кодты көрсетіңіз:
            </h3>
            <QrCodeDisplay roomCode={roomCode} size={210} />

            <button
              type="button"
              onClick={handleStartGame}
              disabled={gameState.players.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            >
              <Icon name="Play" className="size-4 fill-white" />
              Ойынды Бастау ({gameState.players.length} Ойыншы)
            </button>
          </div>

          {/* Right: Connected Teams & Players */}
          <div className="flex flex-col md:col-span-7">
            <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              Командалар құрамы:
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {TEAMS.map((team) => {
                const members = playersByTeam[team.id] || [];
                return (
                  <div
                    key={team.id}
                    className="flex flex-col rounded-xl border p-3.5"
                    style={{
                      borderColor: `${team.color}35`,
                      backgroundColor: `${team.color}08`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <span>{team.badge}</span>
                        <span>{team.name}</span>
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.68rem] font-bold text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        {members.length}
                      </span>
                    </div>

                    <div className="flex min-h-[70px] flex-wrap gap-1.5 align-content-start rounded-lg bg-white/60 p-2 dark:bg-slate-900/60">
                      {members.length === 0 ? (
                        <span className="text-[0.72rem] italic text-slate-400">Ойыншы күтілуде...</span>
                      ) : (
                        members.map((p) => (
                          <span
                            key={p.id}
                            className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium shadow-sm dark:bg-slate-800 dark:text-white"
                          >
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: COUNTDOWN */}
      {gameState.phase === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex size-24 items-center justify-center rounded-full bg-blue-600 text-5xl font-black text-white shadow-2xl"
          >
            🚀
          </motion.div>
          <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
            Ойын дайындалуда...
          </h3>
          <p className="text-sm text-slate-500">Сұрақтар басталуда!</p>
        </div>
      )}

      {/* PHASE 3 & 4: QUESTION & REVEAL */}
      {(gameState.phase === "question" || gameState.phase === "reveal") && currentQ && (
        <div className="flex flex-col gap-6">
          {/* Top Bar: Progress & Timer */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800">
            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Сұрақ {gameState.currentQuestionIndex + 1} / {STEM_QUESTIONS.length} • {currentQ.category}
            </span>

            <div className="flex items-center gap-2">
              <Icon name="Clock" className="size-4 text-blue-600" />
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                {gameState.timerSeconds}с
              </span>
            </div>

            <span className="text-xs font-medium text-slate-500">
              Жауап берді: <b className="text-slate-900 dark:text-white">{gameState.answersCount}</b> / {gameState.players.length}
            </span>
          </div>

          {/* Question Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-inner dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              {currentQ.title}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {currentQ.options.map((opt, idx) => {
              const isCorrect = gameState.phase === "reveal" && idx === currentQ.correctIndex;
              const optionLetters = ["A", "B", "C", "D"];
              const optionColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

              return (
                <div
                  key={opt}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                    isCorrect
                      ? "border-green-500 bg-green-50 shadow-md dark:bg-green-950/40"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg font-bold text-white"
                    style={{ backgroundColor: optionColors[idx] }}
                  >
                    {optionLetters[idx]}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {opt}
                  </span>
                  {isCorrect && <Icon name="CheckCircle2" className="ml-auto size-6 text-green-600" />}
                </div>
              );
            })}
          </div>

          {/* Explanation Box on Reveal */}
          {gameState.phase === "reveal" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-green-200 bg-green-50/80 p-4 dark:border-green-900/50 dark:bg-green-950/30"
            >
              <h4 className="flex items-center gap-2 text-xs font-bold text-green-800 dark:text-green-300">
                <Icon name="Info" className="size-4" /> Түсіндірме:
              </h4>
              <p className="mt-1 text-sm text-green-900 dark:text-green-200">
                {currentQ.explanation}
              </p>
            </motion.div>
          )}

          {/* Host Action Button */}
          <div className="flex justify-end pt-2">
            {gameState.phase === "question" ? (
              <button
                type="button"
                onClick={handleRevealAnswer}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                <Icon name="Eye" className="size-4" />
                Дұрыс жауапты ашу
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-green-700"
              >
                {gameState.currentQuestionIndex + 1 >= STEM_QUESTIONS.length ? (
                  <>
                    <Icon name="Trophy" className="size-4" /> Финалдық Нәтижені Көру
                  </>
                ) : (
                  <>
                    Келесі сұрақ <Icon name="ArrowRight" className="size-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* PHASE 5: GAME OVER PODIUM */}
      {gameState.phase === "game_over" && (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="text-5xl">🏆</span>
          <h3 className="mt-3 font-display text-2xl font-black text-slate-900 dark:text-white">
            Ойын Аяқталды! Жеңімпаздар:
          </h3>

          {/* Podium */}
          <div className="mt-8 flex w-full max-w-xl items-end justify-center gap-4">
            {sortedTeams.slice(0, 3).map((team, idx) => {
              const heights = ["h-44", "h-36", "h-28"];
              const medals = ["🥇 1-орын", "🥈 2-орын", "🥉 3-орын"];
              const order = [1, 0, 2]; // Center top team
              const currentTeam = sortedTeams[order[idx]];

              if (!currentTeam) return null;

              return (
                <div
                  key={currentTeam.id}
                  className={`flex flex-1 flex-col items-center rounded-2xl border p-4 ${heights[idx]} justify-between shadow-lg`}
                  style={{
                    borderColor: currentTeam.color,
                    backgroundColor: `${currentTeam.color}15`,
                  }}
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {medals[order[idx]]}
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">{currentTeam.badge}</span>
                    <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      {currentTeam.name}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black text-white"
                    style={{ backgroundColor: currentTeam.color }}
                  >
                    {currentTeam.score} ұпай
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700"
          >
            <Icon name="RotateCcw" className="size-4" />
            Қайта Бастау
          </button>
        </div>
      )}
    </div>
  );
}
