// src/lib/weather.js
import { supabase } from "@/supabaseClient";

export async function getWeatherForecast(locationUuid, date) {
  const { data, error } = await supabase
    .from("weather_data") // ✅ use the real table name here
    .select("*")
    .eq("location_id", locationUuid) // ✅ still correct
    .eq("forecast_date", date)       // ✅ use the real column name here
    .single();

  if (error) {
    console.error("Failed to load weather forecast:", error);
    return null;
  }

  return data;
}
