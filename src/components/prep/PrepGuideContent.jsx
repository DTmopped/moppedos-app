import React, { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryMap = {
  "BBQ Meats": ["Pulled Pork", "Brisket", "Half Chicken", "STL Louis Ribs", "Beef Short Ribs"],
  Sandwiches: ["Pulled Pork Sandwich", "Brisket Sandwich"],
  Sides: ["Collard Greens", "Mac n Cheese", "Baked Beans", "Corn Casserole", "Corn Muffin", "Honey Butter", "Coleslaw"],
  Breads: ["Buns", "Texas Toast"],
  Desserts: ["Banana Pudding", "Key Lime Pie", "Hummingbird Cake"],
};

const getCategory = (itemName) => {
  for (const [category, items] of Object.entries(categoryMap)) {
    if (items.includes(itemName)) return category;
  }
  return "Other";
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
          <div key={idx} className="border border-slate-300 rounded-lg bg-white">
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
                <p className="text-xs text-slate-500">
                  Guests: {day.guests.toLocaleString()} &middot; AM: {day.amGuests.toLocaleString()} / PM: {day.pmGuests.toLocaleString()}
                </p>
              </div>
              {isExpanded ? <ChevronDown className="text-slate-800" /> : <ChevronRight className="text-slate-800" />}
            </button>

            {isExpanded && (
              <div className="px-4 py-4 bg-slate-50 space-y-4 border-t border-slate-300">
                {['am', 'pm'].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift) return null;

                  // Group items by category
                  const grouped = {};
                  for (const item of shift.prepItems) {
                    const category = getCategory(item.name);
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push(item);
                  }

                  return (
                    <div key={shiftKey} className="bg-white border border-slate-200 rounded-md p-4 shadow">
                      <h5 className="text-md font-semibold text-slate-700 mb-3">
                        {shift.icon} {shift.name} SHIFT
                      </h5>
                      {Object.entries(grouped).map(([section, items]) => (
                        <div key={section} className="mb-4">
                          <h6 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">{section}</h6>
                          {items.length === 0 ? (
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                              <Info size={14} /> No prep items listed.
                            </p>
                          ) : (
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="text-left border-b border-slate-200">
                                  <th className="py-1">Item</th>
                                  <th className="py-1 text-right">Qty</th>
                                  <th className="py-1">Unit</th>
                                  <th className="py-1">Assign</th>
                                  <th className="py-1 text-center">Done</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-100">
                                    <td className="py-1 pr-2">{item.name}</td>
                                    <td className="py-1 text-right pr-2">{item.quantity}</td>
                                    <td className="py-1 pr-2">{item.unit}</td>
                                    <td className="py-1 pr-2">
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
