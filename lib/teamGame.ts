export type TeamId = "red" | "blue" | "green" | "yellow";

export type GamePhase =
  | "lobby"
  | "countdown"
  | "question"
  | "reveal"
  | "leaderboard"
  | "game_over"
  | "room_closed";

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  badge: string;
  score: number;
}

export const TEAMS: Team[] = [
  { id: "red", name: "Қызыл Арыстандар", color: "#ef4444", badge: "🦁", score: 0 },
  { id: "blue", name: "Көк Бүкіттер", color: "#3b82f6", badge: "🦅", score: 0 },
  { id: "green", name: "Жасыл Барыстар", color: "#10b981", badge: "🐆", score: 0 },
  { id: "yellow", name: "Сары Тұлпарлар", color: "#f59e0b", badge: "🐎", score: 0 },
];

export interface Player {
  id: string;
  name: string;
  teamId: TeamId;
  score: number;
  isHost: boolean;
  avatar: string;
  joinedAt: number;
}

export type QuestionCategory =
  | "Барлығы"
  | "Физика"
  | "Химия"
  | "Биология"
  | "Математика"
  | "STEM & Робототехника";

export const CATEGORIES: QuestionCategory[] = [
  "Барлығы",
  "Физика",
  "Химия",
  "Биология",
  "Математика",
  "STEM & Робототехника",
];

export const REACTION_EMOJIS = ["👏", "🚀", "🔥", "💡", "🎉", "💯", "⭐"];

export interface STEMQuestion {
  id: string;
  category: "Физика" | "Химия" | "Биология" | "Математика" | "STEM & Робототехника";
  title: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimit: number; // seconds
  points: number;
}

export function calculatePointsWithSpeedBonus(
  basePoints: number,
  remainingSeconds: number,
  totalSeconds: number
): { total: number; speedBonus: number } {
  if (remainingSeconds <= 0) return { total: basePoints, speedBonus: 0 };
  const ratio = remainingSeconds / totalSeconds;
  let speedBonus = 0;
  if (ratio > 0.75) {
    speedBonus = 50; // Fast answer bonus
  } else if (ratio > 0.5) {
    speedBonus = 30;
  } else if (ratio > 0.25) {
    speedBonus = 10;
  }
  return { total: basePoints + speedBonus, speedBonus };
}

export const STEM_QUESTIONS: STEMQuestion[] = [
  {
    id: "q1",
    category: "Физика",
    title: "Ньютонның екінші заңы бойынша күш (F), масса (m) және үдеу (a) арасындағы байланыс формуласы қандай?",
    options: ["F = m × a", "F = m / a", "F = m + a", "F = a / m"],
    correctIndex: 0,
    explanation: "Ньютонның 2-заңы: Денеге әсер етуші күш оның массасы мен үдеуінің көбейтіндісіне тең (F = m · a).",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q2",
    category: "Биология",
    title: "Өсімдіктерде фотосинтез процесі жасушаның қай органоидында жүреді?",
    options: ["Митохондрия", "Хлоропласт", "Рибосома", "Ядро"],
    correctIndex: 1,
    explanation: "Фотосинтез хлорофилл пигменті бар хлоропласттарда күн жарығының әсерінен жүреді.",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q3",
    category: "Химия",
    title: "Судың химиялық формуласы H₂O. Су молекуласында қандай химиялық байланыс түрі бар?",
    options: ["Иондық", "Ковалентті полюсті", "Металдық", "Сутектік ішкі"],
    correctIndex: 1,
    explanation: "Сутегі мен оттегі бейметалдар болып табылады, олардың арасында ковалентті полюсті байланыс түзіледі.",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q4",
    category: "Математика",
    title: "Тікбұрышты үшбұрыштың катеттері 3 см және 4 см болса, гипотенузасы нешеге тең? (Пифагор теоремасы)",
    options: ["5 см", "6 см", "7 см", "8 см"],
    correctIndex: 0,
    explanation: "Пифагор теоремасы бойынша c² = a² + b² = 3² + 4² = 9 + 16 = 25. Ендеше c = 5 см.",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q5",
    category: "STEM & Робототехника",
    title: "Роботтың қоршаған ортадағы кедергіге дейінгі қашықтықты өлшеу үшін қандай датчик қолданылады?",
    options: ["Гироскоп", "Ультрадыбыстық (Ultrasonic) датчик", "Термометр", "Барометр"],
    correctIndex: 1,
    explanation: "Ультрадыбыстық датчик дыбыс толқынын жіберіп, шағылысқан уақыты арқылы қашықтықты дәл анықтайды.",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q6",
    category: "Физика",
    title: "Күн жүйесіндегі ең үлкен планета қайсысы?",
    options: ["Марс", "Сатурн", "Юпитер", "Уран"],
    correctIndex: 2,
    explanation: "Юпитер — Күн жүйесіндегі ең массалы және ең үлкен газ гиганты планета.",
    timeLimit: 20,
    points: 100,
  },
  {
    id: "q7",
    category: "Биология",
    title: "Адам ағзасында оттегіні мүшелерге тасымалдайтын қан жасушалары қалай аталады?",
    options: ["Эритроциттер", "Лейкоциттер", "Тромбоциттер", "Нейрондар"],
    correctIndex: 0,
    explanation: "Эритроциттер құрамындағы гемоглобин нәтижесінде оттегіні өкпеден дене мүшелеріне тасымалдайды.",
    timeLimit: 20,
    points: 100,
  },
];

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AVATARS(): string[] {
  return ["🚀", "🧪", "⚡", "🤖", "🧬", "🔬", "🪐", "💡", "🎯", "🎓", "🌟", "🔥"];
}

