// src/lib/weather.js
import { supabase } from "@/supabaseClient";

export async function getWeatherForecast(locationUuid, date) {
  const { data, error } = await supabase
    .from("weather_forecast")
    .select("*")
    .eq("location_id", locationUuid)
    .eq("date", date)
    .single();

  if (error) {
    console.error("Failed to load weather forecast:", error);
    return null;
  }

  return data;
}
