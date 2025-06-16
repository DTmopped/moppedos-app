import React from 'react';

const PrintableDailyShiftPrepGuide = ({ dailyShiftPrepData, printDate }) => {
  console.log("🧾 dailyShiftPrepData received for print:", dailyShiftPrepData);

  // TEMP: disable check to ensure print renders even if data isn't ready
  // if (!dailyShiftPrepData || dailyShiftPrepData.length === 0) {
  //   return <div className="p-4">Loading print data or no daily prep data available...</div>;
  // }
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="printable-daily-shift-prep-guide-container p-4 font-sans">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: Arial, sans-serif;
              font-size: 8pt !important; /* Smaller base font for more content */
            }
            .printable-daily-shift-prep-guide-container {
              width: 100%;
            }
            .print-header-title {
              text-align: center;
              font-size: 14pt; /* Adjusted */
              font-weight: bold;
              margin-bottom: 6px; /* Adjusted */
            }
            .print-header-date {
              text-align: center;
              font-size: 8pt; /* Adjusted */
              margin-bottom: 12px; /* Adjusted */
            }
            .day-section {
              margin-bottom: 15px; /* Adjusted */
              page-break-before: auto;
            }
            .day-section:first-of-type {
                page-break-before: avoid;
            }
            .day-header {
              font-size: 12pt; /* Adjusted */
              font-weight: bold;
              margin-bottom: 8px; /* Adjusted */
              border-bottom: 1.5px solid #000; /* Adjusted */
              padding-bottom: 4px; /* Adjusted */
              page-break-after: avoid;
            }
            .day-subheader {
              font-size: 9pt; /* Adjusted */
              font-weight: normal;
              margin-left: 8px; /* Adjusted */
            }
            .shift-section-title {
              font-size: 10pt; /* Adjusted */
              font-weight: bold;
              margin-top: 10px; /* Adjusted */
              margin-bottom: 5px; /* Adjusted */
              background-color: #f0f0f0;
              padding: 4px;
              border-top: 1px solid #ccc;
              border-bottom: 1px solid #ccc;
            }
            .prep-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px; /* Adjusted */
              font-size: 7.5pt; /* Fine-tuned for more columns */
            }
            .prep-table th, .prep-table td {
              border: 1px solid #ccc;
              padding: 3px 4px; /* Adjusted */
              text-align: left;
              vertical-align: top;
            }
            .prep-table th {
              background-color: #e8e8e8; /* Slightly lighter than shift title */
              font-weight: bold;
            }
            .prep-table .col-item { width: 35%; }
            .prep-table .col-qty { width: 10%; text-align: right; }
            .prep-table .col-unit { width: 10%; }
            .prep-table .col-assign { width: 25%; }
            .prep-table .col-done { width: 10%; text-align: center; }
            .checkbox-box { 
              display: inline-block; 
              width: 12px; 
              height: 12px; 
              border: 1px solid #000; 
              margin-right: 5px;
              vertical-align: middle;
            }
            tr { page-break-inside: avoid; }
          }
        `}
      </style>
      <div className="print-header-title">Mopped OS – Daily Shift Prep Guide</div>
      <div className="print-header-date">Generated on: {formatDate(printDate)}</div>

      {dailyShiftPrepData.map((dayData, index) => (
        <div key={dayData.date + index} className="day-section">
          <div className="day-header">
            {new Date(dayData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span className="day-subheader">(Adj. Guests: {dayData.totalGuests.toFixed(0)})</span>
          </div>
          
          {Object.entries(dayData.shifts).map(([shiftKey, shiftInfo]) => (
            <div key={shiftKey} className="shift-section">
              <div className="shift-section-title">{shiftInfo.name} Prep</div>
              {shiftInfo.prepItems && shiftInfo.prepItems.length > 0 ? (
                <table className="prep-table">
                  <thead>
                    <tr>
                      <th className="col-item">Item</th>
                      <th className="col-qty">Qty</th>
                      <th className="col-unit">Unit</th>
                      <th className="col-assign">Assigned To</th>
                      <th className="col-done">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftInfo.prepItems.map((item) => (
                      <tr key={item.id}>
                        <td className="col-item">{item.name}</td>
                        <td className="col-qty">{item.quantity}</td>
                        <td className="col-unit">{item.unit}</td>
                        <td className="col-assign">{item.assignedTo}</td>
                        <td className="col-done">
                          <span className="checkbox-box">
                            {item.completed ? 'X' : '\u00A0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{paddingLeft: '5px', fontSize: '8pt', fontStyle: 'italic'}}>No prep items for this shift.</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PrintableDailyShiftPrepGuide;
