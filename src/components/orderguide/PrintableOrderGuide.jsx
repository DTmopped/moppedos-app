import React, { forwardRef } from 'react';

const PrintableOrderGuide = forwardRef(({ guideData, printDate }, ref) => {
  if (!guideData) {
    return <div className="p-4">Loading print data...</div>;
  }

  const categories = Object.keys(guideData);

  return (
    <div ref={ref} className="p-6 text-sm print:text-xs print:p-2 print:bg-white">
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table th {
            background-color: #f3f4f6 !important;
          }
          tr:nth-child(even) td {
            background-color: #f9fafb !important;
          }
          .par-item {
            color: #f97316 !important;
            font-weight: 600;
          }
          .print-section {
            break-inside: avoid;
          }
          .page-break-before {
            page-break-before: always;
            break-before: always;
          }
        }
      `}</style>

      <h1 className="text-xl font-semibold mb-4">Weekly Order Guide</h1>
      <p className="mb-6">{printDate}</p>

      {categories.map((category, index) => {
        const items = guideData[category];

        return (
          <div
            key={category}
            className={`print-section mb-8 ${index !== 0 ? 'page-break-before' : ''}`}
          >
            <h2 className="text-lg font-semibold mb-2">{category}</h2>

            <table className="w-full border border-gray-300 border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                  <th className="border border-gray-300 px-2 py-1">Forecast</th>
                  <th className="border border-gray-300 px-2 py-1">Actual</th>
                  <th className="border border-gray-300 px-2 py-1">Variance</th>
                  <th className="border border-gray-300 px-2 py-1">Unit</th>
                  <th className="border border-gray-300 px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(items) ? (
                  items.map((item, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-2 py-1 text-left">{item.name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{item.forecast}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{item.actual}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{item.variance}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{item.unit}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {item.status === 'PAR Item' ? (
                          <span className="par-item">⚠️ PAR Item</span>
                        ) : (
                          item.status || ''
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="border px-2 py-2 text-red-600 text-sm">
                      ⚠️ Error: Data for “{category}” is invalid or missing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
});

export default PrintableOrderGuide;
