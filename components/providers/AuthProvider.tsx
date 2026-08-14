"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/authStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { fetchProfile, readMockSession } from "@/lib/supabase/accounts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user && mounted) {
            const profile = await fetchProfile(data.user.id);
            if (profile && mounted) {
              setUser(profile);
            }
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        } finally {
          if (mounted) setLoading(false);
        }

        if (!mounted) return;

        // Listen for auth state changes (OAuth redirect, sign in, sign out).
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!mounted) return;
            if (session?.user) {
              const profile = await fetchProfile(session.user.id);
              if (profile && mounted) {
                setUser(profile);
              }
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        );
        unsubscribe = () => listener.subscription.unsubscribe();
      } else {
        // Fallback mock session check
        const mockUser = readMockSession();
        if (mockUser && mounted) {
          setUser(mockUser);
        }
        if (mounted) setLoading(false);
      }
    }

    void initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
