// Simple Smart Prep Guide Configuration
export const RESTAURANT_TEMPLATES = {
  bbq: {
    name: "BBQ Restaurant",
    icon: "🔥",
    categories: {
      "Smoked Meats": {
        icon: "🥩",
        items: [
          { name: "Brisket", baseQuantity: 20, unit: "lbs", prepTime: 16 },
          { name: "Pulled Pork", baseQuantity: 15, unit: "lbs", prepTime: 12 },
          { name: "Ribs", baseQuantity: 10, unit: "racks", prepTime: 6 },
          { name: "Chicken", baseQuantity: 20, unit: "pieces", prepTime: 4 }
        ]
      },
      "Sides": {
        icon: "🥗",
        items: [
          { name: "Coleslaw", baseQuantity: 5, unit: "lbs", prepTime: 1 },
          { name: "Baked Beans", baseQuantity: 3, unit: "pans", prepTime: 2 },
          { name: "Mac & Cheese", baseQuantity: 2, unit: "pans", prepTime: 1.5 }
        ]
      },
      "Sauces": {
        icon: "🍯",
        items: [
          { name: "BBQ Sauce", baseQuantity: 2, unit: "gallons", prepTime: 0.5 },
          { name: "Hot Sauce", baseQuantity: 1, unit: "gallon", prepTime: 0.3 }
        ]
      }
    }
  },
  italian: {
    name: "Italian Restaurant", 
    icon: "🍝",
    categories: {
      "Pasta": {
        icon: "🍝",
        items: [
          { name: "Fresh Pasta", baseQuantity: 10, unit: "lbs", prepTime: 2 },
          { name: "Gnocchi", baseQuantity: 5, unit: "lbs", prepTime: 3 }
        ]
      },
      "Sauces": {
        icon: "🍅", 
        items: [
          { name: "Marinara", baseQuantity: 2, unit: "gallons", prepTime: 2 },
          { name: "Alfredo", baseQuantity: 1, unit: "gallon", prepTime: 1 }
        ]
      }
    }
  }
};

export const WEEKDAY_MULTIPLIERS = {
  0: 0.8,  // Sunday
  1: 0.7,  // Monday
  2: 0.8,  // Tuesday  
  3: 0.9,  // Wednesday
  4: 1.0,  // Thursday
  5: 1.3,  // Friday
  6: 1.2   // Saturday
};

export const SEASONAL_MULTIPLIERS = {
  spring: 1.0,
  summer: 1.4,
  fall: 1.1, 
  winter: 0.8
};

export const WEATHER_MULTIPLIERS = {
  sunny: 1.0,
  cloudy: 1.0,
  rainy: 1.2,
  stormy: 1.3
};

export const HOLIDAY_MULTIPLIERS = {
  "2024-11-28": 2.0, // Thanksgiving
  "2024-12-24": 0.7, // Christmas Eve
  "2024-12-25": 0.3, // Christmas
  "2024-12-31": 1.5, // New Year's Eve
  "2024-07-04": 1.8, // July 4th
  "2024-05-27": 1.6  // Memorial Day
};

export const SHIFTS_CONFIG = {
  AM: { 
    name: 'AM Shift', 
    percentage: 0.6, 
    color: "text-yellow-400",
    hours: "6:00 AM - 2:00 PM"
  },
  PM: { 
    name: 'PM Shift', 
    percentage: 0.4, 
    color: "text-orange-400",
    hours: "2:00 PM - 10:00 PM"
  }
};
