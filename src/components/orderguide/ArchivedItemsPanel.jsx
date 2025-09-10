// src/components/orderguide/ArchivedItemsPanel.jsx

import React, { useEffect, useState } from "react";
import { supabase } from '@/supabaseClient';

const ArchivedItemsPanel = ({ category, onClose, onRestoreSuccess }) => {
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArchivedItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("manual_additions")
        .select("id, item_name")
        .eq("is_active", false)
        .eq("category", category)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching archived items:", error);
      } else {
        setArchivedItems(data || []);
      }

      setLoading(false);
    };

    fetchArchivedItems();
  }, [category]);

  const handleRestore = async (id) => {
    const { error } = await supabase
      .from("manual_additions")
      .update({ is_active: true })
      .eq("id", id);

    if (error) {
      console.error("Error restoring item:", error);
    } else {
      setArchivedItems((prev) => prev.filter((item) => item.id !== id));
      if (typeof onRestoreSuccess === "function") {
        onRestoreSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Archived Items – {category}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-sm"
          >
            ✖ Close
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : archivedItems.length === 0 ? (
          <p className="text-gray-400">No archived items found.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {archivedItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center py-2"
              >
                <span>{item.item_name}</span>
                <button
                  onClick={() => handleRestore(item.id)}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  ♻ Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ArchivedItemsPanel;

