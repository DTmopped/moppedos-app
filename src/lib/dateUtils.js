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
 * Expects format: "Date: MM-DD-YYYY"
 * Returns: "YYYY-MM-DD" or null
 */
export const extractBaseDateFromWeeklyInput = (inputText) => {
  const lines = inputText.trim().split("\n");
  const dateLine = lines.find((line) =>
    /date:\s*(\d{2}-\d{2}-\d{4})/i.test(line)
  );
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
 * Uses UTC-safe math to avoid timezone-based shifts.
 */
export const getDayFromDate = (dateString, dayOffset = 0) => {
  const [year, month, day] = dateString.split("-").map(Number);

  // Build a new date explicitly in local time (not affected by UTC shift)
  const baseDate = new Date(year, month - 1, day); // local midnight
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
