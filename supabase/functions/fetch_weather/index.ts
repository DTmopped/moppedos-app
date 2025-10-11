import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL" )!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: stores, error } = await supabase
    .from("store_locations")
    .select("id, uuid, name, latitude, longitude")
    .eq("is_active", true);

  if (error || !stores || stores.length === 0) {
    console.error("❌ Failed to fetch store_locations:", error?.message);
    return new Response("❌ Failed to load store_locations", { status: 500 });
  }

  let created = 0;
  let failed = 0;

  for (const store of stores) {
    try {
      const { data: existing } = await supabase
        .from("daily_briefings")
        .select("id")
        .eq("location_id", store.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) continue;

      const lat = store.latitude;
      const lon = store.longitude;

      let weather = {
        icon: "01d",
        conditions: "Clear sky, High 75°F, Low 60°F",
        high: 75,
        low: 60,
      };

      if (lat && lon) {
        try {
          const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
           );

          const json = await res.json();
          const todayForecast = json.list.filter((f: any) =>
            f.dt_txt.startsWith(today)
          );

          if (todayForecast.length) {
            const high = Math.round(
              Math.max(...todayForecast.map((f: any) => f.main.temp_max))
            );
            const low = Math.round(
              Math.min(...todayForecast.map((f: any) => f.main.temp_min))
            );

            const am = todayForecast.slice(0, 4).map((f: any) => f.weather[0].description).join(", ");
            const pm = todayForecast.slice(4).map((f: any) => f.weather[0].description).join(", ");

            let summary = "";
            if (am.includes("rain")) summary += "🌧️ Rainy AM, ";
            if (pm.includes("clear") || pm.includes("sun")) summary += "☀️ Clear PM, ";
            summary += `High ${high}°F, Low ${low}°F`;

            weather = {
              icon: todayForecast[0].weather[0].icon,
              conditions: summary,
              high,
              low,
            };
          }
        } catch (err) {
          console.warn(`⚠️ Weather API failed for ${store.name}:`, err);
        }
      }

      const { data: yBrief } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", store.id)
        .eq("date", yesterdayStr)
        .maybeSingle();

      const { data: fva } = await supabase
        .from("fva_daily_history")
        .select("forecast_sales, am_guests, pm_guests, actual_sales")
        .eq("location_uuid", store.uuid)
        .in("date", [today, yesterdayStr]);

      const todayFva = fva?.find((f) => f.date === today);
      const ydayFva = fva?.find((f) => f.date === yesterdayStr);

      const { error: insertError } = await supabase
        .from("daily_briefings")
        .upsert({
          location_id: store.id,
          date: today,
          lunch: todayFva?.am_guests ?? null,
          dinner: todayFva?.pm_guests ?? null,
          forecasted_sales: todayFva?.forecast_sales ?? null,
          actual_sales: ydayFva?.actual_sales ?? null,
          forecast_notes: yBrief?.forecast_notes ?? null,
          reminders: yBrief?.reminders ?? null,
          mindset: yBrief?.mindset ?? null,
          food_items: yBrief?.food_items ?? null,
          food_image_url: yBrief?.food_image_url ?? null,
          beverage_items: yBrief?.beverage_items ?? null,
          beverage_image_url: yBrief?.beverage_image_url ?? null,
          events: yBrief?.events ?? null,
          repair_notes: yBrief?.repair_notes ?? null,
          manager: yBrief?.manager ?? null,
          weather_icon: weather.icon,
          weather_conditions: weather.conditions,
          weather_temp_high: weather.high,
          weather_temp_low: weather.low,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`❌ Failed to insert for ${store.name}:`, insertError);
        failed++;
      } else {
        console.log(`✅ Briefing created for ${store.name}`);
        created++;
      }
    } catch (err) {
      console.error(`❌ Uncaught error for ${store.name}:`, err);
      failed++;
    }
  }

  return new Response(
    `✅ fetch_weather complete: ${created} briefings created, ${failed} failed`,
    { status: 200 }
  );
});

   
  
    

