import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const triggerPrint = async (Component, props, title) => {
  const html = renderToStaticMarkup(<Component {...props} />);

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 2rem;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    throw new Error("Popup blocked! Please allow popups for this site.");
  }

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
};
