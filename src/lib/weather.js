// src/lib/weather.js
export async function getWeatherForecast(locationUuid, date) {
  // Replace this with your real API or Supabase call if needed
  try {
    const response = await fetch(`https://wttr.in/?format=3`);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
}
