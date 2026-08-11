import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectPage } from "@/components/dashboard/SubjectPage";
import { subjectPanels, type SubjectId } from "@/lib/dashboard";

/** Бес пәннің бәрі құрастыру кезінде статикалық түрде дайындалады. */
export function generateStaticParams() {
  return subjectPanels.map((subject) => ({ id: subject.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const subject = subjectPanels.find((item) => item.id === id);
  if (!subject) return { title: "Модуль табылмады" };

  return {
    title: `${subject.name} — пәндік модуль`,
    description: subject.detail.intro,
    alternates: { canonical: `/dashboard/modules/${subject.id}` },
  };
}

export default async function SubjectModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exists = subjectPanels.some((subject) => subject.id === id);
  if (!exists) notFound();

  return <SubjectPage id={id as SubjectId} />;
}
