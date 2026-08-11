import type { Metadata } from "next";
import { DashGrid } from "@/components/dashboard/DashGrid";
import { dashboardHeader } from "@/lib/dashboard";

export const metadata: Metadata = {
  title: "Панель",
  description: dashboardHeader.subtitle,
  alternates: { canonical: "/dashboard" },
};

export default function DashboardPage() {
  return <DashGrid />;
}
