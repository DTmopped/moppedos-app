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
  const sectionLabels = {
    BBQ: "BBQ Meats",
    Sandwiches: "Sammies",
    Breads: "Breads",
    Sides: "Sides",
    Desserts: "Desserts",
  };

  const sections = Object.keys(sectionLabels);

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
          className="bg-slate-800 border border-slate-600 rounded-md p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold capitalize text-white">
              {sectionLabels[section]}
            </h2>
            <button
              onClick={() => toggleEditor(section)}
              className="text-xs border border-slate-500 rounded px-2 py-1 hover:bg-slate-600 text-white"
            >
              {editorsVisibility[section] ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editorsVisibility[section] && (
            <div className="bg-slate-700 rounded p-3 space-y-2 mb-3">
              <input
                type="text"
                placeholder="Item Name"
                className="w-full p-2 rounded bg-slate-800 text-white"
                value={newItemForms[section]?.name || ""}
                onChange={(e) =>
                  handleNewItemChange(section, "name", e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 4"
                  className="w-2/5 p-2 rounded bg-slate-800 text-white"
                  value={newItemForms[section]?.value || ""}
                  onChange={(e) =>
                    handleNewItemChange(section, "value", e.target.value)
                  }
                />
                <select
                  className="w-1/3 p-2 rounded bg-slate-800 text-white"
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
                className="w-full bg-purple-700 text-white py-2 rounded hover:bg-purple-800"
                onClick={() => addMenuItem(section)}
              >
                Add/Update
              </button>
            </div>
          )}

          <div className="mt-2">
            <p className="text-slate-300 text-sm mb-1">Current Items:</p>
            <ul className="text-white text-sm space-y-1">
              {(menu[section] || []).map((item) => (
                <li key={item.name} className="flex justify-between items-center">
                  <span>
                    {item.name}{" "}
                    {item.unit === "oz" && `(${item.perGuestOz} oz)`}
                    {item.unit === "each" && `(${item.each} each)`}
                    {item.unit === "lb" && `(${item.each || item.perGuestOz} lb)`}
                  </span>
                  <button
                    onClick={() => removeMenuItem(section, item.name)}
                    className="text-red-400 text-xs ml-2"
                  >
                    [X]
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
