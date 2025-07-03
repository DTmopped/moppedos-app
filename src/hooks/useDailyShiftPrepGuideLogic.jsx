import { useState, useEffect, useCallback } from "react";
import { useData } from "@/contexts/DataContext.jsx";
import { useMenuManager } from "@/hooks/useMenuManager.jsx";
import { v4 as uuidv4 } from "uuid";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData, actualData } = useData();
  const { menu } = useMenuManager("dailyPrepMenu");

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);
  const [printDate, setPrintDate] = useState(null);

  const portionToLbs = useCallback((oz, guests) => {
    if (!oz || !guests || isNaN(oz) || isNaN(guests)) return 0;
    return ((guests * oz) / 16).toFixed(1);
  }, []);

  const generateShift = useCallback((menu, guestCount, shiftName) => {
    const prepItems = [];

    Object.entries(menu).forEach(([section, items]) => {
      items.forEach(item => {
        const baseName = section === "Sammies" ? `${item.name} (Sammies)` : item.name;
        let quantity = 0;
        let unit = item.unit;

        if (unit === "oz" && item.perGuestOz) {
          quantity = portionToLbs(item.perGuestOz, guestCount);
          unit = "lbs";
        } else if (unit === "each" && item.each) {
          quantity = guestCount * item.each;
        }

        prepItems.push({
          id: uuidv4(),
          name: baseName,
          quantity,
          unit,
          assignedTo: "",
          completed: false,
        });
      });
    });

    return {
      name: shiftName.toUpperCase(),
      color: shiftName === "am" ? "text-yellow-600" : "text-blue-600",
      icon: shiftName === "am" ? "🌞" : "🌙",
      prepItems,
    };
  }, [portionToLbs]);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;
    if (dailyShiftPrepData.length > 0) return;
    if (!printDate) setPrintDate(forecastData[0].date);

    const latestActuals = actualData?.[actualData.length - 1];
    const latestForecast = forecastData?.[forecastData.length - 1];
    let factor = 1;

    if (
      latestActuals?.guests &&
      latestForecast?.guests &&
      !isNaN(latestActuals.guests) &&
      !isNaN(latestForecast.guests) &&
      latestForecast.guests > 0
    ) {
      factor = latestActuals.guests / latestForecast.guests;
    }

    setAdjustmentFactor(factor);

    const newData = forecastData.map((entry) => {
      const adjGuests = Number(entry.guests) * factor || 0;
      const amGuests = Number(entry.amGuests) * factor || 0;
      const pmGuests = Number(entry.pmGuests) * factor || 0;

      return {
        date: entry.date,
        guests: Math.round(adjGuests),
        amGuests: Math.round(amGuests),
        pmGuests: Math.round(pmGuests),
        shifts: {
          am: generateShift(menu, amGuests, "am"),
          pm: generateShift(menu, pmGuests, "pm"),
        },
      };
    });

    setDailyShiftPrepData(newData);
  }, [forecastData?.length, menu]);

  const handlePrepTaskChange = (date, shiftKey, itemId, field, value) => {
    setDailyShiftPrepData((prev) =>
      prev.map((day) =>
        day.date === date
          ? {
              ...day,
              shifts: {
                ...day.shifts,
                [shiftKey]: {
                  ...day.shifts[shiftKey],
                  prepItems: day.shifts[shiftKey].prepItems.map((item) =>
                    item.id === itemId ? { ...item, [field]: value } : item
                  ),
                },
              },
            }
          : day
      )
    );
  };

  return {
    forecastData,
    adjustmentFactor,
    dailyShiftPrepData,
    printDate,
    setPrintDate,
    handlePrepTaskChange,
    manageMenuOpen: false,
    setManageMenuOpen: () => {},
    menuLoading: false,
    menu,
    MenuEditorComponent: null,
    handleSaveMenu: () => {},
  };
};
