import React, { useState } from "react";
import { Info, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const sectionIcons = {
  "BBQ Meats": "🔥",
  "Sammies": "🥪",
  "Breads": "🍞",
  "Sides": "🧂",
  "Desserts": "🍰",
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
    <div className="space-y-4">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="border border-slate-300 rounded-lg bg-white shadow-sm">
            {/* Toggle Button */}
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div className="text-left">
                <h4 className="text-base font-semibold text-slate-800">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-sm text-slate-500">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
              {isExpanded ? <ChevronDown className="text-slate-700" /> : <ChevronRight className="text-slate-700" />}
            </button>

            {/* Prep Content */}
            {isExpanded && (
              <div className="px-4 py-4 space-y-6">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div key={shiftKey}>
                      <h5 className="text-base font-semibold text-slate-800 mb-2">
                        {shift.icon} {shift.name.toUpperCase()} SHIFT
                      </h5>

                      {Object.entries(shift.sections || {}).map(([sectionName, items]) => (
                        <div key={sectionName} className="mb-6">
                          <h6 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
                            {sectionIcons[sectionName] || "📦"} {sectionName}
                          </h6>

                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-left">
                                <th className="p-2 border-b w-1/4">Item</th>
                                <th className="p-2 border-b w-1/6 text-right">Qty</th>
                                <th className="p-2 border-b w-1/6">Unit</th>
                                <th className="p-2 border-b w-1/4">Assign</th>
                                <th className="p-2 border-b w-1/12 text-center">Done</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, i) => (
                                <tr
                                  key={item.id}
                                  className={cn(
                                    "border-b",
                                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                                  )}
                                >
                                  <td className="p-2 w-1/4 whitespace-nowrap">{item.name}</td>
                                  <td className="p-2 w-1/6 text-right">{item.quantity}</td>
                                  <td className="p-2 w-1/6">{item.unit}</td>
                                  <td className="p-2 w-1/4">
                                    <input
                                      type="text"
                                      placeholder="Assign"
                                      className="w-full px-2 py-1 border border-slate-300 rounded"
                                    />
                                  </td>
                                  <td className="p-2 w-1/12 text-center">
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
