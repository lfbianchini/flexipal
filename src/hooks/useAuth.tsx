import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/store";

export type { Profile, AuthUser } from "@/lib/store";

// Global flag to track subscription
let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;

export function useAuth() {
  const {
    user,
    profile,
    isAdmin,
    loading,
    initialize,
    setUser,
    setProfile,
    setIsAdmin,
    signOut,
    refreshProfile
  } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Only set up subscription if it doesn't exist
    if (!authSubscription) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      });
      authSubscription = listener;
    }

    // Cleanup subscription only when the app is truly unmounting
    return () => {
      window.addEventListener('beforeunload', () => {
        if (authSubscription) {
          authSubscription.subscription.unsubscribe();
          authSubscription = null;
        }
      });
    };
  }, []); // Empty dependency array since we're using global state

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
    user,
    profile,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };
}
