import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid"; // optional icon

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

  return (
    <div className="border border-gray-700 p-4 rounded-lg bg-slate-800/50 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">{section}</h3>
        <button
          onClick={() => toggleEditor(section)}
          className="text-sm border border-gray-500 text-gray-300 px-2 py-1 hover:bg-slate-700"
        >
          {editorOpen ? "Close Editor" : "Edit Items"}
        </button>
      </div>

      {editorOpen && (
        <div className="space-y-4">
          <div>
            <div className="inline-flex items-center px-2 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded shadow-sm mb-3">
              ⚙️ Editing: {section}
            </div>

            <h4 className="text-sm text-gray-300 mb-1">
              Add or Update Item in <span className="font-bold">{section}</span>
            </h4>

            <input
              placeholder="Item Name"
              value={newItemForm?.name || ""}
              onChange={(e) => handleNewItemChange(section, "name", e.target.value)}
              className="w-full p-2 mb-2 bg-slate-700 text-white border border-gray-600 rounded"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Portion Size</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={newItemForm?.value || ""}
                  onChange={(e) => handleNewItemChange(section, "value", e.target.value)}
                  className="w-full p-2 bg-slate-700 text-white border border-gray-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Unit</label>
                <select
                  value={newItemForm?.unit || "oz"}
                  onChange={(e) => handleNewItemChange(section, "unit", e.target.value)}
                  className="w-full p-2 bg-slate-700 text-white border border-gray-600 rounded"
                >
                  <option value="oz">oz</option>
                  <option value="each">each</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => addMenuItem(section)}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
            >
              Save Item
            </button>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2 underline">Current Items:</h5>
            <ul className="space-y-1 max-h-40 overflow-y-auto text-sm text-gray-300">
              {sortedItems.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between items-center px-3 py-2 rounded hover:bg-slate-700/30"
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
                    className="ml-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded shadow-sm transition"
                  >
                    Remove
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
