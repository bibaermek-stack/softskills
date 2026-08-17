"use client";

/**
 * Кейстің рөлдік ойынына арналған реалтайм қозғалтқыш.
 *
 * Командалық викторинадағы `TeamGameRealtimeEngine`-мен бір үлгіде жасалған:
 * Supabase Realtime арнасы бар болса — сол, болмаса бір браузердің қойындылары
 * `BroadcastChannel` арқылы сөйлеседі, ал күй `localStorage`-та сақталады.
 * Осының арқасында мұғалім кілттерсіз де сабақта көрсете алады.
 *
 * Викторинадан айырмашылығы үшеу: бөлме кейске байланады, рөлді екі адам ала
 * алмайды және чат күйдің өз ішінде жүреді — кеш қосылған оқушы әңгіменің
 * басын да көреді.
 */

import { isSupabaseConfigured, supabase } from "./client";
import type { RoleplayMember, RoleplayMessage, RoleplayState } from "@/lib/caseRoleplay";

type StateCallback = (state: RoleplayState) => void;

const STORAGE_PREFIX = "case_roleplay_room_";
/** Чат тарихының шегі — кеш қосылғанға жеткілікті, хабарлама көлемі шамалы. */
const MAX_MESSAGES = 80;

type Envelope =
  | { type: "STATE_UPDATE"; payload: RoleplayState }
  | { type: "JOIN_REQUEST"; payload: RoleplayMember }
  | { type: "SYNC_REQUEST" };

export class CaseRoleplayEngine {
  private roomCode: string;
  private channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<StateCallback>();
  private state: RoleplayState;
  private isHost: boolean;

  constructor(roomCode: string, caseId: string, isHost: boolean, initialMember?: RoleplayMember) {
    this.roomCode = roomCode;
    this.isHost = isHost;

    const saved = this.readSaved(roomCode);
    // Сақталған бөлме басқа кейстікі болса, оны қайта пайдаланбаймыз —
    // әйтпесе рөлдер мен раундтар сәйкес келмей қалады.
    this.state =
      saved && saved.caseId === caseId
        ? saved
        : {
            roomCode,
            caseId,
            phase: "lobby",
            members: [],
            roundIndex: 0,
            endsAt: null,
            pausedLeft: null,
            messages: [],
          };

    if (initialMember && !this.state.members.some((m) => m.id === initialMember.id)) {
      this.state.members = [...this.state.members, initialMember];
    }

    if (typeof window !== "undefined") {
      if ("BroadcastChannel" in window) {
        this.broadcastChannel = new BroadcastChannel(`case_roleplay_bc_${roomCode}`);
        this.broadcastChannel.onmessage = (event) => this.handleIncoming(event.data as Envelope);
      }
      window.addEventListener("storage", this.handleStorage);
    }

    if (isSupabaseConfigured && supabase) {
      this.channel = supabase.channel(`case_roleplay_${roomCode}`, {
        config: { broadcast: { self: false } },
      });
      this.channel
        .on("broadcast", { event: "ROLEPLAY_MSG" }, ({ payload }) =>
          this.handleIncoming(payload as Envelope),
        )
        .subscribe();
    }
  }

  private readSaved(roomCode: string): RoleplayState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
      return raw ? (JSON.parse(raw) as RoleplayState) : null;
    } catch {
      return null;
    }
  }

  private handleStorage = (event: StorageEvent) => {
    if (event.key !== `${STORAGE_PREFIX}${this.roomCode}` || !event.newValue) return;
    try {
      this.state = JSON.parse(event.newValue) as RoleplayState;
      this.notify();
    } catch {
      // Бүлінген жазба — қолда бар күймен жалғастырамыз.
    }
  };

  private handleIncoming(msg: Envelope) {
    if (!msg?.type) return;

    if (msg.type === "STATE_UPDATE") {
      this.state = msg.payload;
      this.save();
      this.notify();
      return;
    }

    if (msg.type === "JOIN_REQUEST") {
      // Тізімді тек хост толықтырады, әйтпесе екі клиент бір мезгілде
      // әртүрлі тізім таратып, соңғысы жеңіп кетер еді.
      if (!this.isHost) return;
      const member = msg.payload;
      const exists = this.state.members.some((m) => m.id === member.id);
      this.patch(exists ? {} : { members: [...this.state.members, member] });
      return;
    }

    if (msg.type === "SYNC_REQUEST" && this.isHost) {
      this.patch({});
    }
  }

  subscribe(callback: StateCallback): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getState(): RoleplayState {
    return this.state;
  }

  /** Күйді жаңартып, бәріне тарату. Барлық өзгеріс осы арқылы жүреді. */
  patch(next: Partial<RoleplayState>) {
    this.state = { ...this.state, ...next };
    this.save();
    this.notify();
    this.send({ type: "STATE_UPDATE", payload: this.state });
  }

  join(member: RoleplayMember) {
    if (!this.state.members.some((m) => m.id === member.id)) {
      this.state = { ...this.state, members: [...this.state.members, member] };
      this.save();
      this.notify();
    }
    this.send({ type: "JOIN_REQUEST", payload: member });
  }

  requestSync() {
    this.send({ type: "SYNC_REQUEST" });
  }

  /**
   * Рөлді бекіту. Рөлді басқа біреу алып қойған болса `false` қайтарады —
   * шақыратын жақ хабарламаны сол бойынша көрсетеді.
   */
  claimRole(memberId: string, roleId: string | null): boolean {
    if (roleId && this.state.members.some((m) => m.roleId === roleId && m.id !== memberId)) {
      return false;
    }
    this.patch({
      members: this.state.members.map((m) => (m.id === memberId ? { ...m, roleId } : m)),
    });
    return true;
  }

  postMessage(message: RoleplayMessage) {
    this.patch({ messages: [...this.state.messages, message].slice(-MAX_MESSAGES) });
  }

  private send(msg: Envelope) {
    this.broadcastChannel?.postMessage(msg);
    if (this.channel) {
      void this.channel.send({ type: "broadcast", event: "ROLEPLAY_MSG", payload: msg });
    }
  }

  private save() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${this.roomCode}`, JSON.stringify(this.state));
    } catch {
      // Орын жоқ — бөлме сессия ішінде ғана жұмыс істейді.
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.handleStorage);
    }
    if (this.channel && supabase) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.broadcastChannel?.close();
    this.broadcastChannel = null;
    this.listeners.clear();
  }
}
