import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  console.log("🔄 Starting daily briefing autofill...");

  const { data: locations, error: locErr } = await supabase
    .from("store_locations")
    .select("id, name, latitude, longitude")
    .eq("is_active", true);

  if (locErr || !locations) {
    console.error("❌ Failed to load store locations:", locErr?.message);
    return new Response("❌ Failed to load locations", { status: 500 });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const loc of locations) {
    try {
      console.log(`📍 Processing: ${loc.name}`);

      // Skip if already created
      const { data: exists } = await supabase
        .from("daily_briefings")
        .select("id")
        .eq("location_id", loc.id)
        .eq("date", today)
        .maybeSingle();

      if (exists) {
        console.log(`⏭️ Skipping ${loc.name} (already exists)`);
        continue;
      }

      // Default weather
      let weather = {
        icon: "01d",
        conditions: "Clear sky, High 75°F, Low 60°F",
        high: 75,
        low: 60,
      };

      if (loc.latitude && loc.longitude) {
        try {
          const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.latitude}&lon=${loc.longitude}&units=imperial&appid=${apiKey}`
          );

          if (res.ok) {
            const json = await res.json();
            const todayForecasts = json.list.filter((f: any) =>
              f.dt_txt.startsWith(today)
            );

            if (todayForecasts.length > 0) {
              const high = Math.round(Math.max(...todayForecasts.map((f: any) => f.main.temp_max)));
              const low = Math.round(Math.min(...todayForecasts.map((f: any) => f.main.temp_min)));

              const am = todayForecasts.slice(0, 4).map((f: any) => f.weather[0].description).join(", ");
              const pm = todayForecasts.slice(4).map((f: any) => f.weather[0].description).join(", ");

              let desc = "";
              if (am.includes("rain")) desc += "🌧️ Rainy AM, ";
              if (pm.includes("clear") || pm.includes("sun")) desc += "☀️ Clear PM, ";
              desc += `High ${high}°F, Low ${low}°F`;

              weather = {
                icon: todayForecasts[0].weather[0].icon,
                conditions: desc,
                high,
                low,
              };
            }
          }
        } catch (err) {
          console.warn(`⚠️ Weather error for ${loc.name}:`, err.message);
        }
      }

      // Pull yesterday's content
      const { data: yesterdayBrief } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", loc.id)
        .eq("date", yesterdayStr)
        .maybeSingle();

      // Pull forecast & actuals
      const { data: fva } = await supabase
        .from("fva_daily_history")
        .select("date, forecast_sales, actual_sales, am_guests, pm_guests")
        .eq("location_id", loc.id)
        .in("date", [today, yesterdayStr]);

      const todayData = fva?.find((r) => r.date === today);
      const ydayData = fva?.find((r) => r.date === yesterdayStr);

      // Insert new briefing
      const { error: insertErr } = await supabase
        .from("daily_briefings")
        .insert({
          location_id: loc.id,
          date: today,
          lunch: todayData?.am_guests ?? null,
          dinner: todayData?.pm_guests ?? null,
          forecasted_sales: todayData?.forecast_sales ?? null,
          actual_sales: ydayData?.actual_sales ?? null,
          forecast_notes: yesterdayBrief?.forecast_notes ?? null,
          reminders: yesterdayBrief?.reminders ?? null,
          mindset: yesterdayBrief?.mindset ?? null,
          food_items: yesterdayBrief?.food_items ?? null,
          food_image_url: yesterdayBrief?.food_image_url ?? null,
          beverage_items: yesterdayBrief?.beverage_items ?? null,
          beverage_image_url: yesterdayBrief?.beverage_image_url ?? null,
          events: yesterdayBrief?.events ?? null,
          repair_notes: yesterdayBrief?.repair_notes ?? null,
          manager: yesterdayBrief?.manager ?? null,
          weather_icon: weather.icon,
          weather_conditions: weather.conditions,
          weather_temp_high: weather.high,
          weather_temp_low: weather.low,
          created_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.error(`❌ Failed to insert for ${loc.name}:`, insertErr.message);
        errorCount++;
      } else {
        console.log(`✅ Briefing created for ${loc.name}`);
        successCount++;
      }

    } catch (err) {
      console.error(`❌ Error processing ${loc.name}:`, err.message);
      errorCount++;
    }
  }

  return new Response(
    `✅ Processed ${successCount} locations. ❌ Errors: ${errorCount}`,
    { status: 200 }
  );
});

   
  
    

