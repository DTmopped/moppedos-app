import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext.jsx";
import { v4 as uuidv4 } from "uuid";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData, actualData } = useData();

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);

  const captureRate = Number(localStorage.getItem("captureRate") || 8);
  const spendPerGuest = Number(localStorage.getItem("spendPerGuest") || 40);
  const amSplit = Number(localStorage.getItem("amSplit") || 60);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;

    const portionToLbs = (oz, guests) => {
      if (!oz || !guests || isNaN(oz) || isNaN(guests)) return 0;
      return ((guests * oz) / 16).toFixed(1);
    };

    const factor = (() => {
      const latestActuals = actualData?.[actualData.length - 1];
      const latestForecast = forecastData?.[actualData?.length - 1];
      if (latestActuals && latestForecast && latestForecast.guests > 0) {
        return latestActuals.guests / latestForecast.guests;
      }
      return 1;
    })();
    setAdjustmentFactor(factor);

    const newData = forecastData.map((entry) => {
      const guests = Number(entry.guests || 0);
      const adjGuests = guests * factor;
      const amGuests = Math.round(adjGuests * (amSplit / 100));
      const pmGuests = Math.round(adjGuests - amGuests);

      const generateShift = (guestCount) => {
        const totalSandwiches = guestCount * 3;

        return {
          name: guestCount === amGuests ? "AM" : "PM",
          color: guestCount === amGuests ? "text-yellow-600" : "text-blue-600",
          icon: guestCount === amGuests ? "🌞" : "🌙",
          prepItems: [
            { id: uuidv4(), name: "Pulled Pork (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Brisket (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Chicken (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },

            { id: uuidv4(), name: "Buns", quantity: guestCount * 3, unit: "each" },
            { id: uuidv4(), name: "Texas Toast", quantity: guestCount, unit: "each" },

            { id: uuidv4(), name: "Coleslaw", quantity: portionToLbs((2 * totalSandwiches) + (4 * guestCount), 1), unit: "lbs" },

            { id: uuidv4(), name: "Pulled Pork", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Brisket", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Half Chicken", quantity: portionToLbs(16, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "St Louis Ribs", quantity: portionToLbs(16, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Beef Short Rib", quantity: portionToLbs(24, guestCount), unit: "lbs" },

            { id: uuidv4(), name: "Collard Greens", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Mac N Cheese", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Baked Beans", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Corn Casserole", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Corn Muffin", quantity: guestCount, unit: "each" },
            { id: uuidv4(), name: "Honey Butter", quantity: guestCount, unit: "each" },

            { id: uuidv4(), name: "Banana Pudding", quantity: guestCount, unit: "each" },
            { id: uuidv4(), name: "Key Lime Pie", quantity: guestCount, unit: "each" },
            { id: uuidv4(), name: "Hummingbird Cake", quantity: guestCount, unit: "each" }
          ]
        };
      };

      return {
        date: entry.date,
        guests: Math.round(adjGuests),
        amGuests,
        pmGuests,
        shifts: {
          am: generateShift(amGuests),
          pm: generateShift(pmGuests)
        }
      };
    });

    setDailyShiftPrepData(newData);
  }, [forecastData, actualData, amSplit]);

  return {
    forecastData,
    adjustmentFactor,
    dailyShiftPrepData,
    printDate: null,
    setPrintDate: () => {},
    handlePrepTaskChange: () => {},
    manageMenuOpen: false,
    setManageMenuOpen: () => {},
    menuLoading: false,
    menu: {},
    MenuEditorComponent: null,
    handleSaveMenu: () => {},
  };
};

