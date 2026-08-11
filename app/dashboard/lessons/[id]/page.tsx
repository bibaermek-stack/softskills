import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/dashboard/LessonPlayer";
import { findLesson, lessons } from "@/lib/lessons";

/** Бес сабақтың бәрі құрастыру кезінде статикалық түрде дайындалады. */
export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lesson = findLesson(id);
  if (!lesson) return { title: "Сабақ табылмады" };

  return {
    title: `${lesson.title} — интерактивті сабақ`,
    description: lesson.summary,
    alternates: { canonical: `/dashboard/lessons/${lesson.id}` },
  };
}

export default async function LessonRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = findLesson(id);
  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} />;
}
