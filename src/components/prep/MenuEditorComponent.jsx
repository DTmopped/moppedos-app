import React, { useMemo } from 'react';

// Commented out UI component imports (keep them commented out for this test)
// import { Button } from '@/components/ui/button.jsx';
// import { Input } from '@/components/ui/input.jsx';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from '@/components/ui/select.jsx';
// import { PlusCircle, XCircle, Edit3 } from 'lucide-react';


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
  // Add a check for 'menu' here
  if (!menu) {
    console.error("Menu data is undefined or null in MenuEditorComponent!");
    return (
      <div style={{ padding: '20px', border: '1px solid orange', color: 'white', background: 'darkred' }}>
        <h2>Error: Menu Data Missing!</h2>
        <p>Please check the data being passed to MenuEditorComponent.</p>
      </div>
    );
  }

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
        // Replaced Card with div
        <div key={section} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          {/* Replaced CardHeader with div */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            {/* Replaced CardTitle with h3 */}
            <h3 style={{ margin: 0, color: 'white' }}>{section}</h3>
            {/* Replaced Button with button */}
            <button
              onClick={() => toggleEditor(section)}
              style={{ background: 'none', border: '1px solid lightgray', color: 'lightgray', padding: '5px 10px', cursor: 'pointer' }}
            >
              {editorsVisibility[section] ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editorsVisibility[section] && (
            // Replaced CardContent with div
            <div style={{ padding: '10px', borderTop: '1px solid lightgray' }}>
              <div style={{ border: '1px solid darkgray', padding: '10px', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.9em', color: 'lightgray' }}>Add/Update Item in {section}</h4>
                {/* Replaced Input with input */}
                <input
                  placeholder="Item Name"
                  value={newItemForms[section]?.name || ''}
                  onChange={(e) => handleNewItemChange(section, 'name', e.target.value)}
                  style={{ width: '100%', padding: '8px', margin: '5px 0', background: 'darkgray', color: 'white', border: '1px solid gray' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Replaced Label with label */}
                    <label style={{ fontSize: '0.8em', color: 'lightgray', marginBottom: '3px' }}>Portion</label>
                    {/* Replaced Input with input */}
                    <input
                      type="number"
                      placeholder="e.g. 4"
                      value={newItemForms[section]?.value || ''}
                      onChange={(e) => handleNewItemChange(section, 'value', e.target.value)}
                      style={{ width: '100%', padding: '8px', background: 'darkgray', color: 'white', border: '1px solid gray' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Replaced Label with label */}
                    <label style={{ fontSize: '0.8em', color: 'lightgray', marginBottom: '3px' }}>Unit</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {/* Replaced Select with select */}
                      <select
                        value={newItemForms[section]?.unit || 'oz'}
                        onChange={(e) => handleNewItemChange(section, 'unit', e.target.value)}
                        style={{ background: 'darkgray', border: '1px solid gray', color: 'white', padding: '8px' }}
                      >
                        {/* Replaced SelectItem with option */}
                        <option value="oz">oz</option>
                        <option value="each">each</option>
                      </select>
                      <span style={{ fontSize: '0.8em', color: 'lightgray' }}>per guest</span>
                    </div>
                  </div>
                </div>
                {/* Replaced Button with button */}
                <button
                  onClick={() => addMenuItem(section)}
                  style={{ width: '100%', background: 'indigo', color: 'white', padding: '10px', border: 'none', cursor: 'pointer', marginTop: '10px' }}
                >
                  Add/Update
                </button>
                <div style={{ marginTop: '15px', borderTop: '1px solid gray', paddingTop: '10px' }}>
                  <h5 style={{ fontSize: '0.85em', color: 'lightgray' }}>Current Items:</h5>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto', color: 'lightgray' }}>
                    {sortedMenu[section].map((item) => (
                      <li key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                        <span>{item.name} ({item.perGuestOz ? `${item.perGuestOz}oz` : `${item.each} each`})</span>
                        {/* Replaced Button with button */}
                        <button
                          onClick={() => removeMenuItem(section, item.name)}
                          style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8em' }}
                        >
                          [X]
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuEditorComponent;
