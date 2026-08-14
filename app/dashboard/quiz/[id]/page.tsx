import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SUBJECT_QUIZZES, type SubjectQuizId } from "@/data/subjectQuizzes";
import { SubjectQuizPlayer } from "@/components/dashboard/SubjectQuizPlayer";

export function generateStaticParams() {
  return (Object.keys(SUBJECT_QUIZZES) as SubjectQuizId[]).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quiz = SUBJECT_QUIZZES[id as SubjectQuizId];
  if (!quiz) return { title: "Викторина табылмады" };

  return {
    title: `${quiz.name} — 200 Жағдаяттық тест викторинасы | Виртуалды STEM`,
    description: quiz.tagline,
    alternates: { canonical: `/dashboard/quiz/${quiz.id}` },
  };
}

export default async function SubjectQuizRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = SUBJECT_QUIZZES[id as SubjectQuizId];
  if (!quiz) notFound();

  return <SubjectQuizPlayer quizData={quiz} />;
}
