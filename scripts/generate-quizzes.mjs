import fs from "node:fs";
import path from "node:path";

const downloadsDir = "C:\\Users\\MECHREVO\\OneDrive\\Downloads";

const subjectsConfig = [
  {
    id: "mathematics",
    name: "Математика",
    title: "Математика: икемді дағдылар жағдаяттық викторинасы",
    tagline: "Логика, бюджет, деректерді талдау және сандық сауаттылық",
    filename: "Математика_икемді_дағдылар_200_тест.md",
    accent: "#3b82f6",
    icon: "Calculator",
  },
  {
    id: "physics",
    name: "Физика",
    title: "Физика: икемді дағдылар жағдаяттық викторинасы",
    tagline: "Эксперимент, энергетика, механика және инженерлік ойлау",
    filename: "Физика_икемді_дағдылар_200_тест.md",
    accent: "#06b6d4",
    icon: "Atom",
  },
  {
    id: "history",
    name: "Тарих",
    title: "Тарих: икемді дағдылар жағдаяттық викторинасы",
    tagline: "Дереккөздер, тарихи логика, эмпатия және сыни ойлау",
    filename: "Тарих_икемді_дағдылар_200_тест.md",
    accent: "#f59e0b",
    icon: "Landmark",
  },
  {
    id: "literature",
    name: "Әдебиет",
    title: "Әдебиет: икемді дағдылар жағдаяттық викторинасы",
    tagline: "Мәтінді талдау, эмпатия, аргументация және шығармашылық",
    filename: "Әдебиет_икемді_дағдылар_200_тест.md",
    accent: "#ec4899",
    icon: "BookOpen",
  },
  {
    id: "technology",
    name: "Технология",
    title: "Технология: икемді дағдылар жағдаяттық викторинасы",
    tagline: "Дизайн-ойлау, прототиптеу, қауіпсіздік және жобалау",
    filename: "Технология_икемді_дағдылар_200_тест.md",
    accent: "#10b981",
    icon: "Cpu",
  },
];

function cleanText(t) {
  if (!t) return "";
  return t
    .replace(/\\_/g, "_")
    .replace(/\\\./g, ".")
    .replace(/\*\*/g, "")
    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAnswers(text) {
  const answers = {};
  const lines = text.split("\n");
  const ansIdx = lines.findIndex(l => {
    const s = l.trim().toLowerCase();
    return s.startsWith("#") && (s.includes("жауап кілт") || s.includes("жауап кілті"));
  });
  if (ansIdx === -1) {
    console.error("Could not find answer key section header!");
    return answers;
  }

  for (let i = ansIdx; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/\|\s*(\d+)\s*\|\s*(?:\*{0,2})([ABCD])(?:\*{0,2})\s*\|\s*([^|]+?)(?:\|\s*([^|]*?))?(?:\||$)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const ansLetter = match[2].toUpperCase();
      const skill = cleanText(match[3]);
      const note = match[4] ? cleanText(match[4]) : "";
      answers[num] = {
        letter: ansLetter,
        index: ansLetter.charCodeAt(0) - 65, // A->0, B->1, C->2, D->3
        skill,
        note,
      };
    }
  }
  return answers;
}

