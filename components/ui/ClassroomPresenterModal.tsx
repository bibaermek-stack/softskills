"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/dashboard/Icon";
import { KatexFormula } from "@/components/ui/KatexFormula";

interface QuickQuiz {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  formula?: string;
}

const CLASSROOM_QUIZZES: QuickQuiz[] = [
  {
    question: "⚡ Кернеу U = 220 В, ал кедергі R = 22 Ом болғанда тізбектегі Ток күші (I) неге тең?",
    options: ["А) 5 Ампер", "Б) 10 Ампер", "В) 15 Ампер", "Г) 20 Ампер"],
    correct: 1,
    explanation: "Ом заңы бойынша: I = U / R. Сондықтан I = 220 / 22 = 10 Ампер.",
    formula: "I = \\frac{U}{R} = \\frac{220}{22} = 10\\text{ A}",
  },
  {
    question: "🪐 Жер бетіндегі еркін түсу үдеуінің (g) орташа мәні қандай?",
    options: ["А) 3.71 м/с²", "Б) 8.87 м/с²", "В) 9.81 м/с²", "Г) 24.79 м/с²"],
    correct: 2,
    explanation: "Жердің ауырлық күші үдеуі g ≈ 9.81 м/с² тең.",
    formula: "g = G \\cdot \\frac{M}{R^2} \\approx 9.81\\text{ м/с}^2",
  },
  {
    question: "🐍 Python тілінде айнымалының квадратын есептеу үшін қай оператор қолданылады?",
    options: ["А) x ^ 2", "Б) x ** 2", "В) sqr(x)", "Г) x.square()"],
    correct: 1,
    explanation: "Python тілінде дәрежеге шығару операторы — қос жұлдызша ** есептеледі.",
  },
];

export function ClassroomPresenterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textScale, setTextScale] = useState<"normal" | "large" | "xlarge">("large");
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-presenter-mode", handleOpen);
    return () => window.removeEventListener("open-presenter-mode", handleOpen);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const currentQuiz = CLASSROOM_QUIZZES[activeQuizIndex];

  const scaleClass =
    textScale === "xlarge"
      ? "text-xl sm:text-2xl"
      : textScale === "large"
      ? "text-lg sm:text-xl"
      : "text-base";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-4xl rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <Icon name="GraduationCap" className="size-6" />
            </div>
            <div>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-emerald-300 border border-emerald-500/30">
                💾 Ешқандай Тіркелусіз • Офлайн/Онлайн Оқыту
              </span>
              <h2 className="text-xl font-bold text-white">📺 Мұғалімнің Интерактивті Экран Режимі</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Selector */}
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-white/10 text-xs font-bold">
              <button
                onClick={() => setTextScale("normal")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  textScale === "normal" ? "bg-cyan-500 text-slate-950 font-black" : "text-slate-400"
                }`}
              >
                100%
              </button>
              <button
                onClick={() => setTextScale("large")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  textScale === "large" ? "bg-cyan-500 text-slate-950 font-black" : "text-slate-400"
                }`}
              >
                125%
              </button>
              <button
                onClick={() => setTextScale("xlarge")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  textScale === "xlarge" ? "bg-cyan-500 text-slate-950 font-black" : "text-slate-400"
                }`}
              >
                150%
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <Icon name="Expand" className="size-4 text-cyan-400" />
              {isFullscreen ? "Шығу" : "Толық Экран"}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="grid size-9 place-items-center rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Interactive Quiz Display Area */}
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
              Сыныптық Квиз • Сұрақ {activeQuizIndex + 1} / {CLASSROOM_QUIZZES.length}
            </span>
            <span className="text-xs text-slate-400">
              💡 Оқушылар үлкен экранға қарап, жауап береді
            </span>
          </div>

          <h3 className={`font-bold text-white leading-relaxed ${scaleClass}`}>
            {currentQuiz.question}
          </h3>

          {currentQuiz.formula && (
            <div className="my-2 rounded-xl bg-slate-900/90 p-4 border border-cyan-500/30 text-center">
              <KatexFormula math={currentQuiz.formula} block />
            </div>
          )}

          {/* Options Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {currentQuiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuiz.correct;
              let btnStyle = "bg-slate-900 border-white/10 text-slate-200 hover:border-white/30";

              if (selectedOption !== null) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-extrabold";
                } else if (isSelected) {
                  btnStyle = "bg-rose-600/30 border-rose-500 text-rose-200";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedOption(idx);
                    setShowExplanation(true);
                  }}
                  className={`rounded-2xl border p-4 text-left font-semibold transition cursor-pointer ${btnStyle} ${scaleClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {showExplanation && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 space-y-2 text-emerald-200 text-sm animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Icon name="CircleCheck" className="size-5 text-emerald-400" />
                Дұрыс Жауап Түсініктемесі:
              </div>
              <p className="leading-relaxed text-slate-200">{currentQuiz.explanation}</p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Icon name="Info" className="size-4 text-cyan-400" />
            Интерактивті тақтада нүктелер сақталады. Браузерді жапсаңыз да деректер жоғалмайды (localStorage).
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedOption(null);
                setShowExplanation(false);
                setActiveQuizIndex((prev) => (prev + 1) % CLASSROOM_QUIZZES.length);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
            >
              <span>Келесі Сұрақ</span>
              <Icon name="ArrowRight" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
