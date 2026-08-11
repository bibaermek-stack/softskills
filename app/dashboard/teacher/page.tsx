import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";

export const metadata = {
  title: "Мұғалім Порталы & Сынып Аналитикасы — Виртуалды STEM",
  description: "Оқушылар үлгерімін бақылау, квиз аналитикасы және тапсырмалар жіберу.",
};

export default function TeacherPage() {
  return <TeacherDashboard />;
}
