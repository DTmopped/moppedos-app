
import React from 'react';

const MenuEditorComponent = ({ sectionTitleColor }) => {
  return (
    <div style={{ padding: '20px', border: '1px solid red', color: 'white' }}>
      <h2>Menu Editor Component - Test</h2>
      <p>If you see this, the component is rendering!</p>
      <p>Section Color: {sectionTitleColor}</p>
    </div>
  );
};

export default MenuEditorComponent;
