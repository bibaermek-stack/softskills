/**
 * Командалық жобалар симуляторының деректері (2.11).
 *
 * Схемадағы `teamSimulator` блогы бес аймақты сипаттайды: орта → рөлдер →
 * коммуникация → қақтығыс → нәтиже. Мұндағы деректер сол блоктың тізімдерін
 * нақты интерактивке айналдырады: әр жол — таңдалатын нысанға, ал қақтығыс
 * сценарийлері салдары бар шешімге айналған.
 *
 * Сценарий атаулары мен жағдаяттары `lib/content.ts` ішіндегі
 * `collaborationScenarios`-пен сәйкес — мәтін екі жерде қайталанбауы үшін
 * сол жерден алынады.
 */

import type { IconName } from "@/components/dashboard/Icon";
import { collaborationScenarios } from "./content";

/** Команда жұмысының өлшенетін төрт көрсеткіші. */
export type MeterId = "communication" | "deadline" | "quality" | "morale";

export const METERS: { id: MeterId; label: string; icon: IconName; accent: string }[] = [
  { id: "communication", label: "Коммуникация", icon: "MessageSquare", accent: "#0891b2" },
  { id: "deadline", label: "Мерзім", icon: "Timer", accent: "#ea580c" },
  { id: "quality", label: "Сапа", icon: "Gauge", accent: "#2563eb" },
  { id: "morale", label: "Команда көңіл күйі", icon: "HeartHandshake", accent: "#15803d" },
];

/** Барлық көрсеткіш осы мәннен басталады. */
export const METER_START = 60;

export type SimEnvironment = {
  id: string;
  label: string;
  icon: IconName;
  accent: string;
  text: string;
};

/** `teamSimulator[0].items` тізімінің интерактивті нұсқасы. */
export const environments: SimEnvironment[] = [
  {
    id: "city",
    label: "Қала кеңістігі",
    icon: "Globe",
    accent: "#2563eb",
    text: "Қала мәселесін шешетін әлеуметтік жоба: тұрғындармен байланыс маңызды.",
  },
  {
    id: "lab",
    label: "Ғылыми зертхана",
    icon: "FlaskConical",
    accent: "#0891b2",
    text: "Эксперимент пен дәлдік басым: деректі тексермей шешім қабылданбайды.",
  },
  {
    id: "office",
    label: "Жобалық кеңсе",
    icon: "Presentation",
    accent: "#7c3aed",
    text: "Мерзім мен ресурс қатаң: жоспарлау шешуші рөл атқарады.",
  },
  {
    id: "council",
    label: "Тарихи кеңес",
    icon: "Landmark",
    accent: "#ea580c",
    text: "Әр шешім дереккөзбен негізделуі керек, көзқарастар қайшы келеді.",
  },
];

export type TeamRole = {
  id: string;
  title: string;
  icon: IconName;
  accent: string;
  duty: string;
};

/** `teamSimulator[1].items` тізімінің интерактивті нұсқасы. */
export const roles: TeamRole[] = [
  {
    id: "lead",
    title: "Жоба жетекшісі",
    icon: "Flag",
    accent: "#1e3a8a",
    duty: "Тапсырманы бөледі, кестені ұстайды, шешімге жауап береді.",
  },
  {
    id: "researcher",
    title: "Зерттеуші",
    icon: "Microscope",
    accent: "#0891b2",
    duty: "Дереккөз жинайды, фактіні тексереді.",
  },
  {
    id: "engineer",
    title: "Инженер",
    icon: "CircuitBoard",
    accent: "#2563eb",
    duty: "Техникалық шешімді құрастырып, сынайды.",
  },
  {
    id: "designer",
    title: "Дизайнер",
    icon: "Palette",
    accent: "#ea580c",
    duty: "Өнімнің көрінісі мен ыңғайлылығын жасайды.",
  },
  {
    id: "analyst",
    title: "Аналитик",
    icon: "ChartLine",
    accent: "#15803d",
    duty: "Деректі талдап, сандық негіздеме береді.",
  },
  {
    id: "speaker",
    title: "Баяндамашы",
    icon: "MessageSquare",
    accent: "#7c3aed",
    duty: "Жобаны қорғап, сұрақтарға жауап береді.",
  },
];

export type TeamMember = {
  id: string;
  name: string;
  trait: string;
  /** Осы мүше күшті болатын рөлдер. */
  strengths: string[];
};

