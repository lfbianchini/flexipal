import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type CommunityPost = {
  id: string;
  created_at: string;
  hashed_user_id: string;
  role: "Buyer" | "Vendor";
  title: string;
  details: string;
  availability_window: string | null;
  contact_info: string | null;
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
      
      try {
        // Call the edge function to get hashed post data
        const { data: hashedPosts, error } = await supabase.functions.invoke('get-hashed-community-posts');

        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        setPosts(hashedPosts);
      } catch (err) {
        console.error('Error invoking edge function:', err);
      } finally {
        setLoading(false);
      }
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
    if (!user?.email) return null;

    try {
      const { data, error } = await supabase.functions.invoke('create-community-post', {
        body: {
          role,
          title,
          details,
          availability_window: availabilityWindow,
          contact_info: contactInfo
        }
      });

      if (error) {
        throw error;
      }

      // Refetch posts to get the updated list with hashed IDs
      const { data: hashedPosts, error: fetchError } = await supabase.functions.invoke('get-hashed-community-posts');
      if (!fetchError && hashedPosts) {
        setPosts(hashedPosts);
      }

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    if (!user?.email) return false;

    try {
      const { error } = await supabase.functions.invoke('delete-community-post', {
        body: { post_id: postId }
      });

      if (error) {
        throw error;
      }

      // Refetch posts after successful deletion
      const { data: hashedPosts, error: fetchError } = await supabase.functions.invoke('get-hashed-community-posts');
      if (!fetchError && hashedPosts) {
        setPosts(hashedPosts);
      }

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  };

  return {
    posts,
    loading,
    createPost,
    deletePost
  };
} 