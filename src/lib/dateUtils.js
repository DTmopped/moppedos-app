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

export const getDayFromDate = (dateString, dayOffset = 0) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const inputDate = new Date(year, month - 1, day);

  // Align to Monday of the same week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const baseDay = inputDate.getDay();
  const daysToSubtract = baseDay === 0 ? 6 : baseDay - 1;
  inputDate.setDate(inputDate.getDate() - daysToSubtract);

  // Apply offset
  inputDate.setDate(inputDate.getDate() + dayOffset);

  const yyyy = inputDate.getFullYear();
  const mm = String(inputDate.getMonth() + 1).padStart(2, '0');
  const dd = String(inputDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
