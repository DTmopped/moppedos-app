import React from "react";
import OrderGuideCategory from "./OrderGuideCategory";

const PrintableOrderGuide = ({ data, printDate }) => {
  const formattedDate = new Date(printDate).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="p-4 text-sm text-black">
      <style>
        {`
          @media print {
            .page-break {
              break-after: page;
            }
            .print-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Weekly Order Guide</h1>
        <div className="text-xs text-gray-600">{formattedDate}</div>
      </div>

      {Object.entries(data).map(([categoryName, items]) => (
        <div key={categoryName} className="print-section mb-8">
          <OrderGuideCategory title={categoryName} items={items} />
        </div>
      ))}
    </div>
  );
};

export default PrintableOrderGuide;
