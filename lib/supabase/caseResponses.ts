"use client";

// Кейстің екінші қадамындағы жазба жауап.
//
// Рөлдік ойынның ұпайы санмен өлшенеді де `game_results`-қа түседі, ал бұл —
// кейстің жалғыз сапалық деректі: оқушының өз сөзімен жазған шешімі. Ол
// мұғалімге көрінбесе, кейстің ең құнды бөлігі жоғалады.
//
// Бір оқушыға бір кейстен бір жол: жауап қайта жазылса, ескісін алмастырады.
// Мұғалім тек `teacher_feedback` бағанын қозғайды — қалғанын дерекқордағы
// триггер қорғайды, сондықтан мұндағы бөліну шешім емес, тек көрініс.

import type { AppUser, PersonSummary } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "./client";
import {
  mockCaseResponses,
  mockLinks,
  mockPerson,
  mockSaveCaseResponses,
  type MockCaseResponseRow,
} from "./mock";

export interface CaseResponse {
  id: string;
  userId: string;
  caseId: string;
  answer: string;
  /** Рөлдік ойын нәтижесі. Ойналмаса — null. */
  play: { correct: number; total: number } | null;
  skipped: boolean;
  submittedAt: string;
  updatedAt: string;
  teacherFeedback: string | null;
  reviewedAt: string | null;
  /** Мұғалім тізімінде — жауап иесі. */
  student?: PersonSummary;
}

interface Row {
  id: string;
  user_id: string;
  case_id: string;
  answer: string;
  play_correct: number | null;
  play_total: number | null;
  skipped: boolean;
  submitted_at: string;
  updated_at: string;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  author?: EmbeddedProfile | EmbeddedProfile[] | null;
}

interface EmbeddedProfile {
  id: string;
  full_name: string;
  user_code: string;
  role: "student" | "teacher" | "admin";
  study_group: string | null;
  avatar_url: string | null;
}

const SELECT = `
  id, user_id, case_id, answer, play_correct, play_total, skipped,
  submitted_at, updated_at, teacher_feedback, reviewed_at,
  author:profiles!case_responses_user_id_fkey (id, full_name, user_code, role, study_group, avatar_url)
`;

