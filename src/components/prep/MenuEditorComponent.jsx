import React from "react";

const MenuEditorComponent = ({
  menu,
  editorsVisibility,
  toggleEditor,
  newItemForms,
  handleNewItemChange,
  addMenuItem,
  removeMenuItem,
}) => {
  const knownSections = ["BBQ", "Sandwiches", "Breads", "Sides", "Desserts"];

  const displayNameMap = {
    BBQ: "BBQ Meats",
    Sandwiches: "Sammies",
    Breads: "Breads",
    Sides: "Sides",
    Desserts: "Desserts",
  };

  const unitOptions = [
    { label: "oz", value: "oz" },
    { label: "each", value: "each" },
    { label: "lb", value: "lb" },
  ];

  const sections = knownSections.filter((section) => menu[section]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => (
        <div
          key={section}
          className="bg-slate-50 border border-slate-200 rounded-2xl shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              {displayNameMap[section] || section}
            </h2>
            <button
              onClick={() => toggleEditor(section)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              {editorsVisibility[section] ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editorsVisibility[section] && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Item Name"
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItemForms[section]?.name || ""}
                  onChange={(e) =>
                    handleNewItemChange(section, "name", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="e.g. 4"
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItemForms[section]?.value || ""}
                  onChange={(e) =>
                    handleNewItemChange(section, "value", e.target.value)
                  }
                />
                <select
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItemForms[section]?.unit || "oz"}
                  onChange={(e) =>
                    handleNewItemChange(section, "unit", e.target.value)
                  }
                >
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-semibold transition"
                onClick={() => addMenuItem(section)}
              >
                Save Item
              </button>
            </div>
          )}

          <div>
            <p className="text-sm text-slate-500 mb-2">Current Items:</p>
            <ul className="text-sm divide-y divide-slate-200">
              {(menu[section] || []).map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between items-center py-2"
                >
                  <span className="text-slate-800">
                    {item.name}{" "}
                    {item.unit === "oz" && `– ${item.perGuestOz || item.value} oz`}
                    {item.unit === "each" && `– ${item.each || item.value} each`}
                    {item.unit === "lb" && `– ${item.each || item.value} lb`}
                  </span>
                  <button
                    onClick={() => removeMenuItem(section, item.name)}
                    className="text-red-500 hover:text-red-600 text-xs font-medium"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuEditorComponent;
