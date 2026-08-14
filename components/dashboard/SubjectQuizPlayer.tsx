"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  type SubjectQuizData,
  type QuizQuestionItem,
  shuffleQuestions,
} from "@/data/subjectQuizzes";
import { Icon } from "./Icon";
import { IconBadge } from "./Panel";
import { cn } from "@/lib/cn";

type QuizMode = "all" | "section" | "blitz25" | "blitz50";
type FeedbackMode = "training" | "exam";

interface SubjectQuizPlayerProps {
  quizData: SubjectQuizData;
}

export function SubjectQuizPlayer({ quizData }: SubjectQuizPlayerProps) {

  // Settings & modes
  const [quizMode, setQuizMode] = useState<QuizMode>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("training");
  const [isShuffled, setIsShuffled] = useState<boolean>(true);

  // Active quiz pool and question pointer
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  
  // Game session states
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState<boolean>(false);
  const [filterReviewOnlyWrong, setFilterReviewOnlyWrong] = useState<boolean>(false);

  // Available unique sections in this subject quiz
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    for (const q of quizData.questions) {
      if (q.section) set.add(q.section);
    }
    return Array.from(set);
  }, [quizData]);

  // Start / Restart Quiz Session
  const initQuizSession = useCallback(
    (mode: QuizMode, section: string, shuffle: boolean) => {
      let pool: QuizQuestionItem[] = [...quizData.questions];

      if (mode === "section" && section !== "all") {
        pool = pool.filter((q) => q.section === section);
      } else if (mode === "blitz25") {
        pool = pool.slice(0, 25);
      } else if (mode === "blitz50") {
        pool = pool.slice(0, 50);
      }

      if (shuffle) {
        pool = shuffleQuestions(pool, true);
      }

      setActiveQuestions(pool);
      setCurrentIndex(0);
      setUserAnswers({});
      setBookmarkedIds({});
      setTimeElapsed(0);
      setIsStarted(true);
      setIsCompleted(false);
      setIsTimerRunning(true);
      setFilterReviewOnlyWrong(false);
    },
    [quizData]
  );

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isCompleted]);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = activeQuestions[currentIndex];
  const totalInSession = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalInSession > 0 ? Math.round((answeredCount / totalInSession) * 100) : 0;

  // Handle option select
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ || isCompleted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  // Toggle bookmark
  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Finish quiz
  const handleFinishQuiz = () => {
    setIsTimerRunning(false);
    setIsCompleted(true);
  };

  // Diagnostic calculations on completion
  const results = useMemo(() => {
    if (!isCompleted || activeQuestions.length === 0) return null;

    let correctCount = 0;
    const skillStats: Record<string, { total: number; correct: number }> = {};
    const wrongQuestions: QuizQuestionItem[] = [];

    activeQuestions.forEach((q) => {
      const userAns = userAnswers[q.id];
      const isCorrect = userAns === q.answer;

      if (isCorrect) correctCount++;
      else wrongQuestions.push(q);

      const s = q.skill || "Жалпы дағды";
      if (!skillStats[s]) {
        skillStats[s] = { total: 0, correct: 0 };
      }
      skillStats[s].total++;
      if (isCorrect) skillStats[s].correct++;
    });

    const percent = Math.round((correctCount / activeQuestions.length) * 100);

    // Official score interpretation from the curriculum guidelines:
    // 160-200: Дағдылар тұрақты көрінеді (Жоғары)
    // 120-159: Жақсы деңгей, жекелеген дағдыларды жетілдіру қажет
    // 80-119: Орташа деңгей, жүйелі жаттығу қажет
    // 0-79: Дағдыларды қадамдық жағдаяттық тапсырмалар арқылы қолдау қажет
    let levelTitle = "";
    let levelTone = "";
    let levelDesc = "";

    if (percent >= 80) {
      levelTitle = "Жоғары деңгей — Дағдылар тұрақты көрінеді";
      levelTone = "#10b981";
      levelDesc =
        "Сіз жағдаяттық тапсырмаларда тиімді шешім қабылдау және сыни талдау дағдыларын өте жоғары деңгейде көрсеттіңіз. Икемді дағдыларыңыз тұрақты қалыптасқан.";
    } else if (percent >= 60) {
      levelTitle = "Жақсы деңгей — Жекелеген дағдыларды жетілдіру қажет";
      levelTone = "#3b82f6";
      levelDesc =
        "Негізгі жағдаяттарда дұрыс логика мен шешім таңдай білесіз. Кейбір күрделі дағдылар бойынша қосымша жаттығулар ұсынылады.";
    } else if (percent >= 40) {
      levelTitle = "Орташа деңгей — Жүйелі жаттығу қажет";
      levelTone = "#f59e0b";
      levelDesc =
        "Нәтиже қанағаттанарлық. Жағдаятты тереңірек талдап, деректер мен аргументтерді байланыстыруды жаттықтыру қажет.";
    } else {
      levelTitle = "Бастапқы деңгей — Қадамдық қолдау қажет";
      levelTone = "#ef4444";
      levelDesc =
        "Дағдыларды қадамдық жағдаяттық тапсырмалар арқылы қолдап, талдау және шешім қабылдау логикасын қайта қарап шығу ұсынылады.";
    }

    return {
      correctCount,
      total: activeQuestions.length,
      percent,
      levelTitle,
      levelTone,
      levelDesc,
      skillStats,
      wrongQuestions,
    };
  }, [isCompleted, activeQuestions, userAnswers]);

  // Questions to display in review list
  const displayQuestionsInReview = useMemo(() => {
    if (!results) return [];
    if (filterReviewOnlyWrong) return results.wrongQuestions;
    return activeQuestions;
  }, [results, filterReviewOnlyWrong, activeQuestions]);

  return (
    <div className="mt-3 flex flex-col gap-4">
      {/* Навигациялық тізбек */}
      <nav aria-label="Бет орны" className="flex flex-wrap items-center gap-1.5 text-[0.78rem]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Icon name="ChevronLeft" className="size-3.5" strokeWidth={2.2} />
          Панель
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <Link
          href="/dashboard/quiz"
          className="rounded-lg px-2 py-1 font-medium text-ink-700/75 transition hover:bg-ink-700/6 hover:text-ink-900 dark:text-paper-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Викториналар
        </Link>
        <span className="text-ink-600/35 dark:text-paper-300/50">/</span>
        <span className="px-1 font-semibold" style={{ color: quizData.accent }}>
          {quizData.name} (200 сұрақ)
        </span>
      </nav>

      {/* ========================================================= */}
      {/* 1. БАСТАПҚЫ БАПТАУ ЖӘНЕ ДАЙЫНДЫҚ ЭКРАНЫ                  */}
      {/* ========================================================= */}
      {!isStarted && (
        <div className="dash-card relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
          <div
            className="absolute top-0 right-0 size-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: quizData.accent }}
            aria-hidden
          />

          <div className="relative max-w-3xl">
            <div className="flex items-center gap-3">
              <IconBadge name={quizData.icon} accent={quizData.accent} size="lg" />
              <div>
                <span
                  className="text-[0.72rem] font-bold tracking-[0.14em] uppercase"
                  style={{ color: quizData.accent }}
                >
                  Икемді дағдылар жағдаяттық викторинасы
                </span>
                <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl lg:text-4xl dark:text-white">
                  {quizData.name} пәнінен 200 тест
                </h1>
              </div>
            </div>

            <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-700 dark:text-paper-200">
              {quizData.tagline}. Бұл тест тек академиялық білімді емес, сыни ойлау, мәселені шешу,
              шығармашылық, шешім қабылдау және ақпараттық сауаттылық сияқты икемді дағдыларды (Soft
              Skills) дамытуға бағытталған.
            </p>

            {/* Карточкалар: сұрақтар саны және ерекшелігі */}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-ink-700/8 bg-paper-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="text-[0.68rem] font-bold text-ink-600/70 uppercase dark:text-paper-400">
                  Жалпы қор
                </span>
                <p className="mt-1 font-display text-xl font-bold" style={{ color: quizData.accent }}>
                  200 жағдаяттық сұрақ
                </p>
                <p className="mt-0.5 text-[0.75rem] text-ink-700/80 dark:text-paper-300">
                  10 тақырыптық бөлім
                </p>
              </div>

              <div className="rounded-2xl border border-ink-700/8 bg-paper-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="text-[0.68rem] font-bold text-ink-600/70 uppercase dark:text-paper-400">
                  Динамикалық режим
                </span>
                <p className="mt-1 font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Араластыру қосулы
                </p>
                <p className="mt-0.5 text-[0.75rem] text-ink-700/80 dark:text-paper-300">
                  Әр кіргенде сұрақ реті ауысады
                </p>
              </div>

              <div className="rounded-2xl border border-ink-700/8 bg-paper-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="text-[0.68rem] font-bold text-ink-600/70 uppercase dark:text-paper-400">
                  Қорытынды бағалау
                </span>
                <p className="mt-1 font-display text-xl font-bold text-purple-600 dark:text-purple-400">
                  Дағдылар картасы
                </p>
                <p className="mt-0.5 text-[0.75rem] text-ink-700/80 dark:text-paper-300">
                  Soft Skills аналитикасы
                </p>
              </div>
            </div>

            {/* Баптаулар бөлімі */}
            <div className="mt-8 space-y-6 rounded-2xl border border-ink-700/10 bg-white/70 p-5 sm:p-6 dark:border-white/10 dark:bg-ink-900/60">
              <h2 className="font-display text-[0.88rem] font-bold text-ink-900 uppercase dark:text-white">
                Викторина параметрлерін таңдаңыз:
              </h2>

              {/* 1. Көлем мен бөлім */}
              <div>
                <label className="block text-[0.78rem] font-bold text-ink-800 dark:text-paper-200">
                  1. Викторина көлемі:
                </label>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: "all", label: "Барлық 200 сұрақ", desc: "Толық курс" },
                    { id: "section", label: "Бөлім бойынша", desc: "20 сұрақтан" },
                    { id: "blitz50", label: "50 сұрақ (Орта)", desc: "Кездейсоқ іріктеу" },
                    { id: "blitz25", label: "25 сұрақ (Блиц)", desc: "Жылдам сынақ" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQuizMode(item.id as QuizMode)}
                      className={cn(
                        "flex flex-col items-start rounded-xl p-3 text-left transition",
                        quizMode === item.id
                          ? "bg-ink-900 text-white shadow-soft ring-2 ring-brand-500 dark:bg-white dark:text-ink-950"
                          : "border border-ink-700/10 bg-paper-50 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      )}
                    >
                      <span className="font-display text-[0.82rem] font-bold">{item.label}</span>
                      <span className="mt-0.5 text-[0.7rem] opacity-75">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Егер бөлім бойынша таңдалса */}
              {quizMode === "section" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="block text-[0.78rem] font-bold text-ink-800 dark:text-paper-200">
                    Тақырыптық бөлімді таңдаңыз:
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full rounded-xl border border-ink-700/15 bg-paper-50 p-3 text-[0.84rem] font-medium text-ink-900 focus:ring-2 focus:ring-brand-500 dark:border-white/15 dark:bg-ink-900 dark:text-white"
                  >
                    <option value="all">Барлық бөлімдер</option>
                    {availableSections.map((sec, idx) => (
                      <option key={sec} value={sec}>
                        {sec || `Бөлім ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* 2. Араластыру мен оқу режимі */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-ink-700/10 p-3.5 dark:border-white/10">
                  <div>
                    <p className="text-[0.82rem] font-bold text-ink-900 dark:text-white">
                      Сұрақтарды араластыру
                    </p>
                    <p className="text-[0.72rem] text-ink-700/70 dark:text-paper-400">
                      Әр ретте жаңа кездейсоқ ретпен беру
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isShuffled}
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
                      isShuffled ? "bg-emerald-500" : "bg-ink-700/20 dark:bg-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                        isShuffled ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-ink-700/10 p-3.5 dark:border-white/10">
                  <div>
                    <p className="text-[0.82rem] font-bold text-ink-900 dark:text-white">
                      Жауапты бірден тексеру
                    </p>
                    <p className="text-[0.72rem] text-ink-700/70 dark:text-paper-400">
                      Оқу режимінде әр сұраққа түсіндірме шығады
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={feedbackMode === "training"}
                    onClick={() =>
                      setFeedbackMode(feedbackMode === "training" ? "exam" : "training")
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
                      feedbackMode === "training" ? "bg-blue-500" : "bg-ink-700/20 dark:bg-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                        feedbackMode === "training" ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Бастау батырмасы */}
              <button
                type="button"
                onClick={() => initQuizSession(quizMode, selectedSection, isShuffled)}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 font-display text-base font-bold text-white shadow-lift transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ backgroundColor: quizData.accent }}
              >
                <Icon name="CirclePlay" className="size-5" strokeWidth={2.2} />
                Викторинаны бастау
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. БЕЛСЕНДІ ВИКТОРИНА ЭКРАНЫ (ACTIVE QUIZ RUNNER)         */}
      {/* ========================================================= */}
      {isStarted && !isCompleted && currentQ && (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
          {/* Негізгі сұрақ терезесі */}
          <main className="dash-card flex flex-col rounded-3xl p-5 sm:p-7 lg:p-8">
            {/* Жоғарғы құралдар панелі: Сұрақ нөмірі, таймер, закладка */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/8 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-9 items-center justify-center rounded-xl font-display text-sm font-bold text-white shadow-soft"
                  style={{ backgroundColor: quizData.accent }}
                >
                  {currentIndex + 1}
                </span>
                <div>
                  <span className="text-[0.72rem] font-bold tracking-wide text-ink-600/75 uppercase dark:text-paper-300">
                    Сұрақ {currentIndex + 1} / {totalInSession}
                  </span>
                  {currentQ.section && (
                    <p className="text-[0.76rem] font-medium text-ink-800 dark:text-paper-200">
                      {currentQ.section}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Таймер */}
                <div className="flex items-center gap-1.5 rounded-xl border border-ink-700/10 bg-paper-50/80 px-3 py-1.5 font-mono text-[0.8rem] font-semibold text-ink-800 dark:border-white/10 dark:bg-white/5 dark:text-paper-100">
                  <Icon name="Clock" className="size-4 text-ink-600 dark:text-paper-300" strokeWidth={2} />
                  <span>{formatTime(timeElapsed)}</span>
                </div>

                {/* Закладка */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(currentQ.id)}
                  aria-label={bookmarkedIds[currentQ.id] ? "Белгіні алып тастау" : "Сұрақты белгілеу"}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition",
                    bookmarkedIds[currentQ.id]
                      ? "border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
                      : "border-ink-700/10 bg-paper-50 text-ink-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-paper-300"
                  )}
                >
                  <Icon name="Flag" className="size-4" strokeWidth={2.2} />
                </button>

                {/* Мобильді навигатор батырмасы */}
                <button
                  type="button"
                  onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
                  className="flex items-center gap-1.5 rounded-xl border border-ink-700/10 bg-paper-50 px-3 py-1.5 text-[0.78rem] font-semibold text-ink-800 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-paper-100"
                >
                  <Icon name="LayoutGrid" className="size-4" />
                  Карта
                </button>
              </div>
            </div>

            {/* Прогресс жолағы */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-700/8 dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: quizData.accent,
                }}
              />
            </div>

            {/* Сұрақтың мәтіні мен жағдаяты */}
            <div className="my-6">
              {currentQ.skill && (
                <span
                  className="inline-block rounded-lg px-2.5 py-1 text-[0.7rem] font-bold tracking-wide uppercase"
                  style={{
                    backgroundColor: `${quizData.accent}18`,
                    color: quizData.accent,
                  }}
                >
                  Дағды: {currentQ.skill}
                </span>
              )}

              <h2 className="mt-3 font-display text-lg leading-relaxed font-semibold text-ink-900 sm:text-xl dark:text-white">
                {currentQ.prompt}
              </h2>
            </div>

            {/* Жауап нұсқалары (A, B, C, D) */}
            <div className="flex flex-col gap-3">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                const isCorrect = currentQ.answer === optIdx;
                const letter = ["A", "B", "C", "D"][optIdx];

                // Оқу режимінде дұрыс/қате реңкі
                let buttonStyle = "border-ink-700/10 bg-white hover:border-ink-700/30 dark:border-white/10 dark:bg-white/5";
                let badgeStyle = "bg-paper-100 text-ink-700 dark:bg-white/10 dark:text-paper-200";

                if (feedbackMode === "training" && userAnswers[currentQ.id] !== undefined) {
                  if (isCorrect) {
                    buttonStyle = "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-500/80";
                    badgeStyle = "bg-emerald-500 text-white";
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = "border-rose-500 bg-rose-50/80 ring-1 ring-rose-500 dark:bg-rose-950/40 dark:border-rose-500/80";
                    badgeStyle = "bg-rose-500 text-white";
                  }
                } else if (isSelected) {
                  buttonStyle = "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500 dark:bg-brand-950/40";
                  badgeStyle = "bg-brand-600 text-white";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={cn(
                      "group flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
                      buttonStyle
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold transition-transform group-hover:scale-105",
                        badgeStyle
                      )}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 text-[0.88rem] leading-relaxed text-ink-900 dark:text-paper-100">
                      {optionText}
                    </span>

                    {/* Тексеру белгішесі */}
                    {feedbackMode === "training" && userAnswers[currentQ.id] !== undefined && (
                      <span className="shrink-0 pt-0.5">
                        {isCorrect ? (
                          <Icon name="CheckCircle2" className="size-5 text-emerald-500" />
                        ) : isSelected ? (
                          <Icon name="X" className="size-5 text-rose-500" />
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Оқу режиміндегі түсініктеме карточкасы */}
            {feedbackMode === "training" && userAnswers[currentQ.id] !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-5 rounded-2xl p-4 sm:p-5",
                  userAnswers[currentQ.id] === currentQ.answer
                    ? "border border-emerald-500/30 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : "border border-amber-500/30 bg-amber-50/70 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
                )}
              >
                <div className="flex items-center gap-2 font-display text-[0.82rem] font-bold uppercase">
                  <Icon
                    name={userAnswers[currentQ.id] === currentQ.answer ? "CheckCircle2" : "Info"}
                    className="size-4"
                  />
                  <span>
                    {userAnswers[currentQ.id] === currentQ.answer
                      ? "Дұрыс шешім!"
                      : "Тиімдірек жауап нұсқасы бар"}
                  </span>
                </div>
                <p className="mt-1 text-[0.82rem] leading-relaxed opacity-90">
                  {currentQ.note
                    ? `Негіздеме: ${currentQ.note}`
                    : `Дұрыс жауап: ${["A", "B", "C", "D"][currentQ.answer]}) «${currentQ.options[currentQ.answer]}». Бұл таңдау «${currentQ.skill}» дағдысын тиімді дамытады.`}
                </p>
              </motion.div>
            )}

            {/* Төменгі басқару батырмалары: Алдыңғы, Келесі, Аяқтау */}
            <div className="mt-8 flex items-center justify-between border-t border-ink-700/8 pt-5 dark:border-white/10">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1.5 rounded-xl border border-ink-700/10 px-4 py-2.5 text-[0.82rem] font-semibold text-ink-800 transition hover:bg-ink-700/6 disabled:opacity-30 dark:border-white/10 dark:text-paper-200 dark:hover:bg-white/5"
              >
                <Icon name="ChevronLeft" className="size-4" />
                Алдыңғы
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < totalInSession - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((i) => Math.min(totalInSession - 1, i + 1))}
                    className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-display text-[0.84rem] font-bold text-white shadow-soft transition hover:scale-[1.02]"
                    style={{ backgroundColor: quizData.accent }}
                  >
                    Келесі
                    <Icon name="ChevronRight" className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 font-display text-[0.84rem] font-bold text-white shadow-soft transition hover:bg-emerald-500 hover:scale-[1.02]"
                  >
                    <Icon name="ClipboardCheck" className="size-4" />
                    Тестті аяқтау ({answeredCount}/{totalInSession})
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* Бүйірлік Сұрақтар Картасы (Navigator 1..200) */}
          <aside
            className={cn(
              "dash-card fixed inset-x-4 bottom-4 z-40 max-h-[80vh] flex-col rounded-3xl p-5 shadow-2xl backdrop-blur-xl lg:static lg:flex lg:max-h-none lg:shadow-none lg:z-0",
              isNavigatorOpen ? "flex" : "hidden"
            )}
          >
            <div className="flex items-center justify-between border-b border-ink-700/8 pb-3 dark:border-white/10">
              <h3 className="font-display text-[0.84rem] font-bold text-ink-900 uppercase dark:text-white">
                Сұрақтар картасы ({totalInSession})
              </h3>
              <button
                type="button"
                onClick={() => setIsNavigatorOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-700/10 lg:hidden dark:text-paper-300"
              >
                <Icon name="X" className="size-4" />
              </button>
            </div>

            {/* Түсіндірме индикаторы */}
            <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] text-ink-700/75 dark:text-paper-400">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-emerald-500" /> Жауап берілген
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-amber-400" /> Белгіленген
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-ink-700/15 dark:bg-white/20" /> Жауап жоқ
              </span>
            </div>

            {/* 1..200 түймелер матрицасы */}
            <div className="mt-3.5 max-h-96 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 lg:grid-cols-5">
                {activeQuestions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isBookmarked = bookmarkedIds[q.id];

                  let cellClass = "border-ink-700/10 bg-paper-50 text-ink-700 dark:border-white/10 dark:bg-white/5 dark:text-paper-300";

                  if (isCurrent) {
                    cellClass = "border-brand-500 bg-brand-600 text-white font-bold ring-2 ring-brand-400";
                  } else if (isBookmarked) {
                    cellClass = "border-amber-400 bg-amber-100 font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200";
                  } else if (isAnswered) {
                    cellClass = "border-emerald-500/40 bg-emerald-100/80 font-medium text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsNavigatorOpen(false);
                      }}
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-xl border text-[0.74rem] transition-transform hover:scale-105",
                        cellClass
                      )}
                    >
                      {idx + 1}
                      {isBookmarked && (
                        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Төменгі аяқтау түймесі */}
            <div className="mt-4 border-t border-ink-700/8 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="w-full rounded-xl bg-ink-900 py-2.5 font-display text-[0.8rem] font-bold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-paper-100"
              >
                Нәтижені шығару
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ҚОРЫТЫНДЫ ДИАГНОСТИКА ЖӘНЕ БАҒАЛАУ КАРТАСЫ (RESULTS)   */}
      {/* ========================================================= */}
      {isCompleted && results && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-5"
        >
          {/* Бас карточка: Нәтиже мен ресми интерпретация */}
          <div className="dash-card overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-700/8 pb-8 dark:border-white/10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.74rem] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: results.levelTone }}
                  >
                    <Icon name="Award" className="size-3.5" />
                    {results.levelTitle}
                  </span>
                </div>

                <h1 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl dark:text-white">
                  {quizData.name} викторинасының қорытындысы
                </h1>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-700 dark:text-paper-200">
                  {results.levelDesc}
                </p>
              </div>

              {/* Ұпай көрсеткіші */}
              <div className="flex items-center gap-4 rounded-2xl border border-ink-700/10 bg-paper-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="text-right">
                  <span className="text-[0.7rem] font-bold tracking-wider text-ink-600/70 uppercase dark:text-paper-400">
                    Жалпы көрсеткіш
                  </span>
                  <div className="font-display text-3xl font-bold text-ink-900 sm:text-4xl dark:text-white">
                    {results.correctCount}{" "}
                    <span className="text-lg font-normal text-ink-600/60 dark:text-paper-400">
                      / {results.total}
                    </span>
                  </div>
                </div>

                <div
                  className="flex size-16 items-center justify-center rounded-2xl font-display text-xl font-bold text-white shadow-lift"
                  style={{ backgroundColor: results.levelTone }}
                >
                  {results.percent}%
                </div>
              </div>
            </div>

            {/* Soft Skills Диагностикалық картасы */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-ink-900 dark:text-white">
                  Икемді дағдылар картасы (Soft Skills Diagnostics)
                </h2>
                <span className="text-[0.75rem] font-semibold text-ink-600/75 dark:text-paper-400">
                  Дағдылар бойынша нақты нәтиже
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(results.skillStats).map(([skillName, stat]) => {
                  const skillPercent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div
                      key={skillName}
                      className="rounded-2xl border border-ink-700/8 bg-paper-50/70 p-4 transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between text-[0.82rem]">
                        <span className="font-semibold text-ink-900 dark:text-paper-100">
                          {skillName}
                        </span>
                        <span className="font-bold tabular-nums" style={{ color: quizData.accent }}>
                          {skillPercent}% ({stat.correct}/{stat.total})
                        </span>
                      </div>

                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink-700/8 dark:bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${skillPercent}%`,
                            backgroundColor:
                              skillPercent >= 75
                                ? "#10b981"
                                : skillPercent >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Әрекет батырмалары: Қайта тапсыру, Қателерді көру */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink-700/8 pt-6 dark:border-white/10">
              <button
                type="button"
                onClick={() => initQuizSession(quizMode, selectedSection, true)}
                className="flex items-center gap-2 rounded-xl px-5 py-3 font-display text-[0.84rem] font-bold text-white shadow-soft transition hover:scale-[1.02]"
                style={{ backgroundColor: quizData.accent }}
              >
                <Icon name="RotateCcw" className="size-4" />
                Қайта тапсыру (Жаңадан араластыру)
              </button>

              <button
                type="button"
                onClick={() => setFilterReviewOnlyWrong(!filterReviewOnlyWrong)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.84rem] font-semibold transition",
                  filterReviewOnlyWrong
                    ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
                    : "border-ink-700/10 bg-paper-50 text-ink-800 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-paper-100"
                )}
              >
                <Icon name="ListChecks" className="size-4" />
                {filterReviewOnlyWrong
                  ? "Барлық сұрақтарды көрсету"
                  : `Тек қате кеткен сұрақтарды қарау (${results.wrongQuestions.length})`}
              </button>

              <Link
                href="/dashboard/quiz"
                className="ml-auto rounded-xl border border-ink-700/10 bg-paper-50 px-4 py-3 text-[0.84rem] font-semibold text-ink-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-paper-100"
              >
                Басқа пәнді таңдау
              </Link>
            </div>
          </div>

          {/* Қателермен және жауаптармен жұмыс тізімі */}
          <div className="dash-card rounded-3xl p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">
              {filterReviewOnlyWrong
                ? `Қате кеткен сұрақтарды талдау (${displayQuestionsInReview.length})`
                : `Барлық сұрақтар мен таңдалған жауаптар (${displayQuestionsInReview.length})`}
            </h3>

            <div className="mt-5 space-y-4">
              {displayQuestionsInReview.map((q) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.answer;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-2xl border p-5 transition-all",
                      isCorrect
                        ? "border-emerald-500/25 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                        : "border-rose-500/25 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-950/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-lg text-xs font-bold text-white",
                            isCorrect ? "bg-emerald-500" : "bg-rose-500"
                          )}
                        >
                          {q.num}
                        </span>
                        <span className="text-[0.72rem] font-bold tracking-wide uppercase text-ink-700/70 dark:text-paper-300">
                          {q.skill}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase",
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                        )}
                      >
                        {isCorrect ? "Дұрыс" : "Қате"}
                      </span>
                    </div>

                    <p className="mt-2.5 font-display text-[0.92rem] font-semibold text-ink-900 dark:text-white">
                      {q.prompt}
                    </p>

                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => {
                        const isChosen = userAns === oIdx;
                        const isRight = q.answer === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "flex items-start gap-2 rounded-xl p-2.5 text-[0.78rem]",
                              isRight
                                ? "bg-emerald-500/15 font-semibold text-emerald-900 dark:text-emerald-200"
                                : isChosen && !isRight
                                ? "bg-rose-500/15 text-rose-900 dark:text-rose-200"
                                : "bg-black/5 text-ink-700/80 dark:bg-white/5 dark:text-paper-300"
                            )}
                          >
                            <span className="font-bold">{["A", "B", "C", "D"][oIdx]})</span>
                            <span>{opt}</span>
                            {isRight && (
                              <Icon name="Check" className="ml-auto size-3.5 text-emerald-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.note && (
                      <p className="mt-3 text-[0.76rem] text-ink-700/85 italic dark:text-paper-300">
                        Түсіндірме / Негіздеме: {q.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