export const members: TeamMember[] = [
  { id: "m1", name: "Айсұлу", trait: "Жоспарлауды ұнатады, мерзімді қатты ұстайды", strengths: ["lead", "analyst"] },
  { id: "m2", name: "Дәулет", trait: "Құрастыруға шебер, қолымен жұмыс істегенді жақсы көреді", strengths: ["engineer"] },
  { id: "m3", name: "Мадина", trait: "Дереккөзбен ұқыпты жұмыс істейді", strengths: ["researcher", "analyst"] },
  { id: "m4", name: "Ерасыл", trait: "Көпшілік алдында сөйлеуден қорықпайды", strengths: ["speaker", "lead"] },
  { id: "m5", name: "Аружан", trait: "Визуалды шешім ұсынуға бейім", strengths: ["designer"] },
  { id: "m6", name: "Нұрлан", trait: "Сандармен жұмыс істеуді ұнатады", strengths: ["analyst", "engineer"] },
];

export type ScenarioOption = {
  id: string;
  label: string;
  /** Көрсеткіштерге таңбалы өзгеріс. */
  effects: Partial<Record<MeterId, number>>;
  /** Таңдаудың салдары — оқушыға көрсетіледі. */
  feedback: string;
  /** Әдістемелік тұрғыда ең күшті таңдау. */
  best?: boolean;
};

export type TeamScenario = {
  id: string;
  title: string;
  situation: string;
  icon: IconName;
  accent: string;
  /** Қай арна арқылы шешіледі — `teamSimulator[2].items` ішінен. */
  channel: string;
  /** Қай рөлдің жауапкершілік аймағы. */
  ownerRole: string;
  options: ScenarioOption[];
};

/** Схемадағы төрт қақтығыс сценарийінің мәтіні. */
function situationOf(title: string): string {
  return collaborationScenarios.find((item) => item.title === title)?.text ?? "";
}

export const scenarios: TeamScenario[] = [
  {
    id: "deadline",
    title: "Мерзім қысқарды",
    situation: situationOf("Мерзім қысқарды"),
    icon: "Timer",
    accent: "#ea580c",
    channel: "Командалық чат",
    ownerRole: "lead",
    options: [
      {
        id: "a",
        label: "Қосымша функциядан бас тартып, негізгісін сапалы бітіру",
        effects: { deadline: 18, quality: 6, morale: 4 },
        feedback:
          "Ауқымды қысқарту — мерзім қысқарғандағы ең сенімді шешім. Негізгі нәтиже сақталады, команда шаршамайды.",
        best: true,
      },
      {
        id: "b",
        label: "Бәрін істеуге тырысып, түнде жұмыс істеу",
        effects: { deadline: 6, quality: -12, morale: -18 },
        feedback:
          "Ауқым сақталды, бірақ сапа төмендеп, команда шаршады. Асығыс жасалған жұмыс кейін қайта істеуді талап етеді.",
      },
      {
        id: "c",
        label: "Мұғалімнен мерзімді ұзартуды сұрау",
        effects: { deadline: -6, communication: 8, morale: 2 },
        feedback:
          "Ашық сөйлесу дұрыс, бірақ мерзім әрқашан ұзартыла бермейді. Қосымша жоспар керек еді.",
      },
    ],
  },
  {
    id: "conflict",
    title: "Команда келіспеді",
    situation: situationOf("Команда келіспеді"),
    icon: "Scale",
    accent: "#7c3aed",
    channel: "Бейнеконференция",
    ownerRole: "lead",
    options: [
      {
        id: "a",
        label: "Екі нұсқаны критерий бойынша салыстырып, бірге шешу",
        effects: { communication: 16, quality: 10, morale: 10 },
        feedback:
          "Критерий енгізу дауды пікірталастан шешімге айналдырады: таңдау жеке емес, дәлелге негізделеді.",
        best: true,
      },
      {
        id: "b",
        label: "Жетекші өз бетімен шешім қабылдайды",
        effects: { deadline: 8, communication: -12, morale: -10 },
        feedback:
          "Шешім тез қабылданды, бірақ пікірі ескерілмеген мүшелер жобадан алшақтады.",
      },
      {
        id: "c",
        label: "Дауыс беріп, көпшілікке сүйену",
        effects: { communication: 6, morale: 4, quality: -4 },
        feedback:
          "Дауыс беру жылдам, бірақ ең дұрыс шешім әрқашан көпшіліктің таңдауы бола бермейді.",
      },
    ],
  },
  {
    id: "resource",
    title: "Ресурс жетіспейді",
    situation: situationOf("Ресурс жетіспейді"),
    icon: "Boxes",
    accent: "#0891b2",
    channel: "Пікірталас форумы",
    ownerRole: "engineer",
    options: [
      {
        id: "a",
        label: "Қолда бар материалдан балама шешім жобалау",
        effects: { quality: 12, communication: 6, morale: 8 },
        feedback:
          "Шектеу — шығармашылықтың қозғаушысы. Балама шешім жобаны тоқтатпай, тәжірибе де қосты.",
        best: true,
      },
      {
        id: "b",
        label: "Материал келгенше жұмысты тоқтату",
        effects: { deadline: -16, morale: -8 },
        feedback: "Күту уақытты жоғалтты. Параллель жүретін жұмыстар бар еді.",
      },
      {
        id: "c",
        label: "Жобаның ауқымын күрт қысқарту",
        effects: { deadline: 10, quality: -10 },
        feedback:
          "Мерзім сақталды, бірақ жобаның негізгі идеясы әлсіреді. Алдымен балама іздеу керек еді.",
      },
    ],
  },
  {
    id: "failure",
    title: "Техникалық ақау",
    situation: situationOf("Техникалық ақау"),
    icon: "TriangleAlert",
    accent: "#2563eb",
    channel: "Дауыстық байланыс",
    ownerRole: "engineer",
    options: [
      {
        id: "a",
        label: "Ақаудың себебін жүйелі түрде іздеп, тексеру журналын жүргізу",
        effects: { quality: 16, communication: 6, deadline: -2 },
        feedback:
          "Диагностика ретімен жүргізілді: себеп табылды әрі құжатталды. Дәл осы жазба қорғауда дәлел болады.",
        best: true,
      },
      {
        id: "b",
        label: "Барлық бөлшекті жаңасына ауыстыру",
        effects: { deadline: -10, quality: 4, morale: -4 },
        feedback:
          "Прототип жұмыс істеуі мүмкін, бірақ себеп белгісіз қалды — ақау қайталануы ықтимал.",
      },
      {
        id: "c",
        label: "Ақауды таныстыруда айтпай, жасырып қою",
        effects: { quality: -16, morale: -12, communication: -8 },
        feedback:
          "Ғылыми адалдыққа қайшы. Сәтсіздікті ашық айту — нәтиженің бөлігі, оны жасыру жобаның құнын түсіреді.",
      },
    ],
  },
];

