import React from 'react';
import { useData } from '@/contexts/DataContext'; // ✅ Use shared context

const AdminModeToggle = () => {
  const { isAdminMode, toggleAdminMode } = useData(); // ✅ Pull from context

  return (
    <button
      onClick={toggleAdminMode}
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
