useEffect(() => {
  if (!forecastData || forecastData.length === 0) return;
  if (dailyShiftPrepData.length > 0) return; // ⛔ Prevent overwriting user edits
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

  const portionToLbs = (oz, guests) => {
    if (!oz || !guests || isNaN(oz) || isNaN(guests)) return 0;
    return ((guests * oz) / 16).toFixed(1);
  };

  const newData = forecastData.map((entry) => {
    const adjGuests = Number(entry.guests) * factor || 0;
    const amGuests = Number(entry.amGuests) * factor || 0;
    const pmGuests = Number(entry.pmGuests) * factor || 0;

    const generateShift = (guestCount, shiftName) => {
      const totalSandwiches = guestCount * 3;

      return {
        name: shiftName.toUpperCase(),
        color: shiftName === "am" ? "text-yellow-600" : "text-blue-600",
        icon: shiftName === "am" ? "🌞" : "🌙",
        prepItems: [
          { id: uuidv4(), name: "Pulled Pork (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Chopped Brisket (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Chopped Chicken (Sammies)", quantity: portionToLbs(6, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Buns", quantity: guestCount * 3, unit: "each", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Texas Toast", quantity: guestCount, unit: "each", assignedTo: "", completed: false },
          {
            id: uuidv4(),
            name: "Coleslaw",
            quantity: portionToLbs((2 * totalSandwiches) + (4 * guestCount), 1),
            unit: "lbs",
            assignedTo: "",
            completed: false
          },
          { id: uuidv4(), name: "Pulled Pork", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Sliced Brisket", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Half Chicken", quantity: portionToLbs(16, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "St Louis Ribs", quantity: portionToLbs(16, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Beef Short Rib", quantity: portionToLbs(16, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Collard Greens", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Mac N Cheese", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Baked Beans", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Corn Casserole", quantity: portionToLbs(4, guestCount), unit: "lbs", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Corn Muffin", quantity: guestCount, unit: "each", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Honey Butter", quantity: guestCount, unit: "each", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Banana Pudding", quantity: guestCount, unit: "each", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Key Lime Pie", quantity: guestCount, unit: "each", assignedTo: "", completed: false },
          { id: uuidv4(), name: "Hummingbird Cake", quantity: guestCount, unit: "each", assignedTo: "", completed: false }
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
}, [forecastData]); // ⛔️ Keep only minimal dependencies
