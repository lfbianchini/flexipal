import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Vendor = {
  hashed_id: string;
  location: string;
  is_live: boolean;
  note: string | null;
  end_time: string | null;
  profile: {
    full_name: string;
    avatar_url: string;
  } | null;
};

const DEFAULT_LOCATION = "undercafé";

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);

  const filterVendors = (vendorList: Vendor[], location: string) => {
    return vendorList.filter(vendor => 
      vendor.is_live && 
      vendor.location === location &&
      (!vendor.end_time || new Date(vendor.end_time) > new Date())
    );
  };

  useEffect(() => {
    let subscription: any = null;

    async function getVendors() {
      setLoading(true);
      
      try {
        // Call the edge function to get hashed vendor data
        const { data: hashedVendors, error } = await supabase.functions.invoke('get-vendors--hashed-');

        if (error) {
          console.error('Error fetching vendors:', error);
          return;
        }

        setVendors(hashedVendors);
        setFilteredVendors(filterVendors(hashedVendors, currentLocation));
      } catch (err) {
        console.error('Error invoking edge function:', err);
      } finally {
        setLoading(false);
      }
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
  }, [currentLocation]);

  const getVendorsByLocation = async (location: string) => {
    setLoading(true);
    setCurrentLocation(location);
    
    // Filter current vendors immediately
    const filtered = filterVendors(vendors, location);
    setFilteredVendors(filtered);
    
    try {
      // Then refresh from the server
      const { data: hashedVendors, error } = await supabase.functions.invoke('get-vendors--hashed-');
      
      if (!error && hashedVendors) {
        setVendors(hashedVendors);
        const updatedFiltered = filterVendors(hashedVendors, location);
        setFilteredVendors(updatedFiltered);
        return updatedFiltered;
      }
      
      return filtered;
    } catch (err) {
      console.error('Error fetching vendors:', err);
      return filtered;
    } finally {
      setLoading(false);
    }
  };

  return {
    vendors,
    filteredVendors,
    loading,
    getVendorsByLocation,
  };
} 