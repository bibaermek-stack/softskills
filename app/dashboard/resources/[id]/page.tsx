import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourcePage, allResources } from "@/components/dashboard/ResourcePage";

/** Сегіз ресурстың бәрі құрастыру кезінде дайындалады. */
export function generateStaticParams() {
  return allResources.map((resource) => ({ id: resource.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = allResources.find((item) => item.id === id);
  if (!resource) return { title: "Ресурс табылмады" };

  return {
    title: resource.title,
    description: resource.text,
    alternates: { canonical: `/dashboard/resources/${resource.id}` },
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exists = allResources.some((resource) => resource.id === id);
  if (!exists) notFound();

  return <ResourcePage id={id} />;
}
