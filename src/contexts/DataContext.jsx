import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Make sure this path is correct

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// This is a new, separate hook for clarity, though it uses the same context.
export const useUserAndLocation = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // --- LOCATION ID STATE AND FETCHING ---
  const [locationId, setLocationId] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    const fetchUserLocation = async () => {
      setLoadingLocation(true);
      // First, get the current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting user session:", sessionError);
        setLoadingLocation(false);
        return;
      }

      if (session?.user) {
        // If a user is logged in, fetch their profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // Assuming you have a 'profiles' table
          .select('location_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else if (profile) {
          console.log(`Existing locationId found: ${profile.location_id}`); // This will now fire correctly
          setLocationId(profile.location_id);
        }
      }
      setLoadingLocation(false);
    };

    fetchUserLocation();
  }, []);


  // --- EXISTING STATE MANAGEMENT ---
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

  // This is the value that will be passed to all components.
  const providerValue = {
    locationId, // <-- The crucial addition
    loadingLocation, // <-- So components know to wait
    forecastData,
    actualData,
    posData,
    setForecastData,
    setPosData,
    addForecastEntry,
    addActualEntry,
    isAdminMode,
    setIsAdminMode,
    toggleAdminMode,
    adminSettings,
    updateAdminSetting,
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
