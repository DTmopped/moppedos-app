import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext.jsx";
import { v4 as uuidv4 } from "uuid";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData, actualData } = useData();

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;

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

    const newData = forecastData
      .filter((entry) => entry.amGuests !== undefined && entry.pmGuests !== undefined)
      .map((entry) => {
        const amGuests = Math.round(entry.amGuests * factor);
        const pmGuests = Math.round(entry.pmGuests * factor);

        const generateShift = (guestCount, label) => {
          const totalSandwiches = guestCount * 3;

          return {
            name: label,
            color: label === "AM" ? "text-yellow-600" : "text-blue-600",
            icon: label === "AM" ? "🌞" : "🌙",
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
          guests: Math.round(entry.guests * factor),
          amGuests,
          pmGuests,
          shifts: {
            am: generateShift(amGuests, "AM"),
            pm: generateShift(pmGuests, "PM")
          }
        };
      });

    setDailyShiftPrepData(newData);
  }, [forecastData, actualData]);

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
