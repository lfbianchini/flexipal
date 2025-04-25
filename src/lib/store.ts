import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
};

export type AuthUser = {
  id: string;
  email: string;
  email_confirmed_at: string;
};

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force clear local session even if Supabase call fails
    } finally {
      // Always clear local state
      set({ user: null, profile: null, isAdmin: false, initialized: false });
    }
  },

  refreshProfile: async () => {
    const { user, profile } = get();
    if (!user?.id) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    
    // Only update if the profile data actually changed
    if (JSON.stringify(profile) !== JSON.stringify(prof)) {
      set({ profile: prof || null });
    }
  },

  initialize: async () => {
    const { initialized, setUser, setProfile, setIsAdmin, setLoading } = get();
    if (initialized) return;

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { id, email, email_confirmed_at } = session.user;
      setUser({ id, email, email_confirmed_at });

      // Only fetch profile and roles if we don't have them yet
      const { profile, isAdmin } = get();
      if (!profile || !isAdmin) {
        const [profileResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", id)
        ]);
        

        if (profileResult.data && JSON.stringify(profile) !== JSON.stringify(profileResult.data)) {
          setProfile(profileResult.data);
          set({ profile: profileResult.data });
        }
        
        const newIsAdmin = rolesResult.data?.some((r: any) => r.role === "admin") || false;
        if (isAdmin !== newIsAdmin) {
          setIsAdmin(newIsAdmin);
        }
      }
    }

    setLoading(false);
    set({ initialized: true });
  }
})); 