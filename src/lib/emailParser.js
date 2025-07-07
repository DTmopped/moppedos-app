export function parseWeeklyForecastEmail(text) {
  const lines = text.split("\n").map(line => line.trim());
  const forecast = [];

  const dayRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i;
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const guestsRegex = /[\d,]+/;

  for (const line of lines) {
    if (dayRegex.test(line) && dateRegex.test(line) && guestsRegex.test(line)) {
      const [dayMatch] = line.match(dayRegex) || [];
      const [dateMatch] = line.match(dateRegex) || [];
      const [guestsMatch] = line.match(guestsRegex) || [];

      const guests = parseInt(guestsMatch.replace(/,/g, ""), 10);
      forecast.push({
        day: dayMatch,
        date: dateMatch,
        guests
      });
    }
  }

  return forecast;
}
