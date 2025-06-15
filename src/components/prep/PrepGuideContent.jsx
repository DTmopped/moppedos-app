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
          <div key={idx} className="border border-slate-700 rounded-lg">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-t-lg"
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
              {isExpanded ? (
                <ChevronDown className="text-white" />
              ) : (
                <ChevronRight className="text-white" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-slate-900 space-y-4 border-t border-slate-600">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div
                      key={shiftKey}
                      className="bg-slate-800 border border-slate-700 rounded-md p-4"
                    >
                      <h5 className="text-md font-semibold text-white mb-2">
                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      {shift.prepItems.length === 0 ? (
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <Info size={14} /> No prep items listed.
                        </p>
                      ) : (
                        <ul className="text-sm text-white space-y-1">
                          {shift.prepItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between border-b border-slate-700 py-1"
                            >
                              <span>{item.name}</span>
                              <span className="font-mono text-right">
                                {item.quantity} {item.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
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
