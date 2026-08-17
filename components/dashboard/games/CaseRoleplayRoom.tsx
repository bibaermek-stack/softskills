"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import type { CaseRole, CaseRound } from "@/lib/caseTasks";
import {
  ROLEPLAY_AVATARS,
  formatClock,
  generateRoleplayCode,
  secondsLeft,
  type RoleplayMember,
  type RoleplayMessage,
  type RoleplayState,
} from "@/lib/caseRoleplay";
import { CaseRoleplayEngine } from "@/lib/supabase/caseRoleplayRealtime";
import { Icon } from "../Icon";
import { QrCodeDisplay } from "./QrCodeDisplay";

/**
 * Кейстің онлайн рөлдік ойыны.
 *
 * Ағыны: бөлме ашу немесе кодпен қосылу → әркім өз рөлін таңдайды → хост
 * ойынды бастайды → раундтар ортақ таймермен жүреді. Чат бөлменің басынан
 * аяғына дейін ашық: рөлдік ойында сөйлесу — қосымша емес, ойынның өзі.
 */

type Mode = "closed" | "host" | "join";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function systemMessage(text: string): RoleplayMessage {
  return {
    id: newId("sys"),
    authorId: "system",
    authorName: "Жүйе",
    avatar: "🔔",
    text,
    at: Date.now(),
    system: true,
  };
}

