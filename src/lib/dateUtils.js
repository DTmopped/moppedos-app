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

export const getDayFromDate = (dateString, dayOffset) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day); // Always builds correct date

  baseDate.setDate(baseDate.getDate() + dayOffset);

  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

  // Normalize to start of day
  baseDate.setHours(0, 0, 0, 0);

  // Add offset in days
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
