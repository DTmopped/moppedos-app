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

      // Fetch user_locations with location UUID
      const { data: locationData, error: locationError } = await supabase
        .from('user_locations')
        .select(`
          location_id,
          locations!inner(uuid)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (locationError) {
        console.error('Failed to get location:', locationError);
      } else if (locationData) {
        const locationUuid = locationData.locations.uuid;
        setLocationId(String(locationUuid));     // Both return the same UUID
        setLocationUuid(String(locationUuid));   // Both return the same UUID
      }

      setLoading(false);
    };

    fetchUserAndLocation();
  }, []);

  return { user, userId: user?.id, locationId, locationUuid, loading };
}

