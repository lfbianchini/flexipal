import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    let conversationSubscription: any = null;

    async function getConversations() {
      if (!user?.id) return;

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (!error && conversations) {
        // Get profiles for all participants
        const otherUserIds = conversations.map(conv => 
          conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
        );

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, hashed_id')
          .in('id', otherUserIds);

        // Transform data to show the other participant's profile
        const transformedData = conversations.map(conv => ({
          ...conv,
          profile: profiles?.find(p => 
            p.id === (conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id)
          ) || null
        }));
        
        setConversations(transformedData);
      }
    }

    if (user?.id) {
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
            filter: `participant1_id=eq.${user.id},participant2_id=eq.${user.id}`,
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
  }, [user?.id]);

  // Fetch and subscribe to messages for current conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
  
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  
    if (!error && data) {
      setMessages(data);
    }
  
    setLoading(false);
  }, []);
  

  const sendMessage = async (conversationId: string, content: string, imageFile?: File) => {
    if (!user?.id) return;

    let image_url = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat_images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      image_url = publicUrl;
    }

    // Send message
    const { error } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        image_url
      }
    ]);

    if (!error) {
      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }
  };

  const startConversation = async (hashedVendorId: string) => {
    if (!user?.id) return;

    try {
      // Call edge function to get real vendor ID from hashed ID
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-vendor-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashed_id: hashedVendorId })
      });

      if (!response.ok) {
        throw new Error('Failed to get vendor ID');
      }

      const { vendor_id } = await response.json();

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${vendor_id}),and(participant1_id.eq.${vendor_id},participant2_id.eq.${user.id})`)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: vendor_id
        })
        .select()
        .single();

      if (!error && data) {
        return data.id;
      }
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
    startConversation
  };
} 