// Define the order of days used for forecast processing
export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// Default cost percentages (can be overridden in localStorage)
export const COST_PERCENTAGES = {
  food: 0.32,
  bev: 0.07,
  labor: 0.25
};

/**
 * Extracts a base date string from input text.
 * Expects format: "Date: YYYY-MM-DD"
 */
export const extractBaseDateFromWeeklyInput = (inputText) => {
  const lines = inputText.trim().split("\n");
  const dateLine = lines.find((line) => /date:\s*(\d{2}-\d{2}-\d{4})/i.test(line));
  if (dateLine) {
    const match = dateLine.match(/date:\s*(\d{2})-(\d{2})-(\d{4})/i); // MM-DD-YYYY
    if (match) {
      const [, mm, dd, yyyy] = match;
      const formatted = `${yyyy}-${mm}-${dd}`;
      const testDate = new Date(formatted);
      if (!isNaN(testDate.getTime())) {
        return formatted;
      }
    }
  }
  return null;
};

/**
 * Returns a YYYY-MM-DD string offset from the provided date.
 * Assumes the input date is already Monday and does NOT realign it.
 */
export const getDayFromDate = (dateString, dayOffset = 0) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const inputDate = new Date(year, month - 1, day);

  // ✅ Just apply the offset directly
  inputDate.setDate(inputDate.getDate() + dayOffset);

  const yyyy = inputDate.getFullYear();
  const mm = String(inputDate.getMonth() + 1).padStart(2, '0');
  const dd = String(inputDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
