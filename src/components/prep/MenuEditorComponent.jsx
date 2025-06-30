import React, { useMemo } from "react";

const MenuEditorComponent = ({
  sectionTitleColor = "from-purple-400 to-indigo-500",
  menu,
  editorsVisibility,
  toggleEditor,
  newItemForms,
  handleNewItemChange,
  addMenuItem,
  removeMenuItem
}) => {
  // Handle missing menu data
  if (!menu) {
    console.error("❌ Menu data is undefined or null in MenuEditorComponent!");
    return (
      <div style={{ padding: '20px', border: '1px solid orange', color: 'white', background: 'darkred' }}>
        <h2>Error: Menu Data Missing!</h2>
        <p>Please check the data being passed to MenuEditorComponent.</p>
      </div>
    );
  }

  console.log("🚧 Menu received by MenuEditorComponent:", menu);

  // Sort menu items alphabetically within each section
  const sortedMenu = useMemo(() => {
    const sorted = {};
    Object.keys(menu).forEach(section => {
  const items = Array.isArray(menu[section]) ? menu[section] : [];
  sorted[section] = [...items].sort((a, b) => a.name.localeCompare(b.name));
});
    return sorted;
  }, [menu]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 px-2 sm:px-4">
      {Object.keys(sortedMenu).map(section => (
        <div key={section} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: 'white' }}>{section}</h3>
            <button
              onClick={() => toggleEditor(section)}
              style={{
                background: 'none',
                border: '1px solid lightgray',
                color: 'lightgray',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              {editorsVisibility[section] ? "Close Editor" : "Edit Items"}
            </button>
          </div>

          {editorsVisibility[section] && (
            <div style={{ padding: '10px', borderTop: '1px solid lightgray' }}>
              <div style={{ border: '1px solid darkgray', padding: '10px', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.9em', color: 'lightgray' }}>Add/Update Item in {section}</h4>

                <input
                  placeholder="Item Name"
                  value={newItemForms[section]?.name || ''}
                  onChange={(e) => handleNewItemChange(section, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    margin: '5px 0',
                    background: 'darkgray',
                    color: 'white',
                    border: '1px solid gray'
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.8em', color: 'lightgray', marginBottom: '3px' }}>Portion</label>
                    <input
                      type="number"
                      placeholder="e.g. 4"
                      value={newItemForms[section]?.value || ''}
                      onChange={(e) => handleNewItemChange(section, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'darkgray',
                        color: 'white',
                        border: '1px solid gray'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.8em', color: 'lightgray', marginBottom: '3px' }}>Unit</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <select
                        value={newItemForms[section]?.unit || 'oz'}
                        onChange={(e) => handleNewItemChange(section, 'unit', e.target.value)}
                        style={{
                          background: 'darkgray',
                          border: '1px solid gray',
                          color: 'white',
                          padding: '8px'
                        }}
                      >
                        <option value="oz">oz</option>
                        <option value="each">each</option>
                      </select>
                      <span style={{ fontSize: '0.8em', color: 'lightgray' }}>per guest</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => addMenuItem(section)}
                  style={{
                    width: '100%',
                    background: 'indigo',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Add/Update
                </button>

                <div style={{ marginTop: '15px', borderTop: '1px solid gray', paddingTop: '10px' }}>
                  <h5 style={{ fontSize: '0.85em', color: 'lightgray' }}>Current Items:</h5>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    maxHeight: '150px',
                    overflowY: 'auto',
                    color: 'lightgray'
                  }}>
                    {sortedMenu[section].map((item) => (
                      <li key={item.name} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '3px 0'
                      }}>
                        <span>
                          {item.name} (
                          {item.perGuestOz
                            ? `${item.perGuestOz} oz`
                            : `${item.each || item.value} each`}
                          )
                        </span>
                        <button
                          onClick={() => removeMenuItem(section, item.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'red',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
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
