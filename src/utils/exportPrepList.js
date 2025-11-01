// Export prep list functionality - FINAL VERSION
// CSV export with station grouping to match print layout

export const exportPrepListToCSV = (prepTasks, prepSchedule) => {
  if (!prepTasks || prepTasks.length === 0) {
    alert('No prep tasks to export');
    return;
  }

  // Group by station (same as print)
  const tasksByStation = prepTasks.reduce((acc, task) => {
    const stationName = task.prep_stations?.name || task.station_name || 'Unknown';
    if (!acc[stationName]) acc[stationName] = [];
    acc[stationName].push(task);
    return acc;
  }, {});

  // Build CSV content with station grouping
  const csvLines = [
    `Prep List for ${prepSchedule?.date || 'Unknown Date'}`,
    `Expected Guests: ${prepSchedule?.expected_guests || 0}`,
    ''
  ];

  // Add each station as a section
  Object.entries(tasksByStation).forEach(([stationName, tasks]) => {
    csvLines.push(`Station,${stationName}`);
    csvLines.push('Item Name,Category,Quantity,Unit,Smart Factor,Notes');
    
    tasks.forEach(task => {
      const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown';
      const category = task.menu_items?.category_normalized || task.category || '';
      const quantity = task.prep_quantity || task.quantity || task.adjusted_quantity || 0;
      const unit = task.prep_unit || task.unit || task.menu_items?.base_unit || 'lb';
      const smartFactor = (task.smart_factor || task.multiplier || 1.0).toFixed(2);
      
      csvLines.push(`"${itemName}","${category}",${quantity},${unit},${smartFactor}x,`);
    });
    
    csvLines.push(''); // Empty line between stations
  });

  const csvContent = csvLines.join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `prep-list-${prepSchedule?.date || 'export'}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPrepListToPrint = (prepTasks, prepSchedule) => {
  if (!prepTasks || prepTasks.length === 0) {
    alert('No prep tasks to export');
    return;
  }

  // Group by station
  const tasksByStation = prepTasks.reduce((acc, task) => {
    const stationName = task.prep_stations?.name || task.station_name || 'Unknown';
    if (!acc[stationName]) acc[stationName] = [];
    acc[stationName].push(task);
    return acc;
  }, {});

  // Station color mapping
  const stationColors = {
    'Smoker': { gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', text: 'white' },
    'Hot Sides': { gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', text: 'white' },
    'Cold Prep': { gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', text: 'white' },
    'Dessert': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', text: 'white' },
    'Other': { gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)', text: 'white' }
  };

  // Create printable HTML with improved layout
  const printWindow = window.open('', '_blank');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prep List - ${prepSchedule?.date || 'Export'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          max-width: 1400px;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 4px solid #1e40af;
          padding-bottom: 25px;
        }
        
        .header h1 {
          margin: 0 0 15px 0;
          color: #1e40af;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        
        .header-info {
          display: flex;
          justify-content: center;
          gap: 50px;
          margin-top: 15px;
        }
        
        .header-info p {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .header-info span {
          color: #2563eb;
        }
        
        .station {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .station-header {
          color: white;
          padding: 18px 25px;
          margin-bottom: 0;
          font-size: 28px;
          font-weight: 900;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 8px 8px 0 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        th, td {
          padding: 18px 20px;
          text-align: left;
          border: 2px solid #e5e7eb;
        }
        
        th {
          background: #f3f4f6;
          font-weight: 800;
          color: #1f2937;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          font-size: 18px;
          background: white;
        }
        
        tr:hover td {
          background: #f9fafb;
        }
        
        .item-name {
          font-weight: 800;
          color: #1f2937;
          font-size: 20px;
        }
        
        .quantity {
          font-weight: 900;
          color: #2563eb;
          font-size: 24px;
        }
        
        .checkbox-cell {
          text-align: center;
          width: 80px;
        }
        
        .checkbox {
          width: 40px;
          height: 40px;
          border: 3px solid #1f2937;
          display: inline-block;
          border-radius: 6px;
          background: white;
        }
        
        .notes-cell {
          min-width: 250px;
          border-left: 3px solid #e5e7eb;
        }
        
        .notes-line {
          border-bottom: 2px solid #d1d5db;
          min-height: 30px;
          margin: 5px 0;
        }
        
        .category-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .smart-factor {
          color: #7c3aed;
          font-weight: 700;
          font-size: 16px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 3px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        
        @media print {
          body {
            padding: 15px;
          }
          
          .no-print {
            display: none !important;
          }
          
          .station {
            page-break-inside: avoid;
          }
          
          table {
            box-shadow: none;
          }
        }
        
        @page {
          margin: 0.75in;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔥 MOPPED BBQ - PREP LIST</h1>
        <div class="header-info">
          <p>Date: <span>${prepSchedule?.date || 'Unknown'}</span></p>
          <p>Expected Guests: <span>${prepSchedule?.expected_guests || 0}</span></p>
        </div>
      </div>

      ${Object.entries(tasksByStation).map(([stationName, tasks]) => {
        const colors = stationColors[stationName] || stationColors['Other'];
        return `
        <div class="station">
          <div class="station-header" style="background: ${colors.gradient}; color: ${colors.text};">
            <span>${stationName}</span>
            <span>${tasks.length} items</span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="checkbox-cell">✓ Done</th>
                <th>Item</th>
                <th>Category</th>
                <th style="width: 180px;">Quantity</th>
                <th style="width: 120px;">Smart Factor</th>
                <th class="notes-cell">Notes / Adjustments</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => {
                const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown';
                const category = task.menu_items?.category_normalized || task.category || '';
                const quantity = task.prep_quantity || task.quantity || task.adjusted_quantity || 0;
                const unit = task.prep_unit || task.unit || task.menu_items?.base_unit || 'lb';
                const smartFactor = (task.smart_factor || task.multiplier || 1.0).toFixed(2);

                return `
                  <tr>
                    <td class="checkbox-cell"><span class="checkbox"></span></td>
                    <td class="item-name">${itemName}</td>
                    <td><span class="category-badge">${category}</span></td>
                    <td class="quantity">${quantity} ${unit}</td>
                    <td class="smart-factor">${smartFactor}x</td>
                    <td class="notes-cell">
                      <div class="notes-line"></div>
                      <div class="notes-line"></div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      }).join('')}

      <div class="footer">
        <p>Prepared by Mopped OS • Smart Prep Guide</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="no-print" style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: white; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border-radius: 12px; z-index: 1000;">
        <button onclick="window.print()" style="padding: 18px 40px; font-size: 20px; cursor: pointer; background: #1e40af; color: white; border: none; border-radius: 10px; font-weight: 900; margin-right: 15px; box-shadow: 0 4px 12px rgba(30,64,175,0.3);">
          🖨️ Print Prep List
        </button>
        <button onclick="window.close()" style="padding: 18px 40px; font-size: 20px; cursor: pointer; background: #6b7280; color: white; border: none; border-radius: 10px; font-weight: 900; box-shadow: 0 4px 12px rgba(107,114,128,0.3);">
          ✖️ Close
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
