import React, { useState, useEffect, useRef } from 'react';

// ----------------------------------------
// 🔧 Initial Data
// ----------------------------------------
const defaultMenuData = {
  Sandwiches: [],
  BBQ: [],
  Bread: [],
  Sides: [],
  Desserts: []
};

const initialMenuData = {
  Sandwiches: [
    { name: "Pulled Pork Sandwich", perGuestOz: 6, unit: "oz" },
    { name: "Chopped Brisket Sandwich", perGuestOz: 6, unit: "oz" },
    { name: "Chopped Chicken Sandwich", perGuestOz: 6, unit: "oz" }
  ],
  BBQ: [
    { name: "Pulled Pork", perGuestOz: 4, unit: "oz" },
    { name: "Brisket", perGuestOz: 4, unit: "oz" },
    { name: "Bone-In Beef Short Rib", perGuestOz: 16, unit: "oz" },
    { name: "Half Chicken", each: 1, unit: "each" },
    { name: "St. Louis Ribs (1/2 rack)", each: 1, unit: "each" }
  ],
  Bread: [
    { name: "Buns", each: 1, unit: "each" },
    { name: "Texas Toast", each: 1, unit: "each" }
  ],
  Sides: [
    { name: "Baked Beans", perGuestOz: 4, unit: "oz" },
    { name: "Mac ’n’ Cheese", perGuestOz: 4, unit: "oz" },
    { name: "Collard Greens", perGuestOz: 4, unit: "oz" },
    { name: "Coleslaw", perGuestOz: 4, unit: "oz" },
    { name: "Corn Casserole", perGuestOz: 4, unit: "oz" },
    { name: "Corn Muffin", each: 1, unit: "each" },
    { name: "Honey Butter", each: 1, unit: "each" }
  ],
  Desserts: [
    { name: "Banana Pudding", each: 1, unit: "each" },
    { name: "Hummingbird Cake", each: 1, unit: "each" },
    { name: "Key Lime Pie", each: 1, unit: "each" }
  ]
};

// ----------------------------------------
// 🧠 Hook
// ----------------------------------------
export const useMenuManager = (localStorageKey) => {
  const [menu, setMenu] = useState(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      const parsed = saved ? JSON.parse(saved) : initialMenuData;

      // Ensure all sections exist even if localStorage was incomplete
      return {
        ...defaultMenuData,
        ...parsed,
      };
    } catch (err) {
      console.error("Invalid menu data in localStorage:", err);
      return initialMenuData;
    }
  });

  const [editorsVisibility, setEditorsVisibility] = useState(() => {
    const init = {};
    Object.keys(initialMenuData).forEach(k => { init[k] = true; });
    return init;
  });

  const [newItemForms, setNewItemForms] = useState(() => {
    const forms = {};
    Object.keys(initialMenuData).forEach(section => {
      forms[section] = { name: '', value: '', unit: 'oz' };
    });
    return forms;
  });

  const saveTimeout = useRef(null);

  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem(localStorageKey, JSON.stringify(menu));
    }, 300);
    return () => clearTimeout(saveTimeout.current);
  }, [menu, localStorageKey]);

  const toggleEditor = (section) => {
    setEditorsVisibility(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNewItemChange = (section, field, value) => {
    setNewItemForms(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const addMenuItem = (section) => {
    const { name, value, unit } = newItemForms[section];
    if (!name || !value) return alert("Name and portion required.");
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return alert("Portion must be a positive number.");

    const newItem = unit === "oz"
      ? { name, perGuestOz: num, unit, each: undefined }
      : { name, each: num, unit, perGuestOz: undefined };

    setMenu(prev => {
      const updatedItems = [...(prev[section] || [])].filter(i => i.name.toLowerCase() !== name.toLowerCase());
      return {
        ...prev,
        [section]: [...updatedItems, newItem]
      };
    });

    setNewItemForms(prev => ({ ...prev, [section]: { name: '', value: '', unit: 'oz' } }));
  };

  const removeMenuItem = (section, name) => {
    setMenu(prev => ({
      ...prev,
      [section]: (prev[section] || []).filter(item => item.name !== name)
    }));
  };

  return {
    menu,
    editorsVisibility,
    toggleEditor,
    newItemForms,
    handleNewItemChange,
    addMenuItem,
    removeMenuItem
  };
};
