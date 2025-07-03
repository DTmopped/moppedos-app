import React, { useState } from "react";

const MenuEditorComponent = ({ data, setData }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemSize, setNewItemSize] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("oz");

  // 🛡️ Guard to avoid null crash
  if (!data || typeof data !== "object") return null;

  const handleEditClick = (section) => {
    setEditingSection(section === editingSection ? null : section);
    setNewItemName("");
    setNewItemSize("");
    setNewItemUnit("oz");
  };

  const saveNewItem = () => {
    if (!newItemName || !newItemSize || !newItemUnit) return;
    const updatedData = { ...data };
    if (!updatedData[editingSection]) {
      updatedData[editingSection] = [];
    }
    updatedData[editingSection].push({
      name: newItemName,
      perGuestOz: newItemUnit === "oz" ? Number(newItemSize) : undefined,
      each: newItemUnit === "each" ? Number(newItemSize) : undefined,
      value: newItemUnit === "lb" ? Number(newItemSize) : undefined,
      unit: newItemUnit,
    });
    setData(updatedData);
    setNewItemName("");
    setNewItemSize("");
    setNewItemUnit("oz");
  };

  const removeMenuItem = (section, itemName) => {
    const updatedData = { ...data };
    updatedData[section] = updatedData[section].filter(
      (item) => item.name !== itemName
    );
    setData(updatedData);
  };

  return (
    <div className="space-y-8">
      {Object.keys(data).map((section) => (
        <div key={section} className="bg-gray-800 rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">
              {section.replaceAll(" B B Q", " BBQ")}
            </h3>
            <button
              onClick={() => handleEditClick(section)}
              className="text-sm px-2 py-1 bg-white text-gray-800 rounded shadow"
            >
              {editingSection === section ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editingSection === section && (
            <>
              <div className="mb-2">
                <span className="inline-block px-2 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded shadow-sm">
                  🔧 Editing: {section.replaceAll(" B B Q", " BBQ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  className="col-span-1 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded"
                  placeholder="Item Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <input
                  type="text"
                  className="col-span-1 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded"
                  placeholder="e.g. 4"
                  value={newItemSize}
                  onChange={(e) => setNewItemSize(e.target.value)}
                />
                <select
                  className="col-span-2 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                >
                  <option value="oz">oz</option>
                  <option value="each">each</option>
                  <option value="lb">lb</option>
                </select>
              </div>
              <button
                onClick={saveNewItem}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded"
              >
                Save Item
              </button>
            </>
          )}

          {data[section] && data[section].length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-300 underline mb-2">
                Current Items:
              </p>
              <ul className="space-y-2">
                {data[section].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded shadow-sm"
                  >
                    <span className="text-white text-sm">
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
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuEditorComponent;
