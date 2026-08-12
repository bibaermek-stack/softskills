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

        // Listen for auth state changes (OAuth redirect, sign in, sign out)
        const { data: listener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
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

        return () => {
          listener.subscription.unsubscribe();
        };
      } else {
        // Fallback mock session check
        const mockUser = readMockSession();
        if (mockUser && mounted) {
          setUser(mockUser);
        }
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
