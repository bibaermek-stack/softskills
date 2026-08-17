"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import type { CaseQuestion, CaseRole, CaseRound } from "@/lib/caseTasks";
import {
  POINTS_PER_CORRECT,
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
  onResult,
}: {
  caseId: string;
  roles: CaseRole[];
  rounds: CaseRound[];
  accent: string;
  /** QR-код арқылы келгенде — бірден қосылу формасы, коды толтырылған күйде. */
  initialCode?: string;
  /** Ойын бітіп, осы қатысушының нәтижесі белгілі болғанда бір рет шақырылады. */
  onResult?: (result: { correct: number; total: number }) => void;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<Mode>(initialCode ? "join" : "closed");
  const [engine, setEngine] = useState<CaseRoleplayEngine | null>(null);
  const [state, setState] = useState<RoleplayState | null>(null);
  const [synced, setSynced] = useState(false);
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
    return engine.subscribe((next) => {
      setState(next);
      setSynced(engine.isSynced());
    });
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

  // Ойын біткенде нәтижені бір рет жоғарыға беру. Күй әр хабарламадан кейін
  // жаңаратындықтан, шектеусіз қалдырсақ, чат жазған сайын қайта жіберілер еді.
  const reportedRef = useRef(false);
  useEffect(() => {
    if (!state || !onResult) return;
    if (state.phase !== "finished") {
      reportedRef.current = false;
      return;
    }
    if (reportedRef.current) return;
    reportedRef.current = true;
    onResult({
      correct: state.outcomes.filter((outcome) => outcome.correct[meId]).length,
      total: state.outcomes.length,
    });
  }, [state, meId, onResult]);

  const me = state?.members.find((m) => m.id === meId) ?? null;
  const round = rounds[state?.roundIndex ?? 0] ?? rounds[0];
  const roundSeconds = round.minutes * 60;
  const left = state ? secondsLeft(state, roundSeconds, now) : roundSeconds;
  const running = Boolean(state?.endsAt);

  const myQuestion = round.questions.find((q) => q.roleId === me?.roleId);
  const playersWithRole = state?.members.filter((m) => m.roleId).length ?? 0;
  const answeredCount = state ? Object.keys(state.answers).length : 0;

  /** Рөл → дұрыс нұсқа. Қозғалтқыш сұрақтарды білмейді, тек салыстырады. */
  const correctByRole = useMemo(() => {
    const map: Record<string, number> = {};
    round.questions.forEach((q) => {
      map[q.roleId] = q.correctIndex;
    });
    return map;
  }, [round]);

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
      score: 0,
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
      score: 0,
    };
    const eng = new CaseRoleplayEngine(code, caseId, false, member);
    eng.join(member);
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
    if (!engine || !state) return;
    engine.patch({
      phase: "playing",
      roundIndex: 0,
      pausedLeft: rounds[0].minutes * 60,
      endsAt: null,
      // Қайта ойнағанда ескі ұпай мен жауап қалып қоймауы керек.
      answers: {},
      revealed: false,
      outcomes: [],
      members: state.members.map((m) => ({ ...m, score: 0 })),
      messages: [...state.messages, systemMessage(`Ойын басталды. ${rounds[0].title}`)],
    });
  };

  const reveal = () => {
    if (!engine || !state || state.revealed) return;
    engine.reveal(correctByRole);
    engine.postMessage(systemMessage("Жауаптар ашылды."));
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
        messages: [...state.messages, systemMessage("Раундтар аяқталды. Нәтиже дайын.")],
      });
      return;
    }
    engine.patch({
      roundIndex: index,
      endsAt: null,
      pausedLeft: rounds[index].minutes * 60,
      answers: {},
      revealed: false,
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

      {!synced ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-ink-700/15 px-3 py-2 text-[0.76rem] text-ink-700/85 dark:border-white/15 dark:text-paper-300">
          <Icon name="Loader" className="size-3.5 animate-spin" strokeWidth={2.2} />
          Бөлмеге қосылуда… Код дұрыс екенін және бөлме әлі ашық екенін тексеріңіз.
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.75rem] font-bold text-white transition active:scale-[0.98]"
                style={{ backgroundColor: accent }}
              >
                <Icon name={running ? "Pause" : "Play"} className="size-3.5" strokeWidth={2.4} />
                {running ? "Тоқтату" : "Бастау"}
              </button>

              {state.revealed ? (
                <button
                  type="button"
                  onClick={nextRound}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-700/12 px-3 py-1.5 text-[0.75rem] font-medium text-ink-700 transition hover:bg-ink-700/5 dark:border-white/12 dark:text-paper-200 dark:hover:bg-white/5"
                >
                  {state.roundIndex < rounds.length - 1 ? "Келесі раунд" : "Нәтижені шығару"}
                  <Icon name="ChevronRight" className="size-3.5" strokeWidth={2.2} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reveal}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-700/12 px-3 py-1.5 text-[0.75rem] font-medium text-ink-700 transition hover:bg-ink-700/5 dark:border-white/12 dark:text-paper-200 dark:hover:bg-white/5"
                >
                  <Icon name="Eye" className="size-3.5" strokeWidth={2.2} />
                  Жауаптарды ашу
                </button>
              )}

              <span className="text-[0.72rem] font-semibold tabular-nums text-ink-600/70 dark:text-paper-300">
                {answeredCount}/{playersWithRole} жауап берді
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[0.72rem] text-ink-600/70 dark:text-paper-300">
              Таймер мен раундты бөлме ашқан адам басқарады.
            </p>
          )}
        </div>
      ) : null}

      {/* Әркімнің өз сұрағы */}
      {state.phase === "playing" ? (
        <QuestionCard
          question={myQuestion}
          hasRole={Boolean(me?.roleId)}
          chosen={me ? state.answers[me.id] : undefined}
          revealed={state.revealed}
          accent={accent}
          onAnswer={(index) => me && engine.answer(me.id, index)}
        />
      ) : null}

      {/* Қорытынды нәтиже */}
      {state.phase === "finished" ? (
        <ResultBoard state={state} roles={roles} meId={meId} accent={accent} />
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

/**
 * Қатысушының өз сұрағы.
 *
 * Сұрақ рөлге байланған, сондықтан бір раундта әркім әртүрлі сұраққа жауап
 * береді — көршісінен көшіру мүмкін емес, ал жауаптарды қосқанда команданың
 * ортақ нәтижесі шығады.
 */
function QuestionCard({
  question,
  hasRole,
  chosen,
  revealed,
  accent,
  onAnswer,
}: {
  question: CaseQuestion | undefined;
  hasRole: boolean;
  chosen: number | undefined;
  revealed: boolean;
  accent: string;
  onAnswer: (index: number) => void;
}) {
  if (!hasRole) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700/15 px-3 py-2.5 text-[0.78rem] text-ink-700/85 dark:border-white/15 dark:text-paper-300">
        Сұрақ алу үшін алдымен рөл таңдаңыз.
      </p>
    );
  }

  if (!question) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700/15 px-3 py-2.5 text-[0.78rem] text-ink-700/85 dark:border-white/15 dark:text-paper-300">
        Бұл раундта сіздің рөліңізге сұрақ жоқ — топты тыңдап, талқылауға қосылыңыз.
      </p>
    );
  }

  const correct = question.correctIndex;

  return (
    <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
      <h5 className="text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
        Сіздің сұрағыңыз
      </h5>
      <p className="mt-1 font-display text-[0.86rem] leading-snug font-semibold text-ink-900 dark:text-white">
        {question.prompt}
      </p>

      <div className="mt-2.5 flex flex-col gap-1.5">
        {question.options.map((option, index) => {
          const picked = chosen === index;
          const isCorrect = revealed && index === correct;
          const isWrongPick = revealed && picked && index !== correct;

          let borderColor = "color-mix(in srgb, var(--color-ink-700) 10%, transparent)";
          let background: string | undefined;
          if (isCorrect) {
            borderColor = "rgb(16 185 129 / 0.55)";
            background = "rgb(16 185 129 / 0.1)";
          } else if (isWrongPick) {
            borderColor = "rgb(220 38 38 / 0.5)";
            background = "rgb(220 38 38 / 0.08)";
          } else if (picked) {
            borderColor = `color-mix(in srgb, ${accent} 55%, transparent)`;
            background = `color-mix(in srgb, ${accent} 8%, transparent)`;
          }

          return (
            <button
              key={option}
              type="button"
              disabled={revealed}
              onClick={() => onAnswer(index)}
              aria-pressed={picked}
              className="flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-[0.8rem] leading-snug text-ink-800 transition-colors disabled:cursor-default dark:text-paper-100"
              style={{ borderColor, backgroundColor: background }}
            >
              {revealed && (isCorrect || isWrongPick) ? (
                <Icon
                  name={isCorrect ? "CircleCheck" : "X"}
                  className={`mt-px size-3.5 shrink-0 ${isCorrect ? "text-emerald-500" : "text-red-500"}`}
                  strokeWidth={2.4}
                />
              ) : (
                <span className="mt-px size-3.5 shrink-0" />
              )}
              {option}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <p className="mt-2.5 rounded-lg bg-ink-700/5 px-3 py-2 text-[0.78rem] leading-snug text-ink-700 dark:bg-white/10 dark:text-paper-200">
          {question.explain}
        </p>
      ) : chosen === undefined ? (
        <p className="mt-2 text-[0.72rem] text-ink-600/70 dark:text-paper-300">
          Бір нұсқаны таңдаңыз.
        </p>
      ) : (
        <p className="mt-2 text-[0.72rem] font-semibold" style={{ color: accent }}>
          Жауабыңыз қабылданды. Ашылғанша өзгертуге болады.
        </p>
      )}
    </div>
  );
}

/** Ойын соңындағы нәтиже: кім қанша ұпай жинады және команда қанша. */
function ResultBoard({
  state,
  roles,
  meId,
  accent,
}: {
  state: RoleplayState;
  roles: CaseRole[];
  meId: string;
  accent: string;
}) {
  const ranked = [...state.members].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  const teamScore = state.members.reduce((sum, m) => sum + m.score, 0);
  const maxTeamScore = state.outcomes.length * state.members.length * POINTS_PER_CORRECT;
  const teamCorrect = state.outcomes.reduce(
    (sum, outcome) => sum + Object.values(outcome.correct).filter(Boolean).length,
    0,
  );

  return (
    <div className="rounded-xl border border-ink-700/8 p-3 dark:border-white/10">
      <h5 className="text-[0.72rem] font-bold tracking-wide text-ink-700/70 uppercase dark:text-paper-300">
        Ойын нәтижесі
      </h5>

      <div
        className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg px-3 py-2.5"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)` }}
      >
        <span className="font-display text-[1.35rem] font-black tabular-nums" style={{ color: accent }}>
          {teamScore}
        </span>
        <span className="text-[0.78rem] font-semibold text-ink-800 dark:text-paper-100">
          команда ұпайы
        </span>
        <span className="text-[0.74rem] text-ink-700/75 dark:text-paper-300">
          · {teamCorrect} дұрыс жауап
          {maxTeamScore > 0 ? ` · ${teamScore}/${maxTeamScore}` : ""}
        </span>
      </div>

      <ol className="mt-2.5 space-y-1.5">
        {ranked.map((member, i) => {
          const role = roles.find((r) => r.id === member.roleId);
          const correctCount = state.outcomes.filter((o) => o.correct[member.id]).length;
          const mine = member.id === meId;
          return (
            <li
              key={member.id}
              className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
              style={{
                borderColor: mine
                  ? `color-mix(in srgb, ${accent} 45%, transparent)`
                  : "color-mix(in srgb, var(--color-ink-700) 8%, transparent)",
                backgroundColor: mine ? `color-mix(in srgb, ${accent} 6%, transparent)` : undefined,
              }}
            >
              <span className="w-4 shrink-0 font-display text-[0.8rem] font-bold tabular-nums text-ink-600/70 dark:text-paper-300">
                {i + 1}
              </span>
              <span aria-hidden className="text-base">
                {member.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.82rem] font-semibold text-ink-900 dark:text-white">
                  {member.name}
                  {mine ? " (сіз)" : ""}
                </span>
                <span className="block truncate text-[0.72rem] text-ink-700/75 dark:text-paper-300">
                  {role ? `${role.emoji} ${role.name}` : "рөлсіз"} · {correctCount}/
                  {state.outcomes.length} дұрыс
                </span>
              </span>
              <span
                className="shrink-0 font-display text-[0.95rem] font-black tabular-nums"
                style={{ color: accent }}
              >
                {member.score}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-2.5 text-[0.74rem] leading-snug text-ink-700/85 dark:text-paper-300">
        Ұпай — бір-бірін тыңдаған команданың нәтижесі. Енді талқылау қадамына өтіп,
        сұрақтарды бірге талдаңдар.
      </p>
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
