import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext.jsx';
import { useMenuManager } from '@/hooks/useMenuManager';

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData } = useData();
  const {
    menu,
    MenuEditorComponent,
    isLoading: menuLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useMenuManager('shiftPrep');

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);
  const [printDate, setPrintDate] = useState(null);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);

  const captureRate = Number(localStorage.getItem('captureRate') || 8);
  const spendPerGuest = Number(localStorage.getItem('spendPerGuest') || 40);
  const amSplit = Number(localStorage.getItem('amSplit') || 60);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0 || !menu) return;

    const newPrepData = forecastData.map((entry) => {
      const guests = Math.round(entry.guests || 0);
      const amGuests = Math.round(guests * (amSplit / 100));
      const pmGuests = guests - amGuests;

      const portion = (count, oz) => ({
        each: count,
        lbs: ((count * oz) / 16).toFixed(1),
      });

      const generateShiftItems = (guestCount) => {
        const items = [];
        if (!menu || Object.keys(menu).length === 0) return items;

        Object.keys(menu).forEach((sectionKey) => {
          const section = menu[sectionKey];
          section.forEach((item) => {
            const { id, name, unit, portionSizeOz = 0, multiplier = 1 } = item;
            let quantity = 0;
            if (unit === 'lbs') {
              quantity = ((guestCount * portionSizeOz * multiplier) / 16).toFixed(1);
            } else {
              quantity = Math.ceil(guestCount * multiplier);
            }
            items.push({ ...item, quantity });
          });
        });

        return items;
      };

      return {
        date: entry.date,
        guests,
        amGuests,
        shifts: {
          am: {
            name: 'AM',
            icon: '🌞',
            color: 'text-yellow-500',
            prepItems: generateShiftItems(amGuests),
          },
          pm: {
            name: 'PM',
            icon: '🌙',
            color: 'text-purple-400',
            prepItems: generateShiftItems(pmGuests),
          },
        },
      };
    });

    setDailyShiftPrepData(newPrepData);
  }, [forecastData, menu, amSplit]);

  const handlePrepTaskChange = (date, shiftKey, itemId, field, value) => {
    setDailyShiftPrepData((prev) => {
      return prev.map((day) => {
        if (day.date !== date) return day;
        const updatedShift = {
          ...day.shifts[shiftKey],
          prepItems: day.shifts[shiftKey].prepItems.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
        return {
          ...day,
          shifts: {
            ...day.shifts,
            [shiftKey]: updatedShift,
          },
        };
      });
    });
  };

  return {
    forecastData,
    menu,
    MenuEditorComponent,
    menuLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    adjustmentFactor,
    dailyShiftPrepData,
    manageMenuOpen,
    setManageMenuOpen,
    handlePrepTaskChange,
    printDate,
    setPrintDate,
  };
};

