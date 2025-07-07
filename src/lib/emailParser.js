export function parseWeeklyForecastEmail(text) {
  const lines = text.trim().split('\n');
  const forecast = [];

  for (let line of lines) {
    console.log(`Parsing line: ${line}`);
    const match = line.match(/(\w{3}) (\d{2}\/\d{2}\/\d{4}) — (\d{1,3}(?:,\d{3})*) guests/);

    console.log('Parsed match:', match);

    if (match) {
      const [, day, date, guestsStr] = match;
      const guests = parseInt(guestsStr.replace(/,/g, ''), 10);

      forecast.push({
        day,
        date,
        guests
      });
    }
  }

  console.log('Final forecast array:', forecast);
  return forecast;
}
