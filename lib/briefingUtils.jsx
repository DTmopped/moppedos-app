import React from 'react';

export const SPEND_PER_GUEST = 15;

export const PRE_SHIFT_ENERGIZERS = [
  { value: "shout_out", label: "Shout Out" },
  { value: "one_word_check_in", label: "One Word Check-In" },
  { value: "menu_quiz", label: "Menu Quiz" },
  { value: "comeback_scenario", label: "Comeback Scenario" },
  { value: "mopped_mission", label: "Mopped Mission" },
];

export const getFormattedDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString; 
  }
};

export const generateBriefingText = (briefingData) => {
  return `
MOORE'S DAILY BRIEFING
--------------------------------------
DATE: ${briefingData.briefingDate || "____________________"}
MOD / LEAD: ${briefingData.modLead || "____________________"}
FOCUS / PRIORITY: ${briefingData.focusPriority || "____________________"}
LINE-UP TIME: ${briefingData.lineUpTime || "____________________"}

TODAY'S FORECASTED VOLUME:
  Lunch (AM): ${briefingData.amGuests} guests
  Dinner (PM): ${briefingData.pmGuests} guests

YESTERDAY'S FORECAST vs ACTUAL:
  Forecasted Sales: ${briefingData.yestForecastSales}
  Actual Sales: ${briefingData.yestActualSales}
  Variance: ${briefingData.yestVariance}%
  Notes on Variance: ${briefingData.varianceNotes || "N/A"}
--------------------------------------

PRE-SHIFT ENERGIZER:
  ${briefingData.preShiftEnergizerLabel || "N/A"}

86’D ITEMS OR MENU SHIFTS:
  ${briefingData.eightySixItems || "N/A"}

STAFFING NOTES (Callouts, Roles, Adjustments):
  ${briefingData.staffingNotes || "N/A"}

GUEST FEEDBACK OR FOLLOW-UPS (From Surveys, Manager Logs, Team Notes):
  ${briefingData.guestFeedback || "N/A"}

OTHER NOTES / REMINDERS:
  ${briefingData.otherNotes || "N/A"}

--------------------------------------
Have a great shift!
  `.trim();
};