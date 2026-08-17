"use client";

/**
 * Кейстің рөлдік ойынына арналған реалтайм қозғалтқыш.
 *
 * Supabase Realtime арнасы бар болса — сол, болмаса бір браузердің қойындылары
 * `BroadcastChannel` арқылы сөйлеседі. Осының арқасында мұғалім кілттерсіз де
 * сабақта көрсете алады.
 *
 * **Күйдің бір ғана иесі бар — бөлмені ашқан адам (хост).** Қалғандары күйді
 * ешқашан таратпайды, тек ниет жібереді: «қосыламын», «осы рөлді аламын»,
 * «мынау хабарым». Хост оларды қабылдап, жаңа күйді бәріне таратады.
 *
 * Бұл ереже бос жерден шықпаған: бұрын әркім өз күйін тарататын еді, ал жаңа
 * қосылған адамның күйінде әлі өзінен басқа ешкім жоқ болатын. Оның бірінші
 * хабары хосттың тізімін сол бос тізіммен алмастырып, бөлмедегілерді шығарып,
 * хостты өз бөлмесінде «қатысушы емес» етіп қоятын — сондықтан QR да, «ойынды
 * бастау» да жоғалып кететін.
 */

import { isSupabaseConfigured, supabase } from "./client";
import type { RoleplayMember, RoleplayMessage, RoleplayState } from "@/lib/caseRoleplay";

type StateCallback = (state: RoleplayState) => void;

const STORAGE_PREFIX = "case_roleplay_room_";
/** Чат тарихының шегі — кеш қосылғанға жеткілікті, хабарлама көлемі шамалы. */
const MAX_MESSAGES = 80;
/** Хост әлі тыңдамаған болуы мүмкін — синхрондауды бірнеше рет сұраймыз. */
const SYNC_RETRIES_MS = [250, 1000, 2500, 5000];

type Envelope =
  | { type: "STATE_UPDATE"; payload: RoleplayState }
  | { type: "JOIN"; payload: RoleplayMember }
  | { type: "CLAIM_ROLE"; payload: { memberId: string; roleId: string | null } }
  | { type: "CHAT"; payload: RoleplayMessage }
  | { type: "SYNC_REQUEST" };

export class CaseRoleplayEngine {
  private roomCode: string;
  private channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<StateCallback>();
  private state: RoleplayState;
  private isHost: boolean;
  private syncTimers: number[] = [];
  /** Қонақ хосттан кемінде бір күй алды ма — интерфейс «қосылуда» деп тұрады. */
  private synced: boolean;

