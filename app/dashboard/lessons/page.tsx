import type { Metadata } from "next";
import { LessonCatalogue } from "@/components/dashboard/LessonCatalogue";

export const metadata: Metadata = {
  title: "Интерактивті сабақтар",
  description:
    "Дайын сабақ үлгісінің алты кезеңі бойынша жүретін интерактивті сабақтар: ойын, симуляция және қорытынды тест.",
  alternates: { canonical: "/dashboard/lessons" },
};

export default function LessonsPage() {
  return <LessonCatalogue variant="page" />;
}
