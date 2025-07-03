import React from "react";

const MenuEditorSection = ({
  section,
  items,
  setItemName,
  setItemValue,
  setItemUnit,
  itemName,
  itemValue,
  itemUnit,
  saveMenuItem,
  removeMenuItem,
  closeEditor,
}) => {
  return (
    <div className="mb-8 p-4 rounded-md shadow-md bg-gray-800 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{section}</h3>
        <button
          onClick={closeEditor}
          className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          Close Editor
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm font-semibold">Item Name</label>
        <input
          type="text"
          placeholder="e.g. Brisket"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 text-sm font-semibold">Portion Size</label>
          <input
            type="text"
            placeholder="e.g. 4"
            className="w-full p-2 rounded bg-gray-700 text-white"
            value={itemValue}
            onChange={(e) => setItemValue(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label className="block mb-1 text-sm font-semibold">Unit</label>
          <select
            className="w-full p-2 rounded bg-gray-700 text-white"
            value={itemUnit}
            onChange={(e) => setItemUnit(e.target.value)}
          >
            <option value="oz">oz</option>
            <option value="each">each</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => saveMenuItem(section)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
      >
        Save Item
      </button>

      <div className="mt-6">
        <p className="text-sm font-bold underline mb-2">Current Items:</p>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
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
  );
};

export default MenuEditorSection;
