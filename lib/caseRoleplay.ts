"use client";

/**
 * Кейстің онлайн рөлдік ойыны — бөлме күйінің пішіні.
 *
 * Бөлме әрқашан бір кейске байланады (`caseId`): рөлдер де, раундтар да сол
 * кейстен алынады, сондықтан екі түрлі кейс бір бөлмеде араласпайды.
 *
 * Таймер `endsAt` (абсолют epoch ms) арқылы синхрондалады. Қалған секундты
 * әр қатысушы өз сағатынан есептейді — бұл әркімге бөлек «қалды N секунд»
 * жіберуден әлдеқайда арзан әрі қойынды ұйықтап оянғанда да дұрыс көрсетеді.
 */

export type RoleplayPhase = "lobby" | "playing" | "finished";

export interface RoleplayMember {
  id: string;
  name: string;
  avatar: string;
  /** Таңдалған рөл. Бір рөлді екі адам ала алмайды. */
  roleId: string | null;
  isHost: boolean;
  joinedAt: number;
  /** Дұрыс жауаптардан жиналған ұпай. */
  score: number;
}

/** Бір раундтың нәтижесі — соңғы экранда осылар қосылады. */
export interface RoundOutcome {
  roundIndex: number;
  /** Қатысушы id → сол раундта дұрыс жауап берді ме. */
  correct: Record<string, boolean>;
}

export interface RoleplayMessage {
  id: string;
  authorId: string;
  authorName: string;
  avatar: string;
  text: string;
  at: number;
  /** Жүйе хабары — «қосылды», «раунд басталды» сияқты. */
  system?: boolean;
}

export interface RoleplayState {
  roomCode: string;
  caseId: string;
  phase: RoleplayPhase;
  members: RoleplayMember[];
  roundIndex: number;
  /** Таймер жүріп тұрса — аяқталатын сәт, әйтпесе null. */
  endsAt: number | null;
  /** Таймер тұрған кездегі қалған секунд. */
  pausedLeft: number | null;
  /** Ағымдағы раундтағы жауаптар: қатысушы id → таңдаған нұсқасы. */
  answers: Record<string, number>;
  /** Дұрыс жауап пен түсіндірме ашылды ма. */
  revealed: boolean;
  /** Өткен раундтардың қорытындысы. */
  outcomes: RoundOutcome[];
  messages: RoleplayMessage[];
}

/** Бір дұрыс жауаптың құны. */
export const POINTS_PER_CORRECT = 10;

export const ROLEPLAY_AVATARS = [
  "🦊",
  "🐼",
  "🦉",
  "🐝",
  "🐢",
  "🦁",
  "🐧",
  "🦋",
  "🐰",
  "🐨",
  "🦄",
  "🐬",
];

/** Бөлме коды — командалық ойындағыдай 6 сан, оқушыға айтуға оңай. */
export function generateRoleplayCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Таймердегі қалған секунд — күйден есептеледі, бөлек сақталмайды. */
export function secondsLeft(state: RoleplayState, roundSeconds: number, now: number): number {
  if (state.endsAt !== null) return Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  return state.pausedLeft ?? roundSeconds;
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
