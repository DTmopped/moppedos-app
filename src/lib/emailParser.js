export function parseWeeklyForecastEmail(text) {
  const lines = text.split("\n");
  const forecast = [];

  for (let line of lines) {
    // Match pattern: Day MM/DD/YYYY – X guests (supports various dash types)
    const match = line.match(
      /^(\w{3}) (\d{2})\/(\d{2})\/(\d{4})\s+[-–—]\s+([\d,]+)\s+guests$/i
    );

    if (match) {
      console.log("Parsed match:", match); // 🐛 Debug: Log each successful match

      const [_, day, month, dayNum, year, guestCount] = match;
      const date = `${month}/${dayNum}/${year}`;
      forecast.push({
        day,
        date,
        guests: parseInt(guestCount.replace(/,/g, ""), 10),
      });
    } else {
      console.warn("No match for line:", line); // 🐛 Debug: Warn if a line doesn’t match
    }
  }

  return forecast;
}
