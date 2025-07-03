import React from "react";

const MenuEditorComponent = ({
  menu,
  editorsVisibility,
  toggleEditor,
  newItemForms,
  handleNewItemChange,
  addMenuItem,
  removeMenuItem,
  sectionTitleColor = "from-indigo-400 to-purple-500",
}) => {
  const knownSections = ["BBQ", "Sandwiches", "Breads", "Sides", "Desserts"];

  const displayNameMap = {
    BBQ: "BBQ Meats",
    Sandwiches: "Sammies",
    Breads: "Breads",
    Sides: "Sides",
    Desserts: "Desserts",
  };

  const sections = knownSections.filter((section) => menu[section]);

  const unitOptions = [
    { label: "oz", value: "oz" },
    { label: "each", value: "each" },
    { label: "lb", value: "lb" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
      {sections.map((section) => (
        <div
          key={section}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-md transition-transform hover:scale-[1.01]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {displayNameMap[section] || section}
            </h2>
            <button
              onClick={() => toggleEditor(section)}
              className="text-xs font-medium border border-slate-500 rounded px-3 py-1 text-white hover:bg-slate-700 transition"
            >
              {editorsVisibility[section] ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editorsVisibility[section] && (
            <div className="bg-slate-700/60 rounded-lg p-4 space-y-3 border border-slate-600 mb-4">
              <input
                type="text"
                placeholder="Item Name"
                className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newItemForms[section]?.name || ""}
                onChange={(e) =>
                  handleNewItemChange(section, "name", e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 4"
                  className="w-2/5 p-2 rounded-md bg-slate-800 text-white border border-slate-600 focus:ring-2 focus:ring-purple-500"
                  value={newItemForms[section]?.value || ""}
                  onChange={(e) =>
                    handleNewItemChange(section, "value", e.target.value)
                  }
                />
                <select
                  className="w-1/3 p-2 rounded-md bg-slate-800 text-white border border-slate-600 focus:ring-2 focus:ring-purple-500"
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
                <span className="text-white text-sm">per guest</span>
              </div>
              <button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-md font-semibold shadow hover:from-purple-700 hover:to-indigo-700 transition"
                onClick={() => addMenuItem(section)}
              >
                Add / Update Item
              </button>
            </div>
          )}

          <div>
            <p className="text-slate-300 text-sm mb-2">Current Items:</p>
            <ul className="text-white text-sm divide-y divide-slate-700">
              {(menu[section] || []).map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between items-center py-1"
                >
                  <span>
                    {item.name}{" "}
                    {item.unit === "oz" && `(${item.perGuestOz} oz)`}
                    {item.unit === "each" && `(${item.each} each)`}
                    {item.unit === "lb" &&
                      `(${item.each || item.perGuestOz} lb)`}
                  </span>
                  <button
                    onClick={() => removeMenuItem(section, item.name)}
                    className="text-red-500 hover:text-red-400 text-xs font-medium transition"
                  >
                    ✕
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
