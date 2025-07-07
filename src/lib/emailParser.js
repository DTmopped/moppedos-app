export function parseWeeklyForecastEmail(text) {
  const lines = text.split("\n").map(line => line.trim());
  const forecast = [];

  for (const line of lines) {
    const match = line.match(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{2}\/\d{2}\/\d{4})\s+[–-]\s+([\d,]+)\s+guests/i
    );

    if (match) {
      const [, day, date, guestsRaw] = match;
      const guests = parseInt(guestsRaw.replace(/,/g, ""), 10);

      forecast.push({ day, date, guests });
    }
  }

  return forecast;
}
