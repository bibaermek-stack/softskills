/**
 * Интерактивті симуляциялардың сипаттамасы.
 *
 * Дерек әдейі бөлек, таза модульде тұр: оны `generateStaticParams` мен
 * `sitemap.ts` сияқты сервер жағындағы код та оқиды. `"use client"` белгісі
 * бар файлдан экспортталған массив сервер тарапында нақты массив емес,
 * клиенттік сілтеме болып көрінеді де, `.map` жұмыс істемейді.
 */

import type { IconName } from "@/components/dashboard/Icon";

export type SimulationId = "pendulum" | "team-project";

export type SimulationInfo = {
  id: SimulationId;
  title: string;
  eyebrow: string;
  icon: IconName;
  accent: string;
  lead: string;
  /** Симуляция көрсететін негізгі заңдылықтар. */
  notes: string[];
};

export const simulations: SimulationInfo[] = [
  {
    id: "pendulum",
    title: "Маятник симуляциясы",
    eyebrow: "Физикалық модель",
    icon: "Atom",
    accent: "#2563eb",
    lead:
      "Математикалық маятниктің толық сызықтық емес теңдеуі. Ұзындықты, массаны, бастапқы бұрышты, сөнуді және ауырлық күшін өзгертіп, периодтың неге тәуелді екенін өз көзіңізбен көріңіз.",
    notes: [
      "Период ұзындықтың квадрат түбіріне тәуелді, ал массаға тәуелді емес.",
      "Амплитуда өскен сайын нақты период кіші бұрыш формуласынан алшақтайды.",
      "Сөну нөл болғанда толық энергия сақталады — оны график арқылы тексеруге болады.",
    ],
  },
  {
    id: "team-project",
    title: "Командалық жоба симуляторы",
    eyebrow: "2.11 Командалық жобалар",
    icon: "UsersRound",
    accent: "#7c3aed",
    lead:
      "Виртуалды ортаны таңдап, командаға рөл бөлесіз және төрт қақтығыс жағдаятында шешім қабылдайсыз. Әр шешім коммуникация, мерзім, сапа және көңіл күй көрсеткіштеріне әсер етеді.",
    notes: [
      "Рөл мүшенің күшті жағына сай келсе, қорытынды ұпайға бонус қосылады.",
      "Әр таңдаудың салдары бірден түсіндіріледі.",
      "Соңында шешімдер журналы мен ең күшті балама көрсетіледі.",
    ],
  },
];

/**
 * Барлық қолжетімді simulation беттері. Алғашқы екі элемент ортақ dynamic
 * route арқылы ашылады, қалғандарының өз тұрақты App Router беттері бар.
 */
export type SimulationCatalogItem = Omit<SimulationInfo, "id" | "notes"> & {
  id: string;
  href: string;
};

export const simulationCatalog: SimulationCatalogItem[] = [
  ...simulations.map((sim) => ({
    id: sim.id,
    href: `/dashboard/simulations/${sim.id}`,
    title: sim.title,
    eyebrow: sim.eyebrow,
    icon: sim.icon,
    accent: sim.accent,
    lead: sim.lead,
  })),
  {
    id: "circuit",
    href: "/dashboard/simulations/circuit",
    title: "Электр тізбектері",
    eyebrow: "Виртуалды зертхана",
    icon: "Zap",
    accent: "#0891b2",
    lead:
      "Кернеу, ток күші және кедергіні өзгертіп, Ом заңының электр тізбегіне әсерін бірден бақылаңыз.",
  },
  {
    id: "astronomy",
    href: "/dashboard/simulations/astronomy",
    title: "Күн жүйесі және гравитация",
    eyebrow: "3D астрономия",
    icon: "Globe",
    accent: "#7c3aed",
    lead:
      "Планеталардың орбиталарын, қозғалыс жылдамдығын және гравитациялық байланыстарын интерактивті модельде зерттеңіз.",
  },
  {
    id: "code",
    href: "/dashboard/simulations/code",
    title: "Python STEM код зертханасы",
    eyebrow: "Оқу демонстрациясы",
    icon: "CircuitBoard",
    accent: "#16a34a",
    lead:
      "Ғылыми есептеулер, графиктер және модельдеу алгоритмдерін тікелей браузерде іске қосыңыз.",
  },
  {
    id: "vr",
    href: "/dashboard/resources/vr",
    title: "Виртуалды тренажерлар (VR/AR)",
    eyebrow: "A-Frame WebXR • Meta Quest",
    icon: "Scan",
    accent: "#8b5cf6",
    lead:
      "Meta Quest және кез келген құрылғы арқылы 3D иммерсивті кеңістікте физика, ғарыш, тарих және робототехника тренажерларынан өтіңіз.",
  },
];

export function findSimulation(id: string): SimulationInfo | undefined {
  return simulations.find((sim) => sim.id === id);
}
