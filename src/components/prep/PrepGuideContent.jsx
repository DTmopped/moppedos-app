import React, { useState } from "react";
import { Info } from "lucide-react";

const categoryMap = {
  "Pulled Pork (Sammies)": "Sammies",
  "Chopped Brisket (Sammies)": "Sammies",
  "Chopped Chicken (Sammies)": "Sammies",
  "Pulled Pork": "BBQ Meats",
  "Brisket": "BBQ Meats",
  "Half Chicken": "BBQ Meats",
  "St Louis Ribs": "BBQ Meats",
  "Beef Short Rib": "BBQ Meats",
  "Collard Greens": "Sides",
  "Mac N Cheese": "Sides",
  "Baked Beans": "Sides",
  "Corn Casserole": "Sides",
  "Corn Muffin": "Sides",
  "Honey Butter": "Sides",
  "Coleslaw": "Sides",
  "Buns": "Breads",
  "Texas Toast": "Breads",
  "Banana Pudding": "Desserts",
  "Key Lime Pie": "Desserts",
  "Hummingbird Cake": "Desserts"
};

const categoryIcons = {
  "Sammies": "🥪 Sammies",
  "BBQ Meats": "🔥 BBQ Meats",
  "Sides": "🥗 Sides",
  "Breads": "🍞 Breads",
  "Desserts": "🍰 Desserts",
  "Other": "📦 Other"
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

  const groupByCategory = (items) => {
    const groups = {};
    for (const item of items) {
      const category = categoryMap[item.name] || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    }
    return groups;
  };

  return (
    <div className="space-y-4">
      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="border border-slate-300 rounded-lg bg-white shadow">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-t-lg"
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
              <span className="text-slate-400">{isExpanded ? "▾" : "▸"}</span>
            </button>

            {isExpanded && (
              <div className="px-4 py-4 space-y-6">
                {['am', 'pm'].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  const groupedItems = groupByCategory(shift.prepItems);

                  return (
                    <div key={shiftKey}>
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">
                        {shift.icon} {shift.name.toUpperCase()} SHIFT
                      </h5>
                      {Object.keys(groupedItems).map((category) => (
                        <div key={category} className="mb-6">
                          <h6 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                            {categoryIcons[category] || category}
                          </h6>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-left">
                                <th className="p-2 border-b">Item</th>
                                <th className="p-2 border-b text-right">Qty</th>
                                <th className="p-2 border-b">Unit</th>
                                <th className="p-2 border-b">Assign</th>
                                <th className="p-2 border-b text-center">Done</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedItems[category].map((item) => (
                                <tr key={item.id} className="border-b">
                                  <td className="p-2 text-slate-800">{item.name}</td>
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
