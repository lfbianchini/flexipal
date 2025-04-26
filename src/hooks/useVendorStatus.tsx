import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type VendorStatus = {
  id: string;
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

  // Memoize the fetch function to avoid recreation on each render
  const fetchStatus = useCallback(async () => {
    if (!user?.email) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { data: response, error } = await supabase.functions.invoke('vendor-status', {
        body: { action: 'get' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (response?.data) {
        console.log('Setting new status:', response.data);
        setStatus(response.data);
        console.log('Status set to:', response.data);
      }
    } catch (error) {
      console.error('Error fetching vendor status:', error);
    }
  }, [user?.email]);

  // Set up subscription
  useEffect(() => {
    let statusSubscription: any = null;

    if (user?.email) {
      // Get initial status
      fetchStatus();

      // Subscribe to changes
      statusSubscription = supabase
        .channel('vendor_status_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendor_status'
          },
          (payload) => {
            console.log('Received status change:', payload);
          
            if (payload.eventType === 'DELETE') {
              setStatus(null);
            } else if (payload.new) {
              setStatus(payload.new as VendorStatus);
            } else {
              fetchStatus(); // fallback, but almost never needed
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      console.log('Subscription set up');
    }

    return () => {
      if (statusSubscription) {
        console.log('Cleaning up subscription');
        supabase.removeChannel(statusSubscription);
      }
    };
  }, [user?.email, fetchStatus]);

  // Handle loading state
  useEffect(() => {
    if (!user?.email) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchStatus().finally(() => setLoading(false));
  }, [user?.email, fetchStatus]);

  const updateStatus = async (updates: Partial<VendorStatus>) => {
    if (!user?.email) return { error: new Error('Not authenticated') };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: new Error('No session found') };
      }

      const { data: response, error } = await supabase.functions.invoke('vendor-status', {
        body: { 
          action: 'update',
          ...updates
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      // Immediately update local state
      if (response?.data) {
        console.log('Setting status after update:', response.data);
        setStatus(response.data);
      }
      
      return { data: response?.data };
    } catch (error) {
      console.error('Error updating status:', error);
      return { error };
    }
  };

  const goLive = async (location: string, note?: string, endTime?: Date) => {
    console.log('Going live with:', { location, note, endTime });
    const result = await updateStatus({ 
      is_live: true, 
      location,
      note: note || null,
      end_time: endTime?.toISOString() || null
    });
    return result;
  };

  const goOffline = async () => {
    console.log('Going offline');
    const result = await updateStatus({ 
      is_live: false, 
      location: null,
      note: null,
      end_time: null
    });
    return result;
  };

  return {
    status,
    loading,
    goLive,
    goOffline,
    updateStatus,
  };
} 