function parseSubjectQuestions(subjectConfig) {
  const filePath = path.join(downloadsDir, subjectConfig.filename);
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split("\n");

  const answers = parseAnswers(text);

  let stopLine = lines.findIndex((l, idx) => {
    if (idx < 30) return false;
    const s = l.trim().toLowerCase();
    return s.startsWith("#") && (s.includes("жауап парағы") || s.includes("жауап кілт"));
  });
  if (stopLine === -1) stopLine = lines.length;

  const contentLines = lines.slice(0, stopLine);
  const questions = [];

  let currentSection = "";
  let i = 0;

  while (i < contentLines.length) {
    const line = contentLines[i].trim();

    if (line.startsWith("# ")) {
      currentSection = cleanText(line.replace(/^#\s*/, ""));
      i++;
      continue;
    }

    const qMatch = line.match(/^(?:\*{0,2})\s*(\d+)(?:\\\.|\.|\))\s+(.+)$/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      let promptText = qMatch[2].replace(/\*{1,2}$/, "").trim();

      i++;
      while (i < contentLines.length) {
        const nextLine = contentLines[i].trim();
        if (!nextLine) {
          i++;
          continue;
        }
        if (/^(?:\*{0,2})A(?:\)|\.|\s*\))/i.test(nextLine) || /^(?:\*{0,2})A\)\s+/i.test(nextLine)) {
          break;
        }
        if (/^(?:\*{0,2})\s*\d+(?:\\\.|\.|\))\s+/.test(nextLine)) {
          break;
        }
        if (nextLine.startsWith("# ")) {
          break;
        }
        promptText += " " + nextLine.replace(/\*{1,2}$/, "").trim();
        i++;
      }

      let optionLinesStr = "";
      while (i < contentLines.length) {
        const oLine = contentLines[i].trim();
        if (!oLine) {
          i++;
          if (i < contentLines.length) {
            const peek = contentLines[i].trim();
            if (/^(?:\*{0,2})\s*\d+(?:\\\.|\.|\))\s+/.test(peek) || peek.startsWith("# ")) {
              break;
            }
          }
          continue;
        }
        if (/^(?:\*{0,2})\s*\d+(?:\\\.|\.|\))\s+/.test(oLine) || oLine.startsWith("# ")) {
          break;
        }
        optionLinesStr += " " + oLine;
        i++;
      }

      const optA = optionLinesStr.match(/(?:^|\s)(?:\*{0,2})A(?:\)|\.)\s*(.*?)(?=\s*(?:\*{0,2})B(?:\)|\.)|$)/i);
      const optB = optionLinesStr.match(/(?:^|\s)(?:\*{0,2})B(?:\)|\.)\s*(.*?)(?=\s*(?:\*{0,2})C(?:\)|\.)|$)/i);
      const optC = optionLinesStr.match(/(?:^|\s)(?:\*{0,2})C(?:\)|\.)\s*(.*?)(?=\s*(?:\*{0,2})D(?:\)|\.)|$)/i);
      const optD = optionLinesStr.match(/(?:^|\s)(?:\*{0,2})D(?:\)|\.)\s*(.*?)$/i);

      const options = [];
      if (optA && optB && optC && optD) {
        options.push(cleanText(optA[1]));
        options.push(cleanText(optB[1]));
        options.push(cleanText(optC[1]));
        options.push(cleanText(optD[1]));
      }

      const ans = answers[qNum] || {
        letter: "A",
        index: 0,
        skill: "Сыни ойлау",
        note: "",
      };

      questions.push({
        num: qNum,
        id: `${subjectConfig.id}_q${qNum}`,
        prompt: cleanText(promptText),
        options,
        answer: ans.index,
        answerLetter: ans.letter,
        skill: ans.skill,
        note: ans.note,
        section: currentSection,
      });
      continue;
    }

    i++;
  }

  return {
    id: subjectConfig.id,
    name: subjectConfig.name,
    title: subjectConfig.title,
    tagline: subjectConfig.tagline,
    accent: subjectConfig.accent,
    icon: subjectConfig.icon,
    totalQuestions: questions.length,
    questions,
  };
}

const allSubjects = subjectsConfig.map(cfg => parseSubjectQuestions(cfg));

const fileContent = `/**
 * 5 пән бойынша 200 жағдаяттық тест сұрақтары (барлығы 1000 сұрақ).
 * 
 * Құжаттардан автоматты түрде генерацияланған:
 * - Математика (200 сұрақ)
 * - Физика (200 сұрақ)
 * - Тарих (200 сұрақ)
 * - Әдебиет (200 сұрақ)
 * - Технология (200 сұрақ)
 */

import type { IconName } from "@/components/dashboard/Icon";

export type SubjectQuizId = "mathematics" | "physics" | "history" | "literature" | "technology";

export type QuizQuestionItem = {
  num: number;
  id: string;
  prompt: string;
  options: [string, string, string, string];
  answer: number; // 0=A, 1=B, 2=C, 3=D
  answerLetter: "A" | "B" | "C" | "D";
  skill: string;
  note?: string;
  section: string;
};

export type SubjectQuizData = {
  id: SubjectQuizId;
  name: string;
  title: string;
  tagline: string;
  accent: string;
  icon: IconName;
  totalQuestions: number;
  questions: QuizQuestionItem[];
};

export const SUBJECT_QUIZZES: Record<SubjectQuizId, SubjectQuizData> = ${JSON.stringify(
  Object.fromEntries(allSubjects.map(s => [s.id, s])),
  null,
  2
)};

export const SUBJECT_QUIZ_LIST: SubjectQuizData[] = Object.values(SUBJECT_QUIZZES);

/** Сұрақтарды кездейсоқ араластыру (Fisher-Yates) */
export function shuffleQuestions(questions: QuizQuestionItem[], shuffleOptions = true): QuizQuestionItem[] {
  const cloned = questions.map((q) => {
    if (!shuffleOptions) return { ...q };
    // Shuffle options while keeping track of new correct answer
    const originalAnswerText = q.options[q.answer];
    const indexedOptions = q.options.map((text, i) => ({ text, isCorrect: i === q.answer }));
    for (let i = indexedOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
    }
    const newAnswerIndex = indexedOptions.findIndex((o) => o.isCorrect);
    const letters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    return {
      ...q,
      options: indexedOptions.map((o) => o.text) as [string, string, string, string],
      answer: newAnswerIndex >= 0 ? newAnswerIndex : 0,
      answerLetter: letters[newAnswerIndex >= 0 ? newAnswerIndex : 0],
    };
  });

  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  return cloned;
}
`;

const outputPath = path.join(process.cwd(), "data", "subjectQuizzes.ts");
fs.writeFileSync(outputPath, fileContent, "utf-8");
console.log(`Generated ${outputPath} successfully!`);