  constructor(roomCode: string, caseId: string, isHost: boolean, initialMember?: RoleplayMember) {
    this.roomCode = roomCode;
    this.isHost = isHost;
    this.synced = isHost;

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

    // Өзін бірден көрсетеміз. Қонақта бұл тек жергілікті көрініс — шын тізімді
    // хост жібереді.
    if (initialMember && !this.state.members.some((m) => m.id === initialMember.id)) {
      this.state = { ...this.state, members: [...this.state.members, initialMember] };
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

  /**
   * Бір браузердің басқа қойындысы жазған күй. Тек хост жазатындықтан, бұл
   * әрқашан бөлме иесінің күйі болады.
   */
  private handleStorage = (event: StorageEvent) => {
    if (this.isHost) return;
    if (event.key !== `${STORAGE_PREFIX}${this.roomCode}` || !event.newValue) return;
    try {
      this.applyRemoteState(JSON.parse(event.newValue) as RoleplayState);
    } catch {
      // Бүлінген жазба — қолда бар күймен жалғастырамыз.
    }
  };

  private handleIncoming(msg: Envelope) {
    if (!msg?.type) return;

    if (msg.type === "STATE_UPDATE") {
      // Күйді тек хост таратады, сондықтан хост оны қабылдамайды.
      if (!this.isHost) this.applyRemoteState(msg.payload);
      return;
    }

    // Қалған хабарлардың бәрі — хостқа арналған ниеттер.
    if (!this.isHost) return;

    if (msg.type === "JOIN") {
      const member = msg.payload;
      const exists = this.state.members.some((m) => m.id === member.id);
      this.commit(exists ? {} : { members: [...this.state.members, member] });
      return;
    }

    if (msg.type === "CLAIM_ROLE") {
      this.applyClaim(msg.payload.memberId, msg.payload.roleId);
      return;
    }

    if (msg.type === "CHAT") {
      this.appendMessage(msg.payload);
      return;
    }

    if (msg.type === "SYNC_REQUEST") {
      this.commit({});
    }
  }

  private applyRemoteState(state: RoleplayState) {
    if (state.roomCode !== this.roomCode || state.caseId !== this.state.caseId) return;
    this.synced = true;
    this.clearSyncTimers();
    this.state = state;
    this.notify();
  }

  /** Хост: күйді жаңартып, сақтап, бәріне тарату. */
  private commit(next: Partial<RoleplayState>) {
    this.state = { ...this.state, ...next };
    this.save();
    this.notify();
    this.send({ type: "STATE_UPDATE", payload: this.state });
  }

  private applyClaim(memberId: string, roleId: string | null): boolean {
    if (roleId && this.state.members.some((m) => m.roleId === roleId && m.id !== memberId)) {
      return false;
    }
    this.commit({
      members: this.state.members.map((m) => (m.id === memberId ? { ...m, roleId } : m)),
    });
    return true;
  }

  private appendMessage(message: RoleplayMessage) {
    if (this.state.messages.some((m) => m.id === message.id)) return;
    this.commit({ messages: [...this.state.messages, message].slice(-MAX_MESSAGES) });
  }

  // --- Ашық API -----------------------------------------------------------

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

  /** Қонақ хосттың күйін алды ма. Хост үшін әрқашан true. */
  isSynced(): boolean {
    return this.synced;
  }

  /** Бөлмені басқару — тек хост шақырады (таймер, раунд, ойынды бастау). */
  patch(next: Partial<RoleplayState>) {
    if (!this.isHost) return;
    this.commit(next);
  }

  join(member: RoleplayMember) {
    if (this.isHost) {
      if (!this.state.members.some((m) => m.id === member.id)) {
        this.commit({ members: [...this.state.members, member] });
      }
      return;
    }
    this.send({ type: "JOIN", payload: member });
    this.scheduleSyncRetries();
  }

  /**
   * Рөлді бекіту. Хост бірден шешеді; қонақ ниетін жібереді, ал нәтижені
   * хосттан келген күйден көреді. `false` — рөл әлдеқашан алынған.
   */
  claimRole(memberId: string, roleId: string | null): boolean {
    if (roleId && this.state.members.some((m) => m.roleId === roleId && m.id !== memberId)) {
      return false;
    }
    if (this.isHost) return this.applyClaim(memberId, roleId);
    this.send({ type: "CLAIM_ROLE", payload: { memberId, roleId } });
    return true;
  }

  postMessage(message: RoleplayMessage) {
    if (this.isHost) {
      this.appendMessage(message);
      return;
    }
    this.send({ type: "CHAT", payload: message });
  }

  requestSync() {
    if (this.isHost) return;
    this.send({ type: "SYNC_REQUEST" });
    this.scheduleSyncRetries();
  }

  private scheduleSyncRetries() {
    if (this.isHost || typeof window === "undefined") return;
    this.clearSyncTimers();
    this.syncTimers = SYNC_RETRIES_MS.map((delay) =>
      window.setTimeout(() => {
        if (!this.synced) this.send({ type: "SYNC_REQUEST" });
      }, delay),
    );
  }

  private clearSyncTimers() {
    if (typeof window === "undefined") return;
    this.syncTimers.forEach((id) => window.clearTimeout(id));
    this.syncTimers = [];
  }

  private send(msg: Envelope) {
    this.broadcastChannel?.postMessage(msg);
    if (this.channel) {
      void this.channel.send({ type: "broadcast", event: "ROLEPLAY_MSG", payload: msg });
    }
  }

  /** Тек хост жазады — әйтпесе қонақтың жартылай күйі бөлмені бүлдірер еді. */
  private save() {
    if (!this.isHost || typeof window === "undefined") return;
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
    this.clearSyncTimers();
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
