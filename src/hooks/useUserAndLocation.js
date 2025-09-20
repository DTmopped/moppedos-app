import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export function useUserAndLocation() {
  const [user, setUser] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndLocation = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Failed to get user:', error);
        setLoading(false);
        return;
      }

      setUser(user);

      // Fetch user_locations table to get the assigned location
      const { data: locationData, error: locationError } = await supabase
        .from('user_locations')
        .select('location_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (locationError) {
        console.error('Failed to get location:', locationError);
      } else {
        setLocationId(locationData?.location_id || null);
      }

      setLoading(false);
    };

    fetchUserAndLocation();
  }, []);

  return { user, locationId, loading };
}
