// src/lib/weather.js
import { supabase } from "@/supabaseClient";

export async function getWeatherForecast(locationUuid, date) {
  const { data, error } = await supabase
    .from("weather_data")
    .select("*")
    .eq("location_id", locationUuid)
    .eq("forecast_date", date) // confirm this matches your column name
    .maybeSingle(); // ✅ <-- use this safely when row may not exist

  if (error) {
    console.error("Failed to load weather forecast:", error);
    return null;
  }

  return data;
}
