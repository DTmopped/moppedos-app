import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import useMenuManager from "@/hooks/useMenuManager";
import MenuEditorComponent from "@/components/prep/MenuEditorComponent"; // ✅ Correct placement

// 🧠 Categorize items by name
const categorizeItem = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes("sammies") || name.includes("sandwich")) return "Sandwiches";
  if (name.includes("bun") || name.includes("texas toast")) return "Breads";
  if (
    ["pulled pork", "brisket", "half chicken", "st louis ribs", "beef short rib"].some(m => name === m)
  ) return "BBQ Meats";
  if (
    ["slaw", "mac", "bean", "casserole", "collard", "corn muffin", "honey butter"].some(m => name.includes(m))
  ) return "Sides";
  if (
    ["pudding", "pie", "hummingbird"].some(m => name.includes(m))
  ) return "Desserts";
  return "Other";
};

const PrepGuideContent = ({
  dailyShiftPrepData,
  onPrepTaskChange,
  expandedDays,
  setExpandedDays,
  showEditor,
  setShowEditor
}) => {
  const { MenuEditorComponent: ManagedEditor } = useMenuManager("menu-data"); // Optional if using wrapped logic

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

  const categoryOrder = [
    "BBQ Meats",
    "Sandwiches",
    "Breads",
    "Sides",
    "Desserts",
    "Other"
  ];

  return (
    <div className="space-y-6">
      {showEditor && (
        <div className="my-6">
          <MenuEditorComponent /> {/* 👈 Or use <ManagedEditor /> if needed */}
        </div>
      )}

      {dailyShiftPrepData.map((day, idx) => {
        const isExpanded = expandedDays[day.date] || false;

        return (
          <div key={idx} className="border border-slate-300 rounded-lg bg-white shadow-sm">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-t-lg"
            >
              <div>
                <h4 className="text-md font-semibold text-gray-800">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Guests: {day.guests?.toLocaleString?.() || 0} &middot; AM: {day.amGuests?.toLocaleString?.() || 0} / PM: {day.pmGuests?.toLocaleString?.() || 0}
                </p>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-4 space-y-8">
                {["am", "pm"].map((shiftKey) => {
                  const shift = day.shifts?.[shiftKey];
                  if (!shift || !shift.prepItems) return null;

                  const categorized = {};
                  shift.prepItems.forEach((item) => {
                    const category = categorizeItem(item.name || "");
                    if (!categorized[category]) categorized[category] = [];
                    categorized[category].push(item);
                  });

                  return (
                    <div key={shiftKey}>
                      <h5 className="text-lg font-semibold text-gray-800 mb-2">
                        {shift.icon} {shift.name?.toUpperCase() || shiftKey.toUpperCase()} SHIFT
                      </h5>

                      {categoryOrder.map((category) => {
                        const items = categorized[category] || [];
                        if (items.length === 0) return null;

                        return (
                          <div key={category} className="mb-6">
                            <h6 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                              {category}
                            </h6>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="min-w-full text-sm text-gray-800">
                                <thead className="bg-slate-100 text-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-left w-1/3">Item</th>
                                    <th className="px-2 py-2 text-right w-1/12">Qty</th>
                                    <th className="px-2 py-2 text-left w-1/12">Unit</th>
                                    <th className="px-2 py-2 text-left w-1/4">Assign</th>
                                    <th className="px-2 py-2 text-center w-1/12">Done</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, index) => (
                                    <tr
                                      key={item.id || `${item.name}-${index}`}
                                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                    >
                                      <td className="px-4 py-2">{item.name}</td>
                                      <td className="px-2 py-2 text-right">{item.quantity}</td>
                                      <td className="px-2 py-2">{item.unit}</td>
                                      <td className="px-2 py-2">
                                        <input
                                          type="text"
                                          value={item.assignedTo || ''}
                                          onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, 'assignedTo', e.target.value)}
                                          placeholder="Assign"
                                          className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                      </td>
                                      <td className="px-2 py-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={item.completed || false}
                                          onChange={(e) => onPrepTaskChange(day.date, shiftKey, item.id, 'completed', e.target.checked)}
                                        />
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

const MemoizedPrepGuideContent = React.memo(PrepGuideContent);
export default MemoizedPrepGuideContent;
