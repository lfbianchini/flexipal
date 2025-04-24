import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/store";

export type { Profile, AuthUser } from "@/lib/store";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // Initialize auth state if not already done
    if (!store.initialized) {
      store.initialize();
    }

    // Listen for auth events
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        store.setUser(null);
        store.setProfile(null);
        store.setIsAdmin(false);
      } else if (session?.user) {
        const { id, email, email_confirmed_at } = session.user;
        store.setUser({ id, email, email_confirmed_at });
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, full_name: string) => {
      try {
        const { data: existing, error: checkErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (existing) {
          return {
            data: null,
            error: { message: 'An account with this email already exists.' }
          };
        }

        const seed = encodeURIComponent(full_name);
        const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name,
              avatar_url: avatarUrl
            }
          }
        });
        if (error) {
          return { data: null, error };
        }

        if (!data.user) {
          return {
            data: null,
            error: { message: 'Failed to create account. Please try again.' }
          };
        }

        return { data, error: null };
      } catch (err) {
        return {
          data: null,
          error: { message: 'An unexpected error occurred. Please try again.' }
        };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  return {
    user: store.user,
    profile: store.profile,
    isAdmin: store.isAdmin,
    loading: store.loading,
    signUp,
    signIn,
    signOut: store.signOut,
    refreshProfile: store.refreshProfile
  };
}
