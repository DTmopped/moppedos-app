// src/components/AppInitializer.jsx
import { useEffect } from 'react';

const AppInitializer = () => {
  useEffect(() => {
    const locationId = '00fe305a-6b02-4eaa-9bfe-cbc2d46d9e17'; // Example
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
