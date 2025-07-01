import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDailyShiftPrepGuideLogic } from "@/hooks/useDailyShiftPrepGuideLogic.jsx";
import { useToast } from "./ui/use-toast.jsx";
import { triggerPrint } from "./prep/PrintUtils.jsx";
import PrintableDailyShiftPrepGuide from "./prep/PrintableDailyShiftPrepGuide.jsx";
import PrepGuideContent from "./prep/PrepGuideContent.jsx";
import { useMenuManager } from "@/hooks/useMenuManager.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Edit3 } from "lucide-react";
import MenuEditorSection from "./prep/MenuEditorSection.jsx";

const DailyShiftPrepGuide = () => {
  const { dailyShiftPrepData, handlePrepTaskChange } = useDailyShiftPrepGuideLogic();
  const { toast } = useToast();
  const [expandedDays, setExpandedDays] = useState({});
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const { menu, setMenu } = useMenuManager("dailyPrepMenu");

  const [newItemForms, setNewItemForms] = useState({});
  const [editorsVisibility, setEditorsVisibility] = useState({});

  const toggleEditor = (section) => {
    setEditorsVisibility((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleNewItemChange = (section, field, value) => {
    setNewItemForms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const addMenuItem = (section) => {
    const item = newItemForms[section];
    if (!item?.name) return;

    const newItem = {
      name: item.name,
      perGuestOz: item.unit === "oz" ? parseFloat(item.value || 0) : null,
      each: item.unit === "each" ? parseFloat(item.value || 0) : null,
      unit: item.unit,
    };

    const updatedSectionItems = [...(menu[section] || [])];
    const index = updatedSectionItems.findIndex((i) => i.name === item.name);

    if (index !== -1) {
      updatedSectionItems[index] = newItem;
    } else {
      updatedSectionItems.push(newItem);
    }

    const updatedMenu = { ...menu, [section]: updatedSectionItems };
    setMenu(updatedMenu);

    setNewItemForms((prev) => ({
      ...prev,
      [section]: { name: "", value: "", unit: "oz" },
    }));

    toast({
      title: "Item added or updated!",
      description: `${newItem.name} in ${section}`,
      variant: "success",
    });
  };

  const removeMenuItem = (section, itemName) => {
    const updatedMenu = {
      ...menu,
      [section]: (menu[section] || []).filter((i) => i.name !== itemName),
    };
    setMenu(updatedMenu);

    toast({
      title: "Item removed",
      description: `${itemName} from ${section}`,
      variant: "destructive",
    });
  };

  const handleInitiatePrint = async () => {
    try {
      await triggerPrint(
        () => (
          <PrintableDailyShiftPrepGuide
            dailyShiftPrepData={dailyShiftPrepData}
            printDate={new Date()}
          />
        ),
        {},
        "Daily Shift Prep Guide – Print"
      );
      toast({ title: "Print processed", variant: "success" });
    } catch (error) {
      toast({
        title: "Print failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const allSections = Object.keys(menu);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-200">Daily Shift Prep Guide</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-indigo-400 border-indigo-600 hover:bg-indigo-700/30"
            onClick={() => setManageMenuOpen(!manageMenuOpen)}
          >
            <Edit3 size={16} className="mr-2" />
            {manageMenuOpen ? "Close Menu Editor" : "Manage Menu"}
          </Button>
          <Button
            onClick={handleInitiatePrint}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {manageMenuOpen && (
        <div className="border border-slate-700 rounded-lg shadow-lg p-4 bg-slate-800/60 space-y-6">
          {allSections.map((section) => (
            <MenuEditorSection
              key={section}
              section={section}
              items={menu[section]}
              editorOpen={editorsVisibility[section]}
              toggleEditor={toggleEditor}
              newItemForm={newItemForms[section] || { name: "", value: "", unit: "oz" }}
              handleNewItemChange={handleNewItemChange}
              addMenuItem={addMenuItem}
              removeMenuItem={removeMenuItem}
            />
          ))}
        </div>
      )}

      <PrepGuideContent
        dailyShiftPrepData={dailyShiftPrepData}
        expandedDays={expandedDays}
        setExpandedDays={setExpandedDays}
        onPrepTaskChange={handlePrepTaskChange}
      />
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
