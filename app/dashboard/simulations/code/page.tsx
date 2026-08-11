import type { Metadata } from "next";
import { PythonPlayground } from "@/components/dashboard/PythonPlayground";

export const metadata: Metadata = {
  title: "Python STEM код зертханасы — Виртуалды STEM",
  description: "STEM есептеріне арналған дайын Python мысалдарын зерттеу және өзгерту ортасы.",
  alternates: { canonical: "/dashboard/simulations/code" },
};

export default function CodePlaygroundPage() {
  return <PythonPlayground />;
}
