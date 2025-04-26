import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type Message = {
  id: string;
  conversation_id: string;
  hashed_sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  isOptimistic?: boolean;
};

export type Conversation = {
  id: string;
  created_at: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string;
    hashed_id: string;
  } | null;
};

export function useChat() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserHashedId, setCurrentUserHashedId] = useState<string | null>(null);

  // Get current user's hashed ID
  useEffect(() => {
    async function getHashedId() {
      if (!profile?.id) return;

      try {
        const { data: hashedId, error } = await supabase.functions.invoke('get-hashed-id');

        if (!error && hashedId?.data) {
          setCurrentUserHashedId(hashedId.data);
        }
      } catch (err) {
        console.error('Error getting hashed ID:', err);
      }
    }

    getHashedId();
  }, [profile?.id]);

  // Fetch conversations
  useEffect(() => {
    let conversationSubscription: any = null;

    async function getConversations() {
      if (!profile?.id) return;

      try {
        // Call edge function to get conversations with hashed IDs
        const { data: hashedConversations, error } = await supabase.functions.invoke('get-hashed-conversations');

        if (!error && hashedConversations?.data) {
          setConversations(hashedConversations.data);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    }

    if (profile?.id) {
      getConversations();

      // Subscribe to conversation changes
      conversationSubscription = supabase
        .channel('conversation_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          () => {
            getConversations();
          }
        )
        .subscribe();
    }

    return () => {
      if (conversationSubscription) {
        supabase.removeChannel(conversationSubscription);
      }
    };
  }, [profile?.id]);

  // Fetch and subscribe to messages for current conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
  
    try {
      // Call edge function to get messages with hashed sender IDs
      const { data: hashedMessages, error } = await supabase.functions.invoke('get-messages', {
        body: { conversation_id: conversationId }
      });
  
      if (error) {
        navigate('/chat');
      }
  
      if (hashedMessages?.data) {
        setMessages(hashedMessages.data);
      } else {
        setMessages([]); // Ensure messages is always an array
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]); // Reset to empty array on error
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const sendMessage = async (conversationId: string, content: string, imageFile?: File) => {
    if (!profile?.id) return;

    let image_url = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat_images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      image_url = publicUrl;
    }

    // Send message through edge function to handle hashed IDs
    const { error } = await supabase.functions.invoke('send-message', {
      body: {
        conversation_id: conversationId,
        content,
        image_url
      }
    });

    if (!error) {
      // Update conversation's last message through edge function
      await supabase.functions.invoke('update-conversation-last-message', {
        body: {
          conversation_id: conversationId,
          last_message: content
        }
      });
    }
  };

  const startConversation = async (hashedUserId: string) => {
    if (!user?.email) return;

    try {
      // Call edge function to start conversation with hashed IDs
      const { data: conversation, error } = await supabase.functions.invoke('start-conversation', {
        body: { hashed_user_id: hashedUserId }
      });

      if (error) {
        throw error;
      }

      return conversation?.data?.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  return {
    conversations,
    messages,
    setMessages,
    loading,
    loadMessages,
    sendMessage,
    startConversation,
    currentUserHashedId,
    setConversations
  };
} 