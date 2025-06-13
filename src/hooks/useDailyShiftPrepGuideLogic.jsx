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
      const guests = Number(entry.guests || 0);
      const adjGuests = guests * factor;
      const amGuests = Math.round(adjGuests * (amSplit / 100));
      const pmGuests = Math.round(adjGuests - amGuests);
      console.log("👥 Guests Breakdown:", {
  date: entry.date,
  rawGuests: guests,
  adjustmentFactor: factor,
  adjGuests,
  amGuests,
  pmGuests
});

      const generateShift = (guestCount) => {
        const totalSandwiches = guestCount * 3;

        return {
          name: guestCount === amGuests ? "AM" : "PM",
          color: guestCount === amGuests ? "text-yellow-600" : "text-blue-600",
          icon: guestCount === amGuests ? "🌞" : "🌙",
          prepItems: [
            // Sandwich proteins (by lb)
            { id: uuidv4(), name: "Pulled Pork (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Brisket (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Chopped Chicken (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs" },

            // Coleslaw combined: 2oz/sandwich + 4oz/guest as side
            { id: uuidv4(), name: "Coleslaw", quantity: portionToLbs((2 * totalSandwiches) + (4 * guestCount), 1), unit: "lbs" },

            // Bread
            { id: uuidv4(), name: "Buns", quantity: Math.ceil(guestCount * 3), unit: "each" },
            { id: uuidv4(), name: "Texas Toast", quantity: Math.ceil(guestCount * 1), unit: "each" },

            // BBQ by lb
            { id: uuidv4(), name: "Pulled Pork", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Brisket", quantity: portionToLbs(6, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Half Chicken", quantity: portionToLbs(16, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "St Louis Ribs", quantity: portionToLbs(16, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Beef Short Rib", quantity: portionToLbs(24, guestCount), unit: "lbs" },

            // Sides by lb or each
            { id: uuidv4(), name: "Collard Greens", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Mac N Cheese", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Baked Beans", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Corn Casserole", quantity: portionToLbs(4, guestCount), unit: "lbs" },
            { id: uuidv4(), name: "Corn Muffin", quantity: Math.ceil(guestCount), unit: "each" },
            { id: uuidv4(), name: "Honey Butter", quantity: portionToLbs(1, guestCount), unit: "lbs" },

            // Desserts by each
            { id: uuidv4(), name: "Banana Pudding", quantity: Math.ceil(guestCount), unit: "each" },
            { id: uuidv4(), name: "Key Lime Pie", quantity: Math.ceil(guestCount), unit: "each" },
            { id: uuidv4(), name: "Hummingbird Cake", quantity: Math.ceil(guestCount), unit: "each" },
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
        },
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