export function getQuestionsForLesson(lessonId: string): STEMQuestion[] {
  switch (lessonId) {
    case "bridge-strength":
      return [
        {
          id: "bs1",
          category: "Физика",
          title: "Көпір құрылысында арка (доғалы) пішіннің басты артықшылығы неде?",
          options: ["Салмақты екі жаққа біркелкі таратады", "Тек сәндік үшін", "Материалды көп жұмсайды", "Суды тоқтатады"],
          correctIndex: 0,
          explanation: "Арка жүктемені екі жақтағы тіреулерге ығыстырып, жүк көтергіштігін арттырады.",
          timeLimit: 20,
          points: 100,
        },
        {
          id: "bs2",
          category: "STEM & Робототехника",
          title: "Тіреуіш фермаларда (Truss bridge) неліктен үшбұрышты геометрия жиі қолданылады?",
          options: ["Үшбұрыш — ең берік геометриялық пішін", "Төртбұрыш жасау қиын", "Үшбұрыш жеңіл өріледі", "Ауаны тез өткізеді"],
          correctIndex: 0,
          explanation: "Үшбұрыш пішіні бұрыштары өзгермейтін, деформацияға ең төзімді пішін болып табылады.",
          timeLimit: 20,
          points: 100,
        },
      ];
    case "city-budget":
      return [
        {
          id: "cb1",
          category: "Математика",
          title: "Қала бюджетінде эко-жобаларға 30% бөлінді. Тұрғындар ұсынысымен бұл 15%-ға арттырылса, барлығы неше процент?",
          options: ["45%", "35%", "50%", "40%"],
          correctIndex: 0,
          explanation: "30% + 15% = 45% құрайды.",
          timeLimit: 20,
          points: 100,
        },
      ];
    case "eco-robot":
      return [
        {
          id: "er1",
          category: "STEM & Робототехника",
          title: "Экологиялық сұрыптау роботы пластик пен металды ажырату үшін қандай датчиктерді қатар қолдануы керек?",
          options: ["Металлодетектор және Оптикалық түс датчигі", "Тек гироскоп", "Тек термометр", "Дыбыс датчигі"],
          correctIndex: 0,
          explanation: "Металл іздегіш пен оптикалық түс сенсоры материал түрін дәл анықтауға мүмкіндік береді.",
          timeLimit: 20,
          points: 100,
        },
      ];
    default:
      return STEM_QUESTIONS;
  }
}
