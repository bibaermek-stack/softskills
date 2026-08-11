import type { Metadata } from "next";
import { AstronomySimulator } from "@/components/dashboard/AstronomySimulator";

export const metadata: Metadata = {
  title: "Күн Жүйесі & Гравитация — Виртуалды STEM",
  description: "Орбиталар, гравитациялық тартылыс заңы және планеталар қозғалысы.",
  alternates: { canonical: "/dashboard/simulations/astronomy" },
};

export default function AstronomyPage() {
  return <AstronomySimulator />;
}
