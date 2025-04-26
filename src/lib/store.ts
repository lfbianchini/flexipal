import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type Profile = {
  id: string; // This will now be a hashed ID
  full_name: string;
  avatar_url: string;
};

export type AuthUser = {
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

// Global flag to track initialization
let isInitializing = false;

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
    const { user } = get();
    if (!user?.email) return;

    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) return;

    const { data: profile, error } = await supabase.functions.invoke('get-hashed-profile', {
      body: { user_id: userId }
    });

    if (!error && profile) {
      set({ profile });
    }
  },

  initialize: async () => {
    const { initialized } = get();
    if (initialized || isInitializing) return;

    isInitializing = true;
    const { setUser, setProfile, setLoading } = get();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { email, email_confirmed_at } = session.user;
        setUser({ email, email_confirmed_at });

        // Get hashed profile using edge functions
        const [profileResult] = await Promise.all([
          supabase.functions.invoke('get-hashed-profile', {
            body: { user_id: session.user.id }
          }),
        ]);

        if (!profileResult.error && profileResult.data) {
          setProfile(profileResult.data);
        }
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      isInitializing = false;
      setLoading(false);
      set({ initialized: true });
    }
  }
})); 