/** Нәтиже экранындағы өлшемдер — `teamSimulator[4].items`. */
export const resultDimensions = [
  "Жария таныстыру",
  "Дайын өнім",
  "Әлеуметтік әсер",
  "Рефлексия есебі",
] as const;

export function clampMeter(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Қорытынды ұпай: көрсеткіштердің орташасы + рөлдің мүшеге сай келу бонусы.
 * Бонус ең көбі 12 балл — таңдау шешуші, ал сәйкестік қосымша.
 */
export function scoreTeamSim(
  meters: Record<MeterId, number>,
  assignments: Record<string, string | null>,
): { base: number; fitBonus: number; score: number; matched: number } {
  const values = METERS.map((meter) => meters[meter.id]);
  const base = values.reduce((sum, value) => sum + value, 0) / values.length;

  const matched = members.reduce((count, member) => {
    const roleId = assignments[member.id];
    return count + (roleId && member.strengths.includes(roleId) ? 1 : 0);
  }, 0);

  const fitBonus = Math.min(12, matched * 3);
  return { base, fitBonus, matched, score: clampMeter(Math.round(base + fitBonus)) };
}

export function feedbackTier(score: number): { title: string; text: string; accent: string } {
  if (score >= 85) {
    return {
      title: "Үлгілі команда",
      text: "Шешімдерің дәлелге негізделді, рөлдер күшті жағына сай бөлінді.",
      accent: "#15803d",
    };
  }
  if (score >= 70) {
    return {
      title: "Тұрақты жұмыс",
      text: "Жоба сәтті аяқталды. Кейбір шешімде сапа мен мерзімнің тепе-теңдігін жақсартуға болады.",
      accent: "#2563eb",
    };
  }
  if (score >= 55) {
    return {
      title: "Даму үстінде",
      text: "Негізгі мақсатқа жеттіңдер, бірақ коммуникация мен жоспарлауда олқылық болды.",
      accent: "#ea580c",
    };
  }
  return {
    title: "Қайта қарау қажет",
    text: "Шешімдер команданың жағдайын нашарлатты. Сценарийлерді қайта өтіп, салдарын талдаңыз.",
    accent: "#7c3aed",
  };
}
