"use client";

import { isSupabaseConfigured, supabase } from "./client";
import type { Player, TeamId, GamePhase } from "@/lib/teamGame";

export interface GameStateBroadcast {
  roomCode: string;
  phase: GamePhase;
  currentQuestionIndex: number;
  timerSeconds: number;
  players: Player[];
  teamScores: Record<TeamId, number>;
  answersCount: number;
  revealedAnswerIndex: number | null;
}

type RealtimeCallback = (state: GameStateBroadcast) => void;

export class TeamGameRealtimeEngine {
  private roomCode: string;
  private channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<RealtimeCallback> = new Set();
  private currentState: GameStateBroadcast;

  constructor(roomCode: string, initialPlayers: Player[] = []) {
    this.roomCode = roomCode;
    this.currentState = {
      roomCode,
      phase: "lobby",
      currentQuestionIndex: 0,
      timerSeconds: 20,
      players: initialPlayers,
      teamScores: { red: 0, blue: 0, green: 0, yellow: 0 },
      answersCount: 0,
      revealedAnswerIndex: null,
    };

    // Initialize local BroadcastChannel fallback for multi-window/multi-tab sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel(`team_game_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "STATE_UPDATE") {
          this.currentState = event.data.payload;
          this.notifyListeners();
        }
      };
    }
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentState);

    if (isSupabaseConfigured && supabase && !this.channel) {
      this.channel = supabase.channel(`team_room_${this.roomCode}`, {
        config: { broadcast: { self: true }, presence: { key: this.roomCode } },
      });

      this.channel
        .on("broadcast", { event: "STATE_UPDATE" }, ({ payload }) => {
          this.currentState = payload;
          this.notifyListeners();
        })
        .subscribe();
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  public broadcastState(newState: Partial<GameStateBroadcast>) {
    this.currentState = { ...this.currentState, ...newState };
    this.notifyListeners();

    // 1. Send via local BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "STATE_UPDATE",
        payload: this.currentState,
      });
    }

    // 2. Send via Supabase Realtime if configured
    if (isSupabaseConfigured && supabase && this.channel) {
      this.channel.send({
        type: "broadcast",
        event: "STATE_UPDATE",
        payload: this.currentState,
      });
    }
  }

  public getCurrentState(): GameStateBroadcast {
    return this.currentState;
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  public destroy() {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners.clear();
  }
}
