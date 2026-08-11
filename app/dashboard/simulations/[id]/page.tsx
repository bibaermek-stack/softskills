import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimulationPage } from "@/components/dashboard/SimulationPage";
import { simulations, type SimulationId } from "@/lib/simulations";

/** Екі симуляция да құрастыру кезінде дайындалады. */
export function generateStaticParams() {
  return simulations.map((sim) => ({ id: sim.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sim = simulations.find((item) => item.id === id);
  if (!sim) return { title: "Симуляция табылмады" };

  return {
    title: sim.title,
    description: sim.lead,
    alternates: { canonical: `/dashboard/simulations/${sim.id}` },
  };
}

export default async function SimulationRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exists = simulations.some((sim) => sim.id === id);
  if (!exists) notFound();

  return <SimulationPage id={id as SimulationId} />;
}
