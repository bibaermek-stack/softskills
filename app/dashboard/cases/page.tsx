import type { Metadata } from "next";
import { CaseCatalogue } from "@/components/dashboard/CaseCatalogue";

export const metadata: Metadata = {
  title: "Кейс тапсырмалар",
  description:
    "Икемді дағдыларды дамытуға арналған кейс тапсырмалар: бейне, шағын тапсырма, рөлдік ойын және симуляция.",
  alternates: { canonical: "/dashboard/cases" },
};

export default function CasesPage() {
  return <CaseCatalogue />;
}
