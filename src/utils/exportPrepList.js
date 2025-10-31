// Export prep list functionality (without costs)
// Add this to your SmartPrepGuide component or create as a utility

export const exportPrepListToCSV = (prepTasks, prepSchedule) => {
  if (!prepTasks || prepTasks.length === 0) {
    alert('No prep tasks to export');
    return;
  }

  // Prepare CSV content
  const headers = [
    'Station',
    'Item Name',
    'Category',
    'Quantity',
    'Unit',
    'Smart Factor'
  ];

  const rows = prepTasks.map(task => {
    const stationName = task.prep_stations?.name || task.station_name || 'Unknown';
    const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown';
    const category = task.menu_items?.category_normalized || task.category || '';
    const quantity = task.quantity || 0;
    const unit = task.unit || task.menu_items?.base_unit || 'lbs';
    const smartFactor = (task.smart_factor || 1.0).toFixed(2);

    return [stationName, itemName, category, quantity, unit, smartFactor];
  });

  // Create CSV content
  const csvContent = [
    `Prep List for ${prepSchedule?.date || 'Unknown Date'}`,
    `Expected Guests: ${prepSchedule?.expected_guests || 0}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

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

  // Create printable HTML
  const printWindow = window.open('', '_blank');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prep List - ${prepSchedule?.date || 'Export'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #1e40af;
          font-size: 32px;
        }
        .header p {
          margin: 10px 0;
          font-size: 20px;
          font-weight: 600;
        }
        .station {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .station-header {
          background: #1e40af;
          color: white;
          padding: 15px 20px;
          margin-bottom: 0;
          font-size: 24px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border: 1px solid #ddd;
        }
        th {
          background: #f3f4f6;
          font-weight: 700;
          color: #1f2937;
          font-size: 14px;
          text-transform: uppercase;
        }
        td {
          font-size: 16px;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .item-name {
          font-weight: 700;
          color: #1f2937;
        }
        .quantity {
          font-weight: 700;
          color: #2563eb;
          font-size: 18px;
        }
        .checkbox {
          width: 30px;
          height: 30px;
          border: 2px solid #333;
          display: inline-block;
        }
        @media print {
          body {
            padding: 10px;
          }
          .no-print {
            display: none;
          }
          .station {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔥 MOPPED BBQ - PREP LIST</h1>
        <p>Date: ${prepSchedule?.date || 'Unknown'}</p>
        <p>Expected Guests: ${prepSchedule?.expected_guests || 0}</p>
      </div>

      ${Object.entries(tasksByStation).map(([stationName, tasks]) => `
        <div class="station">
          <div class="station-header">
            ${stationName} (${tasks.length} items)
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Done</th>
                <th>Item</th>
                <th>Category</th>
                <th style="width: 150px;">Quantity</th>
                <th style="width: 100px;">Smart Factor</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => {
                const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown';
                const category = task.menu_items?.category_normalized || task.category || '';
                const quantity = task.quantity || 0;
                const unit = task.unit || task.menu_items?.base_unit || 'lbs';
                const smartFactor = (task.smart_factor || 1.0).toFixed(2);

                return `
                  <tr>
                    <td style="text-align: center;"><span class="checkbox"></span></td>
                    <td class="item-name">${itemName}</td>
                    <td>${category}</td>
                    <td class="quantity">${quantity} ${unit}</td>
                    <td>${smartFactor}x</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 15px 30px; font-size: 18px; cursor: pointer; background: #1e40af; color: white; border: none; border-radius: 8px; font-weight: bold;">
          🖨️ Print Prep List
        </button>
        <button onclick="window.close()" style="padding: 15px 30px; font-size: 18px; cursor: pointer; margin-left: 15px; background: #6b7280; color: white; border: none; border-radius: 8px; font-weight: bold;">
          ✖️ Close
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
