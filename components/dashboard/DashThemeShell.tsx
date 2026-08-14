"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDashboard, readStoredTheme } from "@/lib/dashboardStore";
import { useAuthStore } from "@/lib/authStore";
import { DashHeader } from "./DashHeader";
import { AiTutorWidget } from "@/components/ui/AiTutorWidget";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import { ClassroomPresenterModal } from "@/components/ui/ClassroomPresenterModal";
import { AuthModal } from "@/components/ui/AuthModal";
import { AuthProvider } from "@/components/providers/AuthProvider";

function DashShellInner({ children }: { children: ReactNode }) {
  const theme = useDashboard((s) => s.theme);
  const setTheme = useDashboard((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(readStoredTheme());
  }, [setTheme]);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleOpenAuth = () => setIsAuthOpen(true);

    window.addEventListener("open-global-search", handleOpenSearch);
    window.addEventListener("open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("open-global-search", handleOpenSearch);
      window.removeEventListener("open-auth-modal", handleOpenAuth);
    };
  }, []);

  // Prompt for sign-in, or finish a provisional OAuth profile by choosing a role.
  useEffect(() => {
    if (mounted && !loading && (!user || user.roleLocked === false)) {
      setIsAuthOpen(true);
    }
  }, [mounted, loading, user]);

  return (
    <div data-theme={theme} className="dash-backdrop min-h-screen relative">
      <div className="mx-auto w-full max-w-[110rem] px-3 py-3 sm:px-4 sm:py-4">
        <DashHeader />
        {children}
      </div>

      {/* Floating AI STEM Tutor */}
      <AiTutorWidget />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onCloseAction={() => setIsSearchOpen(false)} />

      {/* Classroom Interactive Presenter Mode Modal */}
      <ClassroomPresenterModal />

      {/* Auth Modal (Login / Register / Google / Demo) */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export function DashThemeShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashShellInner>{children}</DashShellInner>
    </AuthProvider>
  );
}
