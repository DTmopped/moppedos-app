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
    <div className="space-y-6">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="rounded-lg border border-slate-300 shadow bg-white">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-t-lg border-b border-slate-200"
            >
              <div>
                <h4 className="text-base font-semibold text-slate-800">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-xs text-slate-500">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
              {isExpanded ? <ChevronDown className="text-slate-600" /> : <ChevronRight className="text-slate-600" />}
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-white space-y-6">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div
                      key={shiftKey}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                    >
                      <h5 className="text-md font-semibold text-slate-700 mb-3">
                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      {shift.prepItems.length === 0 ? (
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Info size={14} /> No prep items listed.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-600">
                              <th className="text-left py-1">Item</th>
                              <th className="text-right py-1">Qty</th>
                              <th className="text-left py-1">Unit</th>
                              <th className="text-left py-1">Assigned To</th>
                              <th className="text-center py-1">Done</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shift.prepItems.map((item) => (
                              <tr key={item.id} className="border-t border-slate-200">
                                <td className="py-1 text-slate-800">{item.name}</td>
                                <td className="py-1 text-right text-slate-700 font-mono">{item.quantity}</td>
                                <td className="py-1 text-slate-600">{item.unit}</td>
                                <td className="py-1">
                                  <input
                                    type="text"
                                    placeholder="Assign"
                                    className="w-full px-2 py-1 border border-slate-300 rounded"
                                  />
                                </td>
                                <td className="py-1 text-center">
                                  <input type="checkbox" />
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
