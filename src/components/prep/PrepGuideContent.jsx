import React, { useState } from "react";
import { Info } from "lucide-react";

const categoryOrder = [
  "BBQ Meats",
  "Sammies",
  "Breads",
  "Sides",
  "Desserts",
];

const categoryIcons = {
  "Sammies": "🥪",
  "BBQ Meats": "🔥",
  "Sides": "🥗",
  "Breads": "🍞",
  "Desserts": "🍰",
};

const PrepGuideContent = ({ dailyShiftPrepData, onPrepTaskChange }) => {
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
      {dailyShiftPrepData.map((day) => {
        const isExpanded = expandedDays[day.date] || false;
        const dateObj = new Date(day.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        return (
          <div key={day.date} className="border border-slate-300 bg-white shadow rounded-md">
            <button
              className="w-full text-left px-4 py-3 bg-slate-100 border-b border-slate-300 text-slate-700 font-medium text-base flex justify-between items-center"
              onClick={() => toggleDay(day.date)}
            >
              <span>
                {formattedDate}
                <span className="block text-sm text-muted-foreground font-normal">
                  Guests: {day.guests} · AM: {day.amGuests} / PM: {day.pmGuests}
                </span>
              </span>
              <span>{isExpanded ? "▾" : "▸"}</span>
            </button>

            {isExpanded && ["am", "pm"].map((shiftKey) => {
              const shift = day.shifts?.[shiftKey];
              if (!shift || !shift.prepItems) return null;

              // Categorize items
              const categorized = {
                "Sammies": [],
                "BBQ Meats": [],
                "Breads": [],
                "Sides": [],
                "Desserts": [],
              };

              shift.prepItems.forEach((item) => {
                const name = item.name.toLowerCase();
                if (name.includes("(sammies)")) categorized["Sammies"].push(item);
                else if (["pulled pork", "brisket", "half chicken", "st louis ribs", "beef short rib"].some(v => name.includes(v))) categorized["BBQ Meats"].push(item);
                else if (["buns", "texas toast"].some(v => name.includes(v))) categorized["Breads"].push(item);
                else if (["collard greens", "mac n cheese", "baked beans", "corn casserole", "corn muffin", "honey butter", "coleslaw"].some(v => name.includes(v))) categorized["Sides"].push(item);
                else if (["banana pudding", "key lime pie", "hummingbird cake"].some(v => name.includes(v))) categorized["Desserts"].push(item);
                else categorized["Sides"].push(item); // fallback
              });

              return (
                <div key={shiftKey} className="px-4 py-4 border-t border-slate-200 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase mb-4">
                    {shift.icon} {shift.name} SHIFT
                  </h4>

                  {categoryOrder.map((category) => (
                    categorized[category]?.length > 0 && (
                      <div key={category} className="mb-6">
                        <h5 className="text-slate-600 text-xs font-bold uppercase tracking-wide mb-2">
                          {categoryIcons[category]} {category}
                        </h5>
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-slate-100 text-slate-600">
                            <tr>
                              <th className="text-left py-2 px-4">Item</th>
                              <th className="text-right py-2 px-4">Qty</th>
                              <th className="text-left py-2 px-2">Unit</th>
                              <th className="text-left py-2 px-2">Assign</th>
                              <th className="text-center py-2 px-2">Done</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categorized[category].map((item) => (
                              <tr key={item.id} className="border-t border-slate-200">
                                <td className="px-4 py-2 text-slate-800">{item.name}</td>
                                <td className="px-4 py-2 text-right text-slate-800">{item.quantity}</td>
                                <td className="px-2 py-2 text-slate-800">{item.unit}</td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    placeholder="Assign"
                                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    value={item.assignedTo || ""}
                                    onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, "assignedTo", e.target.value)}
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.completed || false}
                                    onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, "completed", e.target.checked)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default PrepGuideContent;
