import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext.jsx";
import { v4 as uuidv4 } from "uuid";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData, actualData } = useData();

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);
  const [printDate, setPrintDate] = useState(null);

  const captureRate = Number(localStorage.getItem("captureRate") || 8);
  const spendPerGuest = Number(localStorage.getItem("spendPerGuest") || 40);
  const amSplit = Number(localStorage.getItem("amSplit") || 60);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;

    // Auto-set printDate to the first forecasted date
    if (!printDate) {
      setPrintDate(forecastData[0].date);
    }

    const latestActuals = actualData?.[actualData.length - 1];
    const latestForecast = forecastData?.[actualData?.length - 1];
    let factor = 1;
    if (latestActuals && latestForecast && latestForecast.guests > 0) {
      factor = latestActuals.guests / latestForecast.guests;
    }
    setAdjustmentFactor(factor);

    const portionToLbs = (oz, guests) => {
      if (!oz || !guests || isNaN(oz) || isNaN(guests)) return 0;
      return ((guests * oz) / 16).toFixed(1);
    };

    const newData = forecastData.map((entry) => {
      const adjGuests = (entry.guests || 0) * factor;
      const amGuests = (entry.amGuests || 0) * factor;
      const pmGuests = (entry.pmGuests || 0) * factor;

      const generateShift = (guestCount, shiftName) => {
        const totalSandwiches = guestCount * 3;

        return {
          name: shiftName.toUpperCase(),
          color: shiftName === "am" ? "text-yellow-600" : "text-blue-600",
          icon: shiftName === "am" ? "🌞" : "🌙",
          prepItems: [
            { id: uuidv4(), name: "Pulled Pork (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Brisket (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Chicken (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },

            { id: uuidv4(), name: "Buns", quantity: guestCount * 3, unit: "each" },
            { id: uuidv4(), name: "Texas Toast", quantity: guestCount, unit: "each" },

            {
              id: uuidv4(),
              name: "Coleslaw",
              quantity: portionToLbs((2 * totalSandwiches) + (4 * guestCount), 1),
              unit: "lbs"
            },

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
            { id: uuidv4(), name: "Hummingbird Cake", quantity: guestCount, unit: "each" },
          ]
        };
      };

      return {
        date: entry.date,
        guests: Math.round(adjGuests),
        amGuests: Math.round(amGuests),
        pmGuests: Math.round(pmGuests),
        shifts: {
          am: generateShift(amGuests, "am"),
          pm: generateShift(pmGuests, "pm")
        }
      };
    });

    setDailyShiftPrepData(newData);
  }, [forecastData, actualData, amSplit, printDate]);

  return {
    forecastData,
    adjustmentFactor,
    dailyShiftPrepData,
    printDate,
    setPrintDate,
    handlePrepTaskChange: () => {},
    manageMenuOpen: false,
    setManageMenuOpen: () => {},
    menuLoading: false,
    menu: {},
    MenuEditorComponent: null,
    handleSaveMenu: () => {},
  };
};
