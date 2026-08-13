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

const STORAGE_KEY_PREFIX = "team_game_room_";

export class TeamGameRealtimeEngine {
  private roomCode: string;
  private channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<RealtimeCallback> = new Set();
  private currentState: GameStateBroadcast;
  private isHost: boolean;

  constructor(roomCode: string, isHost: boolean = false, initialPlayer?: Player) {
    this.roomCode = roomCode;
    this.isHost = isHost;

    // 1. Try restoring existing room state from localStorage
    let savedState: GameStateBroadcast | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roomCode}`);
        if (raw) {
          savedState = JSON.parse(raw);
        }
      } catch {
        // Ignore
      }
    }

    this.currentState = savedState || {
      roomCode,
      phase: "lobby",
      currentQuestionIndex: 0,
      timerSeconds: 20,
      players: initialPlayer ? [initialPlayer] : [],
      teamScores: { red: 0, blue: 0, green: 0, yellow: 0 },
      answersCount: 0,
      revealedAnswerIndex: null,
    };

    if (initialPlayer && !this.currentState.players.some((p) => p.id === initialPlayer.id)) {
      this.currentState.players.push(initialPlayer);
    }

    // 2. Local BroadcastChannel for instant multi-window / multi-tab synchronization
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel(`team_game_bc_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    }

    // 3. Sync storage listener for same-browser tabs fallback
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.handleStorageEvent);
    }

    // 4. Initialize Supabase Realtime if configured
    this.initSupabaseRealtime();
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `${STORAGE_KEY_PREFIX}${this.roomCode}` && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        this.currentState = updated;
        this.notifyListeners();
      } catch {
        // Ignore
      }
    }
  };

  private initSupabaseRealtime() {
    if (isSupabaseConfigured && supabase && !this.channel) {
      this.channel = supabase.channel(`team_room_chan_${this.roomCode}`, {
        config: { broadcast: { self: false } },
      });

      this.channel
        .on("broadcast", { event: "GAME_MSG" }, ({ payload }) => {
          this.handleIncomingMessage(payload);
        })
        .subscribe();
    }
  }

  private handleIncomingMessage(msg: { type: string; payload?: unknown }) {
    if (!msg || !msg.type) return;

    if (msg.type === "STATE_UPDATE") {
      const state = msg.payload as GameStateBroadcast;
      this.currentState = state;
      this.saveLocalState();
      this.notifyListeners();
    } else if (msg.type === "JOIN_REQUEST") {
      const newPlayer = msg.payload as Player;
      if (newPlayer && newPlayer.id) {
        const exists = this.currentState.players.some((p) => p.id === newPlayer.id);
        if (!exists) {
          const updatedPlayers = [...this.currentState.players, newPlayer];
          this.broadcastState({ players: updatedPlayers });
        } else {
          // Send back full current state so newcomer gets synced
          this.broadcastState({});
        }
      }
    } else if (msg.type === "SYNC_REQUEST") {
      // If we are host, broadcast authoritative state
      if (this.isHost) {
        this.broadcastState({});
      }
    }
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public joinRoom(player: Player) {
    const exists = this.currentState.players.some((p) => p.id === player.id);
    if (!exists) {
      this.currentState.players.push(player);
    }
    this.saveLocalState();
    this.notifyListeners();

    const msg = { type: "JOIN_REQUEST", payload: player };
    this.sendRawMessage(msg);
  }

  public requestSync() {
    this.sendRawMessage({ type: "SYNC_REQUEST" });
  }

  public broadcastState(newState: Partial<GameStateBroadcast>) {
    this.currentState = { ...this.currentState, ...newState };
    this.saveLocalState();
    this.notifyListeners();

    const msg = { type: "STATE_UPDATE", payload: this.currentState };
    this.sendRawMessage(msg);
  }

  private sendRawMessage(msg: { type: string; payload?: unknown }) {
    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {
        // Ignore
      }
    }

    // 2. Supabase Realtime
    if (isSupabaseConfigured && supabase && this.channel) {
      this.channel.send({
        type: "broadcast",
        event: "GAME_MSG",
        payload: msg,
      });
    }
  }

  private saveLocalState() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${this.roomCode}`,
          JSON.stringify(this.currentState)
        );
      } catch {
        // Ignore
      }
    }
  }

  public getCurrentState(): GameStateBroadcast {
    return this.currentState;
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  public destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.handleStorageEvent);
    }
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
