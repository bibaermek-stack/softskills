"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Icon } from "@/components/dashboard/Icon";
import { lessons, type Lesson } from "@/lib/lessons";
import { coreModules, dashboardLibraryRoute, type CoreModule } from "@/lib/dashboard";

interface SearchItem {
  id: string;
  title: string;
  category: "Сабақ" | "Модуль" | "Симуляция" | "Ресурс";
  href: string;
  desc: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  ...lessons.map((lesson: Lesson) => ({
    id: lesson.id,
    title: lesson.title,
    category: "Сабақ" as const,
    href: `/dashboard/lessons/${lesson.id}`,
    desc: `${lesson.summary} (${lesson.duration})`,
  })),
  ...coreModules.map((mod: CoreModule) => ({
    id: mod.id,
    title: mod.title,
    category: "Модуль" as const,
    href: `/dashboard#dash-modules`,
    desc: mod.text,
  })),
  {
    id: "pendulum",
    title: "Маятник тербелісі (Physics Lab)",
    category: "Симуляция",
    href: "/dashboard/simulations",
    desc: "Математикалық маятник теңдеуі, период, жиілік диаграммасы",
  },
  {
    id: "circuit",
    title: "Электр тізбектері (Circuit Builder 3D)",
    category: "Симуляция",
    href: "/dashboard/simulations/circuit",
    desc: "Ом заңы, кернеу, тоқ күші мен кедергі модельдеу лабораториясы",
  },
  {
    id: "digital-lib",
    title: "Цифрлық STEM кітапхана",
    category: "Ресурс",
    href: dashboardLibraryRoute,
    desc: "Оқулықтар, интерактивті 3D модельдер мен әдістемелік құралдар",
  },
  {
    id: "astronomy",
    title: "3D Күн Жүйесі & Гравитация",
    category: "Симуляция",
    href: "/dashboard/simulations/astronomy",
    desc: "Орбиталар, гравитациялық тартылыс заңы және планеталар қозғалысы",
  },
  {
    id: "code",
    title: "Python STEM Код Редакторы",
    category: "Симуляция",
    href: "/dashboard/simulations/code",
    desc: "Онлайн Python бағдарламалау, STEM алгоритмдері мен есептерді орындау",
  },
  {
    id: "teacher",
    title: "Мұғалім Порталы & Сынып Аналитикасы",
    category: "Ресурс",
    href: "/dashboard/teacher",
    desc: "Оқушылар үлгерімін бақылау, квиз аналитикасы және тапсырма жіберу",
  },
  {
    id: "profile",
    title: "Жеке кабинет және Жетістіктер",
    category: "Ресурс",
    href: "/dashboard/profile",
    desc: "XP ұпайлары, значоктар, 7 күндік стрик пен сертификаттар",
  },
];

export function GlobalSearchModal({
  isOpen,
  onCloseAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
}) {
  const [query, setQuery] = useState("");

  // Keyboard Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onCloseAction();
        } else {
          window.dispatchEvent(new CustomEvent("open-global-search"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onCloseAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseAction]);

  const filtered = query.trim()
    ? SEARCH_DATABASE.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_DATABASE.slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-slate-900 text-white shadow-2xl z-10"
          >
            {/* Search Input */}
            <div className="flex items-center border-b border-white/10 px-4 py-3.5">
              <Icon name="Search" className="size-5 text-cyan-400 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Сабақтар, симуляциялар немесе ресурстарды іздеу... (Esc - жабу)"
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={onCloseAction}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <Icon name="X" className="size-5" />
              </button>
            </div>

            {/* Search Results */}
            <div className="dash-scroll max-h-88 overflow-y-auto p-2">
              <div className="px-3 py-1.5 text-[0.7rem] font-semibold text-slate-400">
                {query ? `Табылған нәтижелер (${filtered.length})` : "Ұсынылатын тақырыптар"}
              </div>

              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Сұранысыңыз бойынша ештеңе табылмады.
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onCloseAction}
                      className="flex items-center justify-between rounded-xl p-3 transition hover:bg-white/10 group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[0.65rem] font-bold ${
                              item.category === "Сабақ"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : item.category === "Симуляция"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                            {item.title}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 line-clamp-1">{item.desc}</p>
                      </div>
                      <Icon
                        name="ChevronRight"
                        className="size-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/60 px-4 py-2 text-[0.7rem] text-slate-400">
              <span>Тез іздеу: <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem]">Ctrl</kbd> + <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem]">K</kbd></span>
              <span>Виртуалды STEM Оқыту Платформасы</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
