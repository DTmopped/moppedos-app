export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export const COST_PERCENTAGES = {
  food: 0.32,
  bev: 0.07,
  labor: 0.25
};

export function getDayFromDate(baseDateStr, dayOffset = 0) {
  const baseDate = new Date(baseDateStr);
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid base date");
  }

  // Normalize to start of day
  baseDate.setHours(0, 0, 0, 0);

  // Add offset in days
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
