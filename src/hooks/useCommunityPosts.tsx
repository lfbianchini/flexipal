import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type CommunityPost = Database['public']['Tables']['community_posts']['Row'] & {
  profile: {
    full_name: string;
    avatar_url: string;
  } | null;
};

const DAILY_POST_LIMIT = 4;

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any = null;

    async function getPosts() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile: profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data as CommunityPost[]);
      }

      setLoading(false);
    }

    // Subscribe to changes
    subscription = supabase
      .channel('community_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
        },
        () => {
          // Refetch when any change occurs
          getPosts();
        }
      )
      .subscribe();

    // Initial fetch
    getPosts();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const createPost = async (
    role: "Buyer" | "Vendor",
    title: string,
    details: string,
    availabilityWindow?: string,
    contactInfo?: string
  ) => {
    if (!user?.id) return null;

    // Check daily post count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todaysPosts, error: countError } = await supabase
      .from('community_posts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (countError) {
      throw new Error('Failed to check post limit');
    }

    if ((todaysPosts?.length || 0) >= DAILY_POST_LIMIT) {
      throw new Error(`You can only create ${DAILY_POST_LIMIT} posts per day`);
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        role,
        title,
        details,
        availability_window: availabilityWindow,
        contact_info: contactInfo
      })
      .select(`
        *,
        profile: profiles (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return data as CommunityPost;
  };

  const deletePost = async (postId: string) => {
    if (!user?.id) return false;

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id); // Ensure user can only delete their own posts

    return !error;
  };

  return {
    posts,
    loading,
    createPost,
    deletePost
  };
} 