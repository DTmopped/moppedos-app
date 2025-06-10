import React from 'react';

export const extractValueUtil = (text, label) => {
  const regex = new RegExp(`${label}:\\s*\\$?([\\d,\\.]+)`, "i");
  const match = text.match(regex);
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
};

export const PERFORMANCE_LOG_REQUIRED_KEYS = [
  "date", "forecasted sales", "forecasted food", "forecasted bev", 
  "forecasted labor", "total sales", "food cost", "beverage cost", "labor cost"
];

export const parseSinglePerformanceLogEntry = (entryRaw) => {
  const data = {};
  const lines = entryRaw.split("\n");
  if (lines.length < PERFORMANCE_LOG_REQUIRED_KEYS.length) {
    throw new Error(`Incomplete data for an entry. Each entry needs at least ${PERFORMANCE_LOG_REQUIRED_KEYS.length} fields. Problematic entry starts with: "${lines[0]}"`);
  }

  lines.forEach(line => {
    const parts = line.split(":").map(s => s.trim());
    if (parts.length === 2) {
      const key = parts[0].toLowerCase().replace(/\s+/g, ' ');
      data[key] = !isNaN(parseFloat(parts[1])) ? parseFloat(parts[1]) : parts[1];
    } else if (line.trim() !== "") {
       throw new Error(`Invalid line format: "${line}". Ensure each line is 'Key: Value'.`);
    }
  });
  
  for (const key of PERFORMANCE_LOG_REQUIRED_KEYS) {
    if (data[key] === undefined) throw new Error(`Missing key "${key}" in one of the entries. Entry starts with: "${lines[0]}"`);
  }

  const salesF = data["forecasted sales"] || 0;
  const salesA = data["total sales"] || 0;
  const foodF = data["forecasted food"] || 0;
  const foodA = data["food cost"] || 0;
  const bevF = data["forecasted bev"] || 0;
  const bevA = data["beverage cost"] || 0;
  const labF = data["forecasted labor"] || 0;
  const labA = data["labor cost"] || 0;

  const foodPct = salesA > 0 ? (foodA / salesA) * 100 : 0;
  const bevPct = salesA > 0 ? (bevA / salesA) * 100 : 0;
  const labPct = salesA > 0 ? (labA / salesA) * 100 : 0;

  const alerts = [];
  if (foodPct > 30) alerts.push({ text: "Food Over", type: "error" });
  if (bevPct > 20) alerts.push({ text: "Bev Over", type: "error" });
  if (labPct > 14) alerts.push({ text: "Labor Over", type: "error" });

  return {
    date: data["date"] || "N/A",
    salesF, salesA,
    foodF, foodA,
    bevF, bevA,
    labF, labA,
    foodPct, bevPct, labPct,
    alerts,
    isPerformanceLog: true, 
  };
};


export const parsePosActualsEntry = (text, requiredKeys, addActualEntryCallback, toastCallback, targetFoodPct, targetBevPct, targetLaborPct) => {
    const dateMatch = text.match(/date:\s*([\d\-]+)/i);
    const date = dateMatch ? dateMatch[1] : "N/A";

    if (date === "N/A") {
      throw new Error("Date not found in POS actuals input. Please ensure it's in the format 'Date: YYYY-MM-DD'.");
    }

    const actualSales = extractValueUtil(text, "total net sales");
    const foodCost = extractValueUtil(text, "food cost");
    const beverageCost = extractValueUtil(text, "beverage cost");
    const laborCost = extractValueUtil(text, "labor cost");
    const laborHoursMatch = text.match(/labor hours:\s*([\d\.]+)/i);
    const laborHours = laborHoursMatch ? parseFloat(laborHoursMatch[1]) : null;

    for (const key of requiredKeys) {
        if (key === "date") continue;
        if (extractValueUtil(text, key.replace("total net sales", "total net sales")) === null) {
             throw new Error(`'${key.charAt(0).toUpperCase() + key.slice(1)}' field not found or invalid in POS actuals. Please ensure it's in the format 'Key: $X,XXX.XX'.`);
        }
    }
    if (laborHours === null && text.toLowerCase().includes("labor hours:")) {
        throw new Error("Labor Hours field is present in POS actuals but has an invalid value.");
    }

    let foodPct = "N/A", bevPct = "N/A", laborPct = "N/A";
    let foodVariance = "N/A", bevVariance = "N/A", laborVariance = "N/A";

    if (actualSales === 0) {
      
    } else if (actualSales > 0) {
      foodPct = ((foodCost / actualSales) * 100).toFixed(1);
      bevPct = ((beverageCost / actualSales) * 100).toFixed(1);
      laborPct = ((laborCost / actualSales) * 100).toFixed(1);

      foodVariance = (parseFloat(foodPct) - targetFoodPct).toFixed(1);
      bevVariance = (parseFloat(bevPct) - targetBevPct).toFixed(1);
      laborVariance = (parseFloat(laborPct) - targetLaborPct).toFixed(1);
    }
    
    const dataForContext = { date, actualSales, foodCost, beverageCost, laborCost };
    addActualEntryCallback(dataForContext);

    toastCallback({
      title: "POS Actuals Logged",
      description: `Data for ${date} has been parsed and saved.`,
    });

    return {
      date,
      sales: actualSales.toFixed(2),
      food: foodCost.toFixed(2), foodPct, foodVariance,
      bev: beverageCost.toFixed(2), bevPct, bevVariance,
      labor: laborCost.toFixed(2), laborPct, laborVariance,
      hours: laborHours === null ? 'N/A' : laborHours.toString(),
      isPerformanceLog: false,
    };
};