import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const categorizeItem = (itemName) => {
  const name = itemName.toLowerCase();

  // Prioritize specific identifiers first
  if (name.includes("sammies") || name.includes("sandwich")) return "Sammies";
  if (name.includes("bun") || name.includes("texas toast")) return "Breads";
  if (
    ["pulled pork", "brisket", "half chicken", "st louis ribs", "beef short rib"].some(m => name === m)
  ) return "BBQ Meats";
  if (
    ["slaw", "mac", "bean", "casserole", "collard", "corn muffin", "honey butter"].some(m => name.includes(m))
  ) return "Sides";
  if (
    ["pudding", "pie", "hummingbird"].some(m => name.includes(m))
  ) return "Desserts";

  return "Other";
};

const PrepGuideContent = ({ dailyShiftPrepData }) => {
  const [expandedDays, setExpandedDays] = useState({});

  if (!dailyShiftPrepData || dailyShiftPrepData.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-10">
        No prep data available for this period.
      </div>
    );
  }

  const toggleDay = (date) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="space-y-6">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="border border-slate-300 rounded-lg bg-white shadow-sm">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div>
                <h4 className="text-md font-semibold text-gray-800">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-4 space-y-8">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  // Group items by category
                  const categorized = {};
                  shift.prepItems.forEach((item) => {
                    const category = categorizeItem(item.name);
                    if (!categorized[category]) categorized[category] = [];
                    categorized[category].push(item);
                  });

                  return (
                    <div key={shiftKey}>
                      <h5 className="text-lg font-semibold text-gray-800 mb-2">
                        {shift.icon} {shift.name.toUpperCase()} SHIFT
                      </h5>

                      {Object.entries(categorized).map(([category, items]) => (
                        <div key={category} className="mb-6">
                          <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            {category}
                          </h6>
                          <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
                            <thead className="bg-slate-100 text-gray-700">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">Item</th>
                                <th className="text-right px-3 py-2 font-medium">Qty</th>
                                <th className="text-left px-3 py-2 font-medium">Unit</th>
                                <th className="text-left px-3 py-2 font-medium">Assign</th>
                                <th className="text-center px-3 py-2 font-medium">Done</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                  <td className="px-3 py-2 text-gray-800">{item.name}</td>
                                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                                  <td className="px-3 py-2">{item.unit}</td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      placeholder="Assign"
                                      className="w-full border border-slate-300 rounded px-2 py-1"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <input type="checkbox" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PrepGuideContent;
