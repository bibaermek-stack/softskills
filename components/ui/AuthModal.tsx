"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import {
  signIn,
  signUp,
  signInWithGoogle,
  signInAsDemo,
  claimRole,
} from "@/lib/supabase/accounts";
import type { UserRole } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, initialTab = "signin" }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("student");
  const [studyGroup, setStudyGroup] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const mustClaimRole = currentUser?.roleLocked === false;

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.user) {
        setUser(res.user);
        onClose();
      } else {
        setErrorMsg("Кіру сәтсіз аяқталды. Деректерді тексеріңіз.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Кіру кезінде қате орын алды.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Толық аты-жөніңізді енгізіңіз.");
      return;
    }

    setLoading(true);

    try {
      const res = await signUp({
        email,
        password,
        fullName: fullName.trim(),
        role,
        studyGroup: studyGroup.trim() || undefined,
      });

      if (res.needsEmailConfirmation) {
        setSuccessMsg("Тіркелу сәтті өтті! Поштаңызға растау сілтемесі жіберілді.");
      } else if (res.user) {
        setUser(res.user);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Тіркелу кезінде қате орын алды.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle(tab === "signup" ? role : undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google арқылы кіру сәтсіз аяқталды.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleDemoSignIn = (demoRole: Exclude<UserRole, "admin">) => {
    const user = signInAsDemo(demoRole);
    setUser(user);
    onClose();
  };

  const handleClaimRole = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const user = await claimRole(role);
      if (!user) throw new Error("Профиль табылмады. Қайта кіріп көріңіз.");
      setUser(user);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Рөлді сақтау кезінде қате орын алды.");
    } finally {
      setLoading(false);
    }
  };

  if (mustClaimRole) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-picker-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900/90 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <h2 id="role-picker-title" className="text-xl font-bold tracking-tight">
              Рөліңізді таңдаңыз
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Google тіркелгісін аяқтау үшін рөлді бір рет таңдаңыз. Кейін оны өзгерту мүмкін емес.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {(["student", "teacher"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  aria-pressed={role === value}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    role === value
                      ? "border-brand-400 bg-brand-500/20 text-brand-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {value === "student" ? "🎓 Студент" : "👨‍🏫 Оқытушы"}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleClaimRole}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-linear-to-r from-brand-500 to-indigo-600 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {loading ? "Сақталуда..." : "Рөлді бекіту"}
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 p-6 sm:p-8 text-white shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {tab === "signin" ? "Платформаға кіру" : "Жаңа тіркелгі жасау"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                STEM Интерактивті Білім беру Панелі
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              aria-label="Жабу"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 text-xs font-semibold">
            <button
              onClick={() => { setTab("signin"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`rounded-lg py-2.5 transition ${
                tab === "signin"
                  ? "bg-brand-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Кіру
            </button>
            <button
              onClick={() => { setTab("signup"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`rounded-lg py-2.5 transition ${
                tab === "signup"
                  ? "bg-brand-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Тіркелу
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✅ {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="mt-5 space-y-4">
            {tab === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Толық аты-жөніңіз
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Мысалы: Болат Асқарұлы"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Рөліңізді таңдаңыз
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition ${
                        role === "student"
                          ? "border-brand-400 bg-brand-500/20 text-brand-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span>🎓</span> Студент
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition ${
                        role === "teacher"
                          ? "border-brand-400 bg-brand-500/20 text-brand-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span>👨‍🏫</span> Оқытушы
                    </button>
                  </div>
                </div>

                {role === "student" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Топ / Академиялық топ (міндетті емес)
                    </label>
                    <input
                      type="text"
                      value={studyGroup}
                      onChange={(e) => setStudyGroup(e.target.value)}
                      placeholder="Мысалы: МТ-21"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Электронды пошта (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Құпия сөз
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-linear-to-r from-brand-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-brand-600 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading
                ? "Жүктелуде..."
                : tab === "signin"
                ? "Жүйеге кіру"
                : "Тіркелуді аяқтау"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-slate-900 px-3 text-[0.7rem] text-slate-400 uppercase tracking-wider">
              немесе
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/8 py-2.5 text-xs font-medium text-white transition hover:bg-white/15"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google арқылы кіру</span>
          </button>

          {/* Demo Login Options */}
          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <p className="text-[0.72rem] text-amber-300 font-medium">
              ⚡ Демонстрациялық жылдам кіру (Тіркелусіз):
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn("student")}
                className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-[0.75rem] font-medium text-amber-200 hover:bg-amber-500/20 transition"
              >
                🎓 Студент (Айгерім)
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn("teacher")}
                className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-[0.75rem] font-medium text-amber-200 hover:bg-amber-500/20 transition"
              >
                👨‍🏫 Оқытушы (Серік)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
