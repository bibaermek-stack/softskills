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
