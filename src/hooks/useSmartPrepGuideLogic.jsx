import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext.jsx';
import { useMenuManager } from '@/hooks/useMenuManager';
import { calculateAdjustmentFactorUtil, generateFullWeeklyPrepTextForSection } from '@/lib/prepGuideUtils.js';

export const useSmartPrepGuideLogic = (menuKey) => {
  const { forecastData, actualData } = useData();
  const {
    menu,
    isLoading: menuLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
  } = useMenuManager(menuKey);

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [prepTextBySection, setPrepTextBySection] = useState({});

  const generatePrepText = useCallback(() => {
    if (!forecastData || forecastData.length === 0) return;

    const adjFactor = calculateAdjustmentFactorUtil(actualData, forecastData);
    setAdjustmentFactor(adjFactor);

    const newPrepText = {};
    if (menu && Object.keys(menu).length > 0) {
      Object.keys(menu).forEach(section => {
        newPrepText[section] = generateFullWeeklyPrepTextForSection(menu[section], forecastData, adjFactor);
      });
    }

    setPrepTextBySection(newPrepText);
  }, [menu, forecastData, actualData]);

  useEffect(() => {
    if (!menuLoading && menu) {
      generatePrepText();
    }
  }, [menu, forecastData, actualData, menuLoading, generatePrepText]);

  return {
    forecastData,
    actualData,
    menu,
    menuLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    adjustmentFactor,
    prepTextBySection,
    generatePrepText
  };
};
