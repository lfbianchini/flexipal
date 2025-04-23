import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Vendor = {
  id: string;
  user_id: string;
  location: string;
  is_live: boolean;
  note: string | null;
  end_time: string | null;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
};

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any = null;

    async function getVendors() {
      setLoading(true);
      
      // Get all live vendors with their profiles
      const { data, error } = await supabase
        .from('vendor_status')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('is_live', true)
        .order('last_active', { ascending: false });

      if (!error && data) {
        setVendors(data as unknown as Vendor[]);
      }

      setLoading(false);
    }

    // Subscribe to changes
    subscription = supabase
      .channel('vendor_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_status',
        },
        () => {
          // Refetch when any change occurs
          getVendors();
        }
      )
      .subscribe();

    // Initial fetch
    getVendors();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const getVendorsByLocation = (location: string) => {
    return vendors.filter(vendor => 
      vendor.is_live && 
      vendor.location === location &&
      // Only show vendors whose end_time hasn't passed
      (!vendor.end_time || new Date(vendor.end_time) > new Date())
    );
  };

  return {
    vendors,
    loading,
    getVendorsByLocation,
  };
} 