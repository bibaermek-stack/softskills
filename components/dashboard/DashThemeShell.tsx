"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDashboard, readStoredTheme } from "@/lib/dashboardStore";
import { DashHeader } from "./DashHeader";
import { AiTutorWidget } from "@/components/ui/AiTutorWidget";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import { ClassroomPresenterModal } from "@/components/ui/ClassroomPresenterModal";

export function DashThemeShell({ children }: { children: ReactNode }) {
  const theme = useDashboard((s) => s.theme);
  const setTheme = useDashboard((s) => s.setTheme);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Сақталған теманы бір рет қалпына келтіру.
  useEffect(() => {
    setTheme(readStoredTheme());
  }, [setTheme]);

  // Global search listener
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  return (
    <div data-theme={theme} className="dash-backdrop min-h-screen relative">
      <div className="mx-auto w-full max-w-[110rem] px-3 py-3 sm:px-4 sm:py-4">
        <DashHeader />
        {children}
      </div>

      {/* Floating AI STEM Tutor */}
      <AiTutorWidget />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Classroom Interactive Presenter Mode Modal */}
      <ClassroomPresenterModal />
    </div>
  );
}

