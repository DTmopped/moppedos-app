import { useState, useEffect } from "react";

const canonicalCategories = [
  "BBQ Meats",
  "Sammies",
  "Breads",
  "Sides",
  "Desserts",
  "Other"
];

const defaultMenuData = {
  "Sammies": [
    { name: "Pulled Pork Sandwich", perGuestOz: 6, unit: "oz" },
    { name: "Chopped Brisket Sandwich", perGuestOz: 6, unit: "oz" },
    { name: "Chopped Chicken Sandwich", perGuestOz: 6, unit: "oz" }
  ],
  "BBQ Meats": [
    { name: "Pulled Pork", perGuestOz: 4, unit: "oz" },
    { name: "Brisket", perGuestOz: 4, unit: "oz" },
    { name: "Bone-In Beef Short Rib", perGuestOz: 16, unit: "oz" },
    { name: "Half Chicken", each: 1, unit: "each" },
    { name: "St. Louis Ribs (1/2 rack)", each: 1, unit: "each" }
  ],
  "Breads": [
    { name: "Buns", each: 1, unit: "each" },
    { name: "Texas Toast", each: 1, unit: "each" }
  ],
  "Sides": [
    { name: "Baked Beans", perGuestOz: 4, unit: "oz" },
    { name: "Mac ’n’ Cheese", perGuestOz: 4, unit: "oz" },
    { name: "Collard Greens", perGuestOz: 4, unit: "oz" },
    { name: "Coleslaw", perGuestOz: 4, unit: "oz" },
    { name: "Corn Casserole", perGuestOz: 4, unit: "oz" },
    { name: "Corn Muffin", each: 1, unit: "each" },
    { name: "Honey Butter", each: 1, unit: "each" }
  ],
  "Desserts": [
    { name: "Banana Pudding", each: 1, unit: "each" },
    { name: "Hummingbird Cake", each: 1, unit: "each" },
    { name: "Key Lime Pie", each: 1, unit: "each" }
  ],
  "Other": []
};

const useMenuManager = () => {
  const localStorageKey = "menuItems";
  const [menu, setMenu] = useState(defaultMenuData);

  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Filter to only canonical categories and sanitize items
        const cleaned = canonicalCategories.reduce((acc, category) => {
          const items = parsed[category];
          if (Array.isArray(items)) {
            acc[category] = items;
          } else {
            acc[category] = defaultMenuData[category] || [];
          }
          return acc;
        }, {});

        setMenu(cleaned);
      } catch (err) {
        console.error("Failed to parse saved menu data:", err);
        setMenu(defaultMenuData);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(menu));
  }, [menu]);

  const addOrUpdateItem = (section, item) => {
    setMenu(prev => {
      const existingItems = prev[section] || [];
      const filtered = existingItems.filter(i => i.name !== item.name);
      return {
        ...prev,
        [section]: [...filtered, item]
      };
    });
  };

  const removeItem = (section, itemName) => {
    setMenu(prev => {
      const updated = prev[section].filter(item => item.name !== itemName);
      return { ...prev, [section]: updated };
    });
  };

  return {
    menu,
    setMenu,
    addOrUpdateItem,
    removeItem,
    canonicalCategories
  };
};

export default useMenuManager;
