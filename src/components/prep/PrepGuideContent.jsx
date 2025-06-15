import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryOrder = [
  { key: "BBQ Meats", label: "🔥 BBQ MEATS" },
  { key: "Sammies", label: "🥪 SAMMIES" },
  { key: "Breads", label: "🍞 BREADS" },
  { key: "Sides", label: "🥕 SIDES" },
  { key: "Desserts", label: "🧁 DESSERTS" },
  { key: "Other", label: "📦 OTHER" }
];

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
    <div className="space-y-4">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="border border-slate-300 rounded-lg">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div>
                <h4 className="text-slate-800 font-medium">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-white border-t border-slate-300">
                {['am', 'pm'].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  const categorized = shift.prepItems.reduce((acc, item) => {
                    const category = item.category || 'Other';
                    acc[category] = acc[category] || [];
                    acc[category].push(item);
                    return acc;
                  }, {});

                  return (
                    <div key={shiftKey} className="mb-8">
                      <h5 className="text-md font-semibold text-slate-700 mb-2">\                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      {categoryOrder.map(({ key, label }) => {
                        const items = categorized[key];
                        if (!items || items.length === 0) return null;

                        return (
                          <div key={key} className="mb-6">
                            <h6 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                              {label}
                            </h6>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-slate-100 text-slate-600">
                                  <tr>
                                    <th className="text-left px-2 py-1">Item</th>
                                    <th className="text-right px-2 py-1">Qty</th>
                                    <th className="text-left px-2 py-1">Unit</th>
                                    <th className="text-left px-2 py-1">Assign</th>
                                    <th className="text-center px-2 py-1">Done</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, i) => (
                                    <tr
                                      key={item.id}
                                      className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                                    >
                                      <td className="px-2 py-1 text-slate-800">{item.name}</td>
                                      <td className="px-2 py-1 text-right text-slate-800">{item.quantity}</td>
                                      <td className="px-2 py-1 text-slate-800">{item.unit}</td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="text"
                                          placeholder="Assign"
                                          className="w-full px-2 py-1 border border-slate-300 rounded"
                                        />
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        <input type="checkbox" />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
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
