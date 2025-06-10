import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { PlusCircle, XCircle, Edit3 } from 'lucide-react';

const initialMenuData = {
  Sandwiches: [
    { name: "Pulled Pork Sandwich", perGuestOz: 4, unit: "oz" },
    { name: "Chopped Brisket Sandwich", perGuestOz: 4, unit: "oz" },
    { name: "Chopped Chicken Sandwich", perGuestOz: 4, unit: "oz" },
    { name: "Buns", each: 1, unit: "each" }
  ],
  BBQ: [
    { name: "Pulled Pork", perGuestOz: 6, unit: "oz" },
    { name: "Chopped Brisket", perGuestOz: 6, unit: "oz" },
    { name: "Brisket (Sliced)", perGuestOz: 6, unit: "oz" },
    { name: "Bone-In Short Rib", perGuestOz: 8, unit: "oz" },
    { name: "Half Chicken", each: 1, unit: "each" },
    { name: "St. Louis Ribs (1/2 rack)", each: 1, unit: "each" }
  ],
  Sides: [
    { name: "Baked Beans", perGuestOz: 4, unit: "oz" },
    { name: "Mac ’n’ Cheese", perGuestOz: 4, unit: "oz" },
    { name: "Collard Greens", perGuestOz: 4, unit: "oz" },
    { name: "Coleslaw", perGuestOz: 4, unit: "oz" },
    { name: "Corn Casserole", perGuestOz: 4, unit: "oz" },
    { name: "Corn Muffin", each: 1, unit: "each" }
  ],
  Desserts: [
    { name: "Banana Pudding", each: 1, unit: "each" },
    { name: "Hummingbird Cake", each: 1, unit: "each" },
    { name: "Key Lime Pie", each: 1, unit: "each" }
  ]
};

export const useMenuManager = (localStorageKey) => {
  const [menu, setMenu] = useState(() => {
    const savedMenu = localStorage.getItem(localStorageKey);
    return savedMenu ? JSON.parse(savedMenu) : initialMenuData;
  });
  const [editorsVisibility, setEditorsVisibility] = useState({});
  const [newItemForms, setNewItemForms] = useState({});

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(menu));
  }, [menu, localStorageKey]);

  const toggleEditor = (section) => {
    setEditorsVisibility(prev => ({ ...prev, [section]: !prev[section] }));
    if (!newItemForms[section]) {
      setNewItemForms(prev => ({ ...prev, [section]: { name: '', value: '', unit: 'oz' } }));
    }
  };

  const handleNewItemChange = (section, field, value) => {
    setNewItemForms(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const addMenuItem = (section) => {
    const { name, value, unit } = newItemForms[section];
    if (!name || !value) {
      alert("Item name and portion value are required.");
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      alert("Portion value must be a positive number.");
      return;
    }

    setMenu(prevMenu => {
      const updatedSectionItems = prevMenu[section].filter(i => i.name.toLowerCase() !== name.toLowerCase());
      const newItem = unit === "oz" ? { name, perGuestOz: numValue, unit } : { name, each: numValue, unit };
      return {
        ...prevMenu,
        [section]: [...updatedSectionItems, newItem].sort((a, b) => a.name.localeCompare(b.name))
      };
    });
    setNewItemForms(prev => ({ ...prev, [section]: { name: '', value: '', unit: 'oz' } }));
  };
  
  const removeMenuItem = (section, itemName) => {
    setMenu(prevMenu => ({
      ...prevMenu,
      [section]: prevMenu[section].filter(item => item.name !== itemName)
    }));
  };

  const MenuEditorComponent = ({ sectionTitleColor = "from-purple-400 to-indigo-500" }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {Object.keys(menu).map(section => (
        <Card key={section} className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className={`text-lg text-transparent bg-clip-text bg-gradient-to-r ${sectionTitleColor}`}>{section}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => toggleEditor(section)} className="text-slate-400 hover:text-purple-400">
                {editorsVisibility[section] ? "Close Editor" : <><Edit3 size={14} className="mr-1"/> Edit Items</>}
              </Button>
            </div>
          </CardHeader>
          {editorsVisibility[section] && (
            <CardContent>
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 border border-slate-700 rounded-md bg-slate-800 space-y-2"
              >
                <h4 className="text-sm font-semibold text-slate-200">Add/Update Item in {section}</h4>
                <Input placeholder="Item Name" value={newItemForms[section]?.name || ''} onChange={(e) => handleNewItemChange(section, 'name', e.target.value)} className="bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500"/>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Portion" value={newItemForms[section]?.value || ''} onChange={(e) => handleNewItemChange(section, 'value', e.target.value)} className="bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500"/>
                  <Select value={newItemForms[section]?.unit || 'oz'} onValueChange={(val) => handleNewItemChange(section, 'unit', val)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200"><SelectValue placeholder="Unit" /></SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-slate-200">
                      <SelectItem value="oz">per guest (oz)</SelectItem>
                      <SelectItem value="each">each per guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => addMenuItem(section)} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"><PlusCircle className="mr-2 h-4 w-4" />Add/Update</Button>
                <div className="mt-2 space-y-1">
                  <h5 className="text-xs font-medium text-slate-300">Current Items:</h5>
                  {menu[section].length === 0 ? <p className="text-xs text-slate-500">No items.</p> : (
                    <ul className="text-xs text-slate-400 max-h-24 overflow-y-auto">
                      {menu[section].map(item => (
                        <li key={item.name} className="flex justify-between items-center py-0.5">
                          <span>{item.name} ({item.perGuestOz ? `${item.perGuestOz}oz` : `${item.each} each`})</span>
                          <Button variant="ghost" size="icon" onClick={() => removeMenuItem(section, item.name)} className="h-5 w-5 text-red-500 hover:text-red-400"><XCircle size={12} /></Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  return { menu, MenuEditorComponent };
};
