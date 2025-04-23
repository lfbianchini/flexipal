import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  email: string;
};

export type AuthUser = {
  id: string;
  email: string;
  email_confirmed_at: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gets session and profile
  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { id, email, email_confirmed_at } = session.user;
        setUser({ id, email, email_confirmed_at });
        // Get profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        setProfile(prof || null);
        

        // Check admin role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", id);
        setIsAdmin(roles?.some((r: any) => r.role === "admin") || false);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };
    getSession();
    // Listen for auth events
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getSession();
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Auth helpers
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

        // If signup was successful but no user was returned, it means something went wrong
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    
    setProfile(prof || null);
  }, [user?.id]);

  return { user, profile, isAdmin, loading, signUp, signIn, signOut, refreshProfile };
}
