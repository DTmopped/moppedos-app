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
  const date = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};
