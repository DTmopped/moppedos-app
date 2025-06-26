import React from 'react';

const PrintableDailyShiftPrepGuide = ({ dailyShiftPrepData, printDate }) => {
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
              font-size: 8pt;
            }
            .prep-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7.5pt;
              margin-bottom: 12px;
            }
            .prep-table th, .prep-table td {
              border: 1px solid #ccc;
              padding: 4px;
              text-align: left;
            }
            .checkbox-box {
              display: inline-block;
              width: 12px;
              height: 12px;
              border: 1px solid #000;
              vertical-align: middle;
            }
            .shift-title {
              margin-top: 10px;
              font-weight: bold;
              font-size: 10pt;
            }
            .day-header {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 4px;
            }
            .day-sub {
              font-size: 8pt;
              font-style: italic;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}
      </style>

      <div className="text-center font-bold text-base mb-1">
        Mopped OS – Daily Shift Prep Guide
      </div>
      <div className="text-center text-xs mb-4">
        Generated on: {formatDate(printDate)}
      </div>

      {dailyShiftPrepData.map((day, index) => (
        <div key={index} className={index > 0 ? 'page-break' : ''}>
          <div className="day-header">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="day-sub">
            Guests: {day.guests} | AM: {day.amGuests} | PM: {day.pmGuests}
          </div>

          {['am', 'pm'].map((shiftKey) => {
            const shift = day.shifts[shiftKey];
            if (!shift || !shift.prepItems.length) return null;

            return (
              <div key={shiftKey}>
                <div className="shift-title">{shift.name} Shift</div>
                <table className="prep-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Assign</th>
                      <th>Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shift.prepItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>{item.assignedTo || ''}</td>
                        <td>
                          <span className="checkbox-box">
                            {item.completed ? 'X' : '\u00A0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PrintableDailyShiftPrepGuide;
