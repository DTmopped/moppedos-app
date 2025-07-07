export function parseWeeklyForecastEmail(text) {
  const lines = text.split("\n");
  const forecast = [];

  for (let line of lines) {
    // Debug the line
    console.log("Parsing line:", line);

    const match = line.match(
      /^(\w{3}) (\d{2}\/\d{2}\/\d{4})\s+–\s+([\d,]+)\s+guests$/i
    );

    console.log("Parsed match:", match);

    if (match) {
      const [ , day, date, guestCount ] = match;
      const cleanedGuestCount = guestCount?.replace(/,/g, "");

      if (!cleanedGuestCount || isNaN(cleanedGuestCount)) {
        console.warn("Invalid guest count in line:", line);
        continue;
      }

      forecast.push({
        day,
        date,
        guests: parseInt(cleanedGuestCount, 10),
      });
    } else {
      console.warn("No match for line:", line);
    }
  }

  console.log("Final forecast array:", forecast);
  return forecast;
}
