"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCodeDisplay } from "./QrCodeDisplay";
import {
  TEAMS,
  STEM_QUESTIONS,
  CATEGORIES,
  type Player,
  type TeamId,
  type GamePhase,
  type QuestionCategory,
  type STEMQuestion,
} from "@/lib/teamGame";
import { TeamGameRealtimeEngine, type GameStateBroadcast } from "@/lib/supabase/teamGameRealtime";
import { sounds } from "@/lib/soundEffects";
import { Icon } from "../Icon";

interface TeamGameHostProps {
  roomCode: string;
  initialQuestions?: STEMQuestion[];
  onClose?: () => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  senderName: string;
  left: number;
}

export function TeamGameHost({ roomCode, initialQuestions, onClose }: TeamGameHostProps) {
  const [engine] = useState(() => {
    const eng = new TeamGameRealtimeEngine(roomCode, true);
    if (initialQuestions && initialQuestions.length > 0) {
      eng.broadcastState({ customQuestions: initialQuestions });
    }
    return eng;
  });
  const [gameState, setGameState] = useState<GameStateBroadcast>(() => engine.getCurrentState());
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>("Барлығы");
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Custom question state
  const [customTitle, setCustomTitle] = useState("");
  const [customOptA, setCustomOptA] = useState("");
  const [customOptB, setCustomOptB] = useState("");
  const [customOptC, setCustomOptC] = useState("");
  const [customOptD, setCustomOptD] = useState("");
  const [customCorrect, setCustomCorrect] = useState(0);
  const [customExplanation, setCustomExplanation] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active questions pool (Custom or default filtered by category)
  const activeQuestions: STEMQuestion[] =
    gameState.customQuestions && gameState.customQuestions.length > 0
      ? gameState.customQuestions
      : selectedCategory === "Барлығы"
      ? STEM_QUESTIONS
      : STEM_QUESTIONS.filter((q) => q.category === selectedCategory);

  useEffect(() => {
    const unsubscribeState = engine.subscribe((state) => {
      setGameState(state);
    });

    const unsubscribeReaction = engine.onReaction((emoji, senderName) => {
      const id = Math.random().toString(36).substring(2, 9);
      const left = Math.floor(Math.random() * 80) + 10;
      setFloatingEmojis((prev) => [...prev, { id, emoji, senderName, left }]);
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
      }, 2500);
    });

    return () => {
      unsubscribeState();
      unsubscribeReaction();
      engine.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [engine]);

  // Sound triggers on Phase Changes
  useEffect(() => {
    if (gameState.phase === "game_over") {
      sounds.playVictory();
    } else if (gameState.phase === "reveal") {
      sounds.playCorrect();
    }
  }, [gameState.phase]);

  // Handle Question Countdown Timer
  useEffect(() => {
    if (gameState.phase === "question") {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timerSeconds <= 5 && prev.timerSeconds > 1) {
            sounds.playTick();
          }
          if (prev.timerSeconds <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const q = activeQuestions[prev.currentQuestionIndex];
            const updated = {
              ...prev,
              phase: "reveal" as GamePhase,
              revealedAnswerIndex: q ? q.correctIndex : 0,
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
  }, [gameState.phase, engine, activeQuestions]);

  const handleStartGame = () => {
    const firstQ = activeQuestions[0] || STEM_QUESTIONS[0];
    const newState: Partial<GameStateBroadcast> = {
      phase: "countdown",
      currentQuestionIndex: 0,
      timerSeconds: firstQ.timeLimit,
      revealedAnswerIndex: null,
      answersCount: 0,
      category: selectedCategory,
    };
    engine.broadcastState(newState);

    setTimeout(() => {
      engine.broadcastState({ phase: "question" });
    }, 3000);
  };

  const handleRevealAnswer = () => {
    const q = activeQuestions[gameState.currentQuestionIndex];
    engine.broadcastState({
      phase: "reveal",
      revealedAnswerIndex: q ? q.correctIndex : 0,
    });
  };

  const handleNextQuestion = () => {
    const nextIdx = gameState.currentQuestionIndex + 1;
    if (nextIdx >= activeQuestions.length) {
      engine.broadcastState({ phase: "game_over" });
    } else {
      const q = activeQuestions[nextIdx];
      engine.broadcastState({
        phase: "question",
        currentQuestionIndex: nextIdx,
        timerSeconds: q.timeLimit,
        revealedAnswerIndex: null,
        answersCount: 0,
      });
    }
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customOptA || !customOptB) return;

    const newQ: STEMQuestion = {
      id: `custom_${Math.random().toString(36).substring(2, 9)}`,
      category: "STEM & Робототехника",
      title: customTitle,
      options: [customOptA, customOptB, customOptC || "Жауап 3", customOptD || "Жауап 4"],
      correctIndex: customCorrect,
      explanation: customExplanation || "Арнайы мұғалім сұрағы.",
      timeLimit: 20,
      points: 100,
    };

    const currentCustom = gameState.customQuestions || [];
    const updatedCustom = [...currentCustom, newQ];
    engine.broadcastState({ customQuestions: updatedCustom });

    // Reset inputs
    setCustomTitle("");
    setCustomOptA("");
    setCustomOptB("");
    setCustomOptC("");
    setCustomOptD("");
    setCustomExplanation("");
    setIsCustomModalOpen(false);
  };

  const handleCloseRoom = () => {
    engine.broadcastState({ phase: "room_closed" });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`team_game_room_${roomCode}`);
      } catch {
        // Ignore
      }
    }
    onClose?.();
  };

  const toggleSoundMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const currentQ = activeQuestions[gameState.currentQuestionIndex] || STEM_QUESTIONS[0];

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
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: 350, scale: 0.5 }}
              animate={{ opacity: 0, y: 50, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              style={{ left: `${item.left}%` }}
              className="absolute bottom-10 flex flex-col items-center"
            >
              <span className="text-4xl drop-shadow-md">{item.emoji}</span>
              <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-sm">
                {item.senderName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
              Бөлме коды: <span className="font-bold text-blue-600">{roomCode}</span> • Ойыншылар: {gameState.players.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSoundMute}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Icon name={isMuted ? "Bell" : "Bell"} className="size-4 text-blue-600" />
            {isMuted ? "Дыбыс сөндірулі" : "Дыбыс қосулы"}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={handleCloseRoom}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <Icon name="X" className="size-4" />
              Бөлмені жабу
            </button>
          )}
        </div>
      </div>

      {/* PHASE 1: LOBBY */}
      {gameState.phase === "lobby" && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left: QR Code & Category Selector */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50 md:col-span-5">
            <h3 className="mb-3 text-center font-display text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Пән Тақырыбын Таңдаңыз:
            </h3>

            {/* Category Selector */}
            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <QrCodeDisplay roomCode={roomCode} size={190} />

            {/* Custom Question Button */}
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
            >
              <Icon name="PlusCircle" className="size-4" />
              + Өз сұрағыңды қосу ({gameState.customQuestions?.length || 0})
            </button>

            <button
              type="button"
              onClick={handleStartGame}
              disabled={gameState.players.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
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
            Ойын дайындалуда... ({selectedCategory})
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
              Сұрақ {gameState.currentQuestionIndex + 1} / {activeQuestions.length} • {currentQ.category}
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
                {gameState.currentQuestionIndex + 1 >= activeQuestions.length ? (
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
            {[1, 0, 2].map((rankIndex) => {
              const currentTeam = sortedTeams[rankIndex];
              if (!currentTeam) return null;

              const rank = rankIndex + 1;
              const heightClass = rank === 1 ? "h-52 border-2" : rank === 2 ? "h-44" : "h-36";
              const medals = ["🥇 1-орын", "🥈 2-орын", "🥉 3-орын"];

              return (
                <div
                  key={currentTeam.id}
                  className={`flex flex-1 flex-col items-center rounded-2xl p-4 ${heightClass} justify-between shadow-lg transition-transform hover:scale-105`}
                  style={{
                    borderColor: currentTeam.color,
                    backgroundColor: rank === 1 ? `${currentTeam.color}25` : `${currentTeam.color}15`,
                  }}
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {medals[rankIndex]}
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">{currentTeam.badge}</span>
                    <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      {currentTeam.name}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-3.5 py-1 text-xs font-black text-white shadow-sm"
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

      {/* CUSTOM QUESTION MODAL */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Арнайы Сұрақ Қосу
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <Icon name="X" className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomQuestion} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Сұрақ мәтіні:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Сұрақты осы жерге жазыңыз..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.7rem] font-bold text-red-500">Жауап A:</label>
                    <input
                      type="text"
                      required
                      value={customOptA}
                      onChange={(e) => setCustomOptA(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-bold text-blue-500">Жауап B:</label>
                    <input
                      type="text"
                      required
                      value={customOptB}
                      onChange={(e) => setCustomOptB(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-bold text-green-500">Жауап C:</label>
                    <input
                      type="text"
                      value={customOptC}
                      onChange={(e) => setCustomOptC(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-bold text-amber-500">Жауап D:</label>
                    <input
                      type="text"
                      value={customOptD}
                      onChange={(e) => setCustomOptD(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Дұрыс жауабы қайсысы?:
                  </label>
                  <select
                    value={customCorrect}
                    onChange={(e) => setCustomCorrect(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={0}>A жауабы</option>
                    <option value={1}>B жауабы</option>
                    <option value={2}>C жауабы</option>
                    <option value={3}>D жауабы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Түсіндірме (міндетті емес):
                  </label>
                  <input
                    type="text"
                    placeholder="Дұрыс жауаптың қысқаша түсіндірмесі..."
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    Бас тарту
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                  >
                    Сұрақты Сақтау
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
