import React from 'react';

const PrintableSmartPrepGuide = ({ prepTextBySection, printDate, menu }) => {
  if (!prepTextBySection || Object.keys(prepTextBySection).length === 0) {
    return <div className="p-4">Loading print data or no prep data available...</div>;
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
    <div className="printable-smart-prep-guide-container p-4 font-sans">
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
            .printable-smart-prep-guide-container {
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
            .prep-section-title {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              page-break-after: avoid;
            }
            .prep-item-text {
              white-space: pre-wrap;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9pt;
              padding: 5px;
              border: 1px solid #eee;
              background-color: #f9f9f9;
              border-radius: 4px;
              margin-bottom: 10px;
              page-break-inside: auto;
            }
            ul, ol {
              margin-left: 20px;
              padding-left: 0;
            }
            li {
              margin-bottom: 5px;
            }
          }
        `}
      </style>
      <div className="print-header-title">Mopped OS – Full Weekly Prep Guide</div>
      <div className="print-header-date">Generated on: {formatDate(printDate)}</div>

      {menu && Object.keys(menu).map((section) => (
        <div key={section} className="prep-section">
          <h2 className="prep-section-title">{section}</h2>
          {prepTextBySection[section] ? (
            <div className="prep-item-text">
              {prepTextBySection[section]}
            </div>
          ) : (
            <p className="italic text-gray-500">No prep items calculated for this section.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrintableSmartPrepGuide;