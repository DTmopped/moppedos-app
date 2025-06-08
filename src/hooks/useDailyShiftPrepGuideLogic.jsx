import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext.jsx';
import { useMenuManager } from '@/hooks/useMenuManager';
import { calculateAdjustmentFactorUtil, generateDailyShiftPrepDataForDay } from '@/lib/prepGuideUtils.js';
import { useToast } from "components/ui/use-toast.jsx";

const STORAGE_KEY_PREP_TASKS = 'dailyShiftPrepTasks';

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData, actualData } = useData();
  const { menu, MenuEditorComponent, isLoading: menuLoading, saveMenu } = useMenuManager('dailyShiftPrepGuideMenu');
  const [adjustmentFactor, setAdjustmentFactorState] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const [printDate, setPrintDate] = useState(new Date());
  const [storedPrepTasks, setStoredPrepTasks] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const loadedTasks = localStorage.getItem(STORAGE_KEY_PREP_TASKS);
    if (loadedTasks) {
      setStoredPrepTasks(JSON.parse(loadedTasks));
    }
  }, []);

  const savePrepTasksToStorage = useCallback((tasks) => {
    localStorage.setItem(STORAGE_KEY_PREP_TASKS, JSON.stringify(tasks));
  }, []);

  const calculateAndSetData = useCallback(() => {
    if (menuLoading) return;

    const adjFactor = calculateAdjustmentFactorUtil(actualData, forecastData);
    setAdjustmentFactorState(adjFactor);

    if (!forecastData || forecastData.length === 0 || !menu || Object.keys(menu).length === 0) {
      setDailyShiftPrepData([]);
      return;
    }
    
    const newDailyPrep = forecastData.map(day => generateDailyShiftPrepDataForDay(day, adjFactor, menu, storedPrepTasks));
    setDailyShiftPrepData(newDailyPrep);
  }, [menu, forecastData, actualData, menuLoading, storedPrepTasks]);

  useEffect(() => {
    calculateAndSetData();
  }, [calculateAndSetData]);

  const handlePrepTaskChange = useCallback((date, shiftKey, itemId, field, value) => {
    setDailyShiftPrepData(prevData => {
      return prevData.map(day => {
        if (day.date === date) {
          const updatedShifts = { ...day.shifts };
          if (updatedShifts[shiftKey]) {
            updatedShifts[shiftKey] = {
              ...updatedShifts[shiftKey],
              prepItems: updatedShifts[shiftKey].prepItems.map(item => {
                if (item.id === itemId) {
                  return { ...item, [field]: value };
                }
                return item;
              })
            };
          }
          return { ...day, shifts: updatedShifts };
        }
        return day;
      });
    });

    const taskKey = `${date}-${shiftKey}-${itemId}`;
    const updatedStoredTasks = {
      ...storedPrepTasks,
      [taskKey]: {
        ...(storedPrepTasks[taskKey] || { id: itemId, date, shiftKey }),
        [field]: value,
      }
    };
    setStoredPrepTasks(updatedStoredTasks);
    savePrepTasksToStorage(updatedStoredTasks);

  }, [storedPrepTasks, savePrepTasksToStorage]);
  
  const handleSaveMenu = async (newMenu) => {
    try {
      await saveMenu(newMenu);
      toast({
        title: "Menu Saved",
        description: "Daily Shift Prep Guide menu has been updated.",
        variant: "success",
      });
      calculateAndSetData(); // Recalculate prep data with new menu
    } catch (error) {
      toast({
        title: "Error Saving Menu",
        description: "Could not save the menu. Please try again.",
        variant: "destructive",
      });
    }
  };


  return {
    forecastData,
    actualData,
    menu,
    MenuEditorComponent,
    menuLoading,
    adjustmentFactor,
    dailyShiftPrepData,
    manageMenuOpen,
    setManageMenuOpen,
    printDate,
    setPrintDate,
    handlePrepTaskChange,
    handleSaveMenu,
  };
};
