import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL" )!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    console.log("🔄 Starting daily briefing autofill...");
    
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get locations from the locations table
    const { data: locations, error: locationErr } = await supabase
      .from("locations")
      .select("uuid, name");

    if (locationErr) {
      console.error("❌ Failed to load locations:", locationErr.message);
      return new Response(`❌ Failed to load locations: ${locationErr.message}`, { status: 500 });
    }

    if (!locations || locations.length === 0) {
      console.warn("⚠️ No locations found");
      return new Response("⚠️ No locations found", { status: 200 });
    }

    console.log(`📍 Found ${locations.length} locations to process`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const loc of locations) {
      try {
        console.log(`🏪 Processing location: ${loc.name} (UUID: ${loc.uuid})`);
        
        // Check if we already have a briefing for today
        const { data: existingBriefing } = await supabase
          .from("daily_briefings")
          .select("id")
          .eq("location_id", loc.uuid)
          .eq("date", today)
          .maybeSingle();
          
        if (existingBriefing) {
          console.log(`⏭️ Briefing already exists for ${loc.name} on ${today}, skipping...`);
          continue;
        }

        // Get yesterday's briefing to carry over notes and other content
        const { data: yesterdayBriefing } = await supabase
          .from("daily_briefings")
          .select("*")
          .eq("location_id", loc.uuid)
          .eq("date", yesterdayStr)
          .maybeSingle();

        // Get location details including lat/long from store_locations
        const { data: storeLocation } = await supabase
          .from("store_locations")
          .select("id, latitude, longitude")
          .eq("id", loc.uuid)
          .maybeSingle();

        // Get weather data if we have coordinates
        let weatherData = {
          icon: "01d", // default: clear sky
          conditions: "☀️ Clear day",
          high: 75,
          low: 60
        };

        if (storeLocation?.latitude && storeLocation?.longitude) {
          try {
            const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
            if (apiKey) {
              console.log(`🌤️ Fetching weather for ${loc.name} at ${storeLocation.latitude},${storeLocation.longitude}`);
              
              const weatherRes = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${storeLocation.latitude}&lon=${storeLocation.longitude}&units=imperial&appid=${apiKey}`
               );

              if (weatherRes.ok) {
                const weatherJson = await weatherRes.json();
                const dayForecasts = weatherJson.list.filter((entry: any) =>
                  entry.dt_txt.startsWith(today)
                );

                if (dayForecasts.length > 0) {
                  const high = Math.max(...dayForecasts.map((f: any) => f.main.temp_max));
                  const low = Math.min(...dayForecasts.map((f: any) => f.main.temp_min));

                  const amConditions = dayForecasts
                    .slice(0, Math.min(4, dayForecasts.length))
                    .map((f: any) => f.weather[0].description)
                    .join(", ");
                    
                  const pmConditions = dayForecasts
                    .slice(4)
                    .map((f: any) => f.weather[0].description)
                    .join(", ");

                  let conditions = "";
                  if (amConditions.includes("rain")) conditions += "🌧️ Rainy AM, ";
                  if (pmConditions.includes("clear") || pmConditions.includes("sun")) conditions += "☀️ Clear PM, ";
                  conditions += `High ${Math.round(high)}°F, Low ${Math.round(low)}°F`;

                  weatherData = {
                    icon: dayForecasts[0].weather[0].icon,
                    conditions: conditions,
                    high: Math.round(high),
                    low: Math.round(low)
                  };
                }
              }
            }
          } catch (weatherErr) {
            console.warn(`⚠️ Weather API error for ${loc.name}:`, weatherErr);
            // Continue with default weather data
          }
        }

        // Pull forecast + actuals from fva_daily_history
        const { data: fvaData } = await supabase
          .from("fva_daily_history")
          .select("forecast_sales, am_guests, pm_guests, actual_sales, date")
          .eq("location_uuid", loc.uuid)
          .in("date", [today, yesterdayStr]);

        const todayData = fvaData?.find((d) => d.date === today);
        const ydayData = fvaData?.find((d) => d.date === yesterdayStr);

        // Create the new briefing, carrying over content from yesterday
        const newBriefing = {
          location_id: loc.uuid,
          date: today,
          lunch: todayData?.am_guests ?? null,
          dinner: todayData?.pm_guests ?? null,
          forecasted_sales: todayData?.forecast_sales ?? null,
          actual_sales: ydayData?.actual_sales ?? null,
          weather_icon: weatherData.icon,
          weather_conditions: weatherData.conditions,
          weather_temp_high: weatherData.high,
          weather_temp_low: weatherData.low,
          created_at: new Date().toISOString(),
          
          // Carry over content from yesterday's briefing if available
          forecast_notes: yesterdayBriefing?.forecast_notes ?? null,
          reminders: yesterdayBriefing?.reminders ?? null,
          mindset: yesterdayBriefing?.mindset ?? null,
          food_items: yesterdayBriefing?.food_items ?? null,
          food_image_url: yesterdayBriefing?.food_image_url ?? null,
          beverage_items: yesterdayBriefing?.beverage_items ?? null,
          beverage_image_url: yesterdayBriefing?.beverage_image_url ?? null,
          events: yesterdayBriefing?.events ?? null,
          repair_notes: yesterdayBriefing?.repair_notes ?? null,
          manager: yesterdayBriefing?.manager ?? null,
        };

        // Insert the new briefing
        const { data: briefing, error: briefingError } = await supabase
          .from("daily_briefings")
          .upsert(newBriefing)
          .select();

        if (briefingError) {
          console.error(`❌ Failed to create briefing for ${loc.name}:`, briefingError);
          errorCount++;
        } else {
          console.log(`✅ Created briefing for ${loc.name} with carried-over content`);
          successCount++;
        }

      } catch (err) {
        console.error(`❌ Failed for location ${loc.name}:`, err);
        errorCount++;
      }
    }

    return new Response(
      `✅ Daily briefings process complete: ${successCount} created, ${errorCount} errors`, 
      { status: 200 }
    );
    
  } catch (err) {
    console.error("❌ Fatal error:", err);
    return new Response(`❌ Fatal error: ${err.message}`, { status: 500 });
  }
});


   
  
    

