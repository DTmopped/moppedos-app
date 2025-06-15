import React, { useState } from "react";

const PrepGuideContent = ({ dailyShiftPrepData }) => {
  const [expandedDay, setExpandedDay] = useState(null);

  if (!dailyShiftPrepData || dailyShiftPrepData.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-10">
        No prep data available for this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dailyShiftPrepData.map((day, idx) => {
        const isOpen = expandedDay === idx;

        return (
          <div key={idx} className="border border-slate-700 rounded-lg bg-slate-900 shadow">
            <button
              onClick={() => setExpandedDay(isOpen ? null : idx)}
              className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-800 transition"
            >
              <div>
                <h4 className="text-white font-semibold text-lg">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                  })}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
              <span className="text-white">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 pt-0">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  return (
                    <div key={shiftKey} className="p-4 border border-slate-600 rounded-lg bg-slate-800">
                      <h5 className={`text-md font-semibold mb-2 ${shift.color}`}>
                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      <ul className="space-y-1 text-sm text-white">
                        {shift.prepItems.map((item) => (
                          <li key={item.id} className="flex justify-between border-b border-slate-700 py-1">
                            <span>{item.name}</span>
                            <span className="font-mono text-right">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
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
