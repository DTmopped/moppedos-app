import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Make sure this path is correct

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// This is a new, separate hook for clarity, though it uses the same context.
export const useUserAndLocation = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // --- ENHANCED LOCATION STATE WITH UUID SUPPORT ---
  const [locationId, setLocationId] = useState(null);        // Legacy bigint ID
  const [locationUuid, setLocationUuid] = useState(null);    // Multi-tenant UUID
  const [locationName, setLocationName] = useState(null);    // Location name for display
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      setLoadingLocation(true);
      setLocationError(null);
      
      try {
        // First, get the current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting user session:", sessionError);
          setLocationError("Failed to get user session");
          setLoadingLocation(false);
          return;
        }

        if (session?.user) {
          console.log("🔍 Fetching location data for user:", session.user.id);
          
          // Step 1: Get user's location_id from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('location_id')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("❌ Error fetching user profile:", profileError);
            setLocationError("Failed to fetch user profile");
            setLoadingLocation(false);
            return;
          }

          if (!profile?.location_id) {
            console.warn("⚠️ No location_id found in user profile");
            setLocationError("No location assigned to user");
            setLoadingLocation(false);
            return;
          }

          console.log("✅ Found profile location_id:", profile.location_id);

          // Step 2: Get the corresponding location details from locations table
          const { data: location, error: locationError } = await supabase
            .from('locations')
            .select('id, uuid, name, owner_id')
            .eq('id', profile.location_id)
            .single();

          if (locationError) {
            console.error("❌ Error fetching location details:", locationError);
            setLocationError("Failed to fetch location details");
            setLoadingLocation(false);
            return;
          }

          if (!location) {
            console.warn("⚠️ Location not found for location_id:", profile.location_id);
            setLocationError("Location not found");
            setLoadingLocation(false);
            return;
          }

          // Step 3: Verify user has access to this location (security check)
          if (location.owner_id !== session.user.id) {
            console.warn("🚫 User does not own this location. Owner:", location.owner_id, "User:", session.user.id);
            setLocationError("Access denied to location");
            setLoadingLocation(false);
            return;
          }

          // Step 4: Set all location data
          console.log("🎉 Successfully loaded location data:");
          console.log("  - Location ID (legacy):", location.id);
          console.log("  - Location UUID (multi-tenant):", location.uuid);
          console.log("  - Location Name:", location.name);
          
          setLocationId(location.id);        // Legacy support (bigint)
          setLocationUuid(location.uuid);    // Multi-tenant support (uuid)
          setLocationName(location.name);    // Display name
          
        } else {
          console.log("👤 No user session found");
          setLocationError("User not authenticated");
        }
      } catch (error) {
        console.error("💥 Unexpected error in fetchUserLocation:", error);
        setLocationError("Unexpected error occurred");
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchUserLocation();
  }, []);

  // --- EXISTING STATE MANAGEMENT (UNCHANGED) ---
  const [forecastData, setForecastData] = useState(() => {
    const stored = localStorage.getItem("weeklyForecastResults");
    return stored ? JSON.parse(stored).filter(row => !row.isTotal) : [];
  });

  const [actualData, setActualData] = useState([]);
  const [posData, setPosData] = useState({});
  const [printDate, setPrintDate] = useState(null);
  const [guideData, setGuideData] = useState({});
  const [manualAdditions, setManualAdditions] = useState({});
  
  useEffect(() => {
    localStorage.setItem("weeklyForecastResults", JSON.stringify(forecastData));
  }, [forecastData]);

  const [isAdminMode, setIsAdminMode] = useState(() => {
    const stored = localStorage.getItem('adminMode');
    return stored === 'true';
  });

  const toggleAdminMode = () => {
    setIsAdminMode(prev => {
      const updated = !prev;
      localStorage.setItem('adminMode', updated.toString());
      return updated;
    });
  };

  const safeParse = (key, fallback) => {
    const raw = localStorage.getItem(key);
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? fallback : parsed;
  };

  const [adminSettings, setAdminSettings] = useState({
    captureRate: safeParse("captureRate", 0.08),
    spendPerGuest: safeParse("spendPerGuest", 40),
    amSplit: safeParse("amSplit", 0.6),
    foodCostGoal: safeParse("foodCostGoal", 0.3),
    bevCostGoal: safeParse("bevCostGoal", 0.2),
    laborCostGoal: safeParse("laborCostGoal", 0.14),
  });

  const updateAdminSetting = (key, value) => {
    let numericValue = parseFloat(value);
    if (['captureRate', 'amSplit', 'foodCostGoal', 'bevCostGoal', 'laborCostGoal'].includes(key)) {
      if (numericValue > 1) numericValue = numericValue / 100;
    }
    setAdminSettings(prev => {
      const updated = { ...prev, [key]: numericValue };
      localStorage.setItem(key, numericValue.toString());
      return updated;
    });
  };

  const addForecastEntry = useCallback((newEntry) => {
    setForecastData(prev => {
      const index = prev.findIndex(entry => entry.date === newEntry.date);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newEntry };
        return updated;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const addActualEntry = useCallback((newEntry) => {
    setActualData(prev => {
      const index = prev.findIndex(entry => entry.date === newEntry.date);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newEntry };
        return updated;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  // --- ENHANCED PROVIDER VALUE WITH MULTI-TENANT SUPPORT ---
  const providerValue = {
    // Location data (enhanced for multi-tenant)
    locationId,           // Legacy bigint ID for backward compatibility
    locationUuid,         // Multi-tenant UUID for new queries
    locationName,         // Display name for UI
    loadingLocation,      // Loading state for location fetch
    locationError,        // Error state for location fetch
    
    // Existing data management
    forecastData,
    actualData,
    posData,
    setForecastData,
    setPosData,
    addForecastEntry,
    addActualEntry,
    
    // Admin functionality
    isAdminMode,
    setIsAdminMode,
    toggleAdminMode,
    adminSettings,
    updateAdminSetting,
    
    // Additional data
    guideData,
    setGuideData,
    manualAdditions,
    setManualAdditions,
    printDate,
    setPrintDate
  };

  return (
    <DataContext.Provider value={providerValue}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
