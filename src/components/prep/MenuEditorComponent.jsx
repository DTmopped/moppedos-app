import React, { useMemo } from 'react'; // Add useMemo here
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select.jsx';
import { PlusCircle, XCircle, Edit3 } from 'lucide-react';

// 🧩 Component defined OUTSIDE the hook
const MenuEditorComponent = ({
  sectionTitleColor = "from-purple-400 to-indigo-500",
  menu, // This prop is needed for sortedMenu
  editorsVisibility,
  toggleEditor,
  newItemForms,
  handleNewItemChange,
  addMenuItem,
  removeMenuItem
}) => {
  // The sortedMenu logic needs to be inside this component now,
  // as it depends on the 'menu' prop passed to it.
  const sortedMenu = useMemo(() => {
    const sorted = {};
    Object.keys(menu).forEach(section => {
      sorted[section] = [...(menu[section] || [])].sort((a, b) => a.name.localeCompare(b.name));
    });
    return sorted;
  }, [menu]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 px-2 sm:px-4">
      {Object.keys(sortedMenu).map(section => (
        <Card key={section} className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className={`text-lg text-transparent bg-clip-text bg-gradient-to-r ${sectionTitleColor}`}>{section}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleEditor(section)}
                className="text-slate-400 hover:text-purple-400"
              >
                {editorsVisibility[section] ? "Close Editor" : <><Edit3 size={14} className="mr-1" /> Edit Items</>}
              </Button>
            </div>
          </CardHeader>
          {editorsVisibility[section] && (
            <CardContent>
              <div className="mb-4 p-3 border border-slate-700 rounded-md bg-slate-800 space-y-2">
                <h4 className="text-sm font-semibold text-slate-200">Add/Update Item in {section}</h4>
                <Input
                  placeholder="Item Name"
                  value={newItemForms[section]?.name || ''}
                  onChange={(e) => handleNewItemChange(section, 'name', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <Label className="text-xs text-slate-400 mb-1">Portion</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 4"
                      value={newItemForms[section]?.value || ''}
                      onChange={(e) => handleNewItemChange(section, 'value', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-xs text-slate-400 mb-1">Unit</Label>
                    <div className="flex items-center space-x-1">
                      <Select
                        value={newItemForms[section]?.unit || 'oz'}
                        onValueChange={(val) => handleNewItemChange(section, 'unit', val)}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200 w-[80px]">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 text-slate-200">
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="each">each</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-slate-400">per guest</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => addMenuItem(section)}
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-3"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add/Update
                </Button>
                <div className="mt-4 space-y-1">
                  <h5 className="text-xs font-medium text-slate-300">Current Items:</h5>
                  <ul className="text-xs text-slate-400 max-h-40 overflow-y-auto pr-1">
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
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MenuEditorComponent; // Don't forget to export it!
