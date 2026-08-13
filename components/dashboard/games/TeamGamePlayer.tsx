"use client";

import { useState, useEffect } from "react";
import {
  TEAMS,
  AVATARS,
  STEM_QUESTIONS,
  type Player,
  type TeamId,
} from "@/lib/teamGame";
import { TeamGameRealtimeEngine, type GameStateBroadcast } from "@/lib/supabase/teamGameRealtime";
import { Icon } from "../Icon";

interface TeamGamePlayerProps {
  initialRoomCode?: string;
  onExit?: () => void;
}

export function TeamGamePlayer({ initialRoomCode = "", onExit }: TeamGamePlayerProps) {
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamId>("red");
  const [selectedAvatar, setSelectedAvatar] = useState("🚀");

  const [joined, setJoined] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [engine, setEngine] = useState<TeamGameRealtimeEngine | null>(null);
  const [gameState, setGameState] = useState<GameStateBroadcast | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode);
    }
  }, [initialRoomCode]);

  useEffect(() => {
    if (!engine) return;
    const unsubscribe = engine.subscribe((state) => {
      setGameState(state);
    });
    return () => {
      unsubscribe();
    };
  }, [engine]);

  // Reset answer status when question changes
  useEffect(() => {
    if (gameState?.phase === "question") {
      setSelectedOption(null);
      setHasAnswered(false);
    }
  }, [gameState?.currentQuestionIndex, gameState?.phase]);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim();
    const cleanName = playerName.trim();

    if (!cleanCode || !cleanName) return;

    const pid = `p_${Math.random().toString(36).substring(2, 9)}`;
    const newPlayer: Player = {
      id: pid,
      name: cleanName,
      teamId: selectedTeam,
      score: 0,
      isHost: false,
      avatar: selectedAvatar,
      joinedAt: Date.now(),
    };

    const newEngine = new TeamGameRealtimeEngine(cleanCode, false, newPlayer);
    newEngine.joinRoom(newPlayer);

    setMyPlayerId(pid);
    setEngine(newEngine);
    setGameState(newEngine.getCurrentState());
    setJoined(true);
  };

  const handleChooseAnswer = (optionIdx: number) => {
    if (hasAnswered || !gameState || gameState.phase !== "question" || !engine) return;

    setSelectedOption(optionIdx);
    setHasAnswered(true);

    const q = STEM_QUESTIONS[gameState.currentQuestionIndex];
    const isCorrect = q && optionIdx === q.correctIndex;
    const gainedPoints = isCorrect ? q.points : 0;

    // Update player & team score
    const updatedPlayers = gameState.players.map((p) => {
      if (p.id === myPlayerId) {
        return { ...p, score: p.score + gainedPoints };
      }
      return p;
    });

    const answersCount = gameState.answersCount + 1;
    engine.broadcastState({
      players: updatedPlayers,
      answersCount,
    });
  };

  // FORM VIEW: Name & Team Entry (No Login Required!)
  if (!joined) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-500/30">
            🎮
          </div>
          <h2 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-white">
            Командалық Ойынға Кіру
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Тіркелу талап етілмейді. Тек атыңызды жазып, бөлмеге қосылыңыз!
          </p>
        </div>

        <form onSubmit={handleJoinGame} className="mt-6 flex flex-col gap-4">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Бөлме Коды:
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Мысалы: 742910"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Атыңыз (Никнейм):
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="Аты-жөніңізді жазыңыз..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Аватар таңдаңыз:
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {AVATARS().map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`flex size-9 items-center justify-center rounded-xl text-lg transition ${
                    selectedAvatar === av
                      ? "bg-blue-600 ring-2 ring-blue-500 ring-offset-2"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Team Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Команда таңдаңыз:
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {TEAMS.map((team) => {
                const active = selectedTeam === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeam(team.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                      active ? "shadow-md ring-2" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      borderColor: team.color,
                      backgroundColor: active ? `${team.color}20` : "transparent",
                      color: active ? team.color : undefined,
                    }}
                  >
                    <span className="text-base">{team.badge}</span>
                    <span>{team.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Icon name="LogIn" className="size-4" />
            Ойынға Кіру
          </button>
        </form>
      </div>
    );
  }

  // GAME VIEW: Player Controller
  const currentQ = STEM_QUESTIONS[gameState?.currentQuestionIndex ?? 0];
  const myPlayer = gameState?.players.find((p) => p.id === myPlayerId);
  const myTeam = TEAMS.find((t) => t.id === selectedTeam);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Player Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{selectedAvatar}</span>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              {playerName}
            </h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.68rem] font-bold text-white"
              style={{ backgroundColor: myTeam?.color }}
            >
              <span>{myTeam?.badge}</span>
              <span>{myTeam?.name}</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[0.68rem] font-semibold text-slate-400">Ұпайыңыз</span>
          <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-400">
            {myPlayer?.score ?? 0}
          </span>
        </div>
      </div>

      {/* LOBBY / WAITING */}
      {gameState?.phase === "lobby" && (
        <div className="py-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50 text-3xl animate-bounce dark:bg-blue-950/60">
            ⏳
          </div>
          <h4 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
            Сіз Бөлмеге Қосылдыңыз!
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ұйымдастырушы (Host) ойынды бастауын күтіңіз...
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Бөлме Коды: <b className="text-blue-600">{roomCodeInput}</b>
          </div>
        </div>
      )}

      {/* QUESTION PHASE */}
      {(gameState?.phase === "question" || gameState?.phase === "reveal") && currentQ && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Сұрақ {gameState.currentQuestionIndex + 1} / {STEM_QUESTIONS.length}</span>
            <span className="font-mono text-sm text-blue-600">{gameState.timerSeconds}с</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-center font-semibold text-slate-900 dark:bg-slate-800 dark:text-white">
            {currentQ.title}
          </div>

          {/* Option Buttons (A, B, C, D) */}
          <div className="grid gap-2.5">
            {currentQ.options.map((opt, idx) => {
              const optionLetters = ["A", "B", "C", "D"];
              const optionColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
              const isSelected = selectedOption === idx;
              const isCorrect = gameState.phase === "reveal" && idx === currentQ.correctIndex;

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={hasAnswered || gameState.phase === "reveal"}
                  onClick={() => handleChooseAnswer(idx)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-bold transition active:scale-[0.98] disabled:cursor-default ${
                    isCorrect
                      ? "border-green-500 bg-green-500 text-white shadow-lg"
                      : isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
                  }`}
                >
                  <span
                    className="flex size-8 items-center justify-center rounded-lg font-bold text-white"
                    style={{ backgroundColor: isSelected || isCorrect ? "rgba(255,255,255,0.25)" : optionColors[idx] }}
                  >
                    {optionLetters[idx]}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {hasAnswered && gameState.phase === "question" && (
            <div className="mt-2 rounded-xl bg-blue-50 p-3 text-center text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              ✓ Жауабыңыз қабылданды! Басқа ойыншыларды күтіңіз...
            </div>
          )}
        </div>
      )}

      {/* GAME OVER PHASE */}
      {gameState?.phase === "game_over" && (
        <div className="py-8 text-center">
          <span className="text-4xl">🎉</span>
          <h4 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            Ойын Аяқталды!
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Сіздің жинаған балыңыз: <b className="text-blue-600">{myPlayer?.score ?? 0} ұпай</b>
          </p>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="mt-6 w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Шығу
            </button>
          )}
        </div>
      )}
    </div>
  );
}
