import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type VendorStatus = {
  id: string;
  user_id: string;
  is_live: boolean;
  last_active: string;
  location: string | null;
  note: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

export function useVendorStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VendorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let statusSubscription: any = null;

    async function getInitialStatus() {
      if (!user?.id) return;

      setLoading(true);
      // Get current status
      const { data: existingStatus } = await supabase
        .from('vendor_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingStatus) {
        // Create initial status if it doesn't exist
        const { data: newStatus } = await supabase
          .from('vendor_status')
          .insert([
            {
              user_id: user.id,
              is_live: false,
              location: null,
            },
          ])
          .select()
          .single();
        
        setStatus(newStatus);
      } else {
        setStatus(existingStatus);
      }

      // Subscribe to changes
      statusSubscription = supabase
        .channel('vendor_status_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendor_status',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            setStatus(payload.new as VendorStatus);
          }
        )
        .subscribe();

      setLoading(false);
    }

    getInitialStatus();

    return () => {
      if (statusSubscription) {
        supabase.removeChannel(statusSubscription);
      }
    };
  }, [user?.id]);

  const updateStatus = async (updates: Partial<VendorStatus>) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('vendor_status')
      .update({
        ...updates,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { error };
    return { data };
  };

  const goLive = async (location: string, note?: string, endTime?: Date) => {
    return updateStatus({ 
      is_live: true, 
      location,
      note: note || null,
      end_time: endTime?.toISOString() || null
    });
  };

  const goOffline = async () => {
    return updateStatus({ 
      is_live: false, 
      location: null,
      note: null,
      end_time: null
    });
  };

  return {
    status,
    loading,
    goLive,
    goOffline,
    updateStatus,
  };
} 