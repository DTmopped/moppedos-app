import React, { useState } from "react";
import { Info } from "lucide-react";

const PrepGuideContent = ({ dailyShiftPrepData, onPrepTaskChange }) => {
  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (date) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const sectionOrder = ["BBQ MEATS", "SAMMIES", "BREADS", "SIDES", "DESSERTS"];

  const getSection = (itemName) => {
    const lower = itemName.toLowerCase();
    if (lower.includes("sammies")) return "SAMMIES";
    if (["pulled pork", "brisket", "half chicken", "st louis ribs", "beef short rib"].some(m => lower.includes(m))) return "BBQ MEATS";
    if (["buns", "texas toast"].some(m => lower.includes(m))) return "BREADS";
    if (["coleslaw", "collard greens", "mac", "baked beans", "corn", "honey"].some(m => lower.includes(m))) return "SIDES";
    if (["banana", "key lime", "hummingbird"].some(m => lower.includes(m))) return "DESSERTS";
    return "OTHER";
  };

  if (!dailyShiftPrepData || dailyShiftPrepData.length === 0) {
    return <div className="text-center text-sm text-muted-foreground mt-10">No prep data available for this period.</div>;
  }

  return (
    <div className="space-y-6">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;
        const categorized = {};

        ["am", "pm"].forEach((shiftKey) => {
          const shift = day.shifts?.[shiftKey];
          if (!shift) return;
          shift.prepItems.forEach((item) => {
            const section = getSection(item.name);
            if (!categorized[shiftKey]) categorized[shiftKey] = {};
            if (!categorized[shiftKey][section]) categorized[shiftKey][section] = [];
            categorized[shiftKey][section].push(item);
          });
        });

        return (
          <div key={idx} className="border border-slate-300 rounded-lg bg-white">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div>
                <h4 className="text-base font-medium text-slate-800">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests} / PM: {day.pmGuests}
                </p>
              </div>
              <span className="text-slate-600">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-6">
                {["am", "pm"].map((shiftKey) => (
                  categorized[shiftKey] ? (
                    <div key={shiftKey}>
                      <h5 className="text-sm font-semibold mb-2 text-slate-600">
                        {shiftKey === "am" ? "😊 AM SHIFT" : "🌙 PM SHIFT"}
                      </h5>
                      {sectionOrder.map((section) => (
                        categorized[shiftKey][section] ? (
                          <div key={section} className="mb-4">
                            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                              {section === "BBQ MEATS" ? "🔥 " : section === "SAMMIES" ? "🥪 " : section === "BREADS" ? "🍞 " : section === "SIDES" ? "🥗 " : section === "DESSERTS" ? "🍰 " : ""}
                              {section}
                            </h6>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-left">
                                  <th className="p-2 border-b">Item</th>
                                  <th className="p-2 border-b text-right">Qty</th>
                                  <th className="p-2 border-b text-left">Unit</th>
                                  <th className="p-2 border-b text-left">Assign</th>
                                  <th className="p-2 border-b text-center">Done</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categorized[shiftKey][section].map((item) => (
                                  <tr key={item.id} className="border-b">
                                    <td className="p-2">{item.name}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2">{item.unit}</td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        placeholder="Assign"
                                        className="w-full px-2 py-1 border border-slate-300 rounded"
                                        onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, "assignedTo", e.target.value)}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input
                                        type="checkbox"
                                        onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, "completed", e.target.checked)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null
                      ))}
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PrepGuideContent;
