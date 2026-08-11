"use client";

import { useState, useEffect } from "react";

export interface StudentProgress {
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  completedLessons: string[];
  quizScores: Record<string, number>;
}

const DEFAULT_PROGRESS: StudentProgress = {
  xp: 1250,
  level: 4,
  streak: 7,
  badges: ["circuit_master", "astronomy_pioneer", "python_coder", "quick_learner"],
  completedLessons: ["2.1", "2.2", "2.3"],
  quizScores: {
    "ohm-law": 100,
    "gravity": 90,
    "python-basics": 95,
  },
};

const STORAGE_KEY = "stem_platform_user_progress_v1";

export function getLocalProgress(): StudentProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Error reading localStorage:", e);
  }
  return DEFAULT_PROGRESS;
}

export function saveLocalProgress(progress: StudentProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("stem-storage-updated"));
  } catch (e) {
    console.warn("Error writing to localStorage:", e);
  }
}

export function resetLocalProgress(): StudentProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("stem-storage-updated"));
  } catch (e) {
    console.warn("Error resetting localStorage:", e);
  }
  return DEFAULT_PROGRESS;
}

export function useLocalProgress() {
  const [progress, setProgress] = useState<StudentProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProgress(getLocalProgress());
    setIsLoaded(true);

    const handleUpdate = () => {
      setProgress(getLocalProgress());
    };

    window.addEventListener("stem-storage-updated", handleUpdate);
    return () => window.removeEventListener("stem-storage-updated", handleUpdate);
  }, []);

  const addXp = (amount: number) => {
    const updated = {
      ...progress,
      xp: progress.xp + amount,
      level: Math.floor((progress.xp + amount) / 300) + 1,
    };
    saveLocalProgress(updated);
  };

  const completeLesson = (lessonId: string) => {
    if (progress.completedLessons.includes(lessonId)) return;
    const updated = {
      ...progress,
      completedLessons: [...progress.completedLessons, lessonId],
      xp: progress.xp + 100,
    };
    saveLocalProgress(updated);
  };

  return {
    progress,
    isLoaded,
    addXp,
    completeLesson,
    resetProgress: () => saveLocalProgress(DEFAULT_PROGRESS),
  };
}
