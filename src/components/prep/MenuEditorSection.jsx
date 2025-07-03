import React from "react";

const MenuEditorSection = ({
  section,
  items,
  editorOpen,
  toggleEditor,
  newItemForm,
  handleNewItemChange,
  addMenuItem,
  removeMenuItem,
}) => {
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

  // Clean section name: convert camelCase or "B B Q" to "BBQ"
  const displayName = section
    .replace(/\s+/g, "")      // Remove extra spaces (like "B B Q")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\bB B Q\b/gi, "BBQ") // Force correct 'BBQ' formatting
    .trim();

  return (
    <div className="border border-slate-600 p-4 rounded-lg bg-slate-700/60 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-slate-100">{displayName}</h3>
        <button
          onClick={() => toggleEditor(section)}
          className="text-xs border border-slate-500 text-slate-200 px-2 py-1 hover:bg-slate-600 rounded"
        >
          {editorOpen ? "Close Editor" : "Edit Items"}
        </button>
      </div>

      {editorOpen && (
        <div className="space-y-4 text-slate-100">
          <div className="bg-slate-800/50 p-4 rounded-md shadow-sm">
            <div className="flex items-center gap-2 text-yellow-900 bg-yellow-300 px-2 py-1 text-xs font-semibold rounded w-fit mb-3 shadow">
              <span>⚙️</span>
              <span>Editing: {displayName}</span>
            </div>

            <h4 className="text-sm font-medium text-slate-200 mb-1">
              Add or Update Item in <span className="font-bold">{displayName}</span>
            </h4>

            <input
              placeholder="Item Name"
              value={newItemForm?.name || ""}
              onChange={(e) => handleNewItemChange(section, "name", e.target.value)}
              className="w-full p-2 mb-2 bg-slate-800 text-slate-100 border border-slate-600 rounded placeholder-slate-400"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Portion Size</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={newItemForm?.value || ""}
                  onChange={(e) => handleNewItemChange(section, "value", e.target.value)}
                  className="w-full p-2 bg-slate-800 text-slate-100 border border-slate-600 rounded placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Unit</label>
                <select
                  value={newItemForm?.unit || "oz"}
                  onChange={(e) => handleNewItemChange(section, "unit", e.target.value)}
                  className="w-full p-2 bg-slate-800 text-slate-100 border border-slate-600 rounded"
                >
                  <option value="oz">oz</option>
                  <option value="each">each</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => addMenuItem(section)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium shadow-sm"
            >
              Save Item
            </button>
          </div>

          <div className="bg-slate-800/40 p-3 rounded shadow-inner">
            <h5 className="text-sm font-semibold text-slate-100 mb-2 underline">Current Items:</h5>
            <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
              {sortedItems.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between items-center px-2 py-1 bg-slate-700/40 border border-slate-600 rounded text-slate-100"
                >
                  <span>
                    <strong>{item.name}</strong> –{" "}
                    {item.perGuestOz
                      ? `${item.perGuestOz} oz`
                      : item.each
                      ? `${item.each} each`
                      : item.unit === "lb"
                      ? `${item.value} lb`
                      : "?"}
                  </span>
                  <button
                    onClick={() => removeMenuItem(section, item.name)}
                    className="text-red-400 hover:text-red-600 text-xs ml-2"
                  >
                    [remove]
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditorSection;
