// src/components/AppInitializer.jsx
import { useEffect } from 'react';

const AppInitializer = () => {
  useEffect(() => {
    const locationId = '12345678-90ab-cdef-1234-567890abcdef'; // Replace this with YOUR Supabase location UUID
    const storedLocationId = localStorage.getItem('locationId');

    if (!storedLocationId) {
      localStorage.setItem('locationId', locationId);
      console.log(`✅ Set default locationId: ${locationId}`);
    } else {
      console.log(`🔄 Existing locationId found: ${storedLocationId}`);
    }
  }, []);

  return null;
};

export default AppInitializer;
