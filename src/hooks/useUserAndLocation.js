import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export function useUserAndLocation() {
  const [user, setUser] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [locationUuid, setLocationUuid] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAndLocation = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Failed to get user:', userError);
          setError(userError);
          setLoading(false);
          return;
        }

        if (!user) {
          console.warn('No authenticated user found');
          setLoading(false);
          return;
        }

        setUser(user);

        // Get user's location from user_locations table
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
          setError(locationError);
        } else if (locationData) {
          // Extract location data
          const locationUuid = locationData.location_id;
          const locationName = locationData.store_locations.name;
          
          // Set all location states
          setLocationId(String(locationUuid));
          setLocationUuid(String(locationUuid));
          setLocationName(locationName);
          
          console.log('✅ Location loaded successfully:', {
            locationId: locationUuid,
            locationName: locationName,
            user: user.email
          });
        } else {
          console.warn('No location found for user:', user.email);
          setError(new Error('No location assigned to user'));
        }

      } catch (err) {
        console.error('Error in fetchUserAndLocation:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndLocation();
  }, []);

  return { 
    user, 
    userId: user?.id, 
    locationId, 
    locationUuid, 
    locationName,
    loading,
    error
  };
}


