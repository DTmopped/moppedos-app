import React, { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700"
            >
              <div>
                <h4 className="text-white font-medium">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-xs text-slate-400">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
              {isExpanded ? <ChevronDown className="text-white" /> : <ChevronRight className="text-white" />}
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-slate-900 space-y-6 border-t border-slate-700">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div
                      key={shiftKey}
                      className="bg-slate-800 border border-slate-600 rounded-md p-4"
                    >
                      <h5 className="text-md font-semibold text-green-400 mb-3">
                        {shift.icon} {shift.name.toUpperCase()} SHIFT
                      </h5>

                      {shift.prepItems.length === 0 ? (
                        <p className="text-sm text-slate-300 flex items-center gap-2">
                          <Info size={14} /> No prep items listed.
                        </p>
                      ) : (
                        <table className="w-full text-sm border-separate border-spacing-y-2">
                          <thead>
                            <tr className="text-slate-300">
                              <th className="text-left">Item</th>
                              <th className="text-right">Qty</th>
                              <th className="text-left">Unit</th>
                              <th className="text-left">Assign</th>
                              <th className="text-center">✓</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shift.prepItems.map((item) => (
                              <tr key={item.id} className="bg-slate-700 rounded">
                                <td className="px-2 py-1 text-white">{item.name}</td>
                                <td className="px-2 py-1 text-right font-mono text-white">{item.quantity}</td>
                                <td className="px-2 py-1 text-white">{item.unit}</td>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    placeholder="Assign"
                                    className="w-full px-2 py-1 rounded bg-slate-600 text-white border border-slate-500 text-sm"
                                  />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <input type="checkbox" className="form-checkbox h-4 w-4 text-green-500" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
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
