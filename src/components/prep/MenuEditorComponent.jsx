import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { XCircle } from 'lucide-react';

const MenuEditorComponent = ({ menu, removeMenuItem }) => {
  const sortedMenu = React.useMemo(() => {
    const sorted = {};
    Object.keys(menu).forEach(section => {
      sorted[section] = [...(menu[section] || [])].sort((a, b) => a.name.localeCompare(b.name));
    });
    return sorted;
  }, [menu]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 px-2 sm:px-4">
      {Object.keys(sortedMenu).map(section => (
        <div key={section} className="rounded-md border border-slate-700 bg-slate-800/70 p-4 shadow">
          <h3 className="text-md font-semibold text-slate-200 mb-2">{section}</h3>
          <ul className="text-xs text-slate-400 max-h-40 overflow-y-auto pr-1 space-y-1">
            {sortedMenu[section].map((item) => (
              <li key={item.name} className="flex justify-between items-center py-0.5">
                <span>{item.name} ({item.perGuestOz ? `${item.perGuestOz}oz` : `${item.each} each`})</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMenuItem(section, item.name)}
                  className="h-5 w-5 text-red-500 hover:text-red-400"
                >
                  <XCircle size={12} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MenuEditorComponent;
