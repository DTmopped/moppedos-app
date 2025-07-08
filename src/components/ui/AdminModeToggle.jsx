import React, { useState, useEffect } from 'react';

const AdminModeToggle = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminMode") === "true";
    setIsAdminMode(stored);
  }, []);

  const toggle = () => {
    const updated = !isAdminMode;
    setIsAdminMode(updated);
    localStorage.setItem("adminMode", updated.toString());
  };

  return (
    <button
      onClick={toggle}
      className={`px-4 py-2 rounded font-semibold transition-colors text-sm ${
        isAdminMode
          ? 'bg-yellow-500 text-black hover:bg-yellow-600'
          : 'bg-slate-800 text-white hover:bg-slate-700'
      }`}
    >
      {isAdminMode ? 'Admin Mode: ON' : 'Enable Admin Mode'}
    </button>
  );
};

export default AdminModeToggle;
