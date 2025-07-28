import React, { forwardRef } from 'react';

const PrintableOrderGuide = forwardRef(({ guideData, printDate }, ref) => {
  if (!guideData) {
    return <div className="p-4">Loading print data...</div>;
  }

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
    <div ref={ref} className="printable-order-guide-container p-4 font-sans">
     import React, { forwardRef } from 'react';

const PrintableOrderGuide = forwardRef(({ guideData, printDate }, ref) => {
  if (!guideData) {
    return <div className="p-4">Loading print data...</div>;
  }

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
    <div ref={ref} className="printable-order-guide-container p-4 font-sans">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: Arial, sans-serif;
              font-size: 10pt !important;
            }
            .printable-order-guide-container {
              width: 100%;
            }
            .print-header-title {
              text-align: center;
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .print-header-date {
              text-align: center;
              font-size: 9pt;
              margin-bottom: 20px;
            }
            .category-title {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              page-break-after: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            tr {
              page-break-inside: avoid;
            }
            .status-good { background-color: #e0f7e0 !important; }
            .status-low { background-color: #fff7d5 !important; }
            .status-danger { background-color: #ffd6d6 !important; }
            .item-name { font-weight: bold; }
          }
        `}
      </style>
      <div className="print-header-title">Mopped OS – Weekly Order Guide</div>
      <div className="print-header-date">Printed on: {formatDate(printDate)}</div>

      {Object.entries(guideData).map(([category, items]) => (
        <div key={category} className="category-section">
          <h2 className="category-title">{category}</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Forecasted</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemName = item.name || item[0];
                const forecast = item.forecast !== undefined ? item.forecast : item[1];
                const unit = item.unit || item[2] || "";
                const actual = item.actual !== undefined ? item.actual : (item.posDataValue !== undefined ? item.posDataValue : 0);
                const variance = item.variance !== undefined
                  ? item.variance
                  : (typeof forecast === 'number' && typeof actual === 'number'
                      ? (actual - forecast).toFixed(1)
                      : "-");

                let statusClass = "";
                if (typeof forecast === 'number' && typeof actual === 'number' && forecast !== 0) {
                  const variancePercent = ((actual - forecast) / forecast) * 100;
                  if (Math.abs(variancePercent) <= 10) statusClass = 'status-good';
                  else if (variancePercent > 10 && variancePercent <= 30) statusClass = 'status-low';
                  else if (variancePercent < -10 || variancePercent > 30) statusClass = 'status-danger';
                }

                return (
                  <tr key={`${category}-${itemName}-${index}`} className={statusClass}>
                    <td className="item-name">{itemName}</td>
                    <td>{typeof forecast === 'number' ? forecast.toLocaleString() : forecast}</td>
                    <td>{typeof actual === 'number' ? actual.toLocaleString() : (actual || "-")}</td>
                    <td>{variance}</td>
                    <td>{unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
});

export default PrintableOrderGuide;
      <div className="print-header-title">Mopped OS – Weekly Order Guide</div>
      <div className="print-header-date">Printed on: {formatDate(printDate)}</div>

      {Object.entries(guideData).map(([category, items]) => (
        <div key={category} className="category-section">
          <h2 className="category-title">{category}</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Forecasted</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemName = item.name || item[0];
                const forecast = item.forecast !== undefined ? item.forecast : item[1];
                const unit = item.unit || item[2] || "";
                const actual = item.actual !== undefined ? item.actual : (item.posDataValue !== undefined ? item.posDataValue : 0);
                const variance = item.variance !== undefined
                  ? item.variance
                  : (typeof forecast === 'number' && typeof actual === 'number'
                      ? (actual - forecast).toFixed(1)
                      : "-");

                let statusClass = "";
                if (typeof forecast === 'number' && typeof actual === 'number' && forecast !== 0) {
                  const variancePercent = ((actual - forecast) / forecast) * 100;
                  if (Math.abs(variancePercent) <= 10) statusClass = 'status-good';
                  else if (variancePercent > 10 && variancePercent <= 30) statusClass = 'status-low';
                  else if (variancePercent < -10 || variancePercent > 30) statusClass = 'status-danger';
                }

                return (
                  <tr key={`${category}-${itemName}-${index}`} className={statusClass}>
                    <td className="item-name">{itemName}</td>
                    <td>{typeof forecast === 'number' ? forecast.toLocaleString() : forecast}</td>
                    <td>{typeof actual === 'number' ? actual.toLocaleString() : (actual || "-")}</td>
                    <td>{variance}</td>
                    <td>{unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
});

export default PrintableOrderGuide;