function one(value: EmbeddedProfile | EmbeddedProfile[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

/**
 * Postgres-ке жазуға жарайтын шынайы сессия бар ма.
 *
 * Кілттер тұрғанмен, платформада демонстрациялық кіру де бар — оның uid-і UUID
 * емес, әрі оның атынан RLS өтпейді. Мұндайда мок қоймаға жазамыз: әйтпесе
 * демо режимде жауап ешқайда түспей, мұғалім беті мәңгі бос тұрар еді.
 */
async function hasLiveSession(me: AppUser): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase.auth.getUser();
  return !error && data.user?.id === me.uid;
}

function toResponse(row: Row): CaseResponse {
  const author = one(row.author);
  return {
    id: row.id,
    userId: row.user_id,
    caseId: row.case_id,
    answer: row.answer,
    play:
      row.play_total && row.play_total > 0
        ? { correct: row.play_correct ?? 0, total: row.play_total }
        : null,
    skipped: row.skipped,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    teacherFeedback: row.teacher_feedback,
    reviewedAt: row.reviewed_at,
    student: author
      ? {
          id: author.id,
          fullName: author.full_name,
          userCode: author.user_code,
          role: author.role,
          studyGroup: author.study_group,
          avatarUrl: author.avatar_url,
        }
      : undefined,
  };
}

function mockToResponse(row: MockCaseResponseRow): CaseResponse {
  return {
    id: row.id,
    userId: row.userId,
    caseId: row.caseId,
    answer: row.answer,
    play:
      row.playTotal && row.playTotal > 0
        ? { correct: row.playCorrect ?? 0, total: row.playTotal }
        : null,
    skipped: row.skipped,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    teacherFeedback: row.teacherFeedback,
    reviewedAt: row.reviewedAt,
    student: mockPerson(row.userId),
  };
}

export interface CaseResponseInput {
  caseId: string;
  answer: string;
  play: { correct: number; total: number } | null;
  skipped: boolean;
}

/**
 * Жауапты сақтау. Бір оқушы + бір кейс = бір жол, сондықтан қайта жазу
 * ескісін алмастырады.
 *
 * Қате лақтырмайды: жауап әрқашан `localStorage`-та да тұр, ал желі үзілгені
 * үшін оқушының кейсті аяқтауын тоқтату дұрыс болмас еді.
 */
export async function saveCaseResponse(
  me: AppUser,
  input: CaseResponseInput,
): Promise<void> {
  const answer = input.answer.trim();
  if (!answer) return;

  if (await hasLiveSession(me)) {
    const { error } = await supabase!.from("case_responses").upsert(
      {
        user_id: me.uid,
        case_id: input.caseId,
        answer,
        play_correct: input.play?.correct ?? null,
        play_total: input.play?.total ?? null,
        skipped: input.skipped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,case_id" },
    );
    if (error) console.warn("case response not saved:", error.message);
    return;
  }

  const rows = mockCaseResponses();
  const now = new Date().toISOString();
  const existing = rows.find((r) => r.userId === me.uid && r.caseId === input.caseId);
  if (existing) {
    existing.answer = answer;
    existing.playCorrect = input.play?.correct ?? null;
    existing.playTotal = input.play?.total ?? null;
    existing.skipped = input.skipped;
    existing.updatedAt = now;
  } else {
    rows.unshift({
      id: `case_resp_${Math.random().toString(36).slice(2, 10)}`,
      userId: me.uid,
      caseId: input.caseId,
      answer,
      playCorrect: input.play?.correct ?? null,
      playTotal: input.play?.total ?? null,
      skipped: input.skipped,
      submittedAt: now,
      updatedAt: now,
      teacherFeedback: null,
      reviewedAt: null,
    });
  }
  mockSaveCaseResponses(rows);
}

/** Оқушының өз жауаптары. */
export async function listMyCaseResponses(me: AppUser): Promise<CaseResponse[]> {
  if (await hasLiveSession(me)) {
    const { data, error } = await supabase!
      .from("case_responses")
      .select(SELECT)
      .eq("user_id", me.uid)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as Row[]).map(toResponse);
  }

  return mockCaseResponses()
    .filter((r) => r.userId === me.uid)
    .map(mockToResponse)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Мұғалім қабылдаған оқушылардың жауаптары.
 *
 * Supabase жағында сүзгінің қажеті жоқ — RLS саясаты бөтен жолды бәрібір
 * бермейді. Мок режимде ондай қорғаныс жоқ, сондықтан тізім байланыс
 * графигінен құрылады.
 */
export async function listStudentCaseResponses(me: AppUser): Promise<CaseResponse[]> {
  if (me.role !== "teacher" && me.role !== "admin") return [];

  if (await hasLiveSession(me)) {
    const { data, error } = await supabase!
      .from("case_responses")
      .select(SELECT)
      .neq("user_id", me.uid)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as Row[]).map(toResponse);
  }

  // Мок қойманы тікелей оқимыз: `listLinks` кілттер тұрғанда Postgres-ке
  // барады да, демо-uid-пен «invalid uuid» қатесін қайтарады.
  const studentIds = new Set(
    mockLinks()
      .filter((l) => l.teacherId === me.uid && l.status === "accepted")
      .map((l) => l.studentId),
  );
  return mockCaseResponses()
    .filter((r) => studentIds.has(r.userId))
    .map(mockToResponse)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Мұғалімнің пікірі. Басқа бағанды дерекқордағы триггер қозғалтпайды. */
export async function setCaseFeedback(
  me: AppUser,
  id: string,
  feedback: string,
): Promise<void> {
  const text = feedback.trim();

  if (await hasLiveSession(me)) {
    const { error } = await supabase!
      .from("case_responses")
      .update({ teacher_feedback: text || null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const rows = mockCaseResponses();
  const row = rows.find((r) => r.id === id);
  if (!row) return;
  row.teacherFeedback = text || null;
  row.reviewedAt = text ? new Date().toISOString() : null;
  mockSaveCaseResponses(rows);
}
