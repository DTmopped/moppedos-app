import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { exportExecutiveSummary, exportDetailedReport, exportRestaurantOnly, exportClubOnly, exportCombined } from '../utils/pdfExport';

const ProformaTool = () => {
  // Date Logic - Calculate years based on current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const monthsRemainingInYear = 12 - currentMonth + 1;
  
  // Start Year for financial forecast (user-configurable)
  const [startYear, setStartYear] = useState(2025);
  
  // Calculate calendar years for each forecast year based on startYear
  const year1CalendarYear = startYear;
  const year2CalendarYear = startYear + 1;
  const year3CalendarYear = startYear + 2;
  const year4CalendarYear = startYear + 3;
  const year5CalendarYear = startYear + 4;
  
  // UI State
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedForecastYear, setSelectedForecastYear] = useState('year1'); // 'year1', 'year2', etc.
  const [editingMode, setEditingMode] = useState('global'); // 'global' or 'year-specific'
  const [adminSection, setAdminSection] = useState('labor');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [enableClubOperations, setEnableClubOperations] = useState(false);
  const [clubRentAllocationPercent, setClubRentAllocationPercent] = useState(20); // % of total rent allocated to club
  
  // Revenue Centers (Dayparts) - Per-Year Configuration
  const [revenueCenters, setRevenueCenters] = useState({
    year1: {
      breakfast: false,
      lunch: true,
      dinner: true,
      lateNight: false,
      privateEvents: false,
      toGo: false,
      roomService: false
    },
    year2: {
      breakfast: false,
      lunch: true,
      dinner: true,
      lateNight: false,
      privateEvents: false,
      toGo: false,
      roomService: false
    },
    year3: {
      breakfast: false,
      lunch: true,
      dinner: true,
      lateNight: false,
      privateEvents: false,
      toGo: false,
      roomService: false
    },
    year4: {
      breakfast: false,
      lunch: true,
      dinner: true,
      lateNight: false,
      privateEvents: false,
      toGo: false,
      roomService: false
    },
    year5: {
      breakfast: false,
      lunch: true,
      dinner: true,
      lateNight: false,
      privateEvents: false,
      toGo: false,
      roomService: false
    }
  });
  
  // Helper function to get revenue centers for current editing context
  const getActiveRevenueCenters = () => {
    if (editingMode === 'global') {
      // In global mode, return year1 as the master configuration
      return revenueCenters.year1;
    } else {
      // In year-specific mode, return the selected year's configuration
      return revenueCenters[selectedForecastYear] || revenueCenters.year1;
    }
  };
  
  // Helper function to update revenue centers
  const updateRevenueCenter = (daypart, enabled) => {
    if (editingMode === 'global') {
      // Update all years
      setRevenueCenters(prev => ({
        year1: { ...prev.year1, [daypart]: enabled },
        year2: { ...prev.year2, [daypart]: enabled },
        year3: { ...prev.year3, [daypart]: enabled },
        year4: { ...prev.year4, [daypart]: enabled },
        year5: { ...prev.year5, [daypart]: enabled }
      }));
    } else {
      // Update only selected year
      setRevenueCenters(prev => ({
        ...prev,
        [selectedForecastYear]: {
          ...prev[selectedForecastYear],
          [daypart]: enabled
        }
      }));
    }
  };
  
  // Backward-compatible aliases for calculations (using year1 for now)
  const enableBreakfast = revenueCenters.year1.breakfast;
  const enableLunch = revenueCenters.year1.lunch;
  const enableDinner = revenueCenters.year1.dinner;
  const enableLateNight = revenueCenters.year1.lateNight;
  const enablePrivateEvents = revenueCenters.year1.privateEvents;
  const enableToGo = revenueCenters.year1.toGo;
  const enableRoomService = revenueCenters.year1.roomService;
  
  // Revenue Center Mix (% of total restaurant revenue)
  const [breakfastRevenuePercent, setBreakfastRevenuePercent] = useState(10);
  const [lunchRevenuePercent, setLunchRevenuePercent] = useState(35);
  const [dinnerRevenuePercent, setDinnerRevenuePercent] = useState(55);
  const [lateNightRevenuePercent, setLateNightRevenuePercent] = useState(5);
  const [privateEventsRevenuePercent, setPrivateEventsRevenuePercent] = useState(8);
  const [toGoRevenuePercent, setToGoRevenuePercent] = useState(15);
  const [roomServiceRevenuePercent, setRoomServiceRevenuePercent] = useState(10);
  
  // Food/Beverage Split for each revenue center
  const [breakfastFoodPercent, setBreakfastFoodPercent] = useState(80);
  const [lunchFoodPercent, setLunchFoodPercent] = useState(65);
  const [dinnerFoodPercent, setDinnerFoodPercent] = useState(65);
  const [lateNightFoodPercent, setLateNightFoodPercent] = useState(30);
  const [privateEventsFoodPercent, setPrivateEventsFoodPercent] = useState(70);
  const [toGoFoodPercent, setToGoFoodPercent] = useState(80);
  const [roomServiceFoodPercent, setRoomServiceFoodPercent] = useState(75);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    cogs: false,
    labor: false,
    operating: false,
    rent: false
  });
  
  // Club forecast expandable sections
  const [clubExpandedSections, setClubExpandedSections] = useState({
    revenue: true,
    cogs: false,
    labor: false,
    operating: false
  });

  // Restaurant Revenue Parameters
  const [avgLunchCheck, setAvgLunchCheck] = useState(32);
  const [avgDinnerCheck, setAvgDinnerCheck] = useState(58);
  const [lunchCoversPerDay, setLunchCoversPerDay] = useState(85);
  const [dinnerCoversPerDay, setDinnerCoversPerDay] = useState(120);
  const [operatingDays, setOperatingDays] = useState(360);

  // Cost Structure
  const [foodSalesMixPercent, setFoodSalesMixPercent] = useState(65); // Food is 65% of sales
  const [beverageSalesMixPercent, setBeverageSalesMixPercent] = useState(35); // Beverage is 35% of sales
  const [foodCostPercent, setFoodCostPercent] = useState(28);
  const [beverageCostPercent, setBeverageCostPercent] = useState(22);
  const [laborBurdenPercent, setLaborBurdenPercent] = useState(2.6);
  const [annualGrowthRate, setAnnualGrowthRate] = useState(3);
  
  // Year-over-year growth rates (Restaurant)
  const [year1OperatingMonths, setYear1OperatingMonths] = useState(12); // 1-12 months for partial first year
  const [year2GrowthRate, setYear2GrowthRate] = useState(3);
  const [year3GrowthRate, setYear3GrowthRate] = useState(3);
  const [year4GrowthRate, setYear4GrowthRate] = useState(3);
  const [year5GrowthRate, setYear5GrowthRate] = useState(3);
  
  // Per-Year Customizable Assumptions (for Planning tab)
  const [perYearAssumptions, setPerYearAssumptions] = useState({
    year2: { customized: false, lunchPercent: null, dinnerPercent: null, laborPercent: null, foodCostPercent: null, bevCostPercent: null },
    year3: { customized: false, lunchPercent: null, dinnerPercent: null, laborPercent: null, foodCostPercent: null, bevCostPercent: null },
    year4: { customized: false, lunchPercent: null, dinnerPercent: null, laborPercent: null, foodCostPercent: null, bevCostPercent: null },
    year5: { customized: false, lunchPercent: null, dinnerPercent: null, laborPercent: null, foodCostPercent: null, bevCostPercent: null }
  });
  
  // Club year-over-year growth rates
  const [clubYear1OperatingMonths, setClubYear1OperatingMonths] = useState(12);
  const [clubYear2GrowthRate, setClubYear2GrowthRate] = useState(3);
  const [clubYear3GrowthRate, setClubYear3GrowthRate] = useState(3);
  const [clubYear4GrowthRate, setClubYear4GrowthRate] = useState(3);
  const [clubYear5GrowthRate, setClubYear5GrowthRate] = useState(3);

  // Labor Percentages
  const [fohLaborPercent, setFohLaborPercent] = useState(12);
  const [bohLaborPercent, setBohLaborPercent] = useState(15);
  const [managementPercent, setManagementPercent] = useState(5);

  // Operating Expenses
  const [baseRentAnnual, setBaseRentAnnual] = useState(120000);
  const [advertisingPercent, setAdvertisingPercent] = useState(1.5);
  const [suppliesPercent, setSuppliesPercent] = useState(2);
  const [rmPercent, setRmPercent] = useState(1);
  const [utilitiesPercent, setUtilitiesPercent] = useState(3);
  const [insurancePercent, setInsurancePercent] = useState(1.2);
  const [creditCardPercent, setCreditCardPercent] = useState(2);
  const [wasteManagementPercent, setWasteManagementPercent] = useState(0.3);
  const [telephonePercent, setTelephonePercent] = useState(0.2);
  const [licensesPercent, setLicensesPercent] = useState(0.5);

  // Club Operations Parameters - Per Year Configuration
  const [clubParams, setClubParams] = useState({
    year1: {
      // Revenue Mix
      beerPercent: 15,
      winePercent: 20,
      liquorPercent: 40,
      bottleServicePercent: 20,
      foodPercent: 5,
      // COGS
      beerCostPercent: 25,
      wineCostPercent: 30,
      liquorCostPercent: 22,
      bottleCostPercent: 18,
      foodCostPercent: 30,
      // Labor
      bartendersPercent: 3,
      serversPercent: 2.5,
      bussersPercent: 1,
      coatCheckPercent: 0.5,
      securityPercent: 2,
      djPercent: 1.5,
      // Operating Expenses
      utilitiesPercent: 4.0,
      insurancePercent: 1.6,
      creditCardPercent: 2.7,
      advertisingPercent: 2.0,
      suppliesPercent: 2.7,
      rmPercent: 1.0,
      wasteManagementPercent: 0.3,
      telephonePercent: 0.2,
      licensesPercent: 0.5
    },
    year2: {
      beerPercent: 15, winePercent: 20, liquorPercent: 40, bottleServicePercent: 20, foodPercent: 5,
      beerCostPercent: 25, wineCostPercent: 30, liquorCostPercent: 22, bottleCostPercent: 18, foodCostPercent: 30,
      bartendersPercent: 3, serversPercent: 2.5, bussersPercent: 1, coatCheckPercent: 0.5, securityPercent: 2, djPercent: 1.5,
      utilitiesPercent: 4.0, insurancePercent: 1.6, creditCardPercent: 2.7, advertisingPercent: 2.0, suppliesPercent: 2.7, rmPercent: 1.0, wasteManagementPercent: 0.3, telephonePercent: 0.2, licensesPercent: 0.5
    },
    year3: {
      beerPercent: 15, winePercent: 20, liquorPercent: 40, bottleServicePercent: 20, foodPercent: 5,
      beerCostPercent: 25, wineCostPercent: 30, liquorCostPercent: 22, bottleCostPercent: 18, foodCostPercent: 30,
      bartendersPercent: 3, serversPercent: 2.5, bussersPercent: 1, coatCheckPercent: 0.5, securityPercent: 2, djPercent: 1.5,
      utilitiesPercent: 4.0, insurancePercent: 1.6, creditCardPercent: 2.7, advertisingPercent: 2.0, suppliesPercent: 2.7, rmPercent: 1.0, wasteManagementPercent: 0.3, telephonePercent: 0.2, licensesPercent: 0.5
    },
    year4: {
      beerPercent: 15, winePercent: 20, liquorPercent: 40, bottleServicePercent: 20, foodPercent: 5,
      beerCostPercent: 25, wineCostPercent: 30, liquorCostPercent: 22, bottleCostPercent: 18, foodCostPercent: 30,
      bartendersPercent: 3, serversPercent: 2.5, bussersPercent: 1, coatCheckPercent: 0.5, securityPercent: 2, djPercent: 1.5,
      utilitiesPercent: 4.0, insurancePercent: 1.6, creditCardPercent: 2.7, advertisingPercent: 2.0, suppliesPercent: 2.7, rmPercent: 1.0, wasteManagementPercent: 0.3, telephonePercent: 0.2, licensesPercent: 0.5
    },
    year5: {
      beerPercent: 15, winePercent: 20, liquorPercent: 40, bottleServicePercent: 20, foodPercent: 5,
      beerCostPercent: 25, wineCostPercent: 30, liquorCostPercent: 22, bottleCostPercent: 18, foodCostPercent: 30,
      bartendersPercent: 3, serversPercent: 2.5, bussersPercent: 1, coatCheckPercent: 0.5, securityPercent: 2, djPercent: 1.5,
      utilitiesPercent: 4.0, insurancePercent: 1.6, creditCardPercent: 2.7, advertisingPercent: 2.0, suppliesPercent: 2.7, rmPercent: 1.0, wasteManagementPercent: 0.3, telephonePercent: 0.2, licensesPercent: 0.5
    }
  });

  // Helper function to get current year's club params
  const getCurrentYearClubParams = () => {
    if (editingMode === 'global') return clubParams.year1;
    return clubParams[selectedForecastYear] || clubParams.year1;
  };

  // Helper function to update club param for current year
  const updateClubParam = (paramName, value) => {
    if (editingMode === 'global') {
      // Update all years
      setClubParams(prev => ({
        year1: { ...prev.year1, [paramName]: value },
        year2: { ...prev.year2, [paramName]: value },
        year3: { ...prev.year3, [paramName]: value },
        year4: { ...prev.year4, [paramName]: value },
        year5: { ...prev.year5, [paramName]: value }
      }));
    } else {
      // Update only selected year
      const year = selectedForecastYear || 'year1';
      setClubParams(prev => ({
        ...prev,
        [year]: { ...prev[year], [paramName]: value }
      }));
    }
  };

  // Backward compatibility aliases (use year1 values for calculations)
  const currentClubParams = getCurrentYearClubParams();
  const clubBeerPercent = currentClubParams.beerPercent;
  const clubWinePercent = currentClubParams.winePercent;
  const clubLiquorPercent = currentClubParams.liquorPercent;
  const clubBottleServicePercent = currentClubParams.bottleServicePercent;
  const clubFoodPercent = currentClubParams.foodPercent;
  const clubBeerCostPercent = currentClubParams.beerCostPercent;
  const clubWineCostPercent = currentClubParams.wineCostPercent;
  const clubLiquorCostPercent = currentClubParams.liquorCostPercent;
  const clubBottleCostPercent = currentClubParams.bottleCostPercent;
  const clubFoodCostPercent = currentClubParams.foodCostPercent;
  const clubBartendersPercent = currentClubParams.bartendersPercent;
  const clubServersPercent = currentClubParams.serversPercent;
  const clubBussersPercent = currentClubParams.bussersPercent;
  const clubCoatCheckPercent = currentClubParams.coatCheckPercent;
  const clubSecurityPercent = currentClubParams.securityPercent;
  const clubDJPercent = currentClubParams.djPercent;
  const clubUtilitiesPercent = currentClubParams.utilitiesPercent;
  const clubInsurancePercent = currentClubParams.insurancePercent;
  const clubCreditCardPercent = currentClubParams.creditCardPercent;
  const clubAdvertisingPercent = currentClubParams.advertisingPercent;
  const clubSuppliesPercent = currentClubParams.suppliesPercent;
  const clubRmPercent = currentClubParams.rmPercent;
  const clubWasteManagementPercent = currentClubParams.wasteManagementPercent;
  const clubTelephonePercent = currentClubParams.telephonePercent;
  const clubLicensesPercent = currentClubParams.licensesPercent;

  // Calculate Restaurant Revenue
  const lunchRevenue = lunchCoversPerDay * avgLunchCheck * operatingDays;
  const dinnerRevenue = dinnerCoversPerDay * avgDinnerCheck * operatingDays;
  const baseRevenue = lunchRevenue + dinnerRevenue;
  
  // Calculate revenue center percentages (normalize to 100%)
  const activeCenters = [
    { enabled: enableBreakfast, percent: breakfastRevenuePercent },
    { enabled: enableLunch, percent: lunchRevenuePercent },
    { enabled: enableDinner, percent: dinnerRevenuePercent },
    { enabled: enableLateNight, percent: lateNightRevenuePercent },
    { enabled: enablePrivateEvents, percent: privateEventsRevenuePercent },
    { enabled: enableToGo, percent: toGoRevenuePercent },
    { enabled: enableRoomService, percent: roomServiceRevenuePercent }
  ];
  const totalActivePercent = activeCenters.reduce((sum, center) => sum + (center.enabled ? center.percent : 0), 0);
  
  // Calculate revenue by center (using base revenue as 100%)
  const breakfastRevenue = enableBreakfast ? baseRevenue * (breakfastRevenuePercent / totalActivePercent) : 0;
  const lunchRevenueAdjusted = enableLunch ? baseRevenue * (lunchRevenuePercent / totalActivePercent) : 0;
  const dinnerRevenueAdjusted = enableDinner ? baseRevenue * (dinnerRevenuePercent / totalActivePercent) : 0;
  const lateNightRevenue = enableLateNight ? baseRevenue * (lateNightRevenuePercent / totalActivePercent) : 0;
  const privateEventsRevenue = enablePrivateEvents ? baseRevenue * (privateEventsRevenuePercent / totalActivePercent) : 0;
  const toGoRevenue = enableToGo ? baseRevenue * (toGoRevenuePercent / totalActivePercent) : 0;
  const roomServiceRevenue = enableRoomService ? baseRevenue * (roomServiceRevenuePercent / totalActivePercent) : 0;
  
  const restaurantRevenue = breakfastRevenue + lunchRevenueAdjusted + dinnerRevenueAdjusted + lateNightRevenue + privateEventsRevenue + toGoRevenue + roomServiceRevenue;
  
  // Calculate food/beverage split by revenue center
  const breakfastFoodSales = breakfastRevenue * (breakfastFoodPercent / 100);
  const breakfastBevSales = breakfastRevenue * ((100 - breakfastFoodPercent) / 100);
  const lunchFoodSales = lunchRevenueAdjusted * (lunchFoodPercent / 100);
  const lunchBevSales = lunchRevenueAdjusted * ((100 - lunchFoodPercent) / 100);
  const dinnerFoodSales = dinnerRevenueAdjusted * (dinnerFoodPercent / 100);
  const dinnerBevSales = dinnerRevenueAdjusted * ((100 - dinnerFoodPercent) / 100);
  const lateNightFoodSales = lateNightRevenue * (lateNightFoodPercent / 100);
  const lateNightBevSales = lateNightRevenue * ((100 - lateNightFoodPercent) / 100);
  const privateEventsFoodSales = privateEventsRevenue * (privateEventsFoodPercent / 100);
  const privateEventsBevSales = privateEventsRevenue * ((100 - privateEventsFoodPercent) / 100);
  
  const toGoFoodSales = toGoRevenue * (toGoFoodPercent / 100);
  const toGoBevSales = toGoRevenue * ((100 - toGoFoodPercent) / 100);
  const roomServiceFoodSales = roomServiceRevenue * (roomServiceFoodPercent / 100);
  const roomServiceBevSales = roomServiceRevenue * ((100 - roomServiceFoodPercent) / 100);
  
  // Total food and beverage sales
  const totalFoodSales = breakfastFoodSales + lunchFoodSales + dinnerFoodSales + lateNightFoodSales + privateEventsFoodSales + toGoFoodSales + roomServiceFoodSales;
  const totalBevSales = breakfastBevSales + lunchBevSales + dinnerBevSales + lateNightBevSales + privateEventsBevSales + toGoBevSales + roomServiceBevSales;

  // Calculate Club Revenue (33% of restaurant revenue when enabled)
  const clubRevenue = enableClubOperations ? restaurantRevenue * 0.33 : 0;
  const totalRevenue = restaurantRevenue + clubRevenue;

  // Club Revenue Breakdown
  const clubBeerSales = clubRevenue * (clubBeerPercent / 100);
  const clubWineSales = clubRevenue * (clubWinePercent / 100);
  const clubLiquorSales = clubRevenue * (clubLiquorPercent / 100);
  const clubBottleServiceSales = clubRevenue * (clubBottleServicePercent / 100);
  const clubFoodSales = clubRevenue * (clubFoodPercent / 100);

  // Club COGS
  const clubBeerCost = clubBeerSales * (clubBeerCostPercent / 100);
  const clubWineCost = clubWineSales * (clubWineCostPercent / 100);
  const clubLiquorCost = clubLiquorSales * (clubLiquorCostPercent / 100);
  const clubBottleCost = clubBottleServiceSales * (clubBottleCostPercent / 100);
  const clubFoodCost = clubFoodSales * (clubFoodCostPercent / 100);
  const clubTotalCOGS = clubBeerCost + clubWineCost + clubLiquorCost + clubBottleCost + clubFoodCost;

  // Club Labor
  const clubBartenders = clubRevenue * (clubBartendersPercent / 100);
  const clubServers = clubRevenue * (clubServersPercent / 100);
  const clubBussers = clubRevenue * (clubBussersPercent / 100);
  const clubCoatCheck = clubRevenue * (clubCoatCheckPercent / 100);
  const clubSecurity = clubRevenue * (clubSecurityPercent / 100);
  const clubDJ = clubRevenue * (clubDJPercent / 100);
  const clubBaseLabor = clubBartenders + clubServers + clubBussers + clubCoatCheck + clubSecurity + clubDJ;
  const clubLaborBurden = clubBaseLabor * (laborBurdenPercent / 100);
  const clubTotalLabor = clubBaseLabor + clubLaborBurden;
  
  // Club Operating Expenses (calculated separately from restaurant)
  const clubUtilities = clubRevenue * (clubUtilitiesPercent / 100);
  const clubInsurance = clubRevenue * (clubInsurancePercent / 100);
  const clubCreditCardFees = clubRevenue * (clubCreditCardPercent / 100);
  const clubAdvertising = clubRevenue * (clubAdvertisingPercent / 100);
  const clubSupplies = clubRevenue * (clubSuppliesPercent / 100);
  const clubRm = clubRevenue * (clubRmPercent / 100);
  const clubWasteManagement = clubRevenue * (clubWasteManagementPercent / 100);
  const clubTelephone = clubRevenue * (clubTelephonePercent / 100);
  const clubLicenses = clubRevenue * (clubLicensesPercent / 100);

  // Restaurant COGS
  const restaurantFoodSales = restaurantRevenue * (foodSalesMixPercent / 100);
  const restaurantBeverageSales = restaurantRevenue * (beverageSalesMixPercent / 100);
  const restaurantFoodCost = restaurantFoodSales * (foodCostPercent / 100);
  const restaurantBeverageCost = restaurantBeverageSales * (beverageCostPercent / 100);
  const restaurantCOGS = restaurantFoodCost + restaurantBeverageCost;

  // Restaurant Labor
  const restaurantFOHLabor = restaurantRevenue * (fohLaborPercent / 100);
  const restaurantBOHLabor = restaurantRevenue * (bohLaborPercent / 100);
  const restaurantManagement = restaurantRevenue * (managementPercent / 100);
  const restaurantBaseLabor = restaurantFOHLabor + restaurantBOHLabor + restaurantManagement;
  const restaurantLaborBurden = restaurantBaseLabor * (laborBurdenPercent / 100);
  const restaurantTotalLabor = restaurantBaseLabor + restaurantLaborBurden;

  // Operating Expenses
  const totalRent = baseRentAnnual;
  const clubRentExpense = enableClubOperations ? (totalRent * (clubRentAllocationPercent / 100)) : 0;
  const restaurantRentExpense = totalRent - clubRentExpense;
  const rentExpense = totalRent; // For combined view
  
  // Total Club Operating Expenses
  const clubTotalOperatingExpenses = enableClubOperations ? (
    clubRentExpense + clubUtilities + clubInsurance + clubCreditCardFees + 
    clubAdvertising + clubSupplies + clubRm + clubWasteManagement + 
    clubTelephone + clubLicenses
  ) : 0;
  const advertisingExpense = totalRevenue * (advertisingPercent / 100);
  const suppliesExpense = totalRevenue * (suppliesPercent / 100);
  const rmExpense = totalRevenue * (rmPercent / 100);
  const utilitiesExpense = totalRevenue * (utilitiesPercent / 100);
  const insuranceExpense = totalRevenue * (insurancePercent / 100);
  const creditCardExpense = totalRevenue * (creditCardPercent / 100);
  const wasteExpense = totalRevenue * (wasteManagementPercent / 100);
  const telephoneExpense = totalRevenue * (telephonePercent / 100);
  const licensesExpense = totalRevenue * (licensesPercent / 100);

  const restaurantOperatingExpenses = restaurantRentExpense + advertisingExpense + suppliesExpense + rmExpense + 
    utilitiesExpense + insuranceExpense + creditCardExpense + wasteExpense + telephoneExpense + licensesExpense;
  
  const clubOperatingExpenses = clubRentExpense; // Club only has rent for now
  
  const totalOperatingExpenses = rentExpense + advertisingExpense + suppliesExpense + rmExpense + 
    utilitiesExpense + insuranceExpense + creditCardExpense + wasteExpense + telephoneExpense + licensesExpense;

  // Combined Totals
  const combinedCOGS = restaurantCOGS + clubTotalCOGS;
  const combinedLabor = restaurantTotalLabor + clubTotalLabor;
  const combinedTotalCosts = combinedCOGS + combinedLabor + totalOperatingExpenses;
  const combinedProfit = totalRevenue - combinedTotalCosts;
  const combinedProfitMargin = (combinedProfit / totalRevenue) * 100;
  
  // Aliases for Budget Planning tab
  const totalCOGS = combinedCOGS;
  const totalLabor = combinedLabor;
  const netProfit = combinedProfit;

  // 5-Year Projections
  const calculateYearRevenue = (year) => totalRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1);
  const calculateYearCOGS = (year) => calculateYearRevenue(year) * (combinedCOGS / totalRevenue);
  const calculateYearLabor = (year) => calculateYearRevenue(year) * (combinedLabor / totalRevenue);
  const calculateYearOperating = (year) => {
    const yearRevenue = calculateYearRevenue(year);
    return rentExpense + (yearRevenue - totalRevenue) * ((totalOperatingExpenses - rentExpense) / totalRevenue) + 
      (totalOperatingExpenses - rentExpense);
  };

  // Formatting
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${Math.round(value)}`;
  };

  const formatPercent = (value) => `${value.toFixed(1)}%`;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper function to determine which years to show
  const getYearsToShow = () => {
    if (selectedForecastYear === 'all') return [1, 2, 3, 4, 5];
    if (selectedForecastYear === 'year1') return [1];
    if (selectedForecastYear === 'year2') return [2];
    if (selectedForecastYear === 'year3') return [3];
    if (selectedForecastYear === 'year4') return [4];
    if (selectedForecastYear === 'year5') return [5];
    return [1, 2, 3, 4, 5]; // fallback
  };
  
  // Tab Components
  const renderOverview = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 mb-6">
        <h2 className="text-3xl font-bold text-purple-900 mb-2">📊 5-Year Financial Forecast</h2>
        <p className="text-purple-700">See how your restaurant performs over time</p>
      </div>
      
      {/* Year Selection Tabs */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-slate-600 mr-2">View:</span>
          <button
            onClick={() => setSelectedForecastYear('year1')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'year1'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            Year 1: {year1CalendarYear}
            <div className="text-xs opacity-90 mt-0.5">{year1OperatingMonths} months</div>
          </button>
          <button
            onClick={() => setSelectedForecastYear('year2')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'year2'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            Year 2: {year2CalendarYear}
            <div className="text-xs opacity-90 mt-0.5">+{year2GrowthRate}%</div>
          </button>
          <button
            onClick={() => setSelectedForecastYear('year3')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'year3'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            Year 3: {year3CalendarYear}
            <div className="text-xs opacity-90 mt-0.5">+{year3GrowthRate}%</div>
          </button>
          <button
            onClick={() => setSelectedForecastYear('year4')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'year4'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            Year 4: {year4CalendarYear}
            <div className="text-xs opacity-90 mt-0.5">+{year4GrowthRate}%</div>
          </button>
          <button
            onClick={() => setSelectedForecastYear('year5')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'year5'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            Year 5: {year5CalendarYear}
            <div className="text-xs opacity-90 mt-0.5">+{year5GrowthRate}%</div>
          </button>
          <button
            onClick={() => setSelectedForecastYear('all')}
            className={`px-5 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
              selectedForecastYear === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100 shadow-sm'
            }`}
          >
            📊 5-Year View
          </button>
        </div>
        {selectedForecastYear !== 'all' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
            <p className="text-sm text-purple-800">
              <strong>💡 Tip:</strong> You're viewing {selectedForecastYear === 'year1' ? 'Year 1' : selectedForecastYear === 'year2' ? 'Year 2' : selectedForecastYear === 'year3' ? 'Year 3' : selectedForecastYear === 'year4' ? 'Year 4' : 'Year 5'} details. 
              Go to the Planning tab to adjust assumptions for this year.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className={selectedForecastYear === 'all' ? 'w-full' : 'w-auto mx-auto'}>
          <thead className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200">
            <tr>
              <th className="text-left p-3 font-semibold">Category</th>
              {getYearsToShow().map(year => (
                <th key={year} className="text-right p-3 bg-purple-100 border-2 border-purple-400">
                  <div className="font-semibold">
                    Year {year}: {year === 1 ? year1CalendarYear : year === 2 ? year2CalendarYear : year === 3 ? year3CalendarYear : year === 4 ? year4CalendarYear : year5CalendarYear}
                  </div>
                  <div className="text-xs text-slate-500">
                    {year === 1 ? `(${year1OperatingMonths} mo)` : year === 2 ? `(+${year2GrowthRate}%)` : year === 3 ? `(+${year3GrowthRate}%)` : year === 4 ? `(+${year4GrowthRate}%)` : `(+${year5GrowthRate}%)`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Revenue Section */}
            <tr className="border-b cursor-pointer hover:bg-blue-50" onClick={() => toggleSection('revenue')}>
              <td className="p-3 font-semibold text-blue-600">
                {expandedSections.revenue ? '▼' : '►'} REVENUE {formatCurrency(restaurantRevenue)} (100.0%)
              </td>
              {getYearsToShow().map(year => (
                <td key={year} className="text-right p-3 font-semibold">{formatCurrency(restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
              ))}
            </tr>
            {expandedSections.revenue && (
              <>
                {enableBreakfast && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🌅 Breakfast ({formatPercent((breakfastRevenue / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(breakfastRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enableLunch && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🍽️ Lunch ({formatPercent((lunchRevenueAdjusted / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(lunchRevenueAdjusted * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enableDinner && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🌙 Dinner ({formatPercent((dinnerRevenueAdjusted / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(dinnerRevenueAdjusted * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enableLateNight && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🌃 Late Night ({formatPercent((lateNightRevenue / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(lateNightRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enablePrivateEvents && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🎉 Private Events ({formatPercent((privateEventsRevenue / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(privateEventsRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enableToGo && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🥡 To-Go ({formatPercent((toGoRevenue / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(toGoRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                {enableRoomService && (
                  <tr className="bg-blue-100">
                    <td className="p-3 pl-8 text-sm">🏨 Room Service ({formatPercent((roomServiceRevenue / restaurantRevenue) * 100)})</td>
                    {getYearsToShow().map(year => (
                      <td key={year} className="text-right p-3 text-sm">{formatCurrency(roomServiceRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                    ))}
                  </tr>
                )}
                <tr className="bg-blue-50 border-t border-blue-200">
                  <td className="p-3 pl-8 text-sm font-semibold">Total Food Sales</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm font-semibold">{formatCurrency(totalFoodSales * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                  ))}
                </tr>
                <tr className="bg-blue-50">
                  <td className="p-3 pl-8 text-sm font-semibold">Total Beverage Sales</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm font-semibold">{formatCurrency(totalBevSales * Math.pow(1 + annualGrowthRate / 100, year - 1))}</td>
                  ))}
                </tr>
              </>
            )}

            {/* COGS Section */}
            <tr className="border-b cursor-pointer hover:bg-orange-50" onClick={() => toggleSection('cogs')}>
              <td className="p-3 font-semibold text-orange-600">
                {expandedSections.cogs ? '▼' : '►'} COST OF SALES {formatCurrency(restaurantCOGS)} ({formatPercent((restaurantCOGS / restaurantRevenue) * 100)})
              </td>
              {getYearsToShow().map(year => (
                <td key={year} className="text-right p-3 font-semibold">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantCOGS / restaurantRevenue))}</td>
              ))}
            </tr>
            {expandedSections.cogs && (
              <>
                <tr className="bg-orange-50">
                  <td className="p-3 pl-8">Food Cost ({formatPercent(foodCostPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantFoodCost / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-orange-50">
                  <td className="p-3 pl-8">Beverage Cost ({formatPercent(beverageCostPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantBeverageCost / restaurantRevenue))}</td>
                  ))}
                </tr>
              </>
            )}

            {/* Labor Section */}
            <tr className="border-b cursor-pointer hover:bg-purple-50" onClick={() => toggleSection('labor')}>
              <td className="p-3 font-semibold text-purple-600">
                {expandedSections.labor ? '▼' : '►'} PAYROLL {formatCurrency(restaurantTotalLabor)} ({formatPercent((restaurantTotalLabor / restaurantRevenue) * 100)})
              </td>
              {getYearsToShow().map(year => (
                <td key={year} className="text-right p-3 font-semibold">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantTotalLabor / restaurantRevenue))}</td>
              ))}
            </tr>
            {expandedSections.labor && (
              <>
                <tr className="bg-purple-100">
                  <td className="p-3 pl-8 text-sm">• FOH ({formatPercent(fohLaborPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantFOHLabor / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-purple-100">
                  <td className="p-3 pl-8 text-sm">• BOH ({formatPercent(bohLaborPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantBOHLabor / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-purple-100">
                  <td className="p-3 pl-8 text-sm">• Management ({formatPercent(managementPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantManagement / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-purple-100">
                  <td className="p-3 pl-8 text-sm">• Labor Burden ({formatPercent(laborBurdenPercent)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3 text-sm">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (restaurantLaborBurden / restaurantRevenue))}</td>
                  ))}
                </tr>
              </>
            )}

            {/* Operating Expenses Section */}
            <tr className="border-b cursor-pointer hover:bg-amber-50" onClick={() => toggleSection('operating')}>
              <td className="p-3 font-semibold text-amber-600">
                {expandedSections.operating ? '▼' : '►'} OPERATING EXPENSES {formatCurrency(totalOperatingExpenses)} ({formatPercent((totalOperatingExpenses / restaurantRevenue) * 100)})
              </td>
              {getYearsToShow().map(year => (
                <td key={year} className="text-right p-3 font-semibold">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (totalOperatingExpenses / restaurantRevenue))}</td>
              ))}
            </tr>
            {expandedSections.operating && (
              <>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Rent ({formatPercent((restaurantRentExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency(restaurantRentExpense)}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Utilities ({formatPercent((utilitiesExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (utilitiesExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Insurance ({formatPercent((insuranceExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (insuranceExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Credit Card Fees ({formatPercent((creditCardExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (creditCardExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Advertising ({formatPercent((advertisingExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (advertisingExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Supplies ({formatPercent((suppliesExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (suppliesExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">R&M ({formatPercent((rmExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (rmExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Waste ({formatPercent((wasteExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (wasteExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Telephone ({formatPercent((telephoneExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (telephoneExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
                <tr className="bg-amber-50">
                  <td className="p-3 pl-8">Licenses ({formatPercent((licensesExpense / restaurantRevenue) * 100)})</td>
                  {getYearsToShow().map(year => (
                    <td key={year} className="text-right p-3">{formatCurrency((restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1)) * (licensesExpense / restaurantRevenue))}</td>
                  ))}
                </tr>
              </>
            )}

            {/* Net Profit */}
            <tr className="border-t-2 bg-green-50">
              <td className="p-3 font-bold text-green-800">NET PROFIT</td>
              {getYearsToShow().map(year => {
                const yearRevenue = restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1);
                const yearCOGS = yearRevenue * (restaurantCOGS / restaurantRevenue);
                const yearLabor = yearRevenue * (restaurantTotalLabor / restaurantRevenue);
                const yearOperating = yearRevenue * (totalOperatingExpenses / restaurantRevenue);
                const yearProfit = yearRevenue - yearCOGS - yearLabor - yearOperating;
                return (
                  <td key={year} className="text-right p-3 font-bold text-green-600">{formatCurrency(yearProfit)}</td>
                );
              })}
            </tr>
            <tr className="bg-green-50">
              <td className="p-3 font-semibold text-green-700">Net Profit Margin</td>
              {getYearsToShow().map(year => {
                const yearRevenue = restaurantRevenue * Math.pow(1 + annualGrowthRate / 100, year - 1);
                const yearCOGS = yearRevenue * (restaurantCOGS / restaurantRevenue);
                const yearLabor = yearRevenue * (restaurantTotalLabor / restaurantRevenue);
                const yearOperating = yearRevenue * (totalOperatingExpenses / restaurantRevenue);
                const yearProfit = yearRevenue - yearCOGS - yearLabor - yearOperating;
                const margin = (yearProfit / yearRevenue) * 100;
                return (
                  <td key={year} className="text-right p-3 font-semibold text-green-600">{formatPercent(margin)}</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRevenueAnalysis = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">📈 Revenue Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lunch Service */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Lunch Service</h3>
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Average Check:</span> {formatCurrency(avgLunchCheck)}
            </div>
            <div>
              <span className="font-semibold">Covers/Day:</span> {lunchCoversPerDay}
            </div>
            <div>
              <span className="font-semibold">Annual Revenue:</span> {formatCurrency(lunchRevenue)}
            </div>
            <div>
              <span className="font-semibold">% of Total:</span> {formatPercent((lunchRevenue / restaurantRevenue) * 100)}
            </div>
          </div>
        </div>

        {/* Dinner Service */}
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-xl font-semibold text-orange-800 mb-4">Dinner Service</h3>
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Average Check:</span> {formatCurrency(avgDinnerCheck)}
            </div>
            <div>
              <span className="font-semibold">Covers/Day:</span> {dinnerCoversPerDay}
            </div>
            <div>
              <span className="font-semibold">Annual Revenue:</span> {formatCurrency(dinnerRevenue)}
            </div>
            <div>
              <span className="font-semibold">% of Total:</span> {formatPercent((dinnerRevenue / restaurantRevenue) * 100)}
            </div>
          </div>
        </div>
      </div>

      {enableClubOperations && (
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-xl font-semibold text-purple-800 mb-4">🎵 Club Operations Revenue Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-600">Beer Sales</div>
              <div className="font-semibold">{formatCurrency(clubBeerSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubBeerPercent)} of club</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Wine Sales</div>
              <div className="font-semibold">{formatCurrency(clubWineSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubWinePercent)} of club</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Liquor Sales</div>
              <div className="font-semibold">{formatCurrency(clubLiquorSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubLiquorPercent)} of club</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Bottle Service</div>
              <div className="font-semibold">{formatCurrency(clubBottleServiceSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubBottleServicePercent)} of club</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Food Sales</div>
              <div className="font-semibold">{formatCurrency(clubFoodSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubFoodPercent)} of club</div>
            </div>
            <div className="bg-purple-100 p-2 rounded">
              <div className="text-sm text-slate-600">Total Club</div>
              <div className="font-bold text-lg">{formatCurrency(clubRevenue)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLaborAnalysis = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">👥 Labor Analysis</h2>
      
      {/* Restaurant Labor - Single Column */}
      <div className="bg-white rounded-lg p-6 border max-w-2xl">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🍽️ Restaurant Labor</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>FOH Labor ({formatPercent(fohLaborPercent)}):</span>
            <span className="font-medium">{formatCurrency(restaurantFOHLabor)}</span>
          </div>
          <div className="flex justify-between">
            <span>BOH Labor ({formatPercent(bohLaborPercent)}):</span>
            <span className="font-medium">{formatCurrency(restaurantBOHLabor)}</span>
          </div>
          <div className="flex justify-between">
            <span>Management ({formatPercent(managementPercent)}):</span>
            <span className="font-medium">{formatCurrency(restaurantManagement)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span>Base Labor:</span>
            <span className="font-medium">{formatCurrency(restaurantBaseLabor)}</span>
          </div>
          <div className="flex justify-between">
            <span>Labor Burden ({formatPercent(laborBurdenPercent)}):</span>
            <span className="font-medium">{formatCurrency(restaurantLaborBurden)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total Restaurant Labor:</span>
            <span>{formatCurrency(restaurantTotalLabor)}</span>
          </div>
          <div className="text-center text-purple-600 font-semibold mt-2">
            {formatPercent((restaurantTotalLabor / restaurantRevenue) * 100)} of restaurant sales
          </div>
        </div>
      </div>
    </div>
  );

  // Budget Planning Tab
  const [selectedPlanningYear, setSelectedPlanningYear] = React.useState(2);
  const [planningEntityTab, setPlanningEntityTab] = React.useState('restaurant'); // 'restaurant' or 'club'
  
  const renderBudgetPlanning = () => {
    // Mock actuals data (will be replaced with real data from FVA later)
    const mockActuals = {
      revenue: totalRevenue * 1.05, // 5% above forecast
      cogs: totalCOGS * 1.02, // 2% above forecast
      labor: totalLabor * 1.03, // 3% above forecast
      opex: totalOperatingExpenses * 0.98, // 2% below forecast
    };
    
    const mockNetProfit = mockActuals.revenue - mockActuals.cogs - mockActuals.labor - mockActuals.opex;
    
    // Calculate variances
    const revenueVariance = ((mockActuals.revenue - totalRevenue) / totalRevenue) * 100;
    const cogsVariance = ((mockActuals.cogs - totalCOGS) / totalCOGS) * 100;
    const laborVariance = ((mockActuals.labor - totalLabor) / totalLabor) * 100;
    const opexVariance = ((mockActuals.opex - totalOperatingExpenses) / totalOperatingExpenses) * 100;
    const profitVariance = ((mockNetProfit - netProfit) / netProfit) * 100;
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-green-900 mb-2">📅 Budget Planning</h2>
          <p className="text-green-700">Compare actuals vs. forecast and plan for next year</p>
        </div>
        
        {/* Entity Tabs: Restaurant vs Club */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setPlanningEntityTab('restaurant')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              planningEntityTab === 'restaurant'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            🍽️ Restaurant Planning
          </button>
          {enableClubOperations && (
            <button
              onClick={() => setPlanningEntityTab('club')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                planningEntityTab === 'club'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              🎵 Club Planning
            </button>
          )}
        </div>
        
        {/* Restaurant Planning Content */}
        {planningEntityTab === 'restaurant' && (
          <>
        {/* Variance Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">📊 Current Year Performance (Forecast vs. Actual)</h3>
          <p className="text-sm text-slate-600 mb-6">Year-to-date comparison showing how you're tracking against your original forecast</p>
          
          <div className="space-y-4">
            {/* Revenue Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Revenue</div>
                <div className="text-sm text-slate-600">Forecast: {formatCurrency(totalRevenue)} | Actual: {formatCurrency(mockActuals.revenue)}</div>
              </div>
              <div className={`text-lg font-bold ${revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueVariance >= 0 ? '+' : ''}{revenueVariance.toFixed(1)}%
              </div>
            </div>
            
            {/* COGS Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Cost of Sales</div>
                <div className="text-sm text-slate-600">Forecast: {formatCurrency(totalCOGS)} | Actual: {formatCurrency(mockActuals.cogs)}</div>
              </div>
              <div className={`text-lg font-bold ${cogsVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cogsVariance >= 0 ? '+' : ''}{cogsVariance.toFixed(1)}%
              </div>
            </div>
            
            {/* Labor Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Payroll</div>
                <div className="text-sm text-slate-600">Forecast: {formatCurrency(totalLabor)} | Actual: {formatCurrency(mockActuals.labor)}</div>
              </div>
              <div className={`text-lg font-bold ${laborVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {laborVariance >= 0 ? '+' : ''}{laborVariance.toFixed(1)}%
              </div>
            </div>
            
            {/* OpEx Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Operating Expenses</div>
                <div className="text-sm text-slate-600">Forecast: {formatCurrency(totalOperatingExpenses)} | Actual: {formatCurrency(mockActuals.opex)}</div>
              </div>
              <div className={`text-lg font-bold ${opexVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {opexVariance >= 0 ? '+' : ''}{opexVariance.toFixed(1)}%
              </div>
            </div>
            
            {/* Net Profit Variance */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
              <div>
                <div className="font-bold text-slate-800 text-lg">Net Profit</div>
                <div className="text-sm text-slate-600">Forecast: {formatCurrency(netProfit)} | Actual: {formatCurrency(mockNetProfit)}</div>
              </div>
              <div className={`text-2xl font-bold ${profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitVariance >= 0 ? '+' : ''}{profitVariance.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Smart Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-4">💡 Smart Recommendations</h3>
          <div className="space-y-3">
            {revenueVariance > 3 && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">🚀</div>
                <div>
                  <div className="font-semibold text-blue-900">Strong Revenue Performance</div>
                  <div className="text-sm text-blue-700">You're tracking {revenueVariance.toFixed(1)}% above forecast. Consider increasing Year 2 growth rate from {year2GrowthRate}% to {Math.min(year2GrowthRate + 2, 10)}% to reflect this momentum.</div>
                </div>
              </div>
            )}
            {laborVariance > 2 && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-semibold text-orange-900">Labor Costs Above Budget</div>
                  <div className="text-sm text-orange-700">Payroll is running {laborVariance.toFixed(1)}% over forecast. Review staffing levels or adjust labor % assumptions for next year.</div>
                </div>
              </div>
            )}
            {opexVariance < -2 && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-semibold text-green-900">Operating Expenses Under Control</div>
                  <div className="text-sm text-green-700">OpEx is {Math.abs(opexVariance).toFixed(1)}% below forecast. Great cost management!</div>
                </div>
              </div>
            )}
            {profitVariance > 5 && (
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-semibold text-blue-900">Exceeding Profit Targets</div>
                  <div className="text-sm text-blue-700">Net profit is {profitVariance.toFixed(1)}% above forecast. This is a strong signal for investors and lenders.</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Year-by-Year Budget Adjustments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">📈 Year-by-Year Budget Adjustments</h3>
          <p className="text-sm text-slate-600 mb-6">Customize assumptions for each year to build a realistic forecast</p>
          
          {/* Year Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {[2, 3, 4, 5].map(year => (
              <button
                key={year}
                onClick={() => setSelectedPlanningYear(year)}
                className={`px-6 py-3 font-semibold transition-all ${
                  selectedPlanningYear === year
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Year {year}
              </button>
            ))}
          </div>
          
          {/* Year 2 Adjustments */}
          {selectedPlanningYear === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Revenue Growth Rate</div>
                  <div className="text-sm text-slate-600 mb-3">Current: {year2GrowthRate}%</div>
                  <div className="text-sm text-blue-600 font-medium">
                    💡 Suggested: {revenueVariance > 3 ? Math.min(year2GrowthRate + 2, 10) : year2GrowthRate}% 
                    {revenueVariance > 3 && '(+2% based on strong performance)'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Total Labor %</div>
                  <div className="text-sm text-slate-600 mb-3">Current: {(fohLaborPercent + bohLaborPercent + managementPercent).toFixed(1)}%</div>
                  <div className="text-sm text-blue-600 font-medium">
                    💡 Suggested: {laborVariance > 2 ? (fohLaborPercent + bohLaborPercent + managementPercent + 1).toFixed(1) : (fohLaborPercent + bohLaborPercent + managementPercent).toFixed(1)}%
                    {laborVariance > 2 && '(+1% to account for higher labor costs)'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Food Cost %</div>
                  <div className="text-sm text-slate-600 mb-3">Baseline: {foodCostPercent.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Adjust in Settings if needed for Year 2</div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Lunch/Dinner Mix</div>
                  <div className="text-sm text-slate-600 mb-3">Lunch: {lunchRevenuePercent.toFixed(1)}% | Dinner: {dinnerRevenuePercent.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Adjust in Settings if mix changes in Year 2</div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="text-sm text-slate-700">
                  <strong>📝 Note:</strong> Year 2 starts with Year 1 assumptions. To customize Year 2 specifically, adjust the growth rate and percentages in Settings → Volume & Pricing. Future updates will allow per-year customization directly here.
                </div>
              </div>
            </div>
          )}
          
          {/* Year 3 Adjustments */}
          {selectedPlanningYear === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Revenue Growth Rate</div>
                  <div className="text-sm text-slate-600 mb-3">Current: {year3GrowthRate}%</div>
                  <div className="text-xs text-slate-500">Compounds from Year 2 results</div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Total Labor %</div>
                  <div className="text-sm text-slate-600 mb-3">Baseline: {(fohLaborPercent + bohLaborPercent + managementPercent).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Based on Year 1 assumptions</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-700">
                  💡 <strong>Planning Tip:</strong> Year 3 typically sees operational efficiencies. Consider if labor % can decrease as you optimize staffing.
                </div>
              </div>
            </div>
          )}
          
          {/* Year 4 Adjustments */}
          {selectedPlanningYear === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Revenue Growth Rate</div>
                  <div className="text-sm text-slate-600 mb-3">Current: {year4GrowthRate}%</div>
                  <div className="text-xs text-slate-500">Compounds from Year 3 results</div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Total Labor %</div>
                  <div className="text-sm text-slate-600 mb-3">Baseline: {(fohLaborPercent + bohLaborPercent + managementPercent).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Based on Year 1 assumptions</div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-sm text-green-700">
                  🎯 <strong>Maturity Phase:</strong> Year 4 often shows stable operations. Growth may moderate as you reach market saturation.
                </div>
              </div>
            </div>
          )}
          
          {/* Year 5 Adjustments */}
          {selectedPlanningYear === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Revenue Growth Rate</div>
                  <div className="text-sm text-slate-600 mb-3">Current: {year5GrowthRate}%</div>
                  <div className="text-xs text-slate-500">Compounds from Year 4 results</div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2">Total Labor %</div>
                  <div className="text-sm text-slate-600 mb-3">Baseline: {(fohLaborPercent + bohLaborPercent + managementPercent).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Based on Year 1 assumptions</div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-sm text-purple-700">
                  🏆 <strong>Long-term View:</strong> Year 5 projections help with exit planning or expansion decisions. Consider market conditions and competition.
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}
        
        {/* Club Planning Content */}
        {planningEntityTab === 'club' && enableClubOperations && (
          <>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">🎵 Club Performance (Forecast vs. Actual)</h3>
          <p className="text-sm text-slate-600 mb-6">Year-to-date comparison for club operations</p>
          
          <div className="space-y-4">
            {/* Club Revenue Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Club Revenue</div>
                <div className="text-sm text-slate-600">Forecast: $1.15M | Actual: $1.24M</div>
              </div>
              <div className="text-lg font-bold text-green-600">
                +8.0%
              </div>
            </div>
            
            {/* Club COGS Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Club Cost of Sales</div>
                <div className="text-sm text-slate-600">Forecast: $272K | Actual: $280K</div>
              </div>
              <div className="text-lg font-bold text-red-600">
                +3.0%
              </div>
            </div>
            
            {/* Club Labor Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Club Labor</div>
                <div className="text-sm text-slate-600">Forecast: $124K | Actual: $127K</div>
              </div>
              <div className="text-lg font-bold text-red-600">
                +2.0%
              </div>
            </div>
            
            {/* Club Operating Expenses Variance */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-semibold text-slate-800">Club Operating Expenses</div>
                <div className="text-sm text-slate-600">Forecast: $196K | Actual: $190K</div>
              </div>
              <div className="text-lg font-bold text-green-600">
                -3.0%
              </div>
            </div>
            
            {/* Club Net Profit */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div>
                <div className="font-semibold text-green-900">Net Profit</div>
                <div className="text-sm text-green-700">Forecast: $558K | Actual: $642K</div>
              </div>
              <div className="text-lg font-bold text-green-600">
                +15.0%
              </div>
            </div>
          </div>
        </div>
        
        {/* Club Smart Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">💡 Smart Recommendations</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl">🚀</div>
              <div>
                <div className="font-semibold text-green-900">Strong Club Performance</div>
                <div className="text-sm text-green-700">Club revenue is 8% above forecast. Consider expanding bottle service or premium offerings for Year 2.</div>
              </div>
            </div>
            
            <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl">🍸</div>
              <div>
                <div className="font-semibold text-blue-900">Optimize Beverage Mix</div>
                <div className="text-sm text-blue-700">Review beer/wine/liquor mix percentages in Settings to maximize margins based on actual sales data.</div>
              </div>
            </div>
            
            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-2xl">👥</div>
              <div>
                <div className="font-semibold text-purple-900">Labor Efficiency</div>
                <div className="text-sm text-purple-700">Club labor is tracking well. Maintain current staffing levels for optimal service.</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Club Year-by-Year Adjustments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">📈 Club Year-by-Year Adjustments</h3>
          <p className="text-sm text-slate-600 mb-6">Customize club assumptions for each year</p>
          
          {/* Year Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {[2, 3, 4, 5].map(year => (
              <button
                key={year}
                onClick={() => setSelectedPlanningYear(year)}
                className={`px-6 py-3 font-semibold transition-all ${
                  selectedPlanningYear === year
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Year {year}
              </button>
            ))}
          </div>
          
          {/* Year-specific content */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-semibold text-slate-800 mb-2">Club Revenue Growth</div>
                <div className="text-sm text-slate-600 mb-3">Current: 3%</div>
                <div className="text-sm text-blue-600 font-medium">
                  💡 Suggested: 5% (based on strong Year 1 performance)
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-semibold text-slate-800 mb-2">Beer/Wine/Liquor Mix</div>
                <div className="text-sm text-slate-600 mb-3">Review in Club Operations settings</div>
                <div className="text-xs text-slate-500">Adjust revenue mix percentages per year</div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-semibold text-slate-800 mb-2">Club Labor %</div>
                <div className="text-sm text-slate-600 mb-3">Current: 10.8%</div>
                <div className="text-xs text-slate-500">Adjust in Club Operations settings</div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="font-semibold text-slate-800 mb-2">Bottle Service Focus</div>
                <div className="text-sm text-slate-600 mb-3">Current: 20% of club sales</div>
                <div className="text-sm text-blue-600 font-medium">
                  💡 Consider increasing to 25% for higher margins
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-sm text-purple-700">
                🎯 <strong>Pro Tip:</strong> Use Year-Specific mode in Settings to adjust club parameters independently for each year based on market trends and actual performance.
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    );
  };

  // Club Operations Tab
  const renderClubOperations = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-6">
        <h2 className="text-3xl font-bold text-indigo-900 mb-2">🎵 Club Operations</h2>
        <p className="text-indigo-700">Nightlife revenue and cost breakdown</p>
      </div>

      {!enableClubOperations ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-slate-600 mb-4">Club operations are currently disabled</p>
          <button
            onClick={() => setEnableClubOperations(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold"
          >
            Enable Club Operations
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-sm text-slate-600">🍺 Beer Sales</div>
              <div className="text-xl font-bold">{formatCurrency(clubBeerSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubBeerPercent)} of club</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-sm text-slate-600">🍷 Wine Sales</div>
              <div className="text-xl font-bold">{formatCurrency(clubWineSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubWinePercent)} of club</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-sm text-slate-600">🥃 Liquor Sales</div>
              <div className="text-xl font-bold">{formatCurrency(clubLiquorSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubLiquorPercent)} of club</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-sm text-slate-600">🍾 Bottle Service</div>
              <div className="text-xl font-bold">{formatCurrency(clubBottleServiceSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubBottleServicePercent)} of club</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-sm text-slate-600">🍕 Food Sales</div>
              <div className="text-xl font-bold">{formatCurrency(clubFoodSales)}</div>
              <div className="text-xs text-slate-500">{formatPercent(clubFoodPercent)} of club</div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4 shadow">
              <div className="text-sm text-purple-700 font-semibold">💰 Total Club Revenue</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(clubRevenue)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💸 Club COGS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>🍺 Beer Cost:</span>
                  <span className="font-medium">{formatCurrency(clubBeerCost)} ({formatPercent(clubBeerCostPercent)})</span>
                </div>
                <div className="flex justify-between">
                  <span>🍷 Wine Cost:</span>
                  <span className="font-medium">{formatCurrency(clubWineCost)} ({formatPercent(clubWineCostPercent)})</span>
                </div>
                <div className="flex justify-between">
                  <span>🥃 Liquor Cost:</span>
                  <span className="font-medium">{formatCurrency(clubLiquorCost)} ({formatPercent(clubLiquorCostPercent)})</span>
                </div>
                <div className="flex justify-between">
                  <span>🍾 Bottle Service Cost:</span>
                  <span className="font-medium">{formatCurrency(clubBottleCost)} ({formatPercent(clubBottleCostPercent)})</span>
                </div>
                <div className="flex justify-between">
                  <span>🍔 Food Cost:</span>
                  <span className="font-medium">{formatCurrency(clubFoodCost)} ({formatPercent(clubFoodCostPercent)})</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total COGS:</span>
                  <span>{formatCurrency(clubTotalCOGS)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Club Labor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bartenders:</span>
                  <span className="font-medium">{formatCurrency(clubBartenders)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Servers/Cocktail:</span>
                  <span className="font-medium">{formatCurrency(clubServers)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bussers/Barbacks:</span>
                  <span className="font-medium">{formatCurrency(clubBussers)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coat Check:</span>
                  <span className="font-medium">{formatCurrency(clubCoatCheck)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security:</span>
                  <span className="font-medium">{formatCurrency(clubSecurity)}</span>
                </div>
                <div className="flex justify-between">
                  <span>DJ/Entertainment:</span>
                  <span className="font-medium">{formatCurrency(clubDJ)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Base Labor:</span>
                  <span className="font-medium">{formatCurrency(clubBaseLabor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor Burden:</span>
                  <span className="font-medium">{formatCurrency(clubLaborBurden)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total Labor:</span>
                  <span>{formatCurrency(clubTotalLabor)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 shadow mt-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">💰 Club P&L Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-semibold text-green-700">{formatCurrency(clubRevenue)} ({formatPercent(100.0)})</span>
              </div>
              <div className="flex justify-between">
                <span>COGS:</span>
                <span className="font-medium text-orange-600">-{formatCurrency(clubTotalCOGS)} ({formatPercent((clubTotalCOGS / clubRevenue) * 100)})</span>
              </div>
              <div className="flex justify-between">
                <span>Labor:</span>
                <span className="font-medium text-purple-600">-{formatCurrency(clubTotalLabor)} ({formatPercent((clubTotalLabor / clubRevenue) * 100)})</span>
              </div>
              <div className="flex justify-between">
                <span>Operating Expenses:</span>
                <span className="font-medium text-slate-600">-{formatCurrency(clubTotalOperatingExpenses)} ({formatPercent((clubTotalOperatingExpenses / clubRevenue) * 100)})</span>
              </div>
              <div className="flex justify-between border-t-2 border-purple-300 pt-2 mt-2">
                <span className="font-bold">Club Net Profit:</span>
                <span className="font-bold text-green-700">{formatCurrency(clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses)} ({formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)})</span>
              </div>
            </div>
          </div>

          {/* 5-Year Club Forecast */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">📊 5-Year Club Financial Forecast</h2>
            <p className="text-purple-700 mb-4">Club operations projected growth</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">Category</th>
                    <th className="text-right py-3 px-2 text-sm">
                      <div className="font-semibold text-slate-700">Year 1</div>
                      <div className="text-xs text-slate-500">({clubYear1OperatingMonths} months)</div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm">
                      <div className="font-semibold text-slate-700">Year 2</div>
                      <div className="text-xs text-slate-500">(+{formatPercent(clubYear2GrowthRate)})</div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm">
                      <div className="font-semibold text-slate-700">Year 3</div>
                      <div className="text-xs text-slate-500">(+{formatPercent(clubYear3GrowthRate)})</div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm">
                      <div className="font-semibold text-slate-700">Year 4</div>
                      <div className="text-xs text-slate-500">(+{formatPercent(clubYear4GrowthRate)})</div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm">
                      <div className="font-semibold text-slate-700">Year 5</div>
                      <div className="text-xs text-slate-500">(+{formatPercent(clubYear5GrowthRate)})</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* REVENUE - Expandable */}
                  <tr 
                    className="border-b border-purple-100 cursor-pointer hover:bg-purple-50" 
                    onClick={() => setClubExpandedSections({...clubExpandedSections, revenue: !clubExpandedSections.revenue})}
                  >
                    <td className="py-2 px-2 font-semibold text-green-700">
                      {clubExpandedSections.revenue ? '▼' : '▶'} REVENUE {formatPercent((clubRevenue / clubRevenue) * 100)}
                    </td>
                    <td className="text-right py-2 px-2 font-semibold">{formatCurrency(clubRevenue * (clubYear1OperatingMonths / 12))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubRevenue * (1 + clubYear2GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubRevenue * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubRevenue * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubRevenue * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                  </tr>
                  {clubExpandedSections.revenue && (
                    <>
                      <tr className="bg-green-50">
                        <td className="p-3 pl-8 text-sm">🍺 Beer Sales ({formatPercent(clubBeerPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerSales * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerSales * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="p-3 pl-8 text-sm">🍷 Wine Sales ({formatPercent(clubWinePercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineSales * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineSales * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="p-3 pl-8 text-sm">🥃 Liquor Sales ({formatPercent(clubLiquorPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorSales * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorSales * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="p-3 pl-8 text-sm">🍾 Bottle Service ({formatPercent(clubBottleServicePercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleServiceSales * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleServiceSales * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleServiceSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleServiceSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleServiceSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="p-3 pl-8 text-sm">🍔 Food Sales ({formatPercent(clubFoodPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodSales * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodSales * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodSales * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                    </>
                  )}
                  
                  {/* COGS - Expandable */}
                  <tr 
                    className="border-b border-purple-100 cursor-pointer hover:bg-orange-50" 
                    onClick={() => setClubExpandedSections({...clubExpandedSections, cogs: !clubExpandedSections.cogs})}
                  >
                    <td className="py-2 px-2 text-orange-700">
                      {clubExpandedSections.cogs ? '▼' : '▶'} COGS {formatPercent((clubTotalCOGS / clubRevenue) * 100)}
                    </td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalCOGS * (year1OperatingMonths / 12))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalCOGS * (1 + year2GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalCOGS * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalCOGS * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalCOGS * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100) * (1 + year5GrowthRate / 100))}</td>
                  </tr>
                  {clubExpandedSections.cogs && (
                    <>
                      <tr className="bg-orange-50">
                        <td className="p-3 pl-8 text-sm">🍺 Beer Cost ({formatPercent(clubBeerCostPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerCost * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerCost * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBeerCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="p-3 pl-8 text-sm">🍷 Wine Cost ({formatPercent(clubWineCostPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineCost * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineCost * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubWineCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="p-3 pl-8 text-sm">🥃 Liquor Cost ({formatPercent(clubLiquorCostPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorCost * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorCost * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubLiquorCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="p-3 pl-8 text-sm">🍾 Bottle Service Cost ({formatPercent(clubBottleCostPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleCost * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleCost * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubBottleCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="p-3 pl-8 text-sm">🍔 Food Cost ({formatPercent(clubFoodCostPercent)})</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodCost * (clubYear1OperatingMonths / 12))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodCost * (1 + clubYear2GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                        <td className="text-right p-3 text-sm">{formatCurrency(clubFoodCost * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                      </tr>
                    </>
                  )}
                  
                  {/* LABOR - Expandable */}
                  <tr 
                    className="border-b border-purple-100 cursor-pointer hover:bg-purple-50" 
                    onClick={() => setClubExpandedSections({...clubExpandedSections, labor: !clubExpandedSections.labor})}
                  >
                    <td className="py-2 px-2 text-purple-700">
                      {clubExpandedSections.labor ? '▼' : '▶'} LABOR {formatPercent((clubTotalLabor / clubRevenue) * 100)}
                    </td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalLabor * (year1OperatingMonths / 12))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalLabor * (1 + year2GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalLabor * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalLabor * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalLabor * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100) * (1 + year5GrowthRate / 100))}</td>
                  </tr>
                  {clubExpandedSections.labor && (
                    <>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">Bartenders ({formatPercent(clubBartendersPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubBartenders * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">Servers/Cocktail ({formatPercent(clubServersPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubServers * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">Bussers/Barbacks ({formatPercent(clubBussersPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubBussers * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">Coat Check ({formatPercent(clubCoatCheckPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubCoatCheck * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">Security ({formatPercent(clubSecurityPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubSecurity * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-3 pl-8 text-sm">DJ/Entertainment ({formatPercent(clubDJPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubDJ * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                    </>
                  )}
                  
                  {/* OPERATING EXPENSES - Expandable */}
                  <tr 
                    className="border-b border-purple-100 cursor-pointer hover:bg-slate-50" 
                    onClick={() => setClubExpandedSections({...clubExpandedSections, operating: !clubExpandedSections.operating})}
                  >
                    <td className="py-2 px-2 text-slate-700">
                      {clubExpandedSections.operating ? '▼' : '▶'} OPERATING EXPENSES {formatPercent((clubTotalOperatingExpenses / clubRevenue) * 100)}
                    </td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalOperatingExpenses * (year1OperatingMonths / 12))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalOperatingExpenses * (1 + year2GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalOperatingExpenses * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalOperatingExpenses * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100))}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(clubTotalOperatingExpenses * (1 + year2GrowthRate / 100) * (1 + year3GrowthRate / 100) * (1 + year4GrowthRate / 100) * (1 + year5GrowthRate / 100))}</td>
                  </tr>
                  {clubExpandedSections.operating && (
                    <>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Rent (allocated {formatPercent(clubRentAllocationPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubRent * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Utilities ({formatPercent(clubUtilitiesPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubUtilities * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Insurance ({formatPercent(clubInsurancePercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubInsurance * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Credit Card Fees ({formatPercent(clubCreditCardPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubCreditCard * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Advertising ({formatPercent(clubAdvertisingPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubAdvertising * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Supplies ({formatPercent(clubSuppliesPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubSupplies * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">R&M ({formatPercent(clubRmPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubRm * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Waste Management ({formatPercent(clubWasteManagementPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubWasteManagement * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Telephone ({formatPercent(clubTelephonePercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubTelephone * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 pl-8 text-sm">Licenses ({formatPercent(clubLicensesPercent)})</td>
                        {getYearsToShow().map(year => (
                          <td key={year} className="text-right p-3 text-sm">{formatCurrency(clubLicenses * (year === 1 ? clubYear1OperatingMonths / 12 : year === 2 ? (1 + clubYear2GrowthRate / 100) : year === 3 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) : year === 4 ? (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) : (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100)))}</td>
                        ))}
                      </tr>
                    </>
                  )}
                  <tr className="border-t-2 border-purple-300 bg-green-50">
                    <td className="py-3 px-2 font-bold text-green-900">NET PROFIT</td>
                    <td className="text-right py-3 px-2 font-bold text-green-700">{formatCurrency((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) * (clubYear1OperatingMonths / 12))}</td>
                    <td className="text-right py-3 px-2 font-bold text-green-700">{formatCurrency((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) * (1 + clubYear2GrowthRate / 100))}</td>
                    <td className="text-right py-3 px-2 font-bold text-green-700">{formatCurrency((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100))}</td>
                    <td className="text-right py-3 px-2 font-bold text-green-700">{formatCurrency((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100))}</td>
                    <td className="text-right py-3 px-2 font-bold text-green-700">{formatCurrency((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) * (1 + clubYear2GrowthRate / 100) * (1 + clubYear3GrowthRate / 100) * (1 + clubYear4GrowthRate / 100) * (1 + clubYear5GrowthRate / 100))}</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="py-2 px-2 text-sm text-green-800">Net Profit Margin</td>
                    <td className="text-right py-2 px-2 text-sm text-green-700">{formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)}</td>
                    <td className="text-right py-2 px-2 text-sm text-green-700">{formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)}</td>
                    <td className="text-right py-2 px-2 text-sm text-green-700">{formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)}</td>
                    <td className="text-right py-2 px-2 text-sm text-green-700">{formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)}</td>
                    <td className="text-right py-2 px-2 text-sm text-green-700">{formatPercent((clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) / clubRevenue * 100)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Combined Total Tab
  const renderCombinedTotal = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 mb-6">
        <h2 className="text-3xl font-bold text-green-900 mb-2">🏢 Combined Operations</h2>
        <p className="text-green-700">Restaurant + Club total financial performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-sm text-slate-600 mb-1">💰 Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-slate-500 mt-1">Restaurant: {formatCurrency(restaurantRevenue)} | Club: {formatCurrency(clubRevenue)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-sm text-slate-600 mb-1">📊 Net Profit</div>
          <div className={`text-3xl font-bold ${combinedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(combinedProfit)}</div>
          <div className="text-xs text-slate-500 mt-1">Margin: {formatPercent(combinedProfitMargin)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-sm text-slate-600 mb-1">📉 Total Costs</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(combinedTotalCosts)}</div>
          <div className="text-xs text-slate-500 mt-1">{formatPercent((combinedTotalCosts / totalRevenue) * 100)} of revenue</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Cost Breakdown</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
            <div>
              <div className="font-semibold text-orange-900">Cost of Goods Sold</div>
              <div className="text-sm text-orange-700">Restaurant: {formatCurrency(restaurantCOGS)} | Club: {formatCurrency(clubTotalCOGS)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(combinedCOGS)}</div>
              <div className="text-sm text-orange-700">{formatPercent((combinedCOGS / totalRevenue) * 100)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
            <div>
              <div className="font-semibold text-purple-900">Payroll & Labor</div>
              <div className="text-sm text-purple-700">Restaurant: {formatCurrency(restaurantTotalLabor)} | Club: {formatCurrency(clubTotalLabor)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(combinedLabor)}</div>
              <div className="text-sm text-purple-700">{formatPercent((combinedLabor / totalRevenue) * 100)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
            <div>
              <div className="font-semibold text-amber-900">Operating Expenses</div>
              <div className="text-sm text-amber-700">Rent, utilities, insurance, etc.</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalOperatingExpenses)}</div>
              <div className="text-sm text-amber-700">{formatPercent((totalOperatingExpenses / totalRevenue) * 100)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Admin Panel
  const renderAdminPanel = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">⚙️ Admin Panel</h2>
              <p className="text-slate-600">Adjust parameters for different markets and scenarios</p>
            </div>
            <button
              onClick={() => setShowAdmin(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
          
          {/* Global vs Year-Specific Toggle */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Editing Mode:</span>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setEditingMode('global')}
                  className={`px-4 py-2 rounded-md font-semibold transition-all ${
                    editingMode === 'global'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌍 Global (All Years)
                </button>
                <button
                  onClick={() => setEditingMode('year-specific')}
                  className={`px-4 py-2 rounded-md font-semibold transition-all ${
                    editingMode === 'year-specific'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📅 Year-Specific
                </button>
              </div>
            </div>
            
            {editingMode === 'year-specific' && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-600">Editing:</span>
                <select
                  value={selectedForecastYear}
                  onChange={(e) => setSelectedForecastYear(e.target.value)}
                  className="px-3 py-2 border-2 border-purple-300 rounded-lg bg-white font-semibold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="year1">Year 1: {year1CalendarYear}</option>
                  <option value="year2">Year 2: {year2CalendarYear}</option>
                  <option value="year3">Year 3: {year3CalendarYear}</option>
                  <option value="year4">Year 4: {year4CalendarYear}</option>
                  <option value="year5">Year 5: {year5CalendarYear}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setAdminSection('labor')}
              className={`px-4 py-2 rounded-lg ${adminSection === 'labor' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100'}`}
            >
              👥 Labor & Wages
            </button>
            <button
              onClick={() => setAdminSection('costs')}
              className={`px-4 py-2 rounded-lg ${adminSection === 'costs' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}
            >
              💰 Cost Structure
            </button>
            <button
              onClick={() => setAdminSection('operating')}
              className={`px-4 py-2 rounded-lg ${adminSection === 'operating' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}
            >
              🏢 Operating Expenses
            </button>
            <button
              onClick={() => setAdminSection('volume')}
              className={`px-4 py-2 rounded-lg ${adminSection === 'volume' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}
            >
              📊 Volume & Pricing
            </button>
            <button
              onClick={() => setAdminSection('club')}
              className={`px-4 py-2 rounded-lg ${adminSection === 'club' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100'}`}
            >
              🎵 Club Operations
            </button>
          </div>

          {/* Labor & Wages */}
          {adminSection === 'labor' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Restaurant Labor</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>FOH Labor %</Label>
                  <Slider value={[fohLaborPercent]} onValueChange={(v) => setFohLaborPercent(v[0])} min={8} max={20} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(fohLaborPercent)}</div>
                </div>
                <div>
                  <Label>BOH Labor %</Label>
                  <Slider value={[bohLaborPercent]} onValueChange={(v) => setBohLaborPercent(v[0])} min={10} max={25} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(bohLaborPercent)}</div>
                </div>
                <div>
                  <Label>Management %</Label>
                  <Slider value={[managementPercent]} onValueChange={(v) => setManagementPercent(v[0])} min={3} max={10} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(managementPercent)}</div>
                </div>
                <div>
                  <Label>Labor Burden %</Label>
                  <Slider value={[laborBurdenPercent]} onValueChange={(v) => setLaborBurdenPercent(v[0])} min={0} max={8} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(laborBurdenPercent)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Structure */}
          {adminSection === 'costs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Sales Mix</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Food Sales % of Total</Label>
                  <Slider value={[foodSalesMixPercent]} onValueChange={(v) => {
                    setFoodSalesMixPercent(v[0]);
                    setBeverageSalesMixPercent(100 - v[0]);
                  }} min={30} max={90} step={1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(foodSalesMixPercent)}</div>
                </div>
                <div>
                  <Label>Beverage Sales % of Total</Label>
                  <Slider value={[beverageSalesMixPercent]} onValueChange={(v) => {
                    setBeverageSalesMixPercent(v[0]);
                    setFoodSalesMixPercent(100 - v[0]);
                  }} min={10} max={70} step={1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(beverageSalesMixPercent)}</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Cost Percentages</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Food Cost %</Label>
                  <Slider value={[foodCostPercent]} onValueChange={(v) => setFoodCostPercent(v[0])} min={20} max={35} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(foodCostPercent)}</div>
                </div>
                <div>
                  <Label>Beverage Cost %</Label>
                  <Slider value={[beverageCostPercent]} onValueChange={(v) => setBeverageCostPercent(v[0])} min={15} max={35} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(beverageCostPercent)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Operating Expenses */}
          {adminSection === 'operating' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Operating Expenses</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Base Rent (Annual)</Label>
                  <Input 
                    type="number" 
                    value={baseRentAnnual} 
                    onChange={(e) => setBaseRentAnnual(Number(e.target.value))} 
                    className="mt-2"
                  />
                  <div className="text-sm text-slate-600 mt-1">{formatCurrency(baseRentAnnual)}</div>
                </div>
                <div>
                  <Label>Advertising %</Label>
                  <Slider value={[advertisingPercent]} onValueChange={(v) => setAdvertisingPercent(v[0])} min={0} max={5} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(advertisingPercent)}</div>
                </div>
                <div>
                  <Label>Supplies %</Label>
                  <Slider value={[suppliesPercent]} onValueChange={(v) => setSuppliesPercent(v[0])} min={0} max={5} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(suppliesPercent)}</div>
                </div>
                <div>
                  <Label>R&M %</Label>
                  <Slider value={[rmPercent]} onValueChange={(v) => setRmPercent(v[0])} min={0} max={3} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(rmPercent)}</div>
                </div>
                <div>
                  <Label>Utilities %</Label>
                  <Slider value={[utilitiesPercent]} onValueChange={(v) => setUtilitiesPercent(v[0])} min={0} max={6} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(utilitiesPercent)}</div>
                </div>
                <div>
                  <Label>Insurance %</Label>
                  <Slider value={[insurancePercent]} onValueChange={(v) => setInsurancePercent(v[0])} min={0} max={3} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(insurancePercent)}</div>
                </div>
                <div>
                  <Label>Credit Card Fees %</Label>
                  <Slider value={[creditCardPercent]} onValueChange={(v) => setCreditCardPercent(v[0])} min={0} max={4} step={0.1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(creditCardPercent)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Volume & Pricing */}
          {adminSection === 'volume' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Volume & Pricing</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Average Lunch Check</Label>
                  <Slider value={[avgLunchCheck]} onValueChange={(v) => setAvgLunchCheck(v[0])} min={15} max={60} step={1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatCurrency(avgLunchCheck)}</div>
                </div>
                <div>
                  <Label>Average Dinner Check</Label>
                  <Slider value={[avgDinnerCheck]} onValueChange={(v) => setAvgDinnerCheck(v[0])} min={25} max={100} step={1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatCurrency(avgDinnerCheck)}</div>
                </div>
                <div>
                  <Label>Lunch Covers/Day</Label>
                  <Slider value={[lunchCoversPerDay]} onValueChange={(v) => setLunchCoversPerDay(v[0])} min={20} max={300} step={5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{lunchCoversPerDay} covers</div>
                </div>
                <div>
                  <Label>Dinner Covers/Day</Label>
                  <Slider value={[dinnerCoversPerDay]} onValueChange={(v) => setDinnerCoversPerDay(v[0])} min={30} max={400} step={5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{dinnerCoversPerDay} covers</div>
                </div>
                <div>
                  <Label>Operating Days/Year</Label>
                  <Slider value={[operatingDays]} onValueChange={(v) => setOperatingDays(v[0])} min={250} max={365} step={1} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{operatingDays} days</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">Revenue Centers</h3>
              <p className="text-sm text-slate-600 mb-3">
                Enable additional dayparts for your operation
                {editingMode === 'year-specific' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Editing: {selectedForecastYear === 'year1' ? `Year 1: ${year1CalendarYear}` :
                             selectedForecastYear === 'year2' ? `Year 2: ${year2CalendarYear}` :
                             selectedForecastYear === 'year3' ? `Year 3: ${year3CalendarYear}` :
                             selectedForecastYear === 'year4' ? `Year 4: ${year4CalendarYear}` :
                             `Year 5: ${year5CalendarYear}`}
                  </span>
                )}
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().breakfast} onCheckedChange={(checked) => updateRevenueCenter('breakfast', checked)} />
                  <Label>🌅 Breakfast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().lunch} onCheckedChange={(checked) => updateRevenueCenter('lunch', checked)} />
                  <Label>🍽️ Lunch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().dinner} onCheckedChange={(checked) => updateRevenueCenter('dinner', checked)} />
                  <Label>🌙 Dinner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().lateNight} onCheckedChange={(checked) => updateRevenueCenter('lateNight', checked)} />
                  <Label>🌃 Late Night</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().privateEvents} onCheckedChange={(checked) => updateRevenueCenter('privateEvents', checked)} />
                  <Label>🎉 Private Events</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().toGo} onCheckedChange={(checked) => updateRevenueCenter('toGo', checked)} />
                  <Label>🥡 To-Go / Takeout</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={getActiveRevenueCenters().roomService} onCheckedChange={(checked) => updateRevenueCenter('roomService', checked)} />
                  <Label>🏨 Room Service</Label>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">Revenue Mix by Daypart</h3>
              <p className="text-sm text-slate-600 mb-3">What % of total restaurant revenue comes from each daypart</p>
              <div className="grid grid-cols-2 gap-6">
                {enableBreakfast && (
                  <div>
                    <Label>Breakfast Revenue %</Label>
                    <Slider value={[breakfastRevenuePercent]} onValueChange={(v) => setBreakfastRevenuePercent(v[0])} min={5} max={30} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(breakfastRevenuePercent)}</div>
                  </div>
                )}
                {enableLunch && (
                  <div>
                    <Label>Lunch Revenue %</Label>
                    <Slider value={[lunchRevenuePercent]} onValueChange={(v) => setLunchRevenuePercent(v[0])} min={20} max={60} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(lunchRevenuePercent)}</div>
                  </div>
                )}
                {enableDinner && (
                  <div>
                    <Label>Dinner Revenue %</Label>
                    <Slider value={[dinnerRevenuePercent]} onValueChange={(v) => setDinnerRevenuePercent(v[0])} min={30} max={70} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(dinnerRevenuePercent)}</div>
                  </div>
                )}
                {enableLateNight && (
                  <div>
                    <Label>Late Night Revenue %</Label>
                    <Slider value={[lateNightRevenuePercent]} onValueChange={(v) => setLateNightRevenuePercent(v[0])} min={3} max={20} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(lateNightRevenuePercent)}</div>
                  </div>
                )}
                {enablePrivateEvents && (
                  <div>
                    <Label>Private Events Revenue %</Label>
                    <Slider value={[privateEventsRevenuePercent]} onValueChange={(v) => setPrivateEventsRevenuePercent(v[0])} min={5} max={25} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(privateEventsRevenuePercent)}</div>
                  </div>
                )}
                {enableToGo && (
                  <div>
                    <Label>To-Go Revenue %</Label>
                    <Slider value={[toGoRevenuePercent]} onValueChange={(v) => setToGoRevenuePercent(v[0])} min={5} max={40} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(toGoRevenuePercent)}</div>
                  </div>
                )}
                {enableRoomService && (
                  <div>
                    <Label>Room Service Revenue %</Label>
                    <Slider value={[roomServiceRevenuePercent]} onValueChange={(v) => setRoomServiceRevenuePercent(v[0])} min={5} max={30} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">{formatPercent(roomServiceRevenuePercent)}</div>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mt-6">Food/Beverage Split by Daypart</h3>
              <p className="text-sm text-slate-600 mb-3">Food % for each daypart (Beverage = 100% - Food %)</p>
              <div className="grid grid-cols-2 gap-6">
                {enableBreakfast && (
                  <div>
                    <Label>Breakfast Food %</Label>
                    <Slider value={[breakfastFoodPercent]} onValueChange={(v) => setBreakfastFoodPercent(v[0])} min={50} max={95} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(breakfastFoodPercent)} | Bev: {formatPercent(100 - breakfastFoodPercent)}</div>
                  </div>
                )}
                {enableLunch && (
                  <div>
                    <Label>Lunch Food %</Label>
                    <Slider value={[lunchFoodPercent]} onValueChange={(v) => setLunchFoodPercent(v[0])} min={50} max={85} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(lunchFoodPercent)} | Bev: {formatPercent(100 - lunchFoodPercent)}</div>
                  </div>
                )}
                {enableDinner && (
                  <div>
                    <Label>Dinner Food %</Label>
                    <Slider value={[dinnerFoodPercent]} onValueChange={(v) => setDinnerFoodPercent(v[0])} min={50} max={85} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(dinnerFoodPercent)} | Bev: {formatPercent(100 - dinnerFoodPercent)}</div>
                  </div>
                )}
                {enableLateNight && (
                  <div>
                    <Label>Late Night Food %</Label>
                    <Slider value={[lateNightFoodPercent]} onValueChange={(v) => setLateNightFoodPercent(v[0])} min={15} max={60} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(lateNightFoodPercent)} | Bev: {formatPercent(100 - lateNightFoodPercent)}</div>
                  </div>
                )}
                {enablePrivateEvents && (
                  <div>
                    <Label>Private Events Food %</Label>
                    <Slider value={[privateEventsFoodPercent]} onValueChange={(v) => setPrivateEventsFoodPercent(v[0])} min={50} max={85} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(privateEventsFoodPercent)} | Bev: {formatPercent(100 - privateEventsFoodPercent)}</div>
                  </div>
                )}
                {enableToGo && (
                  <div>
                    <Label>To-Go Food %</Label>
                    <Slider value={[toGoFoodPercent]} onValueChange={(v) => setToGoFoodPercent(v[0])} min={60} max={95} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(toGoFoodPercent)} | Bev: {formatPercent(100 - toGoFoodPercent)}</div>
                  </div>
                )}
                {enableRoomService && (
                  <div>
                    <Label>Room Service Food %</Label>
                    <Slider value={[roomServiceFoodPercent]} onValueChange={(v) => setRoomServiceFoodPercent(v[0])} min={55} max={90} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">Food: {formatPercent(roomServiceFoodPercent)} | Bev: {formatPercent(100 - roomServiceFoodPercent)}</div>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mt-6">5-Year Forecast Settings</h3>
              
              {/* Start Year Selector */}
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                <Label className="text-base font-semibold">📅 Restaurant Opening Date</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm">Start Year</Label>
                    <select 
                      value={startYear} 
                      onChange={(e) => setStartYear(parseInt(e.target.value))}
                      className="w-full mt-2 p-2 border rounded-lg bg-white"
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm">Operating Months in Year 1</Label>
                    <Slider value={[year1OperatingMonths]} onValueChange={(v) => setYear1OperatingMonths(v[0])} min={1} max={12} step={1} className="mt-4" />
                    <div className="text-sm text-slate-600 mt-1">{year1OperatingMonths} months ({formatPercent((year1OperatingMonths / 12) * 100)} of full year)</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-purple-700 bg-white p-3 rounded-lg">
                  <strong>Year 1:</strong> {year1CalendarYear} ({year1OperatingMonths} months) • 
                  <strong>Year 2:</strong> {year2CalendarYear} (12 months) • 
                  <strong>Year 3:</strong> {year3CalendarYear} (12 months)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="opacity-0 pointer-events-none">
                  {/* Placeholder for grid alignment */}
                </div>
                <div>
                  <Label>Year 2 Growth Rate %</Label>
                  <Slider value={[year2GrowthRate]} onValueChange={(v) => setYear2GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(year2GrowthRate)}</div>
                </div>
                <div>
                  <Label>Year 3 Growth Rate %</Label>
                  <Slider value={[year3GrowthRate]} onValueChange={(v) => setYear3GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(year3GrowthRate)}</div>
                </div>
                <div>
                  <Label>Year 4 Growth Rate %</Label>
                  <Slider value={[year4GrowthRate]} onValueChange={(v) => setYear4GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(year4GrowthRate)}</div>
                </div>
                <div>
                  <Label>Year 5 Growth Rate %</Label>
                  <Slider value={[year5GrowthRate]} onValueChange={(v) => setYear5GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                  <div className="text-sm text-slate-600 mt-1">{formatPercent(year5GrowthRate)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Club Operations */}
          {adminSection === 'club' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Switch checked={enableClubOperations} onCheckedChange={setEnableClubOperations} />
                <Label>Enable Club Operations</Label>
              </div>

              {enableClubOperations && (
                <>
                  <h3 className="text-lg font-semibold">Rent Allocation</h3>
                  <div className="mb-6">
                    <Label>Club Rent Allocation % (of total rent)</Label>
                    <Slider value={[clubRentAllocationPercent]} onValueChange={(v) => setClubRentAllocationPercent(v[0])} min={0} max={50} step={1} className="mt-2" />
                    <div className="text-sm text-slate-600 mt-1">
                      Club: {formatPercent(clubRentAllocationPercent)} ({formatCurrency(clubRentExpense)}) | 
                      Restaurant: {formatPercent(100 - clubRentAllocationPercent)} ({formatCurrency(restaurantRentExpense)})
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Club Revenue Mix</h3>
                    {editingMode === 'year-specific' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        Editing: Year {selectedForecastYear.replace('year', '')} {selectedForecastYear === 'year1' ? `: ${startYear}` : selectedForecastYear === 'year2' ? `: ${startYear + 1}` : selectedForecastYear === 'year3' ? `: ${startYear + 2}` : selectedForecastYear === 'year4' ? `: ${startYear + 3}` : `: ${startYear + 4}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">What % of your total club revenue comes from each category (should total 100%)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Beer % of Club Sales</Label>
                      <Slider value={[clubBeerPercent]} onValueChange={(v) => updateClubParam('beerPercent', v[0])} min={0} max={40} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBeerPercent)}</div>
                    </div>
                    <div>
                      <Label>Wine % of Club Sales</Label>
                      <Slider value={[clubWinePercent]} onValueChange={(v) => updateClubParam('winePercent', v[0])} min={0} max={40} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubWinePercent)}</div>
                    </div>
                    <div>
                      <Label>Liquor % of Club Sales</Label>
                      <Slider value={[clubLiquorPercent]} onValueChange={(v) => updateClubParam('liquorPercent', v[0])} min={0} max={60} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubLiquorPercent)}</div>
                    </div>
                    <div>
                      <Label>Bottle Service % of Club Sales</Label>
                      <Slider value={[clubBottleServicePercent]} onValueChange={(v) => updateClubParam('bottleServicePercent', v[0])} min={0} max={50} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBottleServicePercent)}</div>
                    </div>
                    <div>
                      <Label>Food % of Club Sales</Label>
                      <Slider value={[clubFoodPercent]} onValueChange={(v) => updateClubParam('foodPercent', v[0])} min={0} max={20} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubFoodPercent)}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mt-2 p-2 bg-slate-100 rounded">
                    Total Revenue Mix: {formatPercent(clubBeerPercent + clubWinePercent + clubLiquorPercent + clubBottleServicePercent + clubFoodPercent)}
                    {(clubBeerPercent + clubWinePercent + clubLiquorPercent + clubBottleServicePercent + clubFoodPercent) !== 100 && (
                      <span className="text-orange-600 ml-2">⚠️ Should equal 100%</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-6 mb-2">
                    <h3 className="text-lg font-semibold">Club COGS %</h3>
                    {editingMode === 'year-specific' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        Editing: Year {selectedForecastYear.replace('year', '')} {selectedForecastYear === 'year1' ? `: ${startYear}` : selectedForecastYear === 'year2' ? `: ${startYear + 1}` : selectedForecastYear === 'year3' ? `: ${startYear + 2}` : selectedForecastYear === 'year4' ? `: ${startYear + 3}` : `: ${startYear + 4}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Cost of goods as % of sales for each category (e.g., 25% = $25 cost per $100 sold)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Beer Cost %</Label>
                      <Slider value={[clubBeerCostPercent]} onValueChange={(v) => updateClubParam('beerCostPercent', v[0])} min={15} max={40} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBeerCostPercent)}</div>
                    </div>
                    <div>
                      <Label>Wine Cost %</Label>
                      <Slider value={[clubWineCostPercent]} onValueChange={(v) => updateClubParam('wineCostPercent', v[0])} min={20} max={45} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubWineCostPercent)}</div>
                    </div>
                    <div>
                      <Label>Liquor Cost %</Label>
                      <Slider value={[clubLiquorCostPercent]} onValueChange={(v) => updateClubParam('liquorCostPercent', v[0])} min={15} max={35} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubLiquorCostPercent)}</div>
                    </div>
                    <div>
                      <Label>Bottle Service Cost %</Label>
                      <Slider value={[clubBottleCostPercent]} onValueChange={(v) => updateClubParam('bottleCostPercent', v[0])} min={10} max={30} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBottleCostPercent)}</div>
                    </div>
                    <div>
                      <Label>Food Cost %</Label>
                      <Slider value={[clubFoodCostPercent]} onValueChange={(v) => updateClubParam('foodCostPercent', v[0])} min={20} max={40} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubFoodCostPercent)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 mb-2">
                    <h3 className="text-lg font-semibold">Club Labor %</h3>
                    {editingMode === 'year-specific' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        Editing: Year {selectedForecastYear.replace('year', '')} {selectedForecastYear === 'year1' ? `: ${startYear}` : selectedForecastYear === 'year2' ? `: ${startYear + 1}` : selectedForecastYear === 'year3' ? `: ${startYear + 2}` : selectedForecastYear === 'year4' ? `: ${startYear + 3}` : `: ${startYear + 4}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Labor costs as % of club revenue for each role</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Bartenders %</Label>
                      <Slider value={[clubBartendersPercent]} onValueChange={(v) => updateClubParam('bartendersPercent', v[0])} min={0} max={8} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBartendersPercent)}</div>
                    </div>
                    <div>
                      <Label>Servers/Cocktail %</Label>
                      <Slider value={[clubServersPercent]} onValueChange={(v) => updateClubParam('serversPercent', v[0])} min={0} max={6} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubServersPercent)}</div>
                    </div>
                    <div>
                      <Label>Bussers/Barbacks %</Label>
                      <Slider value={[clubBussersPercent]} onValueChange={(v) => updateClubParam('bussersPercent', v[0])} min={0} max={3} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubBussersPercent)}</div>
                    </div>
                    <div>
                      <Label>Coat Check %</Label>
                      <Slider value={[clubCoatCheckPercent]} onValueChange={(v) => updateClubParam('coatCheckPercent', v[0])} min={0} max={2} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubCoatCheckPercent)}</div>
                    </div>
                    <div>
                      <Label>Security %</Label>
                      <Slider value={[clubSecurityPercent]} onValueChange={(v) => updateClubParam('securityPercent', v[0])} min={0} max={5} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubSecurityPercent)}</div>
                    </div>
                    <div>
                      <Label>DJ/Entertainment %</Label>
                      <Slider value={[clubDJPercent]} onValueChange={(v) => updateClubParam('djPercent', v[0])} min={0} max={4} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubDJPercent)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 mb-2">
                    <h3 className="text-lg font-semibold">Club Operating Expenses %</h3>
                    {editingMode === 'year-specific' && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        Editing: Year {selectedForecastYear.replace('year', '')} {selectedForecastYear === 'year1' ? `: ${startYear}` : selectedForecastYear === 'year2' ? `: ${startYear + 1}` : selectedForecastYear === 'year3' ? `: ${startYear + 2}` : selectedForecastYear === 'year4' ? `: ${startYear + 3}` : `: ${startYear + 4}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Operating expenses as % of club revenue (separate from restaurant)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Utilities %</Label>
                      <Slider value={[clubUtilitiesPercent]} onValueChange={(v) => updateClubParam('utilitiesPercent', v[0])} min={0} max={8} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubUtilitiesPercent)}</div>
                    </div>
                    <div>
                      <Label>Insurance %</Label>
                      <Slider value={[clubInsurancePercent]} onValueChange={(v) => updateClubParam('insurancePercent', v[0])} min={0} max={4} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubInsurancePercent)}</div>
                    </div>
                    <div>
                      <Label>Credit Card Fees %</Label>
                      <Slider value={[clubCreditCardPercent]} onValueChange={(v) => updateClubParam('creditCardPercent', v[0])} min={0} max={5} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubCreditCardPercent)}</div>
                    </div>
                    <div>
                      <Label>Advertising %</Label>
                      <Slider value={[clubAdvertisingPercent]} onValueChange={(v) => updateClubParam('advertisingPercent', v[0])} min={0} max={5} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubAdvertisingPercent)}</div>
                    </div>
                    <div>
                      <Label>Supplies %</Label>
                      <Slider value={[clubSuppliesPercent]} onValueChange={(v) => updateClubParam('suppliesPercent', v[0])} min={0} max={5} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubSuppliesPercent)}</div>
                    </div>
                    <div>
                      <Label>R&M (Repairs & Maintenance) %</Label>
                      <Slider value={[clubRmPercent]} onValueChange={(v) => updateClubParam('rmPercent', v[0])} min={0} max={3} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubRmPercent)}</div>
                    </div>
                    <div>
                      <Label>Waste Management %</Label>
                      <Slider value={[clubWasteManagementPercent]} onValueChange={(v) => updateClubParam('wasteManagementPercent', v[0])} min={0} max={1} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubWasteManagementPercent)}</div>
                    </div>
                    <div>
                      <Label>Telephone %</Label>
                      <Slider value={[clubTelephonePercent]} onValueChange={(v) => updateClubParam('telephonePercent', v[0])} min={0} max={1} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubTelephonePercent)}</div>
                    </div>
                    <div>
                      <Label>Licenses %</Label>
                      <Slider value={[clubLicensesPercent]} onValueChange={(v) => updateClubParam('licensesPercent', v[0])} min={0} max={2} step={0.1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubLicensesPercent)}</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mt-6">Club 5-Year Forecast Settings</h3>
                  <p className="text-sm text-slate-600 mb-3">Control club growth projections independently from restaurant</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Club Year 1 Operating Months (1-12)</Label>
                      <Slider value={[clubYear1OperatingMonths]} onValueChange={(v) => setClubYear1OperatingMonths(v[0])} min={1} max={12} step={1} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{clubYear1OperatingMonths} months ({formatPercent((clubYear1OperatingMonths / 12) * 100)} of full year)</div>
                    </div>
                    <div>
                      <Label>Club Year 2 Growth Rate %</Label>
                      <Slider value={[clubYear2GrowthRate]} onValueChange={(v) => setClubYear2GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubYear2GrowthRate)}</div>
                    </div>
                    <div>
                      <Label>Club Year 3 Growth Rate %</Label>
                      <Slider value={[clubYear3GrowthRate]} onValueChange={(v) => setClubYear3GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubYear3GrowthRate)}</div>
                    </div>
                    <div>
                      <Label>Club Year 4 Growth Rate %</Label>
                      <Slider value={[clubYear4GrowthRate]} onValueChange={(v) => setClubYear4GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubYear4GrowthRate)}</div>
                    </div>
                    <div>
                      <Label>Club Year 5 Growth Rate %</Label>
                      <Slider value={[clubYear5GrowthRate]} onValueChange={(v) => setClubYear5GrowthRate(v[0])} min={0} max={20} step={0.5} className="mt-2" />
                      <div className="text-sm text-slate-600 mt-1">{formatPercent(clubYear5GrowthRate)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const totalPositions = Math.ceil((restaurantTotalLabor + clubTotalLabor) / 35000); // Rough estimate

  // Export handler function
  const handleExport = (format) => {
    const exportData = {
      profitMargin: combinedProfitMargin,
      totalRevenue: totalRevenue,
      netProfit: combinedProfit,
      restaurantRevenue: restaurantRevenue,
      restaurantCOGS: restaurantCOGS,
      restaurantLabor: restaurantTotalLabor,
      restaurantOpEx: totalOperatingExpenses - (enableClubOperations ? clubTotalOperatingExpenses : 0),
      restaurantNetProfit: restaurantRevenue - restaurantCOGS - restaurantTotalLabor - (totalOperatingExpenses - (enableClubOperations ? clubTotalOperatingExpenses : 0)),
      clubEnabled: enableClubOperations,
      clubRevenue: clubRevenue,
      clubCOGS: clubTotalCOGS,
      clubLabor: clubTotalLabor,
      clubOpEx: enableClubOperations ? clubTotalOperatingExpenses : 0,
      clubNetProfit: enableClubOperations ? (clubRevenue - clubTotalCOGS - clubTotalLabor - clubTotalOperatingExpenses) : 0,
      forecast: {
        revenue: [totalRevenue, calculateYearRevenue(2), calculateYearRevenue(3), calculateYearRevenue(4)],
        cogs: [combinedCOGS, calculateYearCOGS(2), calculateYearCOGS(3), calculateYearCOGS(4)],
        labor: [combinedLabor, calculateYearLabor(2), calculateYearLabor(3), calculateYearLabor(4)],
        opex: [totalOperatingExpenses, calculateYearOperating(2), calculateYearOperating(3), calculateYearOperating(4)],
        netProfit: [
          combinedProfit,
          calculateYearRevenue(2) - calculateYearCOGS(2) - calculateYearLabor(2) - calculateYearOperating(2),
          calculateYearRevenue(3) - calculateYearCOGS(3) - calculateYearLabor(3) - calculateYearOperating(3),
          calculateYearRevenue(4) - calculateYearCOGS(4) - calculateYearLabor(4) - calculateYearOperating(4)
        ]
      }
    };

    switch(format) {
      case 'executive':
        exportExecutiveSummary(exportData);
        break;
      case 'detailed':
        exportDetailedReport(exportData);
        break;
      case 'restaurant':
        exportRestaurantOnly(exportData);
        break;
      case 'club':
        exportClubOnly(exportData);
        break;
      case 'combined':
        exportCombined(exportData);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl">🧹</div>
                <h1 className="text-4xl font-bold">MoppedOS</h1>
              </div>
              <p className="text-blue-100 text-lg">Restaurant Financial Planning Made Simple</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-blue-50 font-semibold shadow-lg transition-all flex items-center gap-2"
                >
                  📄 Export PDF
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-purple-200 py-2 z-50">
                    <button
                      onClick={() => { handleExport('executive'); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-2"
                    >
                      <span>📄</span>
                      <div>
                        <div className="font-semibold text-gray-800">Executive Summary</div>
                        <div className="text-xs text-gray-500">1-page overview for emails</div>
                      </div>
                    </button>

                    {enableClubOperations && (
                      <button
                        onClick={() => { handleExport('club'); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-2"
                      >
                        <span>🎵</span>
                        <div>
                          <div className="font-semibold text-gray-800">Club Only</div>
                          <div className="text-xs text-gray-500">Club financials only</div>
                        </div>
                      </button>
                    )}
                    {enableClubOperations && (
                      <button
                        onClick={() => { handleExport('combined'); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-2"
                      >
                        <span>🏢</span>
                        <div>
                          <div className="font-semibold text-gray-800">Combined</div>
                          <div className="text-xs text-gray-500">Restaurant + Club consolidated</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAdmin(true)}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-blue-50 font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="text-sm text-blue-100 flex items-center gap-2 mb-1">
                <span className="text-xl">📊</span> Profit Margin
              </div>
              <div className="text-3xl font-bold">{formatPercent(combinedProfitMargin)}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="text-sm text-blue-100 flex items-center gap-2 mb-1">
                <span className="text-xl">💰</span> Annual Revenue
              </div>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              🍽️ Restaurant
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'revenue' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              📈 Revenue
            </button>
            <button
              onClick={() => setActiveTab('labor')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'labor' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              👥 Labor
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'planning' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              📅 Planning
            </button>
            <button
              onClick={() => setActiveTab('club')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'club' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              🎵 Club
            </button>
            <button
              onClick={() => setActiveTab('combined')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'combined' ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              🏢 Combined
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'revenue' && renderRevenueAnalysis()}
        {activeTab === 'labor' && renderLaborAnalysis()}
        {activeTab === 'planning' && renderBudgetPlanning()}
        {activeTab === 'club' && renderClubOperations()}
        {activeTab === 'combined' && renderCombinedTotal()}
      </div>

      {/* Admin Panel */}
      {showAdmin && renderAdminPanel()}


    </div>
  );
};

export default ProformaTool;