export function CaseRoleplayRoom({
  caseId,
  roles,
  rounds,
  accent,
  initialCode,
}: {
  caseId: string;
  roles: CaseRole[];
  rounds: CaseRound[];
  accent: string;
  /** QR-код арқылы келгенде — бірден қосылу формасы, коды толтырылған күйде. */
  initialCode?: string;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<Mode>(initialCode ? "join" : "closed");
  const [engine, setEngine] = useState<CaseRoleplayEngine | null>(null);
  const [state, setState] = useState<RoleplayState | null>(null);
  const [meId, setMeId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState("");

  // Қосылу формасы
  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  const [nameInput, setNameInput] = useState("");
  const [avatar, setAvatar] = useState(ROLEPLAY_AVATARS[0]);

  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authUser?.fullName && !nameInput) setNameInput(authUser.fullName);
  }, [authUser?.fullName, nameInput]);

  useEffect(() => {
    if (!engine) return;
    const unsubscribe = engine.subscribe(setState);
    return unsubscribe;
  }, [engine]);

  useEffect(() => () => engine?.destroy(), [engine]);

  // Таймер жүріп тұрғанда ғана сағатты соғамыз — тұрған бөлмеде рендер жоқ.
  useEffect(() => {
    if (!state?.endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [state?.endsAt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [state?.messages.length]);

  const me = state?.members.find((m) => m.id === meId) ?? null;
  const round = rounds[state?.roundIndex ?? 0] ?? rounds[0];
  const roundSeconds = round.minutes * 60;
  const left = state ? secondsLeft(state, roundSeconds, now) : roundSeconds;
  const running = Boolean(state?.endsAt);

  const startRoom = () => {
    const name = nameInput.trim() || "Жүргізуші";
    const code = generateRoleplayCode();
    const host: RoleplayMember = {
      id: newId("m"),
      name,
      avatar,
      roleId: null,
      isHost: true,
      joinedAt: Date.now(),
    };
    const eng = new CaseRoleplayEngine(code, caseId, true, host);
    eng.patch({ messages: [systemMessage(`${name} бөлмені ашты. Рөлдеріңізді таңдаңдар.`)] });
    setMeId(host.id);
    setEngine(eng);
    setMode("host");
  };

  const joinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const code = codeInput.trim();
    const name = nameInput.trim();
    if (code.length < 4 || !name) return;

    const member: RoleplayMember = {
      id: newId("m"),
      name,
      avatar,
      roleId: null,
      isHost: false,
      joinedAt: Date.now(),
    };
    const eng = new CaseRoleplayEngine(code, caseId, false, member);
    eng.join(member);
    eng.requestSync();
    eng.postMessage(systemMessage(`${name} қосылды.`));
    setMeId(member.id);
    setEngine(eng);
    setMode("host");
  };

  const claim = useCallback(
    (roleId: string) => {
      if (!engine || !me) return;
      const next = me.roleId === roleId ? null : roleId;
      const ok = engine.claimRole(me.id, next);
      if (!ok) {
        setNotice("Бұл рөлді басқа қатысушы алып қойды.");
        window.setTimeout(() => setNotice(""), 2500);
        return;
      }
      if (next) {
        const role = roles.find((r) => r.id === next);
        engine.postMessage(systemMessage(`${me.name} — ${role?.name ?? "рөл"}.`));
      }
    },
    [engine, me, roles],
  );

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!engine || !me || !text) return;
    engine.postMessage({
      id: newId("msg"),
      authorId: me.id,
      authorName: me.name,
      avatar: me.avatar,
      text,
      at: Date.now(),
    });
    setDraft("");
  };

  // --- Хост басқаруы ------------------------------------------------------
  const startGame = () => {
    if (!engine) return;
    engine.patch({
      phase: "playing",
      roundIndex: 0,
      pausedLeft: rounds[0].minutes * 60,
      endsAt: null,
      messages: [...(state?.messages ?? []), systemMessage(`Ойын басталды. ${rounds[0].title}`)],
    });
  };

  const toggleTimer = () => {
    if (!engine || !state) return;
    if (state.endsAt) {
      engine.patch({ endsAt: null, pausedLeft: secondsLeft(state, roundSeconds, Date.now()) });
    } else {
      const remaining = state.pausedLeft ?? roundSeconds;
      engine.patch({ endsAt: Date.now() + remaining * 1000, pausedLeft: null });
    }
  };

  const nextRound = () => {
    if (!engine || !state) return;
    const index = state.roundIndex + 1;
    if (index >= rounds.length) {
      engine.patch({
        phase: "finished",
        endsAt: null,
        pausedLeft: null,
        messages: [...state.messages, systemMessage("Раундтар аяқталды. Шешімдеріңді айтыңдар.")],
      });
      return;
    }
    engine.patch({
      roundIndex: index,
      endsAt: null,
      pausedLeft: rounds[index].minutes * 60,
      messages: [...state.messages, systemMessage(rounds[index].title)],
    });
  };

  const leave = () => {
    engine?.destroy();
    setEngine(null);
    setState(null);
    setMeId("");
    setMode("closed");
  };

  // --- Көріністер ---------------------------------------------------------

  if (mode === "closed") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={startRoom}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[0.8rem] font-bold text-white transition active:scale-[0.98]"
          style={{ backgroundColor: accent }}
        >
          <Icon name="Users" className="size-4" strokeWidth={2.2} />
          Онлайн бөлме ашу
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className="flex items-center justify-center gap-2 rounded-xl border border-ink-700/12 px-4 py-3 text-[0.8rem] font-bold text-ink-700 transition hover:bg-ink-700/5 active:scale-[0.98] dark:border-white/12 dark:text-paper-200 dark:hover:bg-white/5"
        >
          <Icon name="LogIn" className="size-4" strokeWidth={2.2} />
          Кодпен қосылу
        </button>
      </div>
    );
  }

  if (mode === "join" && !engine) {
    return (
      <form onSubmit={joinRoom} className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[0.72rem] font-semibold text-ink-700/75 dark:text-paper-300">
              Бөлме коды
            </span>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              className="rounded-xl border border-ink-700/12 bg-transparent px-3 py-2.5 font-display text-lg font-bold tracking-widest text-ink-900 outline-none focus:border-ink-700/30 dark:border-white/12 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.72rem] font-semibold text-ink-700/75 dark:text-paper-300">
              Атыңыз
            </span>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Айша"
              className="rounded-xl border border-ink-700/12 bg-transparent px-3 py-2.5 text-[0.86rem] text-ink-900 outline-none focus:border-ink-700/30 dark:border-white/12 dark:text-white"
            />
          </label>
        </div>

        <AvatarPicker value={avatar} onChange={setAvatar} accent={accent} />

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-bold text-white transition active:scale-[0.98]"
            style={{ backgroundColor: accent }}
          >
            Қосылу
          </button>
          <button
            type="button"
            onClick={() => setMode("closed")}
            className="rounded-xl border border-ink-700/12 px-4 py-2.5 text-[0.8rem] font-medium text-ink-700 transition hover:bg-ink-700/5 dark:border-white/12 dark:text-paper-200"
          >
            Бас тарту
          </button>
        </div>
      </form>
    );
  }

  if (!state || !engine) return null;

  const everyoneReady =
    state.members.length >= 2 && state.members.every((m) => m.roleId !== null);

  const origin =
    typeof window !== "undefined" && window.location.origin !== "null"
      ? window.location.origin
      : "";
  const joinUrl = `${origin}/play/case?code=${state.roomCode}&case=${encodeURIComponent(caseId)}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Бөлме тақырыбы */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-700/8 px-3 py-2.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span
            className="rounded-lg px-2.5 py-1 font-display text-[0.95rem] font-black tracking-widest tabular-nums"
            style={{
              backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
              color: accent,
            }}
          >
            {state.roomCode}
          </span>
          <span className="text-[0.74rem] text-ink-700/75 dark:text-paper-300">
            {state.members.length} қатысушы
          </span>
        </div>
        <button
          type="button"
          onClick={leave}
          className="rounded-lg px-2.5 py-1.5 text-[0.74rem] font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Бөлмеден шығу
        </button>
      </div>

      {notice ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-[0.76rem] font-medium text-amber-700 dark:text-amber-300">
          {notice}
        </p>
      ) : null}

      {state.phase === "lobby" && me?.isHost ? (
        <div className="flex justify-center rounded-xl border border-ink-700/8 py-4 dark:border-white/10">
          {/* Сілтеме кейстің рөлдік бөлмесіне апаруы керек — жалпы `/play`
              командалық викторинаны ашады, ондағы рөлдер мүлдем басқа. */}
          <QrCodeDisplay
            roomCode={state.roomCode}
            joinUrl={joinUrl}
            size={150}
          />
        </div>
      ) : null}

      {/* Ойын жүріп жатқанда — раунд пен таймер */}
      {state.phase === "playing" ? (
        <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[0.85rem] font-bold text-ink-900 dark:text-white">
              {round.title}
            </span>
            <span
              className="rounded-lg px-3 py-1 font-display text-[1.05rem] font-black tabular-nums"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
                color: left === 0 ? "#dc2626" : accent,
              }}
            >
              {formatClock(left)}
            </span>
          </div>
          <p className="mt-1.5 text-[0.79rem] leading-snug text-ink-700 dark:text-paper-200">
            {round.prompt}
          </p>

          {me?.isHost ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.75rem] font-bold text-white transition active:scale-[0.98]"
                style={{ backgroundColor: accent }}
              >
                <Icon name={running ? "Pause" : "Play"} className="size-3.5" strokeWidth={2.4} />
                {running ? "Тоқтату" : "Бастау"}
              </button>
              <button
                type="button"
                onClick={nextRound}
                className="flex items-center gap-1.5 rounded-lg border border-ink-700/12 px-3 py-1.5 text-[0.75rem] font-medium text-ink-700 transition hover:bg-ink-700/5 dark:border-white/12 dark:text-paper-200 dark:hover:bg-white/5"
              >
                {state.roundIndex < rounds.length - 1 ? "Келесі раунд" : "Ойынды аяқтау"}
                <Icon name="ChevronRight" className="size-3.5" strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <p className="mt-2 text-[0.72rem] text-ink-600/70 dark:text-paper-300">
              Таймерді бөлме ашқан адам басқарады.
            </p>
          )}
        </div>
      ) : null}

      {state.phase === "finished" ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-[0.8rem] font-semibold text-emerald-700 dark:text-emerald-300">
          <Icon name="CircleCheck" className="size-4" strokeWidth={2.2} />
          Раундтар аяқталды. Енді талқылау қадамына өтуге болады.
        </p>
      ) : null}

      {/* Рөлдер тақтасы */}
      <div>
        <h5 className="mb-2 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
          {state.phase === "lobby" ? "Әркім өз рөлін таңдайды" : "Рөлдер"}
        </h5>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => {
            const owner = state.members.find((m) => m.roleId === role.id);
            const mine = owner?.id === meId;
            const free = !owner;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => (free || mine ? claim(role.id) : undefined)}
                disabled={!free && !mine}
                aria-pressed={mine}
                className="rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: mine
                    ? `color-mix(in srgb, ${accent} 55%, transparent)`
                    : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                  backgroundColor: mine
                    ? `color-mix(in srgb, ${accent} 8%, transparent)`
                    : undefined,
                }}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base">
                    {role.emoji}
                  </span>
                  <span className="font-display text-[0.84rem] font-semibold text-ink-900 dark:text-white">
                    {role.name}
                  </span>
                </span>
                <span className="mt-0.5 block text-[0.74rem] leading-snug text-ink-700/80 dark:text-paper-300">
                  {role.mission}
                </span>
                <span className="mt-1.5 block text-[0.72rem] font-semibold">
                  {owner ? (
                    <span style={{ color: mine ? accent : undefined }}>
                      {owner.avatar} {owner.name}
                      {mine ? " (сіз)" : ""}
                    </span>
                  ) : (
                    <span className="text-ink-600/60 dark:text-paper-300">Бос — таңдауға болады</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Өз рөліңнің нұсқауы — ойын басталғанда ашылады */}
      {state.phase !== "lobby" && me?.roleId ? <MyRoleBrief role={roles.find((r) => r.id === me.roleId)} accent={accent} /> : null}

      {state.phase === "lobby" && me?.isHost ? (
        <button
          type="button"
          onClick={startGame}
          disabled={!everyoneReady}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[0.8rem] font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: accent }}
        >
          <Icon name="Play" className="size-4" strokeWidth={2.4} />
          {everyoneReady
            ? "Ойынды бастау"
            : "Барлығы рөл таңдағанда басталады (кемінде 2 адам)"}
        </button>
      ) : null}

      {state.phase === "lobby" && !me?.isHost ? (
        <p className="rounded-lg border border-dashed border-ink-700/15 px-3 py-2.5 text-[0.76rem] text-ink-700/85 dark:border-white/15 dark:text-paper-300">
          Рөліңізді таңдаңыз да, бөлме ашқан адам ойынды бастағанша күтіңіз.
        </p>
      ) : null}

      {/* Командалық чат */}
      <div className="rounded-xl border border-ink-700/8 dark:border-white/10">
        <h5 className="border-b border-ink-700/8 px-3 py-2 text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:border-white/10 dark:text-paper-300">
          Командалық чат
        </h5>

        <div className="dash-scroll flex max-h-56 flex-col gap-1.5 overflow-y-auto p-3">
          {state.messages.length === 0 ? (
            <p className="text-[0.76rem] text-ink-600/60 dark:text-paper-300">
              Әзірге хабарлама жоқ.
            </p>
          ) : null}

          {state.messages.map((message) =>
            message.system ? (
              <p
                key={message.id}
                className="self-center rounded-full bg-ink-700/6 px-2.5 py-1 text-[0.7rem] text-ink-700/75 dark:bg-white/10 dark:text-paper-300"
              >
                {message.text}
              </p>
            ) : (
              <div
                key={message.id}
                className={`flex max-w-[85%] flex-col rounded-xl px-2.5 py-1.5 ${
                  message.authorId === meId
                    ? "self-end text-white"
                    : "self-start bg-ink-700/6 dark:bg-white/10"
                }`}
                style={
                  message.authorId === meId ? { backgroundColor: accent } : undefined
                }
              >
                <span
                  className={`text-[0.68rem] font-semibold ${
                    message.authorId === meId
                      ? "text-white/80"
                      : "text-ink-700/70 dark:text-paper-300"
                  }`}
                >
                  {message.avatar} {message.authorName}
                </span>
                <span className="text-[0.8rem] leading-snug break-words text-ink-800 dark:text-paper-100">
                  <span className={message.authorId === meId ? "text-white" : undefined}>
                    {message.text}
                  </span>
                </span>
              </div>
            ),
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-ink-700/8 p-2 dark:border-white/10">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Хабарлама жазыңыз…"
            maxLength={300}
            className="min-w-0 flex-1 rounded-lg border border-ink-700/12 bg-transparent px-3 py-2 text-[0.8rem] text-ink-900 outline-none focus:border-ink-700/30 dark:border-white/12 dark:text-white"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Жіберу"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white transition active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            <Icon name="Send" className="size-4" strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MyRoleBrief({ role, accent }: { role: CaseRole | undefined; accent: string }) {
  if (!role) return null;
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${accent} 6%, transparent)`,
      }}
    >
      <h5 className="font-display text-[0.84rem] font-bold text-ink-900 dark:text-white">
        {role.emoji} Сіздің рөліңіз: {role.name}
      </h5>
      <p className="mt-0.5 text-[0.76rem] text-ink-700/80 dark:text-paper-300">{role.mission}</p>

      <span className="mt-2.5 block text-[0.68rem] font-bold tracking-wide text-ink-700/60 uppercase dark:text-paper-300">
        Не істейсіз
      </span>
      <ul className="mt-1 space-y-1">
        {role.brief.map((line) => (
          <li key={line} className="text-[0.76rem] leading-snug text-ink-700 dark:text-paper-200">
            • {line}
          </li>
        ))}
      </ul>

      <span className="mt-2 block text-[0.68rem] font-bold tracking-wide text-ink-700/60 uppercase dark:text-paper-300">
        Сұрақтарыңыз
      </span>
      <ul className="mt-1 space-y-1">
        {role.asks.map((line) => (
          <li key={line} className="text-[0.76rem] leading-snug text-ink-700 dark:text-paper-200">
            — {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AvatarPicker({
  value,
  onChange,
  accent,
}: {
  value: string;
  onChange: (next: string) => void;
  accent: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[0.72rem] font-semibold text-ink-700/75 dark:text-paper-300">
        Белгішеңіз
      </span>
      <div className="flex flex-wrap gap-1.5">
        {ROLEPLAY_AVATARS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-pressed={item === value}
            className="flex size-9 items-center justify-center rounded-lg border text-base transition"
            style={{
              borderColor:
                item === value
                  ? `color-mix(in srgb, ${accent} 60%, transparent)`
                  : "color-mix(in srgb, var(--color-ink-700) 10%, transparent)",
              backgroundColor:
                item === value ? `color-mix(in srgb, ${accent} 10%, transparent)` : undefined,
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
