import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export function useUserAndLocation() {
  const [user, setUser] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [locationUuid, setLocationUuid] = useState(null);
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

      // FIXED: Use store_locations instead of locations
      const { data: locationData, error: locationError } = await supabase
        .from('user_locations')
        .select(`
          location_id,
          store_locations!inner(id, name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (locationError) {
        console.error('Failed to get location:', locationError);
      } else if (locationData) {
        // FIXED: Use location_id directly since it's already the UUID
        const locationUuid = locationData.location_id;
        setLocationId(String(locationUuid));
        setLocationUuid(String(locationUuid));
        console.log('✅ Location loaded:', locationData.store_locations.name, locationUuid);
      }

      setLoading(false);
    };

    fetchUserAndLocation();
  }, []);

  return { user, userId: user?.id, locationId, locationUuid, loading };
}


