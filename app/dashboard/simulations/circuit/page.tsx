import type { Metadata } from "next";
import { CircuitSimulator } from "@/components/dashboard/CircuitSimulator";

export const metadata: Metadata = {
  title: "Электр тізбектері (Circuit Builder) — Виртуалды STEM",
  description: "Ом заңы, кернеу, тоқ күші мен кедергі интерактивті лабораториясы.",
  alternates: { canonical: "/dashboard/simulations/circuit" },
};

export default function CircuitSimulationPage() {
  return <CircuitSimulator />;
}
