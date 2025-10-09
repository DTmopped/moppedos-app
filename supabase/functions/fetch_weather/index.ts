import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL" )!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  try {
    console.log("🔄 Starting daily briefing autofill...");
    
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get all active locations with their UUIDs
    const { data: locations, error: locationErr } = await supabase
      .from("locations")
      .select("id, uuid, name, latitude, longitude")
      .eq("active", true); // Only get active locations if you have this column

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
          .eq("location_uuid", loc.uuid)
          .eq("date", today)
          .maybeSingle();
          
        if (existingBriefing) {
          console.log(`⏭️ Briefing already exists for ${loc.name} on ${today}, skipping...`);
          continue;
        }

        // Get weather data if we have coordinates
        let weatherData = null;
        if (loc.latitude && loc.longitude) {
          const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
          if (!apiKey) {
            console.warn("⚠️ No OpenWeather API key found");
          } else {
            console.log(`🌤️ Fetching weather for ${loc.name} at ${loc.latitude},${loc.longitude}`);
            
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.latitude}&lon=${loc.longitude}&units=imperial&appid=${apiKey}`
             );

            if (!weatherRes.ok) {
              console.error(`❌ Weather API error: ${weatherRes.status} ${weatherRes.statusText}`);
              throw new Error(`Weather API returned ${weatherRes.status}`);
            }

            weatherData = await weatherRes.json();
          }
        }

        // Process weather data
        let high = null;
        let low = null;
        let conditions = "";
        let icon = null;
        
        if (weatherData && weatherData.list) {
          const dayForecasts = weatherData.list.filter((entry) => 
            entry.dt_txt.startsWith(today)
          );

          if (dayForecasts.length > 0) {
            high = Math.max(...dayForecasts.map((f) => f.main.temp_max));
            low = Math.min(...dayForecasts.map((f) => f.main.temp_min));

            const amConditions = dayForecasts
              .slice(0, Math.min(4, dayForecasts.length))
              .map((f) => f.weather[0].description)
              .join(", ");
              
            const pmConditions = dayForecasts
              .slice(4)
              .map((f) => f.weather[0].description)
              .join(", ");

            if (amConditions.includes("rain")) conditions += "🌧️ Rainy AM, ";
            if (pmConditions.includes("clear") || pmConditions.includes("sun")) conditions += "☀️ Clear PM, ";
            conditions += `High ${Math.round(high)}°F, Low ${Math.round(low)}°F`;

            icon = dayForecasts[0].weather[0].icon;
          }
        }

        // Pull forecast + actuals
        const { data: fvaData, error: fvaError } = await supabase
          .from("fva_daily_history")
          .select("forecast_sales, am_guests, pm_guests, actual_sales, date")
          .eq("location_uuid", loc.uuid)
          .in("date", [today, yesterdayStr]);

        if (fvaError) {
          console.warn(`⚠️ Error fetching FVA data: ${fvaError.message}`);
        }

        const todayData = fvaData?.find((d) => d.date === today);
        const ydayData = fvaData?.find((d) => d.date === yesterdayStr);

        // Upsert briefing - IMPORTANT: Use location_uuid, not location_id
        const { data: briefing, error: briefingError } = await supabase
          .from("daily_briefings")
          .upsert({
            location_uuid: loc.uuid,  // Use UUID, not legacy ID
            date: today,
            lunch: todayData?.am_guests ?? null,
            dinner: todayData?.pm_guests ?? null,
            forecasted_sales: todayData?.forecast_sales ?? null,
            actual_sales: ydayData?.actual_sales ?? null,
            weather_icon: icon,
            weather_conditions: conditions,
            weather_temp_high: high,
            weather_temp_low: low,
            created_at: new Date().toISOString(),
          })
          .select();

        if (briefingError) {
          console.error(`❌ Failed to create briefing for ${loc.name}:`, briefingError);
          errorCount++;
        } else {
          console.log(`✅ Created briefing for ${loc.name}`);
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

   
  
    

