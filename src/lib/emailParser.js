export function parseWeeklyForecastEmail(text) {
  const lines = text.split("\n");
  const forecast = [];

  for (let line of lines) {
    // Match pattern: Day MM/DD/YYYY – X guests
    const match = line.match(
      /^(\w{3}) (\d{2}\/\d{2}\/\d{4})\s+[–-]\s+([\d,]+)\s+guests$/i
    );

    if (match) {
      const [, day, date, guestCount] = match;
      forecast.push({
        day,
        date,
        guests: parseInt(guestCount.replace(/,/g, ""), 10),
      });
    }
  }

  return forecast;
}
