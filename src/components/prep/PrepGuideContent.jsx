import React, { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

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
          <div key={idx} className="border border-slate-300 rounded-lg bg-white shadow-md">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div>
                <h4 className="text-slate-800 font-semibold">
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
              {isExpanded ? <ChevronDown className="text-slate-800" /> : <ChevronRight className="text-slate-800" />}
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-white space-y-6 border-t border-slate-300">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div key={shiftKey}>
                      <h5 className="text-md font-semibold text-slate-800 mb-2">
                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      {shift.prepItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Info size={14} /> No prep items listed.
                        </p>
                      ) : (
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="text-left bg-slate-50">
                              <th className="p-2 border-b">Item</th>
                              <th className="p-2 border-b text-right">Qty</th>
                              <th className="p-2 border-b">Unit</th>
                              <th className="p-2 border-b">Assigned To</th>
                              <th className="p-2 border-b text-center">Done</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shift.prepItems.map((item) => (
                              <tr key={item.id} className="border-b">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2">{item.unit}</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    placeholder="Assign"
                                    className="w-full px-2 py-1 border border-slate-300 rounded"
                                  />
                                </td>
                                <td className="p-2 text-center">
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
